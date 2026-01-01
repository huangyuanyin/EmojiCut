import {
  StickerSegment,
  ProcessingStatus,
  IMAGE_PROCESSING,
  Rect,
} from '@emojicut/shared';

/**
 * 连体贴纸检测结果
 */
export interface MergedStickerInfo {
  sticker: StickerSegment;
  isMerged: boolean;
  suggestedSplits: number; // 建议分割成几个
  splitDirection: 'horizontal' | 'vertical' | 'none';
  confidence: number; // 检测置信度 0-1
}

/**
 * 加载图像
 */
export const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

/**
 * 判断是否为背景像素
 */
const isBackground = (r: number, g: number, b: number, a: number): boolean => {
  if (a < IMAGE_PROCESSING.BACKGROUND.ALPHA_THRESHOLD) return true; // 透明
  // 高亮度被认为是背景（白色纸张）
  const threshold = IMAGE_PROCESSING.BACKGROUND.RGB_THRESHOLD;
  return r > threshold && g > threshold && b > threshold;
};

/**
 * 连通域查找（Flood Fill算法）
 */
const floodFill = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: boolean[],
): { minX: number; minY: number; maxX: number; maxY: number } => {
  const stack: [number, number][] = [[startX, startY]];
  let minX = startX,
    minY = startY,
    maxX = startX,
    maxY = startY;

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
      continue;
    }

    const pixelIdx = idx * 4;
    const r = data[pixelIdx];
    const g = data[pixelIdx + 1];
    const b = data[pixelIdx + 2];
    const a = data[pixelIdx + 3];

    if (isBackground(r, g, b, a)) {
      continue;
    }

    visited[idx] = true;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return { minX, minY, maxX, maxY };
};

/**
 * 处理贴纸图片 - 自动分割
 */
export const processStickerSheet = async (
  img: HTMLImageElement,
  onProgress?: (status: ProcessingStatus) => void,
): Promise<StickerSegment[]> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  onProgress?.({
    stage: 'analyzing_layout',
    progress: 20,
    message: '分析图像布局...',
  });

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const visited = new Array(canvas.width * canvas.height).fill(false);
  const regions: Array<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }> = [];

  // 扫描整个图像，找出所有连通域
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = y * canvas.width + x;
      if (visited[idx]) continue;

      const pixelIdx = idx * 4;
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];
      const a = data[pixelIdx + 3];

      if (isBackground(r, g, b, a)) {
        visited[idx] = true;
        continue;
      }

      const bounds = floodFill(data, canvas.width, canvas.height, x, y, visited);
      const width = bounds.maxX - bounds.minX + 1;
      const height = bounds.maxY - bounds.minY + 1;
      const area = width * height;

      if (
        area > IMAGE_PROCESSING.FILTER.MIN_AREA &&
        width > IMAGE_PROCESSING.FILTER.MIN_WIDTH &&
        height > IMAGE_PROCESSING.FILTER.MIN_HEIGHT
      ) {
        regions.push(bounds);
      }
    }
  }

  onProgress?.({
    stage: 'segmenting',
    progress: 60,
    message: `找到 ${regions.length} 个区域，正在合并...`,
  });

  // 合并相邻的区域
  const mergedRegions = mergeRegions(regions);

  onProgress?.({
    stage: 'segmenting',
    progress: 80,
    message: `提取 ${mergedRegions.length} 张贴纸...`,
  });

  // 提取每个贴纸
  const segments: StickerSegment[] = mergedRegions.map((region, index) => {
    const result = extractStickerFromRect(
      canvas,
      region,
      `sticker_${index + 1}`,
    );

    return result || {
      id: `sticker-${Date.now()}-${index}`,
      dataUrl: '',
      rawDataUrl: '',
      originalX: region.minX,
      originalY: region.minY,
      width: region.maxX - region.minX + 1,
      height: region.maxY - region.minY + 1,
      name: `sticker_${index + 1}`,
      isNaming: false,
    };
  }).filter(s => s.dataUrl);

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: `成功提取 ${segments.length} 张贴纸！`,
  });

  return segments;
};

/**
 * 合并相邻的区域
 */
const mergeRegions = (
  regions: Array<{ minX: number; minY: number; maxX: number; maxY: number }>,
): Array<{ minX: number; minY: number; maxX: number; maxY: number }> => {
  if (regions.length === 0) return [];

  const merged: typeof regions = [];
  const used = new Array(regions.length).fill(false);

  for (let i = 0; i < regions.length; i++) {
    if (used[i]) continue;

    let current = { ...regions[i] };
    let changed = true;

    while (changed) {
      changed = false;
      for (let j = 0; j < regions.length; j++) {
        if (used[j] || i === j) continue;

        if (shouldMerge(current, regions[j])) {
          current = {
            minX: Math.min(current.minX, regions[j].minX),
            minY: Math.min(current.minY, regions[j].minY),
            maxX: Math.max(current.maxX, regions[j].maxX),
            maxY: Math.max(current.maxY, regions[j].maxY),
          };
          used[j] = true;
          changed = true;
        }
      }
    }

    merged.push(current);
    used[i] = true;
  }

  return merged;
};

/**
 * 判断两个区域是否应该合并
 */
const shouldMerge = (
  r1: { minX: number; minY: number; maxX: number; maxY: number },
  r2: { minX: number; minY: number; maxX: number; maxY: number },
): boolean => {
  const dx = Math.max(0, Math.max(r1.minX, r2.minX) - Math.min(r1.maxX, r2.maxX));
  const dy = Math.max(0, Math.max(r1.minY, r2.minY) - Math.min(r1.maxY, r2.maxY));
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < IMAGE_PROCESSING.MERGE.DISTANCE;
};

/**
 * 从矩形区域提取贴纸，去除背景并添加白色描边
 */
export const extractStickerFromRect = (
  source: HTMLCanvasElement | HTMLImageElement,
  rect: Rect,
  defaultName: string = 'sticker',
): StickerSegment | null => {
  const padding = 2;
  const strokeWidth = 6; // 白色描边宽度

  // 获取源图像尺寸（HTMLImageElement 使用 naturalWidth/naturalHeight）
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  // 1. 计算裁剪尺寸
  const finalX = Math.max(0, rect.minX - padding);
  const finalY = Math.max(0, rect.minY - padding);
  const finalW = Math.min(width - finalX, (rect.maxX - rect.minX) + padding * 2);
  const finalH = Math.min(height - finalY, (rect.maxY - rect.minY) + padding * 2);

  if (finalW <= 0 || finalH <= 0) return null;

  // 2. 创建裁剪画布并去除背景
  const segCanvas = document.createElement('canvas');
  segCanvas.width = finalW;
  segCanvas.height = finalH;
  const segCtx = segCanvas.getContext('2d');
  if (!segCtx) return null;

  segCtx.drawImage(
    source,
    finalX, finalY, finalW, finalH,
    0, 0, finalW, finalH
  );

  // 去除白色背景，使其透明
  const segImageData = segCtx.getImageData(0, 0, finalW, finalH);
  const segPixels = segImageData.data;
  for (let i = 0; i < segPixels.length; i += 4) {
    if (isBackground(segPixels[i], segPixels[i+1], segPixels[i+2], segPixels[i+3])) {
      segPixels[i+3] = 0; // 设为透明
    }
  }
  segCtx.putImageData(segImageData, 0, 0);

  // 3. 创建白色剪影用于描边
  const silhouetteCanvas = document.createElement('canvas');
  silhouetteCanvas.width = finalW;
  silhouetteCanvas.height = finalH;
  const sCtx = silhouetteCanvas.getContext('2d');
  if (!sCtx) return null;

  sCtx.drawImage(segCanvas, 0, 0);
  sCtx.globalCompositeOperation = 'source-in';
  sCtx.fillStyle = '#FFFFFF';
  sCtx.fillRect(0, 0, finalW, finalH);

  // 4. 创建最终画布，留出描边空间
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalW + (strokeWidth * 2);
  finalCanvas.height = finalH + (strokeWidth * 2);
  const fCtx = finalCanvas.getContext('2d');
  if (!fCtx) return null;

  // 启用平滑让描边更自然
  fCtx.imageSmoothingEnabled = true;
  fCtx.imageSmoothingQuality = 'high';

  // 5. 绘制白色描边 - 在多个角度绘制白色剪影
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const ox = strokeWidth + Math.cos(angle) * strokeWidth;
    const oy = strokeWidth + Math.sin(angle) * strokeWidth;
    fCtx.drawImage(silhouetteCanvas, ox, oy);
  }

  // 填充描边中心，确保没有间隙
  fCtx.drawImage(silhouetteCanvas, strokeWidth, strokeWidth);

  // 6. 在描边上绘制原始彩色图像
  fCtx.globalCompositeOperation = 'source-over';
  fCtx.drawImage(segCanvas, strokeWidth, strokeWidth);

  return {
    id: crypto.randomUUID(),
    dataUrl: finalCanvas.toDataURL('image/png'),      // 带描边版本（用于显示）
    rawDataUrl: segCanvas.toDataURL('image/png'),     // 不带描边版本（用于下载）
    originalX: finalX,
    originalY: finalY,
    width: finalCanvas.width,
    height: finalCanvas.height,
    name: defaultName,
    isNaming: false
  };
};

/**
 * 计算贴纸列表的平均尺寸
 */
const calculateAverageSize = (stickers: StickerSegment[]): { avgWidth: number; avgHeight: number; avgArea: number } => {
  if (stickers.length === 0) return { avgWidth: 0, avgHeight: 0, avgArea: 0 };
  
  const totalWidth = stickers.reduce((sum, s) => sum + s.width, 0);
  const totalHeight = stickers.reduce((sum, s) => sum + s.height, 0);
  const totalArea = stickers.reduce((sum, s) => sum + s.width * s.height, 0);
  
  return {
    avgWidth: totalWidth / stickers.length,
    avgHeight: totalHeight / stickers.length,
    avgArea: totalArea / stickers.length,
  };
};

/**
 * 智能检测连体贴纸
 */
export const detectMergedStickers = (stickers: StickerSegment[]): MergedStickerInfo[] => {
  if (stickers.length < 2) {
    return stickers.map(s => ({
      sticker: s,
      isMerged: false,
      suggestedSplits: 1,
      splitDirection: 'none' as const,
      confidence: 0,
    }));
  }

  const { avgWidth, avgHeight, avgArea } = calculateAverageSize(stickers);
  
  return stickers.map(sticker => {
    const aspectRatio = sticker.width / sticker.height;
    const area = sticker.width * sticker.height;
    
    // 判断是否可能是连体贴纸的条件：
    // 1. 宽高比异常（太宽或太高）
    // 2. 面积明显大于平均值
    
    let isMerged = false;
    let suggestedSplits = 1;
    let splitDirection: 'horizontal' | 'vertical' | 'none' = 'none';
    let confidence = 0;
    
    // 检测水平连体（太宽）
    if (aspectRatio > 1.8 && sticker.width > avgWidth * 1.5) {
      isMerged = true;
      suggestedSplits = Math.round(aspectRatio);
      splitDirection = 'vertical';
      confidence = Math.min(0.9, (aspectRatio - 1.5) / 2);
    }
    // 检测垂直连体（太高）
    else if (aspectRatio < 0.55 && sticker.height > avgHeight * 1.5) {
      isMerged = true;
      suggestedSplits = Math.round(1 / aspectRatio);
      splitDirection = 'horizontal';
      confidence = Math.min(0.9, (1 / aspectRatio - 1.5) / 2);
    }
    // 检测面积异常大
    else if (area > avgArea * 2.5) {
      isMerged = true;
      suggestedSplits = Math.round(Math.sqrt(area / avgArea));
      splitDirection = aspectRatio > 1 ? 'vertical' : 'horizontal';
      confidence = Math.min(0.8, (area / avgArea - 2) / 4);
    }
    
    return {
      sticker,
      isMerged,
      suggestedSplits: Math.max(2, Math.min(suggestedSplits, 4)),
      splitDirection,
      confidence,
    };
  });
};

/**
 * 检查是否有连体贴纸
 */
export const hasMergedStickers = (stickers: StickerSegment[]): boolean => {
  const results = detectMergedStickers(stickers);
  return results.some(r => r.isMerged && r.confidence > 0.3);
};

/**
 * 获取连体贴纸列表
 */
export const getMergedStickers = (stickers: StickerSegment[]): MergedStickerInfo[] => {
  return detectMergedStickers(stickers).filter(r => r.isMerged && r.confidence > 0.3);
};

/**
 * 分析图像中的最佳分割点（基于像素投影）
 */
const findBestSplitPoints = (
  imageData: ImageData,
  direction: 'horizontal' | 'vertical',
  numSplits: number
): number[] => {
  const { width, height, data } = imageData;
  const projection: number[] = [];
  
  if (direction === 'vertical') {
    // 垂直分割：计算每列的非背景像素数
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a > 20) count++; // 非透明像素
      }
      projection.push(count);
    }
  } else {
    // 水平分割：计算每行的非背景像素数
    for (let y = 0; y < height; y++) {
      let count = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a > 20) count++;
      }
      projection.push(count);
    }
  }
  
  // 找到投影最低的位置作为分割点
  const segmentSize = Math.floor(projection.length / (numSplits));
  const splitPoints: number[] = [];
  
  for (let i = 1; i < numSplits; i++) {
    const centerPos = i * segmentSize;
    const searchRange = Math.floor(segmentSize * 0.3); // 在中心点附近30%范围内搜索
    
    let minVal = Infinity;
    let bestPos = centerPos;
    
    for (let j = Math.max(0, centerPos - searchRange); j < Math.min(projection.length, centerPos + searchRange); j++) {
      // 计算局部最小值（使用窗口平均）
      let windowSum = 0;
      const windowSize = 5;
      for (let k = Math.max(0, j - windowSize); k < Math.min(projection.length, j + windowSize); k++) {
        windowSum += projection[k];
      }
      
      if (windowSum < minVal) {
        minVal = windowSum;
        bestPos = j;
      }
    }
    
    splitPoints.push(bestPos);
  }
  
  return splitPoints.sort((a, b) => a - b);
};

/**
 * 智能分割单个连体贴纸
 */
export const splitMergedSticker = async (
  sticker: StickerSegment,
  direction: 'horizontal' | 'vertical',
  numSplits: number
): Promise<StickerSegment[]> => {
  // 从 dataUrl 加载图像
  const img = await loadImage(sticker.dataUrl);
  
  // 创建画布获取图像数据
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // 找到最佳分割点
  const splitPoints = findBestSplitPoints(imageData, direction, numSplits);
  
  // 根据分割点提取各个部分
  const segments: StickerSegment[] = [];
  const points = [0, ...splitPoints, direction === 'vertical' ? canvas.width : canvas.height];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    let rect: Rect;
    if (direction === 'vertical') {
      rect = {
        minX: start,
        maxX: end,
        minY: 0,
        maxY: canvas.height,
      };
    } else {
      rect = {
        minX: 0,
        maxX: canvas.width,
        minY: start,
        maxY: end,
      };
    }
    
    // 创建分割后的画布
    const segWidth = rect.maxX - rect.minX;
    const segHeight = rect.maxY - rect.minY;
    
    if (segWidth <= 0 || segHeight <= 0) continue;
    
    const segCanvas = document.createElement('canvas');
    segCanvas.width = segWidth;
    segCanvas.height = segHeight;
    const segCtx = segCanvas.getContext('2d')!;
    
    segCtx.drawImage(
      canvas,
      rect.minX, rect.minY, segWidth, segHeight,
      0, 0, segWidth, segHeight
    );
    
    // 裁剪到实际内容边界
    const trimmedSegment = trimToContent(segCanvas);
    
    if (trimmedSegment) {
      segments.push({
        id: crypto.randomUUID(),
        dataUrl: trimmedSegment.dataUrl,
        rawDataUrl: trimmedSegment.dataUrl,  // 分割后的贴纸两个版本相同
        originalX: sticker.originalX + (direction === 'vertical' ? start : 0),
        originalY: sticker.originalY + (direction === 'horizontal' ? start : 0),
        width: trimmedSegment.width,
        height: trimmedSegment.height,
        name: `${sticker.name}_${i + 1}`,
        isNaming: false,
      });
    }
  }
  
  return segments;
};

/**
 * 裁剪画布到实际内容边界
 */
const trimToContent = (canvas: HTMLCanvasElement): { dataUrl: string; width: number; height: number } | null => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a > 20) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (!hasContent || maxX <= minX || maxY <= minY) return null;
  
  const padding = 4;
  const trimX = Math.max(0, minX - padding);
  const trimY = Math.max(0, minY - padding);
  const trimW = Math.min(width - trimX, maxX - minX + 1 + padding * 2);
  const trimH = Math.min(height - trimY, maxY - minY + 1 + padding * 2);
  
  const trimCanvas = document.createElement('canvas');
  trimCanvas.width = trimW;
  trimCanvas.height = trimH;
  const trimCtx = trimCanvas.getContext('2d')!;
  
  trimCtx.drawImage(canvas, trimX, trimY, trimW, trimH, 0, 0, trimW, trimH);
  
  return {
    dataUrl: trimCanvas.toDataURL('image/png'),
    width: trimW,
    height: trimH,
  };
};

/**
 * 一键智能分割所有连体贴纸
 */
export const smartSplitAllMerged = async (
  stickers: StickerSegment[],
  onProgress?: (progress: number, message: string) => void
): Promise<StickerSegment[]> => {
  const mergedInfos = detectMergedStickers(stickers);
  const result: StickerSegment[] = [];
  let processed = 0;
  
  for (const info of mergedInfos) {
    if (info.isMerged && info.confidence > 0.3 && info.splitDirection !== 'none') {
      onProgress?.(
        Math.round((processed / mergedInfos.length) * 100),
        `正在分割贴纸 ${processed + 1}/${mergedInfos.length}...`
      );
      
      const splitStickers = await splitMergedSticker(
        info.sticker,
        info.splitDirection,
        info.suggestedSplits
      );
      result.push(...splitStickers);
    } else {
      result.push(info.sticker);
    }
    processed++;
  }
  
  onProgress?.(100, '分割完成！');
  return result;
};

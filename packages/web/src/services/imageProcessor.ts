import {
  StickerSegment,
  ProcessingStatus,
  IMAGE_PROCESSING,
  Rect,
} from '@emojicut/shared';

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

  // 启用平滑处理
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
    dataUrl: finalCanvas.toDataURL('image/png'),
    originalX: finalX,
    originalY: finalY,
    width: finalCanvas.width,
    height: finalCanvas.height,
    name: defaultName,
    isNaming: false
  };
};

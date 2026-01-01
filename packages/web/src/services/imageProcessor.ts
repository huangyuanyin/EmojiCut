import {
  StickerSegment,
  ProcessingStatus,
  IMAGE_PROCESSING,
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
  return (
    a < IMAGE_PROCESSING.BACKGROUND.ALPHA_THRESHOLD ||
    (r > IMAGE_PROCESSING.BACKGROUND.RGB_THRESHOLD &&
      g > IMAGE_PROCESSING.BACKGROUND.RGB_THRESHOLD &&
      b > IMAGE_PROCESSING.BACKGROUND.RGB_THRESHOLD)
  );
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
    const dataUrl = extractStickerFromRect(
      img,
      region.minX,
      region.minY,
      region.maxX - region.minX + 1,
      region.maxY - region.minY + 1,
    );

    return {
      id: `sticker-${Date.now()}-${index}`,
      dataUrl,
      originalX: region.minX,
      originalY: region.minY,
      width: region.maxX - region.minX + 1,
      height: region.maxY - region.minY + 1,
      name: `sticker_${index + 1}`,
      isNaming: false,
    };
  });

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
 * 从矩形区域提取贴纸
 */
const extractStickerFromRect = (
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  canvas.width = width;
  canvas.height = height;

  // 绘制原图的裁剪区域
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

  // 添加白色描边
  const imageData = ctx.getImageData(0, 0, width, height);

  const strokeCanvas = document.createElement('canvas');
  const strokeCtx = strokeCanvas.getContext('2d')!;
  strokeCanvas.width = width;
  strokeCanvas.height = height;

  strokeCtx.putImageData(imageData, 0, 0);

  // 绘制描边
  for (let angle = 0; angle < IMAGE_PROCESSING.STROKE.STEPS; angle++) {
    const rad = (angle / IMAGE_PROCESSING.STROKE.STEPS) * Math.PI * 2;
    const offsetX =
      Math.cos(rad) * IMAGE_PROCESSING.STROKE.WIDTH;
    const offsetY =
      Math.sin(rad) * IMAGE_PROCESSING.STROKE.WIDTH;

    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(strokeCanvas, offsetX, offsetY);
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = IMAGE_PROCESSING.STROKE.COLOR;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-atop';
  ctx.drawImage(strokeCanvas, 0, 0);

  return canvas.toDataURL('image/png');
};

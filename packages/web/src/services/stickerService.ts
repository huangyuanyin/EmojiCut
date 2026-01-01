import {
  StickerSegment,
  ProcessingStatus,
  GenerateStickerRequest,
  GenerateStickerResponse,
  GenerateNameRequest,
  GenerateNameResponse,
  API_ENDPOINTS,
  FILE_CONFIG,
} from '@emojicut/shared';
import { loadImage, processStickerSheet } from './imageProcessor';
import JSZip from 'jszip';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * 通用的 API 调用函数
 */
async function callStickerAPI<T>(
  endpoint: string,
  request: unknown,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 调用后端API生成贴纸
 */
export const generateSticker = async (
  request: GenerateStickerRequest,
): Promise<GenerateStickerResponse> => {
  return callStickerAPI<GenerateStickerResponse['data']>(
    API_ENDPOINTS.GENERATE_STICKER,
    request,
  );
};

/**
 * 调用后端API生成贴纸名称
 */
export const generateName = async (
  request: GenerateNameRequest,
): Promise<GenerateNameResponse> => {
  return callStickerAPI<GenerateNameResponse['data']>(
    API_ENDPOINTS.GENERATE_NAME,
    request,
  );
};

/**
 * 处理上传的文件 - 图像分割
 */
export const processFile = async (
  dataUrl: string,
  onProgress?: (status: ProcessingStatus) => void,
): Promise<{ success: boolean; segments?: StickerSegment[]; error?: string }> => {
  try {
    onProgress?.({
      stage: 'analyzing_layout',
      progress: 10,
      message: '加载图像...',
    });

    const img = await loadImage(dataUrl);
    const segments = await processStickerSheet(img, onProgress);

    return { success: true, segments };
  } catch (error) {
    console.error('Failed to process file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * 批量AI命名
 */
export const runAiNaming = async (
  segments: StickerSegment[],
  setSegments: React.Dispatch<React.SetStateAction<StickerSegment[]>>,
  onProgress?: (status: ProcessingStatus) => void,
): Promise<void> => {
  const batchSize = 3;
  const total = segments.length;

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    const currentEnd = Math.min(i + batchSize, total);

    onProgress?.({
      stage: 'ai_naming',
      progress: Math.round((currentEnd / total) * 100),
      message: `AI命名中... (${currentEnd}/${total})`,
    });

    // 标记为命名中
    const batchIds = batch.map((seg) => seg.id);
    setSegments((prev) =>
      prev.map((seg) =>
        batchIds.includes(seg.id) ? { ...seg, isNaming: true } : seg,
      ),
    );

    // 并行处理批次并收集结果
    const results = await Promise.all(
      batch.map(async (segment) => {
        const response = await generateName({ imageData: segment.dataUrl });
        return {
          id: segment.id,
          name: response.success && response.data ? response.data.filename : segment.name,
        };
      }),
    );

    // 统一更新状态
    setSegments((prev) =>
      prev.map((seg) => {
        const result = results.find((r) => r.id === seg.id);
        return result ? { ...seg, name: result.name, isNaming: false } : seg;
      }),
    );
  }

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: '全部完成！',
  });
};

/**
 * 下载所有贴纸为ZIP
 */
export const downloadAllStickers = async (
  segments: StickerSegment[],
): Promise<void> => {
  const zip = new JSZip();

  segments.forEach((segment) => {
    const base64Data = segment.dataUrl.split(',')[1];
    zip.file(`${segment.name}.png`, base64Data, { base64: true });
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = FILE_CONFIG.ZIP_FILENAME;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * 文件大小验证
 */
export const validateFileSize = (file: File): boolean => {
  return file.size <= FILE_CONFIG.MAX_FILE_SIZE;
};

/**
 * 文件类型验证
 */
export const validateFileType = (file: File): boolean => {
  return (FILE_CONFIG.ALLOWED_TYPES as readonly string[]).includes(file.type);
};

/**
 * 读取文件为Base64
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

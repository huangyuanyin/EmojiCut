import {
  StickerSegment,
  UploadImageResponse,
  UploadImagesResponse,
  API_ENDPOINTS,
} from '@emojicut/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const getExternalBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const host = window.location.hostname;
  return ['localhost', '127.0.0.1'].includes(host) ? API_BASE : `${location.protocol}//${host}:3001`;
};

const post = async <T>(endpoint: string, body: object): Promise<T> => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

/** 上传单个贴纸 */
export const uploadForShare = async (sticker: StickerSegment): Promise<UploadImageResponse> => {
  try {
    return await post(API_ENDPOINTS.UPLOAD_IMAGE, { imageData: sticker.rawDataUrl, filename: sticker.name });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Upload failed' };
  }
};

/** 批量上传贴纸 */
export const uploadAllForShare = async (stickers: StickerSegment[]): Promise<UploadImagesResponse> => {
  try {
    return await post(API_ENDPOINTS.UPLOAD_IMAGES, { images: stickers.map(s => ({ imageData: s.rawDataUrl, filename: s.name })) });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Upload failed' };
  }
};

/** 生成下载页链接 */
export const getImageDownloadUrl = (id: string) => `${getExternalBase()}/api/sticker/download/${id}`;
export const getAllDownloadUrl = (id: string) => `${getExternalBase()}/api/sticker/download-all/${id}`;

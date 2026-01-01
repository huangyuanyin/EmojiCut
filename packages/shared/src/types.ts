/**
 * 应用模式
 */
export type AppMode = 'generate' | 'cut';

/**
 * 处理阶段
 */
export type ProcessingStage =
  | 'idle'
  | 'analyzing_layout'
  | 'segmenting'
  | 'ai_naming'
  | 'complete';

/**
 * 处理状态
 */
export interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number; // 0-100
  message: string;
}

/**
 * 贴纸片段
 */
export interface StickerSegment {
  id: string;
  dataUrl: string;
  originalX: number;
  originalY: number;
  width: number;
  height: number;
  name: string;
  isNaming: boolean;
}

/**
 * 画面风格类型
 */
export type StickerStyle = 'line_cute' | 'chibi_expressive' | 'kawaii_pastel' | 'dynamic_action' | 'custom';

/**
 * 图片纵横比类型
 */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

/**
 * 图片生成配置
 */
export interface ImageConfig {
  aspectRatio?: AspectRatio;
  // Future: add other config options like quality, size, etc.
}

/**
 * 贴纸生成请求
 */
export interface GenerateStickerRequest {
  referenceImage: string; // Base64 encoded image
  style: StickerStyle;
  customStyle?: string;
  aspectRatio?: AspectRatio; // 图片纵横比
  count?: number; // 生成数量 (1-16)
}

/**
 * 贴纸生成响应
 */
export interface GenerateStickerResponse {
  success: boolean;
  data?: {
    imageData: string; // Base64 encoded PNG
  };
  error?: string;
}

/**
 * AI命名请求
 */
export interface GenerateNameRequest {
  imageData: string; // Base64 encoded image
}

/**
 * AI命名响应
 */
export interface GenerateNameResponse {
  success: boolean;
  data?: {
    filename: string;
  };
  error?: string;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

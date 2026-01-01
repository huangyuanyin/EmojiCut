/**
 * 矩形区域定义（用于手动裁剪）
 */
export interface Rect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

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
  dataUrl: string;        // 带描边的版本（用于显示）
  rawDataUrl: string;     // 不带描边的版本（用于下载）
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
export type StickerStyle = 'line_cute' | 'chibi_expressive' | 'kawaii_pastel' | 'dynamic_action' | 'realistic' | 'custom';

/**
 * 风格类别 - 决定 AI 提示词模板
 */
export type StyleCategory = 'cartoon' | 'realistic';

/**
 * 风格配置项
 */
export interface StyleConfigItem {
  /** 显示名称 */
  name: string;
  /** AI 提示词描述 */
  description: string;
  /** 风格类别 */
  category: StyleCategory;
}

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
  withCaption?: boolean; // 是否带文字
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

/**
 * 图片上传请求（用于生成分享二维码）
 */
export interface UploadImageRequest {
  imageData: string;
  filename?: string;
}

/**
 * 图片上传响应
 */
export interface UploadImageResponse {
  success: boolean;
  data?: {
    id: string;      // 图片唯一标识
    url: string;     // 访问URL
    expiresAt: number; // 过期时间戳
  };
  error?: string;
}

/**
 * 获取图片响应
 */
export interface GetImageResponse {
  success: boolean;
  data?: {
    imageData: string;
    filename: string;
  };
  error?: string;
}

/**
 * 批量上传图片请求
 */
export interface UploadImagesRequest {
  images: Array<{
    imageData: string;
    filename: string;
  }>;
}

/**
 * 批量上传图片响应
 */
export interface UploadImagesResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    count: number;
    expiresAt: number;
  };
  error?: string;
}

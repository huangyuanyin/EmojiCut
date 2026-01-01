/**
 * Gemini API 内容部分
 */
export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  inline_data?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Gemini API 内容
 */
export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/**
 * 安全设置
 */
export interface SafetySetting {
  category: string;
  threshold: string;
}

/**
 * 生成配置
 */
export interface GeminiGenerationConfig {
  imageConfig?: {
    aspectRatio: string;
  };
  safetySettings?: SafetySetting[];
}

/**
 * Gemini API 响应
 */
export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: GeminiPart[];
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

/**
 * Gemini API 请求
 */
export interface GeminiRequestBody {
  contents: GeminiContent[];
  generationConfig?: Omit<GeminiGenerationConfig, 'safetySettings'>;
  safetySettings?: SafetySetting[];
}

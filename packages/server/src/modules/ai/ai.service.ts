import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetch, ProxyAgent } from 'undici';
import { StickerStyle } from '@emojicut/shared';
import { AppConfig } from '../../app.module';
import {
  STICKER_GENERATION_PROMPT,
  STICKER_NAMING_PROMPT,
  MAX_FILENAME_LENGTH,
  API_TIMEOUT,
  DEFAULT_SAFETY_SETTINGS,
  STYLE_CONFIG,
  getStyleCategory,
} from './ai.constants';
import {
  GeminiContent,
  GeminiGenerationConfig,
  GeminiResponse,
  GeminiPart,
} from './ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private _baseUrl: string;
  private _apiKey: string;
  private _model: string;
  private _proxyAgent: ProxyAgent | null = null;

  constructor(private configService: ConfigService) {
    const geminiConfig = this.configService.get<AppConfig['gemini']>('gemini');
    const proxyConfig = this.configService.get<AppConfig['proxy']>('proxy');

    this._apiKey = geminiConfig?.apiKey || '';
    this._baseUrl = geminiConfig?.baseUrl || '';
    this._model = geminiConfig?.model || 'gemini-2.0-flash-exp';

    // 检查 HTTP 代理配置
    const httpProxy = proxyConfig?.https || proxyConfig?.http || '';

    this.logger.log(`API Key loaded: ${this._apiKey ? 'YES' : 'NO'}`);
    this.logger.log(`Model: ${this._model}`);
    this.logger.log(`Base URL: ${this._baseUrl || 'NONE (using official API)'}`);
    this.logger.log(`HTTP Proxy: ${httpProxy || 'NONE'}`);

    if (!this._apiKey) {
      this.logger.warn('GEMINI_API_KEY not found in configuration');
    }

    // 如果配置了 HTTP 代理，创建代理 agent
    if (httpProxy && !this._baseUrl) {
      this._proxyAgent = new ProxyAgent(httpProxy);
      this.logger.log(`✓ Using HTTP proxy for official Gemini API`);
    }

    if (this._baseUrl) {
      this.logger.log(`✓ Using custom Gemini endpoint: ${this._baseUrl}`);
    } else {
      this.logger.log(`✓ Using official Gemini API`);
    }
  }

  /**
   * 调用 Gemini API
   */
  private async _callGeminiAPI(
    contents: Omit<GeminiContent, 'role'>[],
    generationConfig?: GeminiGenerationConfig,
  ): Promise<GeminiResponse> {
    // 如果配置了完整 URL，直接使用；否则使用官方 API
    const apiUrl = this._baseUrl ||
      `https://generativelanguage.googleapis.com/v1beta/models/${this._model}:generateContent`;

    this.logger.log(`Calling API: ${apiUrl}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 官方 API 使用 query param，自定义端点使用 Bearer token
    const finalUrl = this._baseUrl ? apiUrl : `${apiUrl}?key=${this._apiKey}`;

    if (this._baseUrl) {
      headers['Authorization'] = `Bearer ${this._apiKey}`;
    }

    // 为 Imagen API 格式化 contents（添加 role）
    const formattedContents: GeminiContent[] = contents.map(content => ({
      role: 'user' as const,
      ...content
    }));

    const requestBody: {
      contents: GeminiContent[];
      generationConfig?: Omit<GeminiGenerationConfig, 'safetySettings'>;
      safetySettings?: GeminiGenerationConfig['safetySettings'];
    } = { contents: formattedContents };

    // 如果提供了 generationConfig，分离 safetySettings 和其他配置
    if (generationConfig) {
      const { safetySettings, ...otherConfig } = generationConfig;

      // generationConfig 只包含非 safetySettings 的配置
      if (Object.keys(otherConfig).length > 0) {
        requestBody.generationConfig = otherConfig;
      }

      // safetySettings 作为顶级字段
      if (safetySettings) {
        requestBody.safetySettings = safetySettings;
      }
    }

    const fetchOptions: {
      method: string;
      headers: Record<string, string>;
      body: string;
      signal: AbortSignal;
      dispatcher?: ProxyAgent;
    } = {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(API_TIMEOUT),
    };

    this.logger.log(`Request body keys: ${Object.keys(requestBody).join(', ')}`);

    // 如果有代理 agent，使用 dispatcher 选项
    if (this._proxyAgent) {
      fetchOptions.dispatcher = this._proxyAgent;
    }

    try {
      const response = await fetch(finalUrl, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API response: ${response.status} - ${errorText.substring(0, 500)}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        this.logger.error('API request timeout after 30 seconds');
        throw new Error('API request timeout');
      }
      throw error;
    }
  }

  /**
   * 生成贴纸
   */
  async generateStickerSheet(
    referenceImageBase64: string,
    style: StickerStyle,
    customStyle?: string,
    aspectRatio?: string,
    count: number = 1,
    withCaption: boolean = false,
  ): Promise<string> {
    try {
      this.logger.log(`Generating sticker sheet with style: ${style}, aspectRatio: ${aspectRatio || 'default'}, count: ${count}, withCaption: ${withCaption}`);

      const styleDescription = this._getStyleDescription(style, customStyle);
      const category = getStyleCategory(style);
      const prompt = STICKER_GENERATION_PROMPT(styleDescription, category, count, withCaption);

      const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, '');

      const contents = [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: base64Data } }
        ]
      }];

      const generationConfig: GeminiGenerationConfig = {
        safetySettings: DEFAULT_SAFETY_SETTINGS,
      };

      if (aspectRatio) {
        generationConfig.imageConfig = { aspectRatio };
      }

      const data = await this._callGeminiAPI(contents, generationConfig);

      this.logger.log(`Response has ${data.candidates?.length || 0} candidates`);

      const candidates = data.candidates;

      if (!candidates || candidates.length === 0) {
        if (data.promptFeedback) {
          this.logger.error(`Prompt feedback: ${JSON.stringify(data.promptFeedback)}`);

          if (data.promptFeedback.blockReason) {
            throw new Error(`Content blocked by safety filters: ${data.promptFeedback.blockReason}`);
          }
        }

        this.logger.error(`Full response: ${JSON.stringify(data)}`);
        throw new Error('No candidates in response - possibly blocked by safety filters or model limitations');
      }

      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: GeminiPart) => part.inlineData || part.inline_data);

      if (!imagePart) {
        this.logger.error(`Parts: ${JSON.stringify(parts).substring(0, 500)}`);
        throw new Error('No image data in response');
      }

      const imageData = imagePart.inlineData || imagePart.inline_data;

      return `data:image/png;base64,${imageData.data}`;
    } catch (error) {
      this.logger.error(`Failed to generate sticker sheet: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成贴纸名称
   */
  async generateStickerName(imageBase64: string): Promise<string> {
    try {
      const prompt = STICKER_NAMING_PROMPT;

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const contents = [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: base64Data } }
        ]
      }];

      const data = await this._callGeminiAPI(contents);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      // 清理文件名，保留中文、英文、数字和下划线
      const cleanedName = text
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, '')
        .substring(0, MAX_FILENAME_LENGTH); // 限制长度

      return cleanedName || '贴纸';
    } catch (error) {
      this.logger.error(`Failed to generate sticker name: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取风格描述
   */
  private _getStyleDescription(style: StickerStyle, customStyle?: string): string {
    if (style === 'custom' && customStyle) {
      return customStyle;
    }
    return STYLE_CONFIG[style]?.description || STYLE_CONFIG.line_cute.description;
  }
}

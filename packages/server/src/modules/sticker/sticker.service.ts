import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import {
  GenerateStickerRequest,
  GenerateStickerResponse,
  GenerateNameRequest,
  GenerateNameResponse,
} from '@emojicut/shared';

@Injectable()
export class StickerService {
  private readonly logger = new Logger(StickerService.name);

  constructor(private aiService: AiService) {}

  /**
   * 生成贴纸
   */
  async generateSticker(
    request: GenerateStickerRequest,
  ): Promise<GenerateStickerResponse> {
    try {
      this.logger.log(`Generating sticker with style: ${request.style}`);

      const imageData = await this.aiService.generateStickerSheet(
        request.referenceImage,
        request.style,
        request.customStyle,
        request.aspectRatio, // 传递 aspectRatio 参数
      );

      return {
        success: true,
        data: { imageData },
      };
    } catch (error) {
      this.logger.error(`Failed to generate sticker: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to generate sticker',
      };
    }
  }

  /**
   * 生成贴纸名称
   */
  async generateName(
    request: GenerateNameRequest,
  ): Promise<GenerateNameResponse> {
    try {
      this.logger.log('Generating sticker name');

      const filename = await this.aiService.generateStickerName(
        request.imageData,
      );

      return {
        success: true,
        data: { filename },
      };
    } catch (error) {
      this.logger.error(`Failed to generate name: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to generate name',
      };
    }
  }
}

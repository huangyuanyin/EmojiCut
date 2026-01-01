import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import {
  GenerateStickerRequest, GenerateStickerResponse,
  GenerateNameRequest, GenerateNameResponse,
  UploadImageRequest, UploadImageResponse,
  UploadImagesRequest, UploadImagesResponse,
  GetImageResponse, SHARE_CONFIG,
} from '@emojicut/shared';

interface StoredImage {
  imageData: string;
  filename: string;
  expiresAt: number;
}

interface StoredGroup {
  images: Array<{ imageData: string; filename: string }>;
  count: number;
  expiresAt: number;
}

@Injectable()
export class StickerService {
  private readonly logger = new Logger(StickerService.name);
  private readonly images = new Map<string, StoredImage>();
  private readonly groups = new Map<string, StoredGroup>();

  constructor(private ai: AiService) {
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let count = 0;
    for (const [id, item] of [...this.images, ...this.groups] as [string, { expiresAt: number }][]) {
      if (item.expiresAt < now) {
        this.images.delete(id);
        this.groups.delete(id);
        count++;
      }
    }
    if (count) this.logger.log(`Cleaned ${count} expired items`);
  }

  private genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  async generateSticker(req: GenerateStickerRequest): Promise<GenerateStickerResponse> {
    try {
      this.logger.log(`Generating sticker: style=${req.style}, caption=${req.withCaption || false}`);
      const imageData = await this.ai.generateStickerSheet(
        req.referenceImage, req.style, req.customStyle, req.aspectRatio, req.count || 1, req.withCaption || false
      );
      return { success: true, data: { imageData } };
    } catch (e) {
      this.logger.error(`Generate sticker failed: ${e.message}`);
      return { success: false, error: e.message || 'Failed to generate sticker' };
    }
  }

  async generateName(req: GenerateNameRequest): Promise<GenerateNameResponse> {
    try {
      const filename = await this.ai.generateStickerName(req.imageData);
      return { success: true, data: { filename } };
    } catch (e) {
      this.logger.error(`Generate name failed: ${e.message}`);
      return { success: false, error: e.message || 'Failed to generate name' };
    }
  }

  async uploadImage(req: UploadImageRequest): Promise<UploadImageResponse> {
    try {
      if (this.images.size >= SHARE_CONFIG.MAX_IMAGES) {
        this.cleanup();
        if (this.images.size >= SHARE_CONFIG.MAX_IMAGES) {
          const oldest = this.images.keys().next().value;
          if (oldest) this.images.delete(oldest);
        }
      }

      const id = this.genId();
      const expiresAt = Date.now() + SHARE_CONFIG.EXPIRE_TIME;
      this.images.set(id, { imageData: req.imageData, filename: req.filename || 'sticker', expiresAt });
      this.logger.log(`Uploaded image: ${id}`);
      return { success: true, data: { id, url: `/api/sticker/image/${id}`, expiresAt } };
    } catch (e) {
      this.logger.error(`Upload image failed: ${e.message}`);
      return { success: false, error: e.message || 'Upload failed' };
    }
  }

  getImage(id: string): GetImageResponse {
    const img = this.images.get(id);
    if (!img) return { success: false, error: 'Image not found' };
    if (img.expiresAt < Date.now()) {
      this.images.delete(id);
      return { success: false, error: 'Image expired' };
    }
    return { success: true, data: { imageData: img.imageData, filename: img.filename } };
  }

  async uploadImages(req: UploadImagesRequest): Promise<UploadImagesResponse> {
    try {
      const id = this.genId();
      const expiresAt = Date.now() + SHARE_CONFIG.EXPIRE_TIME;
      this.groups.set(id, { images: req.images, count: req.images.length, expiresAt });
      this.logger.log(`Uploaded ${req.images.length} images: ${id}`);
      return { success: true, data: { id, url: `/api/sticker/download-all/${id}`, count: req.images.length, expiresAt } };
    } catch (e) {
      this.logger.error(`Upload images failed: ${e.message}`);
      return { success: false, error: e.message || 'Upload failed' };
    }
  }

  getImageGroup(id: string): { success: boolean; data?: { images: Array<{ imageData: string; filename: string }>; count: number }; error?: string } {
    const g = this.groups.get(id);
    if (!g) return { success: false, error: 'Not found' };
    if (g.expiresAt < Date.now()) {
      this.groups.delete(id);
      return { success: false, error: 'Expired' };
    }
    return { success: true, data: { images: g.images, count: g.count } };
  }
}

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { StickerService } from './sticker.service';
import {
  GenerateStickerRequest,
  GenerateStickerResponse,
  GenerateNameRequest,
  GenerateNameResponse,
} from '@emojicut/shared';

@Controller('sticker')
export class StickerController {
  constructor(private readonly stickerService: StickerService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateSticker(
    @Body() request: GenerateStickerRequest,
  ): Promise<GenerateStickerResponse> {
    return this.stickerService.generateSticker(request);
  }

  @Post('name')
  @HttpCode(HttpStatus.OK)
  async generateName(
    @Body() request: GenerateNameRequest,
  ): Promise<GenerateNameResponse> {
    return this.stickerService.generateName(request);
  }
}

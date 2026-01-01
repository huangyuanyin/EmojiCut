import { Module } from '@nestjs/common';
import { StickerController } from './sticker.controller';
import { StickerService } from './sticker.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [StickerController],
  providers: [StickerService],
})
export class StickerModule {}

import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { StickerService } from './sticker.service';
import {
  GenerateStickerRequest, GenerateStickerResponse,
  GenerateNameRequest, GenerateNameResponse,
  UploadImageRequest, UploadImageResponse,
  UploadImagesRequest, UploadImagesResponse,
  GetImageResponse,
} from '@emojicut/shared';

// 公共样式
const BASE_STYLES = `
:root{--pink:#FFC0CB;--pink-dark:#FF99A4;--bg:#FFF5F7;--lavender:#E6E6FA;--blue:#E0F7FA;--text:#6B4C4C;--border:#FFB7B2}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Mali','Noto Sans SC',-apple-system,sans-serif;background:var(--bg);background-image:radial-gradient(var(--pink-dark) 2px,transparent 2px);background-size:30px 30px;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;color:var(--text)}
.card{background:#fff;border-radius:40px;border:5px solid var(--pink);padding:28px 24px;max-width:340px;width:100%;box-shadow:0 12px 0 var(--border),0 24px 40px rgba(255,182,193,.3);text-align:center;position:relative}
.card::before,.card::after{position:absolute;top:-15px;font-size:24px;animation:float 2s ease-in-out infinite}
.card::before{content:'✨';left:20px}.card::after{content:'💖';right:25px;animation-direction:reverse}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px) rotate(10deg)}}
.title{font-size:22px;font-weight:700;margin-bottom:6px}.subtitle{font-size:13px;color:#999;margin-bottom:20px}
.footer{margin-top:20px;font-size:12px;opacity:.6}
`;

const htmlPage = (title: string, styles: string, body: string) => `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Mali:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>${BASE_STYLES}${styles}</style>
</head><body>${body}</body></html>`;

const base64ToBuffer = (dataUrl: string) => Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');

@Controller('sticker')
export class StickerController {
  constructor(private readonly stickerService: StickerService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generateSticker(@Body() req: GenerateStickerRequest): Promise<GenerateStickerResponse> {
    return this.stickerService.generateSticker(req);
  }

  @Post('name')
  @HttpCode(HttpStatus.OK)
  generateName(@Body() req: GenerateNameRequest): Promise<GenerateNameResponse> {
    return this.stickerService.generateName(req);
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  uploadImage(@Body() req: UploadImageRequest): Promise<UploadImageResponse> {
    return this.stickerService.uploadImage(req);
  }

  @Post('upload-all')
  @HttpCode(HttpStatus.OK)
  uploadImages(@Body() req: UploadImagesRequest): Promise<UploadImagesResponse> {
    return this.stickerService.uploadImages(req);
  }

  @Get('image/:id/info')
  @HttpCode(HttpStatus.OK)
  getImageInfo(@Param('id') id: string): GetImageResponse {
    return this.stickerService.getImage(id);
  }

  @Get('image/:id')
  getImage(@Param('id') id: string, @Res() res: Response) {
    const result = this.stickerService.getImage(id);
    if (!result.success || !result.data) return res.status(404).json(result);
    this.sendImage(res, result.data.imageData, result.data.filename, 'attachment');
  }

  @Get('download/:id')
  downloadPage(@Param('id') id: string, @Res() res: Response) {
    const result = this.stickerService.getImage(id);
    if (!result.success || !result.data) return this.sendError(res, '图片不存在或已过期');
    res.type('html').send(this.singlePage(result.data.imageData, result.data.filename));
  }

  @Get('download-all/:id')
  async downloadAllPage(@Param('id') id: string, @Res() res: Response) {
    const result = this.stickerService.getImageGroup(id);
    if (!result.success || !result.data) return this.sendError(res, '贴纸包不存在或已过期');
    res.type('html').send(this.allPage(result.data.images, result.data.count));
  }

  @Get('download-all/:id/image/:index')
  async getGroupImage(@Param('id') id: string, @Param('index') index: string, @Res() res: Response) {
    const result = this.stickerService.getImageGroup(id);
    if (!result.success || !result.data) return res.status(404).json(result);
    const idx = +index;
    if (isNaN(idx) || idx < 0 || idx >= result.data.images.length) {
      return res.status(404).json({ success: false, error: 'Index out of range' });
    }
    const img = result.data.images[idx];
    this.sendImage(res, img.imageData, img.filename, 'inline');
  }

  private sendImage(res: Response, dataUrl: string, filename: string, disposition: string) {
    const buf = base64ToBuffer(dataUrl);
    res.set({ 'Content-Type': 'image/png', 'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}.png"`, 'Content-Length': buf.length });
    res.send(buf);
  }

  private sendError(res: Response, msg: string) {
    res.status(404).type('html').send(htmlPage('出错了', '.emoji{font-size:64px;margin-bottom:16px}',
      `<div class="card"><div class="emoji">😿</div><h1 class="title">哎呀，出错了~</h1><p class="subtitle">${msg}</p></div>`));
  }

  private singlePage(imageData: string, filename: string) {
    return htmlPage(`保存贴纸 - ${filename}`, `
.img-box{background:var(--blue);border:3px dashed #B2EBF2;border-radius:24px;padding:20px;margin-bottom:16px}
.img-box img{max-width:100%;max-height:220px;border-radius:12px;display:block;margin:0 auto;filter:drop-shadow(0 6px 12px rgba(0,0,0,.15))}
.name{font-size:13px;font-weight:600;background:var(--lavender);padding:8px 18px;border-radius:20px;margin-bottom:16px;display:inline-block;border:2px solid #D1C4E9}
.tips{background:linear-gradient(135deg,#FFE4EC,#E8D5FF);border-radius:20px;padding:14px 16px;margin-bottom:16px;border:2px solid var(--pink);font-size:12px;line-height:1.7}
.tips b{color:#E91E63}.tips-t{font-size:13px;font-weight:700;color:#7B1FA2;margin-bottom:8px}
.btn{display:flex;align-items:center;justify-content:center;width:100%;padding:14px;border:none;border-radius:25px;font-size:15px;font-weight:700;font-family:inherit;background:linear-gradient(135deg,#FF9AAA,#C88AFF);color:#fff;box-shadow:0 4px 0 #E57A8A;text-decoration:none}
.btn:active{transform:translateY(4px);box-shadow:none}`,
      `<div class="card">
<h1 class="title">保存贴纸 🎀</h1><p class="subtitle">长按图片即可保存到相册哦~</p>
<div class="img-box"><img src="${imageData}" alt="${filename}"></div>
<div class="name">📎 ${filename}</div>
<div class="tips"><div class="tips-t">💡 保存方法</div><b>iPhone:</b> 长按图片 → 添加到照片<br><b>Android:</b> 长按图片 → 保存图片</div>
<a href="${imageData}" download="${filename}.png" class="btn">📥 点击下载</a>
</div><div class="footer">由 EmojiCut 生成 💖</div>`);
  }

  private allPage(images: Array<{ imageData: string; filename: string }>, count: number) {
    const grid = images.map(i => `<div class="item"><img src="${i.imageData}" alt="${i.filename}"><div class="name">${i.filename}</div></div>`).join('');
    return htmlPage('保存全部贴纸', `
body{justify-content:flex-start;padding-bottom:80px}
.header{text-align:center;margin-bottom:24px}.badge{display:inline-block;background:linear-gradient(135deg,#FF9AAA,#C88AFF);color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-top:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;max-width:600px;margin:0 auto}
.item{background:#fff;border-radius:20px;border:3px solid var(--pink);padding:12px;text-align:center;box-shadow:0 6px 0 var(--border)}
.item:active{transform:translateY(4px);box-shadow:0 2px 0 var(--border)}
.item img{width:100%;border-radius:12px;-webkit-touch-callout:default}
.name{font-size:11px;margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:3px solid var(--pink);padding:16px;text-align:center;box-shadow:0 -4px 20px rgba(255,182,193,.3);font-weight:600}
.bar span{color:#E91E63}`,
      `<div class="header"><h1 class="title">✨ 你的贴纸们 ✨</h1><p class="subtitle">长按图片保存到相册哦~</p><div class="badge">共 ${count} 个贴纸 💖</div></div>
<div class="grid">${grid}</div>
<div class="footer">由 EmojiCut 生成 💖</div>
<div class="bar">📷 <span>长按</span>图片即可保存到相册~</div>`);
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // 禁用默认 body parser
  });

  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });

  // 开发环境允许所有来源，生产环境可按需限制
  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService<AppConfig>);
  const serverConfig = configService.get<AppConfig['server']>('server');
  const port = serverConfig?.port || 3001;

  // 监听所有网络接口，允许局域网访问
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server is running on: http://localhost:${port}`);
  console.log(`🌐 LAN access: http://0.0.0.0:${port}`);
  console.log(`📝 API documentation: http://localhost:${port}/api`);
}

bootstrap();

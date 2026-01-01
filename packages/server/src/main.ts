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

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService<AppConfig>);
  const serverConfig = configService.get<AppConfig['server']>('server');
  const port = serverConfig?.port || 3001;

  await app.listen(port);

  console.log(`🚀 Server is running on: http://localhost:${port}`);
  console.log(`📝 API documentation: http://localhost:${port}/api`);
}

bootstrap();

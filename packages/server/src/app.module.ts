import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StickerModule } from './modules/sticker/sticker.module';
import { AiModule } from './modules/ai/ai.module';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';

/**
 * 应用配置接口
 */
export interface AppConfig {
  gemini: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  proxy?: {
    http?: string;
    https?: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
}

/**
 * 加载 YAML 配置文件
 */
function loadConfiguration(): AppConfig {
  const configPath = resolve(process.cwd(), 'resource', 'config', 'application.local.yaml');

  if (!existsSync(configPath)) {
    console.error('❌ Configuration file not found: application.local.yaml');
    console.error('📝 Please copy application.local.example.yaml to application.local.yaml');
    console.error(`   Location: ${configPath}`);
    process.exit(1);
  }

  try {
    const fileContent = readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent) as Record<string, any>;
    console.log(`✓ Loaded config from: ${configPath}`);

    return {
      gemini: {
        apiKey: config.gemini?.apiKey || '',
        model: config.gemini?.model || 'gemini-2.0-flash-exp',
        baseUrl: config.gemini?.baseUrl || '',
      },
      proxy: {
        http: config.proxy?.http || '',
        https: config.proxy?.https || '',
      },
      server: {
        port: config.server?.port || 3001,
        nodeEnv: config.server?.nodeEnv || 'development',
      },
    };
  } catch (error) {
    console.error('❌ Failed to load configuration:', error.message);
    process.exit(1);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfiguration],
      ignoreEnvFile: true,
    }),
    StickerModule,
    AiModule,
  ],
})
export class AppModule {}

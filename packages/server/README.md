# @emojicut/server

EmojiCut 后端服务 - 基于Nest.js构建

## 功能

- AI 贴纸生成 (Google Gemini)
- AI 贴纸智能命名
- RESTful API

## 开发

```bash
pnpm dev         # 开发模式
pnpm build       # 构建
pnpm start:prod  # 生产模式
```

## 配置

```bash
# 复制配置文件
cd resource/config
cp application.local.example.yaml application.local.yaml

# 编辑配置填入 Gemini API Key
```

## API

- `POST /api/sticker/generate` - 生成贴纸
- `POST /api/sticker/name` - 生成贴纸名称

## 项目结构

```
src/
└── modules/
    ├── ai/       # AI 服务
    └── sticker/  # 贴纸业务
```

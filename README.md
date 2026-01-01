# EmojiCut - AI贴纸生成工具

> AI驱动的LINE风格贴纸自动生成和智能切割系统

## 功能特性

✨ **AI贴纸生成** - 基于参考图生成16张可爱贴纸
🎨 **多种画风** - 支持LINE可爱、Q版、粉彩等多种风格
✂️ **智能切割** - 自动识别和分割贴纸
🤖 **AI命名** - 智能生成描述性文件名
📦 **批量下载** - 一键打包ZIP下载

## 技术栈

**前端**: React 19 + TypeScript + Rsbuild + Less
**后端**: Nest.js + TypeScript + Google Gemini AI
**架构**: pnpm workspace monorepo

## 快速开始

### 安装

```bash
# 安装依赖
pnpm install

# 配置环境
cp .env.example .env
# 编辑 .env 填入 Gemini API Key
```

### 开发

```bash
# 启动前后端
pnpm dev

# 单独启动
pnpm dev:web    # 前端
pnpm dev:server # 后端
```

### 构建

```bash
pnpm build
```

## 项目结构

```
packages/
├── web/      # 前端应用
├── server/   # 后端服务
└── shared/   # 共享类型
```

## 核心工作流

1. **上传参考图** → 2. **选择画风** → 3. **AI生成16张贴纸** → 4. **自动智能切割** → 5. **AI命名** → 6. **下载ZIP**

## 开发指南

详见各子包的README：
- [Web应用](./packages/web/README.md)
- [Server服务](./packages/server/README.md)
- [共享类型](./packages/shared/README.md)

## License

MIT

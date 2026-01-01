# @emojicut/web

EmojiCut 前端应用 - 基于React和Rsbuild构建

## 技术栈

- **React 19** - UI框架
- **TypeScript** - 类型安全
- **Rsbuild** - 快速构建工具
- **Less** - CSS预处理器
- **lucide-react** - 图标库
- **Canvas API** - 图像处理

## 开发

```bash
pnpm dev      # 开发模式
pnpm build    # 构建
pnpm preview  # 预览
```

## 主要功能

1. **AI贴纸生成** - 上传参考图，选择风格，生成16张贴纸
2. **自动切割** - 智能识别和分割贴纸
3. **AI命名** - 自动为贴纸生成描述性名称
4. **批量下载** - ZIP打包下载所有贴纸

## 项目结构

```
src/
├── components/  # React 组件
├── services/    # 业务逻辑
├── styles/      # 全局样式
└── App.tsx      # 主应用
```

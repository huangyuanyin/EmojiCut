# @emojicut/shared

共享类型定义和常量库，供前后端使用。

## 包含内容

- TypeScript 类型定义
- API 端点常量
- 图像处理配置
- 贴纸风格配置

## 使用

```typescript
import {
  StickerStyle,
  StickerSegment,
  API_ENDPOINTS,
  STYLE_DESCRIPTIONS
} from '@emojicut/shared';
```

## 核心类型

- `StickerStyle` - 贴纸风格枚举
- `StickerSegment` - 贴纸片段数据
- `AppMode` - 应用模式 (generate/cut)
- `ProcessingStage` - 处理阶段

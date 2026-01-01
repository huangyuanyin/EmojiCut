# EmojiCut 项目开发规范

## 项目概述

EmojiCut 是一个基于 AI 驱动的贴纸生成和自动切割工具，采用 Monorepo 架构。

### 核心功能
- **生成模式 (generate)**：基于参考图使用 AI 生成贴纸图片
- **切割模式 (cut)**：自动识别和分割图片中的贴纸，支持 AI 智能命名

### 技术栈
- **前端**: React 19 + TypeScript + Rsbuild + Less
- **后端**: Nest.js + TypeScript + Google Gemini AI
- **共享包**: TypeScript 类型定义和常量
- **包管理**: pnpm workspace

---

## 项目架构规范

### Monorepo 包结构

```
packages/
├── shared/           # 共享类型和常量
│   ├── src/
│   │   ├── types.ts       # TypeScript 类型定义
│   │   ├── constants.ts   # 共享常量
│   │   └── index.ts       # 统一导出
│   └── package.json
│
├── web/              # 前端应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── services/      # 业务服务（API 调用、图像处理等）
│   │   ├── hooks/         # 自定义 React Hooks
│   │   ├── utils/         # 工具函数
│   │   ├── styles/        # 全局样式
│   │   ├── App.tsx        # 根组件
│   │   └── index.tsx      # 入口文件
│   └── package.json
│
└── server/           # 后端服务
    ├── src/
    │   ├── modules/       # 功能模块
    │   │   ├── ai/        # AI 服务模块
    │   │   └── sticker/   # 贴纸业务模块
    │   ├── app.module.ts  # 根模块
    │   └── main.ts        # 入口文件
    └── package.json
```

### 前端目录结构规范

```
src/
├── components/          # UI 组件
│   ├── CutePrinter2D/  # 打印机组件
│   │   ├── index.tsx
│   │   ├── helper.ts
│   │   └── index.module.less
│   └── StickerStack/   # 贴纸堆栈组件
│       ├── index.tsx
│       └── index.module.less
│
├── services/           # 业务逻辑服务
│   ├── stickerService.ts    # API 调用服务
│   └── imageProcessor.ts    # 图像处理服务
│
├── hooks/              # 自定义 Hooks（如需要）
│   └── useImageProcessor.ts
│
├── utils/              # 工具函数
│   └── download.ts
│
├── styles/             # 全局样式
│   ├── reset.less
│   └── variables.less
│
├── App.tsx            # 根组件
└── index.tsx          # 应用入口
```

### 后端模块结构规范（Nest.js）

```
src/modules/sticker/
├── sticker.module.ts      # 模块定义
├── sticker.controller.ts  # 控制器（路由）
├── sticker.service.ts     # 业务逻辑
└── dto/                   # 数据传输对象（可选）
    ├── generate-sticker.dto.ts
    └── generate-name.dto.ts
```

---

## 代码开发原则

### 核心原则（SOLID）

1. **单一职责（SRP）**
   - 每个函数/组件只做一件事
   - 常量、工具、逻辑、UI 各司其职
   - 示例：图像处理逻辑抽离到 `imageProcessor.ts`，不与 UI 组件耦合

2. **开放封闭（OCP）**
   - 对扩展开放，对修改封闭
   - 通过组合而非修改来扩展功能
   - 示例：新增贴纸风格通过添加配置，而非修改现有代码

3. **最小知识（LoD）**
   - 组件只与直接依赖交互
   - 避免深层级调用（如 `a.b.c.d.method()`）
   - 使用 Props 或 Context 传递依赖

4. **依赖倒置（DIP）**
   - 依赖抽象而非具体实现
   - 通过 Props 传入依赖
   - 示例：组件接收 `onSubmit` 回调，而非直接调用 API

5. **组合优于继承**
   - 使用组合模式和 Hooks 复用逻辑
   - 避免复杂继承体系
   - 示例：使用自定义 Hook 如 `useImageProcessor` 复用逻辑

### 代码实践

1. **职责分离**
   - 常量定义在 `constants.ts` 或 `@emojicut/shared/constants`
   - 工具函数在 `helper.ts` 或独立的 `utils/` 文件
   - 业务逻辑在 `service.ts` 或 `hooks/`
   - UI 组件只关注渲染和交互

2. **纯函数优先**
   - 尽可能将逻辑实现为纯函数（无副作用）
   - 避免与视图状态绑定
   - 便于测试和复用
   ```typescript
   // ✅ 好的做法
   function calculateProgress(current: number, total: number): number {
     return Math.round((current / total) * 100);
   }

   // ❌ 避免
   function calculateProgress() {
     return Math.round((this.state.current / this.state.total) * 100);
   }
   ```

3. **可维护性**
   - 相关代码集中管理，便于查找和修改
   - 模块内聚，减少跨文件依赖
   - 合理使用目录结构组织代码

4. **可测试性**
   - 纯函数抽离到 `helper.ts`，方便单元测试
   - 避免在组件内编写复杂逻辑
   - Mock 外部依赖（API、第三方库）

5. **简洁性**
   - 主组件文件保持清晰，一般不超过 300 行
   - 单个文件过长要做拆分
   - 提取子组件或自定义 Hook

6. **文案管理**
   - 文案直接写在组件中，不抽离为常量
   - 用户可见的文字保持语义化
   - 未来支持国际化时再统一处理

7. **避免过早优化**
   - 先保证代码可读性和正确性
   - 性能优化基于实际测量，不要盲目优化
   - 关注用户体验，而非理论性能

8. **DRY 原则（Don't Repeat Yourself）**
   - 不要重复自己，相同逻辑抽离复用
   - 3 次以上重复必须抽象
   - 注意过度抽象的陷阱

9. **命名即文档**
   - 使用清晰的命名减少注释需求
   - 函数名使用动词开头（如 `generateSticker`、`processImage`）
   - 布尔值使用 `is`/`has`/`should` 前缀

10. **提前返回（Early Return）**
    - 使用 early return 减少嵌套，提高可读性
    ```typescript
    // ✅ 好的做法
    function processSticker(data: string | null) {
      if (!data) return null;
      if (data.length === 0) return null;

      return transform(data);
    }

    // ❌ 避免
    function processSticker(data: string | null) {
      if (data) {
        if (data.length > 0) {
          return transform(data);
        }
      }
      return null;
    }
    ```

---

## 命名规范

### 文件和文件夹

| 类型 | 命名规范 | 示例 | 说明 |
|------|---------|------|------|
| **Monorepo 包名** | 小写短横线 | `web/`, `server/`, `shared/` | packages/ 下的包目录 |
| **React 组件文件夹** | 大驼峰 (PascalCase) | `CutePrinter2D/`, `StickerStack/` | 一个组件一个文件夹 |
| **页面文件夹** | 大驼峰 (PascalCase) | `Home/`, `Projects/` | pages/ 下的页面目录 |
| **工具文件/文件夹** | 小驼峰 (camelCase) | `imageProcessor.ts`, `utils/` | 工具、服务类文件 |
| **组件内部文件** | 固定命名 | `index.tsx`, `helper.ts`, `index.module.less` | 组件文件夹内的标准文件 |
| **模块文件夹** | 小驼峰 (camelCase) | `modules/sticker/`, `modules/ai/` | Nest.js 模块目录 |

### 组件文件组织结构

```
ComponentName/
├── index.tsx              # 主组件文件
├── helper.ts              # 纯函数工具（可选）
├── const.ts               # 组件私有常量（可选）
├── types.ts               # 组件私有类型（可选）
├── index.module.less      # 样式文件
└── SubComponent.tsx       # 子组件（可选）
```

### 代码命名

| 类型 | 命名规范 | 示例 | 说明 |
|------|---------|------|------|
| **React 组件** | 大驼峰 (PascalCase) | `CutePrinter2D`, `StickerStack` | 组件名与文件夹名一致 |
| **类型定义 (Type)** | 大驼峰 (PascalCase) | `AppMode`, `StickerStyle` | 使用描述性命名 |
| **接口 (Interface)** | 大驼峰 + 后缀 | `ComponentProps`, `ApiResponse`, `ImageConfig` | 使用 `Props`/`Config`/`Data`/`Options` 等后缀 |
| **常量** | 全大写下划线 (UPPER_SNAKE_CASE) | `API_ENDPOINTS`, `IMAGE_PROCESSING` | 顶层常量和配置对象 |
| **枚举** | 大驼峰 (PascalCase) | `ProcessingStage`, `StatusType` | 枚举类型名 |
| **枚举值** | 小写下划线 | `'analyzing_layout'`, `'ai_naming'` | 字符串字面量类型的值 |
| **函数/方法** | 小驼峰 (camelCase) | `generateSticker`, `processImage`, `handleSubmit` | 动词开头，描述动作 |
| **变量** | 小驼峰 (camelCase) | `isProcessing`, `stickerList`, `currentStage` | 名词性，描述数据 |
| **布尔值变量** | is/has/should 前缀 | `isLoading`, `hasError`, `shouldUpdate` | 清晰表达真/假含义 |
| **私有成员** | 下划线前缀 | `_internalState`, `_processData` | Nest.js 服务类的私有方法 |
| **CSS 类名** | 短横线 (kebab-case) | `sticker-stack`, `cute-printer`, `loading-spinner` | BEM 命名可选 |
| **CSS 变量** | 双短横线前缀 | `--color-primary`, `--spacing-md` | CSS 自定义属性 |

### 函数命名最佳实践

| 前缀 | 含义 | 示例 |
|------|------|------|
| `get` | 获取数据（同步） | `getStickerById`, `getCurrentStage` |
| `fetch` | 获取数据（异步） | `fetchStickerData`, `fetchApiStatus` |
| `set` | 设置数据 | `setProcessingStage`, `setLoading` |
| `is` | 判断布尔值 | `isValidImage`, `isProcessing` |
| `has` | 判断存在性 | `hasError`, `hasStickers` |
| `should` | 条件判断 | `shouldProcessImage`, `shouldShowDialog` |
| `handle` | 事件处理器 | `handleSubmit`, `handleUpload` |
| `on` | 事件回调 | `onComplete`, `onError` |
| `create` | 创建新对象 | `createSticker`, `createCanvas` |
| `build` | 构建复杂对象 | `buildRequestPayload`, `buildConfig` |
| `process` | 处理数据 | `processImage`, `processStickerSheet` |
| `transform` | 转换数据 | `transformToBase64`, `transformSegments` |
| `validate` | 验证数据 | `validateImageFile`, `validateConfig` |
| `format` | 格式化数据 | `formatFilename`, `formatDate` |
| `parse` | 解析数据 | `parseImageData`, `parseResponse` |
| `calculate` | 计算 | `calculateProgress`, `calculateBounds` |

---

## TypeScript 类型规范

### 类型定义位置

1. **共享类型**：定义在 `@emojicut/shared/types.ts`
   - 前后端共用的接口和类型
   - API 请求/响应类型
   - 通用数据结构

2. **模块私有类型**：定义在模块内的 `types.ts`
   - 仅在当前模块使用的类型
   - 组件内部状态类型

3. **内联类型**：简单类型直接内联定义
   ```typescript
   // 简单的 Props 可以内联
   const Component: React.FC<{ title: string; count: number }> = ({ title, count }) => {
     // ...
   };
   ```

### 类型定义最佳实践

```typescript
// ✅ 使用 Type 定义联合类型和字面量类型
export type AppMode = 'generate' | 'cut';
export type StickerStyle = 'line_cute' | 'chibi_expressive' | 'kawaii_pastel';

// ✅ 使用 Interface 定义对象结构（推荐用于 Props 和数据对象）
export interface StickerSegment {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

// ✅ Interface 支持继承和合并
export interface BaseProps {
  className?: string;
}

export interface ComponentProps extends BaseProps {
  title: string;
  onSubmit: () => void;
}

// ✅ 使用泛型提高复用性
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ✅ 使用可选属性和必需属性
export interface ImageConfig {
  aspectRatio?: AspectRatio; // 可选
  quality: number;            // 必需
}

// ❌ 避免使用 any
// Bad
function process(data: any) { }

// ✅ 使用 unknown 或具体类型
function process(data: unknown) {
  if (typeof data === 'string') {
    // 类型收窄
  }
}
```

### 常量对象的类型约束

```typescript
// ✅ 使用 as const 确保字面量类型
export const STICKER_STYLES = {
  line_cute: 'LINE可爱贴纸风格',
  chibi_expressive: 'Q版表情包风格',
} as const;

// ✅ 从常量对象提取类型
export type StickerStyleKey = keyof typeof STICKER_STYLES;
```

---

## React 组件开发规范

### 组件文件模板

```typescript
import React, { useState, useEffect } from 'react';
import { SomeType } from '@emojicut/shared';
import './index.module.less';

/**
 * 组件 Props 定义
 */
interface ComponentNameProps {
  /** 必需属性说明 */
  title: string;
  /** 可选属性说明 */
  subtitle?: string;
  /** 回调函数说明 */
  onSubmit: (data: SomeType) => void;
}

/**
 * 组件说明
 */
const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  subtitle,
  onSubmit,
}) => {
  // 1. Hooks 定义
  const [state, setState] = useState<string>('');

  // 2. 副作用
  useEffect(() => {
    // effect logic
  }, []);

  // 3. 事件处理函数
  const handleClick = () => {
    setState('new value');
    onSubmit({ /* data */ });
  };

  // 4. 渲染
  return (
    <div className="component-name">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
      <button onClick={handleClick}>提交</button>
    </div>
  );
};

export default ComponentName;
```

### 组件设计原则

1. **使用函数组件 + Hooks**
   - 不再使用 Class 组件
   - 状态管理使用 `useState`、`useReducer`
   - 副作用使用 `useEffect`

2. **Props 类型定义**
   - 必须使用 TypeScript Interface 定义
   - 使用 JSDoc 注释说明每个属性
   - 可选属性使用 `?:`

3. **组件拆分原则**
   - 单个组件不超过 300 行
   - UI 逻辑复杂时拆分子组件
   - 业务逻辑抽离到自定义 Hook 或 Service

4. **状态提升**
   - 多个子组件共享的状态提升到父组件
   - 使用 Props 向下传递数据
   - 使用回调函数向上通知事件

5. **性能优化**
   ```typescript
   // 使用 React.memo 避免不必要的重渲染
   const MemoComponent = React.memo(Component);

   // 使用 useCallback 缓存函数
   const handleSubmit = useCallback(() => {
     // logic
   }, [dependencies]);

   // 使用 useMemo 缓存计算结果
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(data);
   }, [data]);
   ```

---

## CSS/Less 样式规范

### 样式文件组织

1. **全局样式**：`src/styles/`
   - `reset.less` - 样式重置
   - `variables.less` - CSS 变量定义

2. **组件样式**：组件文件夹内的 `index.module.less`
   - 使用 CSS Modules 避免样式冲突
   - 类名使用 kebab-case

### BEM 命名规范（推荐）

```less
// Block - 组件名
.sticker-stack {
  padding: 20px;

  // Element - 子元素
  &__item {
    margin-bottom: 10px;

    // Modifier - 状态修饰
    &--active {
      border: 2px solid blue;
    }
  }

  &__button {
    padding: 8px 16px;

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
```

### CSS 变量使用

```less
// variables.less
:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-error: #ef4444;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}

// 组件中使用
.component {
  color: var(--color-primary);
  padding: var(--spacing-md);
}
```

### 响应式设计

```less
.component {
  padding: 24px;

  // 平板
  @media (max-width: 768px) {
    padding: 16px;
  }

  // 手机
  @media (max-width: 480px) {
    padding: 8px;
  }
}
```

---

## API 接口规范

### 请求/响应类型定义

所有 API 相关的类型定义在 `@emojicut/shared/types.ts`：

```typescript
// 请求类型
export interface GenerateStickerRequest {
  referenceImage: string;  // Base64 encoded
  style: StickerStyle;
  customStyle?: string;
  aspectRatio?: AspectRatio;
}

// 响应类型
export interface GenerateStickerResponse {
  success: boolean;
  data?: {
    imageData: string;
  };
  error?: string;
}
```

### 错误处理规范

```typescript
// 统一的错误响应格式
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

// 前端错误处理
try {
  const response = await fetch('/api/sticker/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const result: GenerateStickerResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
} catch (error) {
  console.error('生成贴纸失败:', error);
  // 用户友好的错误提示
  alert('生成失败，请重试');
}
```

---

## 注释和文档规范

### 何时写注释

1. **必须写注释**
   - 复杂算法的实现思路
   - 非显而易见的业务逻辑
   - 临时解决方案（TODO、FIXME）
   - 公共 API 和类型定义

2. **不需要注释**
   - 显而易见的代码（命名清晰）
   - 简单的 getter/setter
   - 与代码重复的描述

### 注释风格

```typescript
/**
 * 处理贴纸图片，自动识别并分割成独立的贴纸片段
 *
 * @param imageData - Base64 编码的图片数据
 * @returns 贴纸片段数组
 *
 * @example
 * const segments = await processStickerSheet(base64Image);
 * console.log(`找到 ${segments.length} 个贴纸`);
 */
export async function processStickerSheet(imageData: string): Promise<StickerSegment[]> {
  // 1. 加载图像
  const img = await loadImage(imageData);

  // 2. 识别背景（RGB > 240 或 Alpha < 20）
  const background = detectBackground(img);

  // 3. Flood Fill 查找连通域
  // 使用广度优先搜索，合并距离 < 15px 的区域
  const regions = findConnectedRegions(background);

  // 4. 提取贴纸并添加白色描边（6px）
  return regions.map(region => extractSticker(region));
}

// TODO: 优化大图处理性能
// FIXME: 修复边缘情况下的白边问题
```

---

## Git 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(web): 添加贴纸预览功能` |
| `fix` | Bug 修复 | `fix(server): 修复 AI 命名超时问题` |
| `docs` | 文档更新 | `docs: 更新 README 安装说明` |
| `style` | 代码格式（不影响功能） | `style(web): 统一组件命名规范` |
| `refactor` | 重构（不影响功能） | `refactor(shared): 简化类型定义` |
| `perf` | 性能优化 | `perf(web): 优化图像处理性能` |
| `test` | 测试相关 | `test(server): 添加 AI 服务单元测试` |
| `chore` | 构建/工具相关 | `chore: 升级依赖版本` |

### Scope 范围

- `web` - 前端相关
- `server` - 后端相关
- `shared` - 共享包相关
- `deps` - 依赖相关
- `*` - 通用修改

### 示例

```bash
# 好的 commit
feat(web): 添加自定义贴纸风格输入框
fix(server): 修复 Gemini API 超时重试逻辑
docs: 补充开发环境配置说明
refactor(shared): 简化 ProcessingStage 类型定义

# 不好的 commit（避免）
update code
fix bug
修改样式
```

---

## 对话使用中文回复
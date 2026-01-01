import { SafetySetting } from './ai.types';
import { StyleCategory } from '@emojicut/shared';

export { STYLE_CONFIG, getStyleCategory } from '@emojicut/shared';

/**
 * 文字提示词片段
 */
const CAPTION_PROMPT_SEGMENT = {
  single: `
TEXT: Add a short Chinese meme caption (2-10 characters) matching the expression. Use bold, readable font placed near the character.`,

  multi: `
TEXT: Add unique short Chinese meme captions (2-10 characters each) to EVERY sticker, matching each expression. Bold, readable font.`,
};

/**
 * 各类别的提示词模板配置
 */
const PROMPT_TEMPLATES: Record<StyleCategory, {
  single: (styleDescription: string, withCaption: boolean) => string;
  multi: (styleDescription: string, count: number, rows: number, cols: number, withCaption: boolean) => string;
}> = {
  cartoon: {
    single: (styleDescription, withCaption) => `You are a cute cartoon character designer. Please design and generate a single LINE-style emoji sticker for the character in the image.

Requirements:
1. Generate exactly 1 sticker showing a cute expression or action
2. Use 2-head chibi proportions with a creative pose
3. Background must be pure white (#FFFFFF) for easy automatic cutting
4. The sticker should be centered in the image with good padding around it
5. Art style: ${styleDescription}
${withCaption ? CAPTION_PROMPT_SEGMENT.single : ''}
Please generate the image directly without any text explanation.`,

    multi: (styleDescription, count, rows, cols, withCaption) => `You are a cute cartoon character designer. Please design and generate a set of LINE-style emoji sticker pack for the character in the image.

Requirements:
1. Generate ${count} different sticker expressions arranged in a ${rows}x${cols} grid
2. Each sticker shows the same character with different expressions or actions
3. Use 2-head chibi proportions with creative poses
4. Background must be pure white (#FFFFFF) for easy automatic cutting
5. Maintain clear spacing between each sticker
6. Art style: ${styleDescription}
${withCaption ? CAPTION_PROMPT_SEGMENT.multi : ''}
Please generate the image directly without any text explanation.`,
  },
  realistic: {
    single: (styleDescription, withCaption) => `You are a professional sticker designer. Please create a single realistic photo-based sticker from the person/character in the image.

Requirements:
1. Generate exactly 1 sticker showing an expressive pose or emotion
2. MUST preserve the person's specific features: face shape, eyes, nose, mouth, skin tone, hairstyle, and any unique characteristics
3. PRESERVE the original realistic appearance - do NOT cartoonize or stylize
4. Keep natural human proportions and real facial features
5. Background must be pure white (#FFFFFF) for easy automatic cutting
6. The sticker should be centered in the image with good padding around it
7. Add clean, sharp edges suitable for a die-cut sticker effect
8. Art style: ${styleDescription}
${withCaption ? CAPTION_PROMPT_SEGMENT.single : ''}
Please generate the image directly without any text explanation.`,

    multi: (styleDescription, count, rows, cols, withCaption) => `You are a professional sticker designer. Please create a set of realistic photo-based stickers from the person/character in the image.

Requirements:
1. Generate ${count} different sticker poses/expressions arranged in a ${rows}x${cols} grid
2. Each sticker shows the same person with different expressions or poses
3. MUST preserve the person's specific features consistently across all stickers: face shape, eyes, nose, mouth, skin tone, hairstyle, and any unique characteristics
4. PRESERVE the original realistic appearance - do NOT cartoonize or stylize
5. Keep natural human proportions and real facial features throughout
6. Background must be pure white (#FFFFFF) for easy automatic cutting
7. Maintain clear spacing between each sticker
8. Add clean, sharp edges suitable for a die-cut sticker effect
9. Art style: ${styleDescription}
${withCaption ? CAPTION_PROMPT_SEGMENT.multi : ''}
Please generate the image directly without any text explanation.`,
  },
};

/**
 * 生成贴纸的提示词模板
 * @param styleDescription 风格描述
 * @param category 风格类别
 * @param count 生成数量 (1-16)
 * @param withCaption 是否带文字
 */
export const STICKER_GENERATION_PROMPT = (
  styleDescription: string,
  category: StyleCategory = 'cartoon',
  count: number = 1,
  withCaption: boolean = false
) => {
  const template = PROMPT_TEMPLATES[category];
  const rows = Math.ceil(count / 4);
  const cols = Math.min(count, 4);

  return count === 1
    ? template.single(styleDescription, withCaption)
    : template.multi(styleDescription, count, rows, cols, withCaption);
};

/**
 * 生成贴纸名称的提示词
 */
export const STICKER_NAMING_PROMPT = `Analyze the content of this sticker image, including the character's expression, action, and emotion.
Generate a descriptive name using short Chinese words (2-6 characters).

Examples: 开心, 生气, 思考中, 摸鱼, 冲鸭, 无语 etc.

Return only the name without any extension or other explanatory text.
Format: Chinese name string only`;

/**
 * 文件名最大长度
 */
export const MAX_FILENAME_LENGTH = 20;

/**
 * API 请求超时时间（毫秒）
 */
export const API_TIMEOUT = 30000;

/**
 * 默认安全设置
 */
export const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
];

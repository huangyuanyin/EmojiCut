import { SafetySetting } from './ai.types';

export { STYLE_DESCRIPTIONS } from '@emojicut/shared';

/**
 * 生成贴纸的提示词模板
 * @param styleDescription 风格描述
 * @param count 生成数量 (1-16)
 */
export const STICKER_GENERATION_PROMPT = (styleDescription: string, count: number = 1) => {
  if (count === 1) {
    return `You are a cute cartoon character designer. Please design and generate a single LINE-style emoji sticker for the character in the image.

Requirements:
1. Generate exactly 1 sticker showing a cute expression or action
2. Use 2-head chibi proportions with a creative pose
3. Background must be pure white (#FFFFFF) for easy automatic cutting
4. The sticker should be centered in the image with good padding around it
5. Art style: ${styleDescription}

Please generate the image directly without any text explanation.`;
  }
  
  const rows = Math.ceil(count / 4);
  const cols = Math.min(count, 4);
  
  return `You are a cute cartoon character designer. Please design and generate a set of LINE-style emoji sticker pack for the character in the image.

Requirements:
1. Generate ${count} different sticker expressions arranged in a ${rows}x${cols} grid
2. Each sticker shows the same character with different expressions or actions
3. Use 2-head chibi proportions with creative poses and text
4. Background must be pure white (#FFFFFF) for easy automatic cutting
5. Maintain clear spacing between each sticker
6. Art style: ${styleDescription}

Please generate the image directly without any text explanation.`;
};

/**
 * 生成贴纸名称的提示词
 */
export const STICKER_NAMING_PROMPT = `Analyze the content of this sticker image, including the character's expression, action, and emotion.
Generate a descriptive filename using short English words connected with underscores.

Examples: happy_wave, sad_cry, excited_jump, thinking_hmm, etc.

Return only the filename without the .png extension or any other explanatory text.
Format: filename string only`;

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

/**
 * 贴纸风格配置
 */
export const STICKER_STYLES = {
  line_cute: 'LINE可爱贴纸风格',
  chibi_expressive: 'Q版表情包风格',
  kawaii_pastel: '粉彩少女风格',
  dynamic_action: '动感活力风格',
  custom: '自定义风格',
} as const;

/**
 * 风格描述（AI 提示词）
 */
export const STYLE_DESCRIPTIONS = {
  line_cute: 'Cute LINE sticker style with simple lines, bright colors, and adorable expressions',
  chibi_expressive: 'Chibi Q-version emoji style with exaggerated expressions and dynamic actions',
  kawaii_pastel: 'Kawaii pastel style with soft macaron colors and sweet, gentle aesthetics',
  dynamic_action: 'Dynamic action style with energetic poses and vibrant movements',
  custom: '',
} as const;

/**
 * API端点
 */
export const API_ENDPOINTS = {
  GENERATE_STICKER: '/api/sticker/generate',
  GENERATE_NAME: '/api/sticker/name',
} as const;

/**
 * 图像处理常量
 */
export const IMAGE_PROCESSING = {
  // 背景识别
  BACKGROUND: {
    RGB_THRESHOLD: 240,
    ALPHA_THRESHOLD: 20,
  },

  // 区域合并
  MERGE: {
    DISTANCE: 15,
  },

  // 最小区域尺寸
  FILTER: {
    MIN_AREA: 50,
    MIN_WIDTH: 5,
    MIN_HEIGHT: 5,
  },

  // 贴纸描边
  STROKE: {
    WIDTH: 6,
    STEPS: 24,
    COLOR: '#FFFFFF',
  },
} as const;

/**
 * 文件配置
 */
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] as const,
  ZIP_FILENAME: 'stickers.zip',
} as const;

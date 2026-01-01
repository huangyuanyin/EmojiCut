import { StickerStyle, StyleConfigItem, StyleCategory } from './types';

/**
 * 统一的风格配置
 */
export const STYLE_CONFIG: Record<StickerStyle, StyleConfigItem> = {
  line_cute: {
    name: 'LINE可爱贴纸风格',
    description: 'Cute LINE sticker style with simple lines, bright colors, and adorable expressions',
    category: 'cartoon',
  },
  chibi_expressive: {
    name: 'Q版表情包风格',
    description: 'Chibi Q-version emoji style with exaggerated expressions and dynamic actions',
    category: 'cartoon',
  },
  kawaii_pastel: {
    name: '粉彩少女风格',
    description: 'Kawaii pastel style with soft macaron colors and sweet, gentle aesthetics',
    category: 'cartoon',
  },
  dynamic_action: {
    name: '动感活力风格',
    description: 'Dynamic action style with energetic poses and vibrant movements',
    category: 'cartoon',
  },
  realistic: {
    name: '真实人物风格',
    description: 'Realistic photo-based sticker style - preserve the original photo appearance with natural proportions, real textures, and authentic details. Do NOT cartoonize or stylize',
    category: 'realistic',
  },
  custom: {
    name: '自定义风格',
    description: '',
    category: 'cartoon', // 自定义默认为卡通类别，可通过提示词覆盖
  },
};

/**
 * 获取风格类别
 */
export const getStyleCategory = (style: StickerStyle): StyleCategory => {
  return STYLE_CONFIG[style]?.category ?? 'cartoon';
};

/**
 * API端点
 */
export const API_ENDPOINTS = {
  GENERATE_STICKER: '/api/sticker/generate',
  GENERATE_NAME: '/api/sticker/name',
  UPLOAD_IMAGE: '/api/sticker/upload',
  UPLOAD_IMAGES: '/api/sticker/upload-all',
  GET_IMAGE: '/api/sticker/image',
} as const;

/**
 * 图像处理常量
 */
export const IMAGE_PROCESSING = {
  // 背景识别
  BACKGROUND: {
    RGB_THRESHOLD: 240, // 降低阈值，让更多浅色区域被识别为背景
    ALPHA_THRESHOLD: 20,
  },

  // 区域合并
  MERGE: {
    DISTANCE: 5,
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

/** 图片分享配置 */
export const SHARE_CONFIG = {
  EXPIRE_TIME: 60 * 60 * 1000, // 1小时
  MAX_IMAGES: 500,
} as const;

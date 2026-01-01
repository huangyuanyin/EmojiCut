import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import styles from './index.module.less';

// 预设颜色方案
export const BUTTON_COLORS = {
  green: { borderColor: '#81C784', color: '#2E7D32', background: '#E8F5E9' },
  blue: { borderColor: '#64B5F6', color: '#1565C0', background: '#E3F2FD' },
  purple: { borderColor: '#CE93D8', color: '#7B1FA2', background: '#F3E5F5' },
  pink: { borderColor: '#F48FB1', color: '#C2185B', background: '#FCE4EC' },
} as const;

export type ButtonColorScheme = keyof typeof BUTTON_COLORS;

export interface CuteButtonProps {
  /** 按钮文本 */
  children: React.ReactNode;
  /** 点击事件 */
  onClick?: () => void;
  /** 图标组件 */
  icon?: LucideIcon;
  /** 颜色方案名称或自定义颜色 */
  color?: ButtonColorScheme | { borderColor: string; color: string; background: string };
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 额外的类名 */
  className?: string;
}

const CuteButton: React.FC<CuteButtonProps> = ({
  children,
  onClick,
  icon: Icon,
  color = 'purple',
  disabled = false,
  loading = false,
  className = '',
}) => {
  // 获取颜色样式
  const colorStyle = typeof color === 'string' ? BUTTON_COLORS[color] : color;

  return (
    <button
      onClick={onClick}
      className={`cute-btn ${styles.cuteButton} ${className}`}
      style={colorStyle}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 size={16} className={styles.spinIcon} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
};

export default CuteButton;


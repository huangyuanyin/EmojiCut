import React, { useState } from 'react';
import { StickerSegment } from '@emojicut/shared';
import { Download, Loader2 } from 'lucide-react';
import './StickerStack.less';

// 贴纸堆叠旋转配置
const ROTATION_STEPS = 7; // 旋转步数
const ROTATION_ANGLE = 5; // 每步旋转角度（度）
const ROTATION_BASE = -15; // 基础旋转角度（度）
const ANIMATION_DELAY_STEP = 0.1; // 动画延迟步长（秒）

interface StickerStackProps {
  segments: StickerSegment[];
}

const StickerStack: React.FC<StickerStackProps> = ({ segments }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDraggedId(id);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedId) return;

    setPositions((prev) => ({
      ...prev,
      [draggedId]: {
        x: (prev[draggedId]?.x || 0) + e.movementX,
        y: (prev[draggedId]?.y || 0) + e.movementY,
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggedId(null);
  };

  const handleDownload = (segment: StickerSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = segment.dataUrl;
    link.download = `${segment.name}.png`;
    link.click();
  };

  if (segments.length === 0) {
    return (
      <div className="sticker-stack-empty">
        <p>暂无贴纸</p>
      </div>
    );
  }

  return (
    <div
      className="sticker-stack"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {segments.map((segment, index) => {
        const position = positions[segment.id] || { x: 0, y: 0 };
        const rotation = (index % ROTATION_STEPS) * ROTATION_ANGLE + ROTATION_BASE;

        return (
          <div
            key={segment.id}
            className={`sticker-card ${draggedId === segment.id ? 'dragging' : ''}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
              zIndex: draggedId === segment.id ? 9999 : segments.length - index,
              animationDelay: `${index * ANIMATION_DELAY_STEP}s`,
            }}
            onMouseDown={(e) => handleMouseDown(segment.id, e)}
          >
            <div className="sticker-image-wrapper">
              <img src={segment.dataUrl} alt={segment.name} className="sticker-image" />
              {segment.isNaming && (
                <div className="naming-overlay">
                  <Loader2 className="spinner" size={24} />
                  <span>命名中...</span>
                </div>
              )}
            </div>

            <div className="sticker-info">
              <span className="sticker-name">{segment.name}</span>
              <button
                className="download-btn"
                onClick={(e) => handleDownload(segment, e)}
                title="下载单张"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StickerStack;

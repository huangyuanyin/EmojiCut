import React, { useState, useRef, useEffect } from 'react';
import { StickerSegment } from '@emojicut/shared';
import { Download, QrCode } from 'lucide-react';
import QRCodeModal from '../QRCodeModal';
import styles from './index.module.less';

interface StickerStackProps {
  stickers: StickerSegment[];
  visible: boolean;
}

const StickerStack: React.FC<StickerStackProps> = ({ stickers, visible }) => {
  const [qrCodeSticker, setQrCodeSticker] = useState<StickerSegment | null>(null);

  if (!visible || stickers.length === 0) return null;

  return (
    <>
      <div className={styles.container}>
        <div className={styles.stackArea}>
          {stickers.map((sticker, index) => (
            <DraggableSticker 
              key={sticker.id} 
              sticker={sticker} 
              index={index}
              onShowQRCode={setQrCodeSticker}
            />
          ))}
        </div>
      </div>
      
      {/* 二维码弹窗 */}
      {qrCodeSticker && (
        <QRCodeModal
          sticker={qrCodeSticker}
          onClose={() => setQrCodeSticker(null)}
        />
      )}
    </>
  );
};

interface DraggableProps {
  sticker: StickerSegment;
  index: number;
  onShowQRCode: (sticker: StickerSegment) => void;
}

const DraggableSticker: React.FC<DraggableProps> = ({ sticker, index, onShowQRCode }) => {
  const initialRotation = useRef(Math.random() * 30 - 15);
  const initialX = useRef(Math.random() * 40 - 20);
  const initialY = useRef(Math.random() * 40 - 20 + index * 2);

  const [position, setPosition] = useState({ x: initialX.current, y: initialY.current });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const stickerSize = 128;
    const padding = 10;
    const stackAreaOffsetY = 160; // stackArea 的 translateY 偏移

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;

      // 贴纸位置是相对于 stackArea 中心的偏移量
      // stackArea 中心在屏幕中心下方 160px
      const halfWidth = window.innerWidth / 2;
      const halfHeight = window.innerHeight / 2;

      const minX = -halfWidth + padding;
      const maxX = halfWidth - stickerSize - padding;
      // 上边界需要考虑 stackArea 的偏移
      const minY = -halfHeight - stackAreaOffsetY + padding;
      const maxY = halfHeight - stackAreaOffsetY - stickerSize - padding;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = sticker.rawDataUrl;
    link.download = `${sticker.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShowQRCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowQRCode(sticker);
  };

  return (
    <div
      className={styles.stickerItem}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${initialRotation.current}deg) scale(${isDragging ? 1.1 : 1})`,
        zIndex: isDragging ? 100 : index,
        opacity: 0,
        animation: `slideOut 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
        animationDelay: `${index * 0.1}s`,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.stickerInner}>
        <img src={sticker.dataUrl} alt={sticker.name} className={styles.stickerImage} />
        <div className={`${styles.tooltip} ${isHovered || isDragging ? styles.visible : ''}`}>
          {sticker.name}
          <div className={styles.actionBtns} onMouseDown={e => e.stopPropagation()}>
            <div onClick={handleDownload} className={styles.actionBtn} title="下载">
              <Download size={10} />
            </div>
            <div onClick={handleShowQRCode} className={`${styles.actionBtn} ${styles.qrBtn}`} title="扫码分享">
              <QrCode size={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerStack;


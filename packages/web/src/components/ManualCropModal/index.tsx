import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Check, Crop } from 'lucide-react';
import { Rect } from '@emojicut/shared';
import styles from './index.module.less';

interface ManualCropModalProps {
  imageUrl: string;
  onClose: () => void;
  onConfirm: (rect: Rect) => void;
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
type DragMode = 'none' | 'draw' | 'resize';

const ManualCropModal: React.FC<ManualCropModalProps> = ({ imageUrl, onClose, onConfirm }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);

  const getImageCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!imgRef.current) return null;
    
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    return {
      x: Math.max(0, Math.min(img.naturalWidth, x * scaleX)),
      y: Math.max(0, Math.min(img.naturalHeight, y * scaleY))
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragMode === 'none') return;
      
      const coords = getImageCoordinates(e.clientX, e.clientY);
      if (!coords) return;

      if (dragMode === 'draw' && startPos) {
        setCurrentRect({
          minX: Math.min(startPos.x, coords.x),
          maxX: Math.max(startPos.x, coords.x),
          minY: Math.min(startPos.y, coords.y),
          maxY: Math.max(startPos.y, coords.y)
        });
      } else if (dragMode === 'resize' && currentRect && resizeHandle) {
        setCurrentRect(prev => {
          if (!prev) return prev;
          const newRect = { ...prev };
          
          if (resizeHandle.includes('n')) {
            newRect.minY = Math.min(coords.y, newRect.maxY - 10);
          }
          if (resizeHandle.includes('s')) {
            newRect.maxY = Math.max(coords.y, newRect.minY + 10);
          }
          if (resizeHandle.includes('w')) {
            newRect.minX = Math.min(coords.x, newRect.maxX - 10);
          }
          if (resizeHandle.includes('e')) {
            newRect.maxX = Math.max(coords.x, newRect.minX + 10);
          }
          
          return newRect;
        });
      }
    };

    const handleMouseUp = () => {
      setDragMode('none');
      setResizeHandle(null);
    };

    if (dragMode !== 'none') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, startPos, resizeHandle, getImageCoordinates, currentRect]);

  // 开始绘制新选择框
  const handleDrawStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = getImageCoordinates(e.clientX, e.clientY);
    if (coords) {
      setDragMode('draw');
      setStartPos(coords);
      setCurrentRect({ minX: coords.x, maxX: coords.x, minY: coords.y, maxY: coords.y });
    }
  };

  // 调整大小
  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode('resize');
    setResizeHandle(handle);
  };

  const handleConfirm = () => {
    if (currentRect && (currentRect.maxX - currentRect.minX > 5) && (currentRect.maxY - currentRect.minY > 5)) {
      onConfirm(currentRect);
    }
  };

  // 计算选择框的样式（百分比）
  const getOverlayStyle = () => {
    if (!currentRect || !imgRef.current) return {};
    
    const nw = imgRef.current.naturalWidth;
    const nh = imgRef.current.naturalHeight;
    
    const left = (currentRect.minX / nw) * 100;
    const top = (currentRect.minY / nh) * 100;
    const width = ((currentRect.maxX - currentRect.minX) / nw) * 100;
    const height = ((currentRect.maxY - currentRect.minY) / nh) * 100;

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`
    };
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            <Crop size={20} /> Manual Selection
          </h3>
          <p className={styles.subtitle}>Click and drag to select a sticker.</p>
        </div>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={24} />
        </button>
      </div>

      <div 
        ref={containerRef}
        className={styles.imageContainer}
      >
        {/* 透明交互层 - 用于捕获绘制事件 */}
        <div 
          className={styles.interactionLayer}
          onMouseDown={handleDrawStart}
        />
        
        <img 
          ref={imgRef}
          src={imageUrl} 
          alt="Original" 
          className={styles.image}
          draggable={false}
        />
        
        {currentRect && (
          <>
            {/* 暗色遮罩层 */}
            <div className={styles.dimOverlay} />
            
            {/* 选择框本身 */}
            <div 
              className={styles.selectionBox}
              style={getOverlayStyle()}
            >
              <div className={styles.selectionLabel}>Selection</div>
              
              {/* 边缘拖拽手柄 */}
              <div 
                className={`${styles.resizeHandle} ${styles.handleN}`}
                onMouseDown={(e) => handleResizeStart(e, 'n')}
              />
              <div 
                className={`${styles.resizeHandle} ${styles.handleS}`}
                onMouseDown={(e) => handleResizeStart(e, 's')}
              />
              <div 
                className={`${styles.resizeHandle} ${styles.handleE}`}
                onMouseDown={(e) => handleResizeStart(e, 'e')}
              />
              <div 
                className={`${styles.resizeHandle} ${styles.handleW}`}
                onMouseDown={(e) => handleResizeStart(e, 'w')}
              />
              
              {/* 角落拖拽手柄 */}
              <div 
                className={`${styles.resizeHandle} ${styles.handleCorner} ${styles.handleNW}`}
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              />
              <div 
                className={`${styles.resizeHandle} ${styles.handleCorner} ${styles.handleNE}`}
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div 
                className={`${styles.resizeHandle} ${styles.handleCorner} ${styles.handleSW}`}
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              />
              <div 
                className={`${styles.resizeHandle} ${styles.handleCorner} ${styles.handleSE}`}
                onMouseDown={(e) => handleResizeStart(e, 'se')}
              />
            </div>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button onClick={onClose} className={styles.cancelBtn}>
          Cancel
        </button>
        <button 
          onClick={handleConfirm}
          disabled={!currentRect}
          className={styles.confirmBtn}
        >
          <Check size={18} />
          Add Sticker
        </button>
      </div>
    </div>
  );
};

export default ManualCropModal;

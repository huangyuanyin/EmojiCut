import React, { useState } from 'react';
import { AppMode, StickerSegment, ProcessingStatus, Rect } from '@emojicut/shared';
import { Download, Loader2, Sparkles, Heart, PlusCircle, ArrowLeft, Scissors, Wand2 } from 'lucide-react';
import CutePrinter2D from './components/CutePrinter2D';
import StickerStack from './components/StickerStack';
import ManualCropModal from './components/ManualCropModal';
import CuteButton from './components/CuteButton';
import { 
  processFile, 
  runAiNaming, 
  downloadAllStickers,
  hasMergedStickers,
  smartSplitAllMerged,
} from './services/stickerService';
import { loadImage, extractStickerFromRect } from './services/imageProcessor';
import styles from './App.module.less';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('generate');
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: '等待开始...',
  });
  const [segments, setSegments] = useState<StickerSegment[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageEl, setOriginalImageEl] = useState<HTMLImageElement | null>(null);
  const [isManualCropping, setIsManualCropping] = useState(false);
  const [hasMerged, setHasMerged] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  const handleGenerateComplete = async (imageData: string) => {
    setAppMode('cut');

    // 保存原始图像用于手动裁剪
    setOriginalImage(imageData);
    const img = await loadImage(imageData);
    setOriginalImageEl(img);

    // 开始图像处理
    const result = await processFile(imageData, setStatus);
    if (result.success && result.segments) {
      setSegments(result.segments);
      
      // 检测是否有连体贴纸
      const merged = hasMergedStickers(result.segments);
      setHasMerged(merged);

      // 自动开始AI命名
      await runAiNaming(result.segments, setSegments, setStatus);
    }
  };

  const handleSmartSplit = async () => {
    if (segments.length === 0) return;
    
    setIsSplitting(true);
    setStatus({
      stage: 'segmenting',
      progress: 0,
      message: '智能分割中...',
    });

    try {
      const splitStickers = await smartSplitAllMerged(
        segments,
        (progress, message) => {
          setStatus({
            stage: 'segmenting',
            progress,
            message,
          });
        }
      );
      
      setSegments(splitStickers);
      setHasMerged(hasMergedStickers(splitStickers));
      
      // 为新分割的贴纸进行AI命名
      const newStickers = splitStickers.filter(
        s => !segments.some(old => old.id === s.id)
      );
      if (newStickers.length > 0) {
        await runAiNaming(newStickers, setSegments, setStatus);
      } else {
        setStatus({
          stage: 'complete',
          progress: 100,
          message: '分割完成！',
        });
      }
    } catch (error) {
      console.error('Smart split failed:', error);
      setStatus({
        stage: 'complete',
        progress: 100,
        message: '分割失败，请重试',
      });
    } finally {
      setIsSplitting(false);
    }
  };

  const handleManualCrop = async (rect: Rect) => {
    if (!originalImageEl) return;

    const newSegment = extractStickerFromRect(
      originalImageEl,
      rect,
      `sticker_${segments.length + 1}`
    );

    if (newSegment) {
      setSegments(prev => [...prev, newSegment]);
      setIsManualCropping(false);
      // 为新添加的贴纸进行AI命名
      await runAiNaming([newSegment], setSegments, setStatus);
    }
  };

  const handleReset = () => {
    setAppMode('generate');
    setStatus({
      stage: 'idle',
      progress: 0,
      message: '等待开始...',
    });
    setSegments([]);
    setOriginalImage(null);
    setOriginalImageEl(null);
    setHasMerged(false);
    setIsSplitting(false);
  };

  const handleDownloadAll = async () => {
    setIsZipping(true);
    await downloadAllStickers(segments);
    setIsZipping(false);
  };

  return (
    <div className="shojo-container">
      {appMode === 'generate' && (
        <CutePrinter2D onGenerateComplete={handleGenerateComplete} />
      )}

      {appMode === 'cut' && (
        <>
          {segments.length > 0 && (
            <div className={styles.floatingBtnGroup}>
              <CuteButton
                onClick={handleDownloadAll}
                icon={Download}
                color="green"
                loading={isZipping}
              >
                保存全部
              </CuteButton>
              {hasMerged && (
                <CuteButton
                  onClick={handleSmartSplit}
                  icon={Scissors}
                  color="orange"
                  loading={isSplitting}
                >
                  智能分割
                </CuteButton>
              )}
              <CuteButton
                onClick={() => setIsManualCropping(true)}
                icon={PlusCircle}
                color="blue"
                disabled={!originalImage}
              >
                手动添加
              </CuteButton>
              <CuteButton
                onClick={handleReset}
                icon={ArrowLeft}
                color="purple"
              >
                重新生成
              </CuteButton>
            </div>
          )}

          {/* 机器面板 */}
          <div className="cute-machine cute-machine-static">
            <div className={styles.header}>
              <div className={styles.headerDot}></div>
              <div className={styles.headerTitle}>✨ NANO BANANA PRO ✨</div>
              <div className={styles.headerDot}></div>
            </div>

            <div className={styles.screenArea}>
              {status.stage !== 'idle' && status.stage !== 'complete' ? (
                <div className={styles.processingState}>
                  <Loader2 size={32} className={styles.spinIcon} />
                  <div className={styles.processingText}>{status.message}</div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className={styles.completeState}>
                  <div className={styles.successIcon}>
                    <Heart size={40} fill="currentColor" />
                  </div>
                  <div className={styles.completeTitle}>✨ 完成啦 ✨</div>
                  <div className={styles.stickerCount}>
                    <Sparkles size={16} />
                    <span>共 {segments.length} 个贴纸</span>
                  </div>
                  {hasMerged && (
                    <div className={styles.mergedAlert}>
                      <Wand2 size={14} />
                      <span>检测到有贴纸可能连在一起</span>
                    </div>
                  )}
                  <div className={styles.completeActions}>
                    {hasMerged && (
                      <CuteButton
                        onClick={handleSmartSplit}
                        icon={Scissors}
                        color="orange"
                        loading={isSplitting}
                      >
                        一键分割
                      </CuteButton>
                    )}
                    <CuteButton
                      onClick={handleDownloadAll}
                      icon={Download}
                      color="green"
                      loading={isZipping}
                      disabled={segments.length === 0}
                    >
                      保存全部
                    </CuteButton>
                    <CuteButton
                      onClick={handleReset}
                      icon={ArrowLeft}
                      color="purple"
                    >
                      重新生成
                    </CuteButton>
                  </div>
                </div>
              )}
            </div>

            <div className="output-slot-2d"></div>
          </div>

          <div className="sticker-output-area">
            <StickerStack stickers={segments} visible={segments.length > 0} />
          </div>

          {/* 手动裁剪模态框 */}
          {isManualCropping && originalImage && (
            <ManualCropModal
              imageUrl={originalImage}
              onClose={() => setIsManualCropping(false)}
              onConfirm={handleManualCrop}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;

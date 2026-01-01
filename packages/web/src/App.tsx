import React, { useState } from 'react';
import { AppMode, StickerSegment, ProcessingStatus } from '@emojicut/shared';
import { Download, Loader2, RefreshCw, Sparkles, Heart } from 'lucide-react';
import CutePrinter2D from './components/CutePrinter2D/index';
import StickerStack from './components/StickerStack/index';
import { processFile, runAiNaming, downloadAllStickers } from './services/stickerService';
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

  const handleGenerateComplete = async (imageData: string) => {
    setAppMode('cut');

    // 开始图像处理
    const result = await processFile(imageData, setStatus);
    if (result.success && result.segments) {
      setSegments(result.segments);

      // 自动开始AI命名
      await runAiNaming(result.segments, setSegments, setStatus);
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
          <div className="cute-machine cute-machine-static">
            <div className={styles.header}>
              <div className={styles.headerDot}></div>
              <div className={styles.headerTitle}>✨ EmojiCut - AI贴纸生成 ✨</div>
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
                  
                  <div className={styles.actionButtons}>
                    <button onClick={handleReset} className={styles.resetBtn}>
                      <RefreshCw size={16} />
                      <span>再来一次</span>
                    </button>
                    <button 
                      onClick={handleDownloadAll} 
                      className={styles.downloadBtn}
                      disabled={isZipping}
                    >
                      {isZipping ? <Loader2 size={16} className={styles.spinIcon} /> : <Download size={16} />}
                      <span>全部保存</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="output-slot-2d"></div>
          </div>

          <div className="sticker-output-area">
            <StickerStack stickers={segments} visible={segments.length > 0} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;

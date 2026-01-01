import React, { useState } from 'react';
import { AppMode, StickerSegment, ProcessingStatus } from '@emojicut/shared';
import CutePrinter2D from './components/CutePrinter2D';
import StickerStack from './components/StickerStack';
import { processFile, runAiNaming, downloadAllStickers } from './services/stickerService';
import './styles/App.less';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('generate');
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: '等待开始...',
  });
  const [segments, setSegments] = useState<StickerSegment[]>([]);

  // 处理生成完成的回调
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

  // 重新开始
  const handleReset = () => {
    setAppMode('generate');
    setStatus({
      stage: 'idle',
      progress: 0,
      message: '等待开始...',
    });
    setSegments([]);
  };

  // 下载所有贴纸
  const handleDownloadAll = async () => {
    await downloadAllStickers(segments);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 EmojiCut AI</h1>
        <p>AI驱动的贴纸生成和智能切割系统</p>
      </header>

      <main className="app-main">
        {appMode === 'generate' ? (
          <CutePrinter2D onGenerateComplete={handleGenerateComplete} />
        ) : (
          <div className="cut-mode">
            <div className="status-bar">
              <div className="status-info">
                <span className="status-stage">{status.message}</span>
                <span className="status-progress">{status.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>

            <StickerStack segments={segments} />

            <div className="action-buttons">
              <button onClick={handleDownloadAll} className="btn btn-primary">
                📦 下载全部 ({segments.length})
              </button>
              <button onClick={handleReset} className="btn btn-secondary">
                🔄 重新开始
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Made with ❤️ using React, Rsbuild & Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;

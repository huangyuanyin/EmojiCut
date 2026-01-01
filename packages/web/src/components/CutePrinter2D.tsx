import React, { useState, useRef } from 'react';
import { StickerStyle, STICKER_STYLES } from '@emojicut/shared';
import { Sparkles, Upload } from 'lucide-react';
import {
  generateSticker,
  validateFileSize,
  validateFileType,
  readFileAsBase64,
} from '../services/stickerService';
import './CutePrinter2D.less';

interface CutePrinter2DProps {
  onGenerateComplete: (imageData: string) => void;
}

const CutePrinter2D: React.FC<CutePrinter2DProps> = ({ onGenerateComplete }) => {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StickerStyle>('line_cute');
  const [customStyle, setCustomStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      alert('请上传图片文件（PNG, JPG, JPEG, WEBP）');
      return;
    }

    if (!validateFileSize(file)) {
      alert('文件大小不能超过10MB');
      return;
    }

    const base64 = await readFileAsBase64(file);
    setReferenceImage(base64);
  };

  const handleGenerate = async () => {
    if (!referenceImage) {
      alert('请先上传参考图片！');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await generateSticker({
        referenceImage,
        style: selectedStyle,
        customStyle: selectedStyle === 'custom' ? customStyle : undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        setTimeout(() => {
          onGenerateComplete(response.data!.imageData);
        }, 500);
      } else {
        alert(`生成失败: ${response.error || '未知错误'}`);
        setIsGenerating(false);
        setProgress(0);
      }
    } catch (error) {
      clearInterval(progressInterval);
      alert('生成失败，请检查网络连接和API密钥配置');
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="printer-container">
      <div className="printer">
        {/* 打印机头部 */}
        <div className="printer-header">
          <div className="printer-logo">EmojiCut AI</div>
          <div className="status-light" />
        </div>

        {/* 屏幕区域 */}
        <div className="printer-screen" onClick={() => fileInputRef.current?.click()}>
          {referenceImage ? (
            <img src={referenceImage} alt="参考图" className="preview-image" />
          ) : (
            <div className="upload-placeholder">
              <Upload size={48} />
              <p>点击上传参考图</p>
              <span>支持 PNG, JPG, WEBP</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* 风格选择 */}
        <div className="style-selector">
          <label>选择画风:</label>
          <div className="style-buttons">
            {(Object.keys(STICKER_STYLES) as StickerStyle[]).map((style) => (
              <button
                key={style}
                className={`style-btn ${selectedStyle === style ? 'active' : ''}`}
                onClick={() => setSelectedStyle(style)}
                disabled={isGenerating}
              >
                {STICKER_STYLES[style]}
              </button>
            ))}
          </div>

          {selectedStyle === 'custom' && (
            <input
              type="text"
              className="custom-style-input"
              placeholder="输入自定义风格描述..."
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              disabled={isGenerating}
            />
          )}
        </div>

        {/* 生成按钮 */}
        <div className="printer-controls">
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !referenceImage}
          >
            <Sparkles size={20} />
            {isGenerating ? `生成中... ${progress}%` : '生成贴纸'}
          </button>

          {isGenerating && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* 打印机底座 */}
        <div className="printer-footer">
          <div className="printer-tray" />
        </div>
      </div>
    </div>
  );
};

export default CutePrinter2D;

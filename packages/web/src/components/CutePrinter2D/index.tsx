import React, { useState, useRef, useEffect } from 'react';
import { StickerStyle, STYLE_CONFIG } from '@emojicut/shared';
import { Sparkles, Heart, Star, CloudUpload, Power, Scissors, Wand2, ImageOff } from 'lucide-react';
import {
  generateSticker,
  validateFileSize,
  validateFileType,
  readFileAsBase64,
} from '../../services/stickerService';
import styles from './index.module.less';

interface CutePrinter2DProps {
  onGenerateComplete: (imageData: string) => void;
}

const CutePrinter2D: React.FC<CutePrinter2DProps> = ({ onGenerateComplete }) => {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StickerStyle>('custom');
  const [customStyle, setCustomStyle] = useState('');
  const [stickerCount, setStickerCount] = useState(16);
  const [countInputValue, setCountInputValue] = useState('16');
  const [withCaption, setWithCaption] = useState(true); // 默认带文字
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedStyle === 'custom' && referenceImage && !isGenerating) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [selectedStyle, referenceImage, isGenerating]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      setError('请上传图片文件（PNG, JPG, JPEG, WEBP）');
      return;
    }

    if (!validateFileSize(file)) {
      setError('文件大小不能超过10MB');
      return;
    }

    const base64 = await readFileAsBase64(file);
    setReferenceImage(base64);
    setError(null);
  };

  const handlePanelClick = () => {
    if (!referenceImage) {
      fileInputRef.current?.click();
    }
  };

  const handleReset = () => {
    setReferenceImage(null);
    setCustomStyle('');
    setError(null);
  };

  const handleGenerate = async () => {
    if (!referenceImage) {
      setError('请先上传参考图片！');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await generateSticker({
        referenceImage,
        style: selectedStyle,
        customStyle: selectedStyle === 'custom' ? customStyle : undefined,
        count: stickerCount,
        withCaption,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        setTimeout(() => {
          onGenerateComplete(response.data!.imageData);
        }, 500);
      } else {
        setError(`生成失败: ${response.error || '未知错误'}`);
        setIsGenerating(false);
        setProgress(0);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError('生成失败，请检查网络连接和API密钥配置');
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className={`cute-machine cute-machine-expanded ${isGenerating ? 'processing' : ''}`}>
      <div className="deco deco-star" style={{ top: -20, left: -20 }}>
        <Star fill="currentColor" />
      </div>
      <div className="deco deco-heart" style={{ top: 20, right: -30 }}>
        <Heart fill="currentColor" />
      </div>
      <div className="deco deco-star" style={{ bottom: -10, left: -10, fontSize: '18px' }}>
        <Star fill="currentColor" />
      </div>

      <div className={styles.header}>
        <div className={styles.headerDot}></div>
        <div className={styles.headerTitle}>✨ EmojiCut - AI贴纸生成 ✨</div>
        <div className={styles.headerDot}></div>
      </div>

      <div className="machine-screen machine-screen-tall" onClick={handlePanelClick}>
        {!referenceImage ? (
          <>
            <CloudUpload size={36} className={styles.uploadIcon} />
            <div className="screen-text">
              上传角色图片
              <br />
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>点击选择文件</span>
            </div>
          </>
        ) : (
          <div className={styles.imagePreview}>
            <img src={referenceImage} alt="Reference" className={styles.previewImage} />
            {!isGenerating && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className={styles.resetBtn}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {referenceImage && !isGenerating && (
        <div className={styles.styleSection}>
          <div className={styles.styleChips}>
            {(Object.keys(STYLE_CONFIG) as StickerStyle[]).map((style) => (
              <button
                key={style}
                className={`style-chip ${selectedStyle === style ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style)}
              >
                {STYLE_CONFIG[style].name}
              </button>
            ))}
          </div>

          {selectedStyle === 'custom' && (
            <textarea
              ref={textareaRef}
              className="printer-style-input"
              style={{ marginTop: 8 }}
              placeholder="输入画面风格，如：赛博朋克霓虹灯、水彩风..."
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              rows={2}
            />
          )}

          <div className={styles.countSection}>
            <label className={styles.countLabel}>生成数量</label>
            <div className={styles.countInput}>
              <button
                className={styles.countBtn}
                onClick={() => {
                  const newVal = Math.max(1, stickerCount - 2);
                  setStickerCount(newVal);
                  setCountInputValue(String(newVal));
                }}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={16}
                value={countInputValue}
                onChange={(e) => setCountInputValue(e.target.value)}
                onBlur={() => {
                  const val = parseInt(countInputValue);
                  if (isNaN(val) || val < 1) {
                    setStickerCount(1);
                    setCountInputValue('1');
                  } else if (val > 16) {
                    setStickerCount(16);
                    setCountInputValue('16');
                  } else {
                    setStickerCount(val);
                    setCountInputValue(String(val));
                  }
                }}
                className={styles.countValue}
              />
              <button
                className={styles.countBtn}
                onClick={() => {
                  const newVal = Math.min(16, stickerCount + 2);
                  setStickerCount(newVal);
                  setCountInputValue(String(newVal));
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.captionSection}>
            <label
              className={`${styles.captionToggle} ${!withCaption ? styles.captionToggleActive : ''}`}
              onClick={() => setWithCaption(!withCaption)}
            >
              <div className={styles.captionIcon}>
                <ImageOff size={16} />
              </div>
              <span className={styles.captionText}>生成纯贴纸</span>
              <div className={`${styles.toggleSwitch} ${!withCaption ? styles.toggleSwitchOn : ''}`}>
                <div className={styles.toggleKnob}></div>
              </div>
            </label>
            {!withCaption && (
              <div className={styles.captionHint}>
                🎨 只生成表情贴纸，不带文字
              </div>
            )}
          </div>
        </div>
      )}

      {isGenerating && (
        <div className={styles.generatingSection}>
          <Sparkles size={24} className={styles.spinIcon} />
          <div className="screen-text" style={{ fontSize: 14, marginBottom: 8 }}>
            AI 生成中...
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorSection}>
          <div className={styles.errorMsg}>{error}</div>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.controlBtn}>
          <div
            className={`${styles.powerBtn} ${referenceImage && !isGenerating ? styles.powerBtnOn : styles.powerBtnOff}`}
          >
            <Power size={18} />
          </div>
          <div
            className={`${styles.powerIndicator} ${referenceImage && !isGenerating ? styles.indicatorOn : styles.indicatorOff}`}
          ></div>
        </div>

        <button
          className="printer-action-btn"
          style={{ whiteSpace: 'nowrap' }}
          onClick={handleGenerate}
          disabled={!referenceImage || isGenerating}
        >
          <Wand2 size={20} />
          <span>{isGenerating ? '生成中' : '✨ 生成贴纸'}</span>
        </button>

        <div className={styles.controlBtn}>
          <div className={styles.cutBtn}>
            <Scissors size={18} />
          </div>
          <div className={styles.cutLabel}>CUT</div>
        </div>
      </div>

      <div className="output-slot-2d"></div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className={styles.fileInput}
        accept="image/*"
      />
    </div>
  );
};

export default CutePrinter2D;


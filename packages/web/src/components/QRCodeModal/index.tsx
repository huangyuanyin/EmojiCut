import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { StickerSegment } from '@emojicut/shared';
import { uploadForShare, uploadAllForShare, getImageDownloadUrl, getAllDownloadUrl } from '../../services/shareService';
import CuteButton from '../CuteButton';
import styles from './index.module.less';

const isLocalhost = () => ['localhost', '127.0.0.1'].includes(window.location.hostname);

type QRCodeModalProps = {
  onClose: () => void;
} & ({ sticker: StickerSegment; stickers?: never } | { stickers: StickerSegment[]; sticker?: never });

const QRCodeModal: React.FC<QRCodeModalProps> = ({ sticker, stickers, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [dataId, setDataId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBatch = !!stickers;

  const doUpload = async () => {
    setLoading(true);
    setError(null);
    const result = isBatch ? await uploadAllForShare(stickers) : await uploadForShare(sticker!);
    setLoading(false);
    if (result.success && result.data) {
      setDataId(result.data.id);
      setExpiresAt(result.data.expiresAt);
    } else {
      setError(result.error || '上传失败');
    }
  };

  useEffect(() => { doUpload(); }, [sticker, stickers]);

  const downloadUrl = dataId ? (isBatch ? getAllDownloadUrl(dataId) : getImageDownloadUrl(dataId)) : '';
  const formatExpireTime = (ts: number) => `${Math.ceil((ts - Date.now()) / 3600000)} 小时`;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isBatch ? '📦 分享全部贴纸' : '📱 扫码保存'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.content}>
          <div className={styles.preview}>
            {isBatch ? (
              <div className={styles.countBadge}>🎁 共 {stickers.length} 个贴纸</div>
            ) : (
              <>
                <img src={sticker!.dataUrl} alt={sticker!.name} className={styles.previewImage} />
                <div className={styles.stickerName}>{sticker!.name}</div>
              </>
            )}
          </div>

          <div className={styles.qrSection}>
            {loading ? (
              <div className={styles.loadingState}>
                <Loader2 size={40} className={styles.spinIcon} />
                <p>✨ {isBatch ? '正在上传贴纸...' : '正在生成二维码...'}</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p className={styles.errorText}>{error}</p>
                <CuteButton color="pink" onClick={doUpload}>重试</CuteButton>
              </div>
            ) : (
              <>
                <div className={styles.qrContainer}>
                  <QRCodeSVG value={downloadUrl} size={180} level="M" includeMargin bgColor="#E0F7FA" fgColor="#6B4C4C" />
                </div>
                <p className={styles.instruction}>📷 扫码后长按保存~</p>
                {isLocalhost() && (
                  <div className={styles.localhostWarning}>
                    <AlertTriangle size={14} />
                    <span>当前 localhost 访问，手机无法扫码，请用局域网 IP</span>
                  </div>
                )}
                {expiresAt && (
                  <div className={styles.expireInfo}>
                    <Clock size={14} />
                    <span>有效期：{formatExpireTime(expiresAt)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;

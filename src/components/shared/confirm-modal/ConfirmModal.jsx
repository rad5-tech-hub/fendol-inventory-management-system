import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoAlertCircle, IoWarningOutline, IoCheckmarkCircle } from 'react-icons/io5';
import styles from './confirm-modal.module.scss';

const ICONS = {
  danger: IoAlertCircle,
  warning: IoWarningOutline,
  primary: IoCheckmarkCircle,
};

export default function ConfirmModal({ show, onConfirm, onCancel, title, message, variant = 'danger', confirmText = 'Confirm', cancelText = 'Cancel', loading = false }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onCancel]);

  if (!mounted) return null;

  const Icon = ICONS[variant] || ICONS.danger;

  return createPortal(
    <div className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`} onClick={onCancel}>
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={`${styles.iconWrap} ${styles[`iconWrap_${variant}`]}`}>
          <Icon size={32} />
        </div>
        {title && <h5 className={styles.title}>{title}</h5>}
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading} type="button">{cancelText}</button>
          <button className={`${styles.confirmBtn} ${styles[`confirmBtn_${variant}`]}`} onClick={onConfirm} disabled={loading} type="button">
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

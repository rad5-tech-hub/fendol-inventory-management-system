import React from 'react';
import styles from './ErrorState.module.scss';

export default function ErrorState({
  icon,
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.iconWrap}>
        {icon || (
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="4" width="48" height="48" rx="24" fill="#FDF2F2" />
            <rect x="4" y="4" width="48" height="48" rx="24" stroke="#F5D6D6" strokeWidth="2" />
            <circle cx="28" cy="24" r="8" fill="#DC2626" opacity="0.15" />
            <path d="M28 20v5M28 27.5v.5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
            <path d="M17 40c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </svg>
        )}
      </div>
      <h3 className={styles.title}>{title || 'Something went wrong'}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry} type="button">
          {retryLabel}
        </button>
      )}
    </div>
  );
}

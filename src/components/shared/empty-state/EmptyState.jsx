import React from 'react';
import styles from './EmptyState.module.scss';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.iconWrap}>
        {icon || (
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="4" width="48" height="48" rx="24" fill="#F3F0F0" />
            <rect x="4" y="4" width="48" height="48" rx="24" stroke="#E5D9D9" strokeWidth="2" />
            <path d="M22 26h12M22 30h8M22 34h10" stroke="#512728" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <circle cx="38" cy="22" r="6" fill="#512728" stroke="#fff" strokeWidth="2" />
            <path d="M36 22h4M38 20v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

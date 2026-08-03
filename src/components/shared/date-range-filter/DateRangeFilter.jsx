import React from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import styles from './DateRangeFilter.module.scss';

const DateRangeFilter = ({ dateFrom, dateTo, onChange, onClear, label = 'Date Range' }) => {
  const handleFrom = (e) => onChange(e.target.value, dateTo);
  const handleTo = (e) => onChange(dateFrom, e.target.value);
  const hasValue = dateFrom || dateTo;

  return (
    <div className={styles.dateRangeFilter}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.inputs}>
        <div className={styles.dateField}>
          <IoCalendarOutline size={14} color="#6B7280" />
          <input
            type="date"
            value={dateFrom || ''}
            onChange={handleFrom}
            className={styles.dateInput}
            aria-label="Start date"
          />
        </div>
        <span className={styles.sep}>—</span>
        <div className={styles.dateField}>
          <IoCalendarOutline size={14} color="#6B7280" />
          <input
            type="date"
            value={dateTo || ''}
            onChange={handleTo}
            className={styles.dateInput}
            aria-label="End date"
          />
        </div>
        {hasValue && onClear && (
          <button className={styles.clearBtn} onClick={onClear} type="button">
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;

import React from 'react';
import styles from './DataTable.module.scss';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = '',
  emptyMessage = 'No data found.',
  onRowClick,
  className = '',
  actions,
}) {
  const hasActionColumn = !!actions;
  const colSpan = columns.length + (hasActionColumn ? 1 : 0);

  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={colSpan} className={styles.statusCell}>
            <div className={styles.skeletonRow}>
              {Array.from({ length: colSpan }).map((_, i) => (
                <div key={i} className={styles.skeletonCell}>
                  <div className={styles.skeletonPulse} />
                </div>
              ))}
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={colSpan} className={styles.statusCell}>
            <div className={styles.errorInline}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" fill="#DC2626" opacity="0.15" />
                <path d="M9 6.5v3M9 11.5v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={colSpan} className={styles.statusCell}>
            <div className={styles.emptyInline}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#F3F0F0" />
                <path d="M8 12h8" stroke="#512728" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              </svg>
              <span>{emptyMessage}</span>
            </div>
          </td>
        </tr>
      );
    }

    return data.map((row, rowIndex) => (
      <tr
        key={row.id || rowIndex}
        {...(onRowClick ? { onClick: () => onRowClick(row), style: { cursor: 'pointer' } } : {})}
      >
        {columns.map((col) => {
          const cellValue = row[col.key];
          return (
            <td
              key={col.key}
              className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start'}
            >
              {col.render ? col.render(cellValue, row, rowIndex) : cellValue}
            </td>
          );
        })}
        {hasActionColumn && (
          <td className="text-start" style={{ overflow: 'visible' }}>
            {actions(row, rowIndex)}
          </td>
        )}
      </tr>
    ));
  };

  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start'}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
            {hasActionColumn && <th className="text-start">Actions</th>}
          </tr>
        </thead>
        <tbody>{renderBody()}</tbody>
      </table>
    </div>
  );
}

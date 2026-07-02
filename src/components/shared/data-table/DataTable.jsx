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
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (hasActionColumn ? 1 : 0)} className={styles.statusCell}>
                Loading...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length + (hasActionColumn ? 1 : 0)} className={styles.statusCell}>
                {error}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (hasActionColumn ? 1 : 0)} className={styles.statusCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

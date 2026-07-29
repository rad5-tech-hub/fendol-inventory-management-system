import React from 'react';
import ReactPaginate from 'react-paginate';
import styles from './Pagination.module.scss';

export default function Pagination({
  currentPage = 0,
  pageCount = 1,
  totalItems = 0,
  pageSize = 45,
  onPageChange,
  itemName = 'items',
  className = '',
}) {
  const safePageCount = Math.max(1, pageCount);
  const safeCurrentPage = Math.min(currentPage, safePageCount - 1);
  const start = totalItems === 0 ? 0 : safeCurrentPage * pageSize + 1;
  const end = Math.min((safeCurrentPage + 1) * pageSize, totalItems);

  return (
    <div className={`${styles.footer} ${className}`}>
      <div className={styles.showingText}>
        {totalItems === 0
          ? `Showing 0 ${itemName}`
          : `Showing ${start}–${end} of ${totalItems} ${itemName}`}
      </div>
      <ReactPaginate
        previousLabel="‹"
        nextLabel="›"
        breakLabel="..."
        pageCount={safePageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={3}
        onPageChange={onPageChange}
        forcePage={safeCurrentPage}
        containerClassName="pagination mb-0"
        pageClassName="page-item"
        pageLinkClassName="page-link"
        previousClassName="page-item"
        previousLinkClassName="page-link"
        nextClassName="page-item"
        nextLinkClassName="page-link"
        breakClassName="page-item"
        breakLinkClassName="page-link"
        activeClassName="active"
      />
    </div>
  );
}

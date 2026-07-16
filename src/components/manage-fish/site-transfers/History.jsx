import React, { useState, useEffect, useCallback } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsSearch, BsX } from "react-icons/bs";
import { FaExchangeAlt, FaBoxOpen } from "react-icons/fa";
import { GiFishingNet } from "react-icons/gi";
import { IoEyeOutline } from "react-icons/io5";
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import { Modal, Button } from 'react-bootstrap';
import { SkeletonTable, SkeletonStatGrid, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
import ReactPaginate from 'react-paginate';
import { ToastContainer, toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Api, { ApiV2 } from "../../shared/api/apiLink";
import DataTable from "../../shared/data-table/DataTable";

const ITEMS_PER_PAGE = 10;

const pad = (n) => String(n).padStart(2, '0');
const fmtISODate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  /* ── Sidebar state ── */
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((prev) => !prev);
  const handleCloseSidebar = () => setShowSidebar(false);

  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const siteId = isSuperAdmin ? (activeSite?.id || '') : (user?.siteId || '');
      if (!siteId) {
        setError('No site selected. Please select a site from the header or contact an administrator.');
        setRecords([]);
        setLoading(false);
        return;
      }
      const res = await ApiV2.get('/v2/fish-transfer/outgoing', {
        params: { siteId },
      });
      const body = res.data;
      if (!body || body.success !== true) {
        throw new Error(body?.response_message || 'Failed to load transfer history.');
      }
      const list = body?.data;
      if (!Array.isArray(list)) {
        setRecords([]);
        setLoading(false);
        return;
      }
      const mapped = list.map((t) => ({
        id: t.id,
        date: fmtISODate(t.createdAt),
        pondFrom: t.pondFrom || '—',
        siteTo: t.siteTo || '—',
        quantity: t.quantity ?? 0,
        description: t.comments || null,
      }));
      setRecords(mapped);
    } catch (err) {
      const serverMsg = err?.response?.data?.response_message;
      const fallbackMsg = err?.response?.data?.message;
      const networkMsg = err?.message;
      const finalMsg = serverMsg || fallbackMsg || networkMsg || 'An unexpected error occurred. Please try again.';

      if (err?.response?.status === 400) {
        setError(finalMsg || 'Invalid request. Please check your input.');
      } else if (err?.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err?.response?.status === 403) {
        setError('You do not have permission to view transfer history.');
      } else if (err?.response?.status === 404) {
        setError('Transfer history endpoint not found. Please contact support.');
      } else if (err?.response?.status === 409) {
        setError(finalMsg || 'Conflict retrieving transfer history.');
      } else if (err?.response?.status === 422) {
        setError(finalMsg || 'Validation failed. Please check your site selection.');
      } else if (err?.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (!err?.response) {
        setError('Network error. Please check your connection and try again.');
      } else if (err?.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(typeof finalMsg === 'string' ? finalMsg : 'An unexpected error occurred. Please try again.');
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeSite?.id, user?.siteId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = records.filter((r) => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.pondFrom?.toLowerCase().includes(q) || false)
        || (r.siteTo?.toLowerCase().includes(q) || false)
        || (r.description?.toLowerCase().includes(q) || false);
    }
    return true;
  });

  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const offset = page * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(offset, offset + ITEMS_PER_PAGE);

  const handleViewDetails = (r) => {
    setSelectedRecord(r);
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const hasFilters = search || dateFrom || dateTo;

  const formatNumber = (n) => new Intl.NumberFormat().format(n);

  /* ── Derived stats (from filtered data) ── */
  const totalTransferred = filtered.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const statCards = [
    {
      label: 'TOTAL TRANSFERRED',
      value: `${formatNumber(totalTransferred)} pcs`,
      sub: 'All fish moved across records',
      icon: GiFishingNet,
      color: '#512728',
    },
    {
      label: 'TOTAL RECORDS',
      value: formatNumber(filtered.length),
      sub: 'Transfer history entries',
      icon: FaExchangeAlt,
      color: '#2563EB',
    },
  ];

  return (
    <section className={styles.body} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer />
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>Transfer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBodyCompact}>
          {selectedRecord && (
            <>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Date</span>
                <span className={styles.modalValue}>{selectedRecord.date}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Pond From</span>
                <span className={styles.modalValue}>{selectedRecord.pondFrom}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Site To</span>
                <span className={styles.modalValue}>{selectedRecord.siteTo}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Quantity</span>
                <span className={styles.modalValue}>{formatNumber(selectedRecord.quantity)} pcs</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Description</span>
                <span className={styles.modalValue}>{selectedRecord.description || '—'}</span>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>

      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span>Fish Operations</span>
              <span className={styles.separator}>&gt;</span>
              <span>Site Transfers</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>History</span>
            </div>

            {/* ── Header row ── */}
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div>
                <h3 className={styles.headingTitle}>Transfer History</h3>
                <p className={styles.headingSubtitle}>
                  Complete record of all site-to-site fish transfers.
                </p>
              </div>
            </div>

            {loading && (
              <div className="mt-4">
                <SkeletonStatGrid count={2} />
                <div className="mt-4"><SkeletonFilterBar /><SkeletonTable rows={8} /></div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <span className="flex-grow-1">{error}</span>
                <button className="btn btn-sm btn-outline-danger" onClick={loadHistory}>Retry</button>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* ── Info strip ── */}
                <div className={styles.infoStrip}>
                  {statCards.map((card, i) => (
                    <div key={i} className={styles.infoCard}>
                      <div className={styles.infoIcon} style={{ background: card.color + '1A' }}>
                        <card.icon size={18} color={card.color} />
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoLabel}>{card.label}</div>
                        <div className={styles.infoValue}>{card.value}</div>
                        <span className={styles.infoSub}>{card.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Filters row ── */}
                <div className="d-flex align-items-end gap-3 mb-4 flex-wrap">
                  <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '420px' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C949B', fontSize: '14px', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search pond, site, description..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      className={styles.searchInput}
                    />
                  </div>
                  <div className="d-flex align-items-end gap-2 ms-auto flex-wrap">
                    <div>
                      <div className={styles.filterLabel}>FROM</div>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                        className={styles.dateInput}
                      />
                    </div>
                    <div>
                      <div className={styles.filterLabel}>TO</div>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                        className={styles.dateInput}
                      />
                    </div>
                    {hasFilters && (
                      <button onClick={clearFilters} className={styles.clearBtn}>
                        <BsX size={16} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Empty state ── */}
                {filtered.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <FaBoxOpen />
                    </div>
                    <div className={styles.emptyStateHeading}>
                      No transfer records found
                    </div>
                    <div className={styles.emptyStateSub}>
                      {hasFilters
                        ? 'No records match your filters. Try adjusting your search or date range.'
                        : 'There are no transfer records to display yet.'}
                    </div>
                  </div>
                )}

                {/* ── Table ── */}
                {filtered.length > 0 && (
                  <>
                    <DataTable
                      columns={[
                        { key: 'date', label: 'DATE' },
                        { key: 'pondFrom', label: 'POND FROM' },
                        { key: 'siteTo', label: 'SITE TO' },
                        { key: 'quantity', label: 'QUANTITY', render: (value) => formatNumber(value) },
                        { key: 'description', label: 'DESCRIPTION' },
                      ]}
                      data={pageItems}
                      actions={(row) => (
                        <PortalDropdown
                          show={openDropdownId === row.id}
                          onToggle={(isOpen) => setOpenDropdownId(isOpen ? row.id : null)}
                          btnClass={styles.threeDotBtn}
                          items={[
                            { label: <><IoEyeOutline size={16} style={{ marginRight: 10 }} /> View Details</>, onClick: () => handleViewDetails(row) },
                          ]}
                        />
                      )}
                    />


                  </>
                )}
              </>
            )}
            </div>
            {!loading && !error && pageCount > 1 && (
              <div className={styles.paginationFooter}>
                <small className={styles.paginationInfo}>
                  Showing {offset + 1}&ndash;{Math.min(offset + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
                </small>
                <div className={styles.pagination} style={{ paddingTop: 12, paddingBottom: 12, background: '#fff' }}>
                  <ReactPaginate
                    previousLabel={"< "}
                    nextLabel={" >"}
                    breakLabel={"..."}
                    pageCount={pageCount}
                    forcePage={page}
                    onPageChange={({ selected }) => setPage(selected)}
                    containerClassName={"pagination mb-0"}
                    pageClassName={"page-item"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    previousLinkClassName={"page-link"}
                    nextClassName={"page-item"}
                    nextLinkClassName={"page-link"}
                    breakClassName={"page-item"}
                    breakLinkClassName={"page-link"}
                    activeClassName={"active"}
                  />
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

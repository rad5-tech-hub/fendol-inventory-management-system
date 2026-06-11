import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../process.module.scss';
import { Spinner, Alert, OverlayTrigger, Popover } from "react-bootstrap";
import { FaExclamationTriangle, FaSearch, FaCalendarAlt, FaChevronDown, FaSlidersH, FaEllipsisV, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import Api from '../../shared/api/apiLink';
import SiteSelector from '../../shared/site-selector/SiteSelector';

// ─── inline style tokens (no changes to process.module.scss) ────────────────
const PRIMARY    = '#512728';
const PRIMARY_HV = '#714445';
const BG_PAGE    = '#f5f6fa';
const BG_CARD    = '#ffffff';
const TEXT_MAIN  = '#2E3135';
const TEXT_MUTED = '#8C949B';
const BORDER     = '#e8eaed';

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: BG_PAGE,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: TEXT_MAIN,
  },
  contentWrap: {
    padding: '32px 36px',
    maxWidth: '1300px',
    margin: '0 auto',
  },
  // ── page header ──────────────────────────────────────────────────────────
  pageHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: TEXT_MAIN,
    margin: 0,
    lineHeight: 1.2,
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: TEXT_MUTED,
    marginTop: '4px',
  },
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    backgroundColor: PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },
  // ── stat cards ───────────────────────────────────────────────────────────
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: BG_CARD,
    borderRadius: '10px',
    padding: '20px 22px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  statLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '30px',
    fontWeight: 700,
    color: TEXT_MAIN,
    lineHeight: 1,
  },
  statBadge: {
    fontSize: '11px',
    fontWeight: 600,
    marginLeft: '6px',
    color: '#28a745',
  },
  statSub: {
    fontSize: '11.5px',
    color: TEXT_MUTED,
    marginTop: '4px',
  },
  statValueGreen: {
    fontSize: '30px',
    fontWeight: 700,
    color: '#28a745',
    lineHeight: 1,
  },
  statValueRed: {
    fontSize: '30px',
    fontWeight: 700,
    color: '#dc3545',
    lineHeight: 1,
  },
  statSubRed: {
    fontSize: '11px',
    color: '#dc3545',
    marginTop: '4px',
  },
  // ── filter bar ───────────────────────────────────────────────────────────
  filterBar: {
    backgroundColor: BG_CARD,
    borderRadius: '10px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  searchWrap: {
    flex: 1,
    minWidth: '200px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: TEXT_MUTED,
    fontSize: '13px',
  },
  searchInput: {
    width: '100%',
    border: `1px solid ${BORDER}`,
    borderRadius: '7px',
    padding: '8px 12px 8px 34px',
    fontSize: '13.5px',
    color: TEXT_MAIN,
    backgroundColor: '#fafbfc',
    outline: 'none',
  },
  filterSelect: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: `1px solid ${BORDER}`,
    borderRadius: '7px',
    padding: '8px 12px',
    fontSize: '13px',
    color: TEXT_MAIN,
    backgroundColor: BG_CARD,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  filterSelectIcon: {
    color: TEXT_MUTED,
    fontSize: '11px',
  },
  filterIconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: `1px solid ${BORDER}`,
    borderRadius: '7px',
    backgroundColor: BG_CARD,
    cursor: 'pointer',
    color: TEXT_MUTED,
    fontSize: '15px',
    flexShrink: 0,
  },
  dateInput: {
    border: `1px solid ${BORDER}`,
    borderRadius: '7px',
    padding: '8px 12px',
    fontSize: '13px',
    color: TEXT_MAIN,
    backgroundColor: BG_CARD,
    cursor: 'pointer',
  },
  // ── table panel ──────────────────────────────────────────────────────────
  tablePanel: {
    backgroundColor: BG_CARD,
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  tableResponsive: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12.5px',
    minWidth: '900px',
  },
  thead: {
    backgroundColor: '#f9fafb',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${BORDER}`,
  },
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: 'middle',
    color: TEXT_MAIN,
    whiteSpace: 'nowrap',
  },
  tdLast: {
    padding: '12px 14px',
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: 'middle',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  batchLink: {
    color: PRIMARY,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  // ── type badges ──────────────────────────────────────────────────────────
  typeBadge: (type) => {
    const map = {
      Washing:  { bg: '#e8f0fe', color: '#1a73e8' },
      Smoking:  { bg: '#fce8e6', color: '#d93025' },
      Drying:   { bg: '#fef7e0', color: '#b36a00' },
      Default:  { bg: '#f1f3f4', color: TEXT_MUTED },
    };
    const t = map[type] || map.Default;
    return {
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: t.bg,
      color: t.color,
    };
  },
  // ── output W/B/D ─────────────────────────────────────────────────────────
  outputWrap: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' },
  outputW: { color: '#28a745', fontWeight: 700 },
  outputB: { color: '#1a73e8', fontWeight: 700 },
  outputD: { color: '#dc3545', fontWeight: 700 },
  outputLabel: { color: TEXT_MUTED, fontSize: '11px' },
  // ── status ───────────────────────────────────────────────────────────────
  statusDot: (status) => {
    const colors = {
      Completed:   '#28a745',
      'In Progress': '#f9a825',
      'Saved Draft': '#8C949B',
    };
    return {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: colors[status] || TEXT_MUTED,
      marginRight: '6px',
      flexShrink: 0,
    };
  },
  statusText: (status) => {
    const colors = {
      Completed:   '#28a745',
      'In Progress': '#f9a825',
      'Saved Draft': TEXT_MUTED,
    };
    return {
      fontSize: '13px',
      fontWeight: 500,
      color: colors[status] || TEXT_MUTED,
    };
  },
  // ── complete process btn ─────────────────────────────────────────────────
  completeBtn: {
    backgroundColor: PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 13px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: '8px',
    whiteSpace: 'nowrap',
  },
  // ── actions ──────────────────────────────────────────────────────────────
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: TEXT_MUTED,
    padding: '4px 6px',
    fontSize: '17px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  // ── table footer ─────────────────────────────────────────────────────────
  tableFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    fontSize: '13px',
    color: TEXT_MUTED,
    borderTop: `1px solid ${BORDER}`,
  },
  // ── pagination ───────────────────────────────────────────────────────────
  paginationWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  pageBtn: (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: `1px solid ${active ? PRIMARY : BORDER}`,
    backgroundColor: active ? PRIMARY : BG_CARD,
    color: active ? '#fff' : TEXT_MAIN,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  }),
  pageDots: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    fontSize: '13px',
    color: TEXT_MUTED,
  },
  // ── progress bar (In Progress rows) ─────────────────────────────────────
  progressWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  progressBar: {
    width: '80px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#e8eaed',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#f9a825',
  }),
  progressPct: { fontSize: '12px', color: TEXT_MUTED },
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function deriveType(history) {
  if (history.type) return history.type;
  if (history.processType) return history.processType;
  return '—';
}

function deriveStatus(history) {
  if (history.status) return history.status;
  if (history.isCompleted === false) return 'In Progress';
  return 'Completed';
}

function deriveSite(history) {
  return history.site || history.location || '—';
}

// ─── component ───────────────────────────────────────────────────────────────
export default function ViewSummary() {
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [detailsPanel, setDetailsPanel] = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const openDetails = (history) => {
    setDetailsPanel(history);
    requestAnimationFrame(() => setPanelVisible(true));
  };

  const closeDetails = () => {
    setPanelVisible(false);
    setTimeout(() => setDetailsPanel(null), 420);
  };

  useEffect(() => {
    const fetchMoveFishHistory = async () => {
      try {
        const response = await Api.get('/latest-completed');
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        setMoveFishHistory(data);
        setFilteredData(data);
      } catch (error) {
        setError("Error fetching move fish history. Please try again.");
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMoveFishHistory();
  }, []);

  useEffect(() => {
    let data = moveFishHistory;

    if (selectedDate) {
      data = data.filter((history) => {
        const createdDate = new Date(history.date);
        const formattedDate = createdDate.toISOString().split('T')[0];
        return formattedDate === selectedDate;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(h =>
        (h.batchNumber || h.batch || '').toLowerCase().includes(q) ||
        (h.remark || '').toLowerCase().includes(q)
      );
    }

    if (siteFilter) {
      data = data.filter(h => deriveSite(h).toLowerCase() === siteFilter.toLowerCase());
    }

    if (statusFilter) {
      data = data.filter(h => deriveStatus(h).toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredData(data);
    setCurrentPage(0);
  }, [moveFishHistory, selectedDate, searchQuery, siteFilter, statusFilter]);

  useEffect(() => {
    const handler = () => setOpenActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const renderPopover = (remark) => (
    <Popover id="popover-basic">
      <Popover.Header as="h5">Full Remark</Popover.Header>
      <Popover.Body>{remark}</Popover.Body>
    </Popover>
  );

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const offset = currentPage * itemsPerPage;
  const paginatedData = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  // ── computed summary stats ────────────────────────────────────────────────
  const totalProcesses = moveFishHistory.length;
  const inProgress = moveFishHistory.filter(h => deriveStatus(h) === 'In Progress').length;
  const completed   = moveFishHistory.filter(h => deriveStatus(h) === 'Completed').length;
  const totalQty    = moveFishHistory.reduce((sum, h) => sum + (h.totalQuantity || 0), 0);
  const totalDamage = moveFishHistory.reduce((sum, h) => sum + (h.totalDamageLoss || 0), 0);
  const lossRate    = totalQty > 0 ? ((totalDamage / totalQty) * 100).toFixed(2) : '0.00';

  const formatBig = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat().format(n);
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '8px 16px',
    fontSize: '13px',
    color: TEXT_MAIN,
    cursor: 'pointer',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <section className={`${styles.body}`}>
      <style>{`
  @keyframes fdl-slide-in {
    0%   { transform: translateX(100%) skewX(-1deg); opacity: 0; }
    60%  { transform: translateX(-8px) skewX(0.4deg); opacity: 1; }
    80%  { transform: translateX(4px) skewX(-0.2deg); }
    100% { transform: translateX(0) skewX(0deg); opacity: 1; }
  }
  @keyframes fdl-slide-out {
    0%   { transform: translateX(0) skewX(0deg); opacity: 1; }
    30%  { transform: translateX(4px) skewX(-0.3deg); }
    100% { transform: translateX(105%) skewX(1deg); opacity: 0; }
  }
  @keyframes fdl-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fdl-overlay-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  .fdl-drawer-panel::-webkit-scrollbar { width: 4px; }
  .fdl-drawer-panel::-webkit-scrollbar-track { background: transparent; }
  .fdl-drawer-panel::-webkit-scrollbar-thumb { background: #e8eaed; border-radius: 4px; }
  .fdl-timeline-line {
    position: absolute;
    left: 6px;
    top: 18px;
    bottom: -18px;
    width: 2px;
    background: #e8eaed;
  }
  .fdl-meta-box {
    background: #f9fafb;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    padding: 14px 16px;
    font-family: 'Courier New', monospace;
    font-size: 11.5px;
    color: #2E3135;
    line-height: 1.9;
  }
`}</style>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content} flex-grow-1`} style={s.page}>
          <div style={s.contentWrap}>

            {/* ── page header ─────────────────────────────────────────────── */}
            <div style={s.pageHeaderRow}>
              <div>
                <h1 style={s.pageTitle}>Processing Records</h1>
                <p style={s.pageSubtitle}>Track and monitor all processing activities across sites and batches.</p>
              </div>
              <button
                style={s.createBtn}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY_HV}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = PRIMARY}
              >
                <FaPlus size={12} />
                Create New Process
              </button>
            </div>

            {/* ── stat cards ──────────────────────────────────────────────── */}
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <div style={s.statLabel}>Total Processes</div>
                <div>
                  <span style={s.statValue}>{new Intl.NumberFormat().format(totalProcesses)}</span>
                  <span style={s.statBadge}>+4%</span>
                </div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>In Progress</div>
                <div>
                  <span style={s.statValue}>{inProgress}</span>
                  <span style={{ ...s.statBadge, color: TEXT_MUTED }}> Active</span>
                </div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>Completed</div>
                <div>
                  <span style={s.statValueGreen}>{new Intl.NumberFormat().format(completed)}</span>
                  <span style={{ ...s.statBadge, color: TEXT_MUTED }}>
                    {totalProcesses > 0 ? Math.round((completed / totalProcesses) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>Fish Processed</div>
                <div style={s.statValue}>{formatBig(totalQty)}</div>
                <div style={s.statSub}>Units total</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>Damaged Fish</div>
                <div style={s.statValueRed}>{new Intl.NumberFormat().format(totalDamage)}</div>
                <div style={s.statSubRed}>Loss Rate: {lossRate}%</div>
              </div>
            </div>

            {/* ── filter bar ──────────────────────────────────────────────── */}
            <div style={s.filterBar}>
              <div style={s.searchWrap}>
                <FaSearch style={s.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by batch or operator..."
                  style={s.searchInput}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={s.filterSelect}>
                <FaCalendarAlt style={{ color: TEXT_MUTED, fontSize: '12px' }} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ border: 'none', outline: 'none', fontSize: '13px', backgroundColor: 'transparent', color: TEXT_MAIN, cursor: 'pointer' }}
                />
                <FaChevronDown style={s.filterSelectIcon} />
              </div>
              <SiteSelector onChange={(id, name) => setSiteFilter(name || '')} />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ ...s.filterSelect, border: `1px solid ${BORDER}`, appearance: 'auto', cursor: 'pointer' }}
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Saved Draft">Saved Draft</option>
              </select>
              <div style={s.filterIconBtn}>
                <FaSlidersH />
              </div>
            </div>

            {/* ── loading / error / empty / table ─────────────────────────── */}
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : error ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-75 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">No data available.</span>
                </Alert>
              </div>
            ) : (
              <div style={s.tablePanel}>
                <div style={s.tableResponsive}>
                  <table style={s.table}>
                  <thead style={s.thead}>
                    <tr>
                      <th style={{ ...s.th, rowSpan: 2 }}>Date Created</th>
                      <th style={{ ...s.th, rowSpan: 2 }}>Batch Number</th>
                      <th style={{ ...s.th, rowSpan: 2 }}>Site</th>
                      <th style={{ ...s.th, rowSpan: 2 }}>Qty Before</th>
                      <th style={{ ...s.th, textAlign: 'center', borderBottom: `1px solid ${BORDER}` }} colSpan={3}>
                        Qty After (W, B, D)
                      </th>
                      <th style={{ ...s.th, rowSpan: 2 }}>Processing Team</th>
                      <th style={{ ...s.th, rowSpan: 2 }}>Status</th>
                      <th style={{ ...s.th, rowSpan: 2 }}>Last Updated</th>
                      <th style={{ ...s.th, rowSpan: 2, textAlign: 'right' }}>Actions</th>
                    </tr>
                    <tr>
                      <th style={{ ...s.th, textAlign: 'center', paddingTop: '4px', paddingBottom: '10px' }}>Whole (W)</th>
                      <th style={{ ...s.th, textAlign: 'center', paddingTop: '4px', paddingBottom: '10px' }}>Broken (B)</th>
                      <th style={{ ...s.th, textAlign: 'center', paddingTop: '4px', paddingBottom: '10px' }}>Damaged (D)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(paginatedData) && paginatedData.map((history, index) => {
                      const formattedDate = formatDate(history.createdAt);
                      const status = deriveStatus(history);
                      const site   = deriveSite(history);
                      const batchNum = history.batchNumber || history.batch || `FDL-BT-${String(index + 1).padStart(4, '0')}`;
                      const isInProgress = status === 'In Progress';
                      const isSavedDraft = status === 'Saved Draft';

                      const pillStyle = {
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      };

                      return (
                        <tr key={index} style={{ backgroundColor: BG_CARD }}>
                          <td style={s.td}>{formattedDate}</td>
                          <td style={s.td}>
                            <span style={s.batchLink}>{batchNum}</span>
                          </td>
                          <td style={s.td}>{site}</td>
                          <td style={s.td}>{new Intl.NumberFormat().format(history.totalQuantity)} Units</td>
                          {isInProgress ? (
                            <>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <div style={s.progressWrap}>
                                  <div style={s.progressBar}>
                                    <div style={s.progressFill(67)} />
                                  </div>
                                  <span style={s.progressPct}>67%</span>
                                </div>
                              </td>
                              <td style={{ ...s.td, textAlign: 'center', color: TEXT_MUTED }}>—</td>
                              <td style={{ ...s.td, textAlign: 'center', color: TEXT_MUTED }}>—</td>
                            </>
                          ) : isSavedDraft ? (
                            <>
                              <td style={{ ...s.td, textAlign: 'center', color: TEXT_MUTED }}>—</td>
                              <td style={{ ...s.td, textAlign: 'center', color: TEXT_MUTED }}>—</td>
                              <td style={{ ...s.td, textAlign: 'center', color: TEXT_MUTED }}>—</td>
                            </>
                          ) : (
                            <>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <span style={{ ...pillStyle, backgroundColor: '#e6f9ee', color: '#28a745' }}>
                                  {new Intl.NumberFormat().format(history.wholeFishQuantity)}
                                </span>
                              </td>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <span style={{ ...pillStyle, backgroundColor: '#fff3e0', color: '#e07b00' }}>
                                  {new Intl.NumberFormat().format(history.brokenFishQuantity)}
                                </span>
                              </td>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <span style={{ ...pillStyle, backgroundColor: '#fdecea', color: '#dc3545' }}>
                                  {new Intl.NumberFormat().format(history.totalDamageLoss)}
                                </span>
                              </td>
                            </>
                          )}
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {(() => {
                                const team = history.processingTeam || history.team || [];
                                const dummyColors = ['#512728', '#8C949B', '#c4c4c4'];
                                const dummyInits = ['FT', 'JA', 'MK'];
                                const count = Math.max(team.length, 3);
                                return Array.from({ length: Math.min(count, 3) }, (_, i) => {
                                  const member = team[i];
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: member ? '#c4c4c4' : dummyColors[i],
                                        border: '2px solid #fff',
                                        marginLeft: i > 0 ? '-8px' : '0',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: member ? 'transparent' : '#fff',
                                        backgroundImage: member?.avatar ? `url(${member.avatar})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                      }}
                                    >
                                      {!member && dummyInits[i]}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </td>
                          <td style={s.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              ...(status === 'Completed'    && { backgroundColor: '#e6f9ee', color: '#28a745' }),
                              ...(status === 'In Progress'  && { backgroundColor: '#fff8e1', color: '#f9a825' }),
                              ...(status === 'Saved Draft'  && { backgroundColor: '#f1f3f4', color: TEXT_MUTED }),
                            }}>
                              {status}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ fontSize: '12px', color: TEXT_MAIN, lineHeight: '1.4', whiteSpace: 'nowrap' }}>
                              <div>{formatDate(history.updatedAt || history.createdAt).split(' ')[0]}</div>
                              <div style={{ color: TEXT_MUTED }}>{formatDate(history.updatedAt || history.createdAt).split(' ')[1]}</div>
                            </div>
                          </td>
                          <td style={s.tdLast}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                style={s.actionBtn}
                                onClick={e => { e.stopPropagation(); setOpenActionMenu(openActionMenu === index ? null : index); }}
                              >
                                <FaEllipsisV />
                              </button>

                              {openActionMenu === index && (
                                <div style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  zIndex: 100,
                                  backgroundColor: '#fff',
                                  border: `1px solid ${BORDER}`,
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                  minWidth: '180px',
                                  padding: '6px 0',
                                }}>
                                  <button style={menuItemStyle} onClick={() => { setOpenActionMenu(null); openDetails(history); }}>
                                    <FaSearch style={{ marginRight: '8px', fontSize: '12px', color: TEXT_MUTED }} /> View Details
                                  </button>
                                  <button style={menuItemStyle} onClick={() => setOpenActionMenu(null)}>
                                    <FaCalendarAlt style={{ marginRight: '8px', fontSize: '12px', color: TEXT_MUTED }} /> View Batch History
                                  </button>
                                  <button style={menuItemStyle} onClick={() => setOpenActionMenu(null)}>
                                    <FaChevronDown style={{ marginRight: '8px', fontSize: '12px', color: TEXT_MUTED }} /> Export Record
                                  </button>

                                  {status === 'Saved Draft' && (
                                    <>
                                      <hr style={{ margin: '4px 0', borderColor: BORDER }} />
                                      <button style={menuItemStyle} onClick={() => setOpenActionMenu(null)}>
                                        ✓ <span style={{ marginLeft: '8px' }}>Continue Process</span>
                                      </button>
                                      <button style={{ ...menuItemStyle, color: '#dc3545', fontWeight: 600 }} onClick={() => setOpenActionMenu(null)}>
                                        🔄 <span style={{ marginLeft: '8px' }}>Complete Process</span>
                                      </button>
                                      <button style={menuItemStyle} onClick={() => setOpenActionMenu(null)}>
                                        ✏️ <span style={{ marginLeft: '8px' }}>Edit Process</span>
                                      </button>
                                      <button style={{ ...menuItemStyle, color: '#dc3545' }} onClick={() => setOpenActionMenu(null)}>
                                        🗑️ <span style={{ marginLeft: '8px' }}>Delete Draft</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                {/* ── table footer / pagination ─────────────────────────── */}
                <div style={s.tableFooter}>
                  <span>Showing {Math.min(itemsPerPage, filteredData.length - offset)} of {filteredData.length} processes</span>
                  <div style={s.paginationWrap}>
                    <button
                      style={{ ...s.pageBtn(false), width: '32px' }}
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <FaChevronLeft size={11} />
                    </button>
                    {Array.from({ length: Math.min(3, pageCount) }, (_, i) => i).map(i => (
                      <button
                        key={i}
                        style={s.pageBtn(currentPage === i)}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {pageCount > 3 && <span style={s.pageDots}>...</span>}
                    <button
                      style={{ ...s.pageBtn(false), width: '32px' }}
                      onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                      disabled={currentPage >= pageCount - 1}
                    >
                      <FaChevronRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>

      {/* ── Process Details Drawer ──────────────────────────────────────── */}
      {detailsPanel && (
        <>
          {/* Overlay */}
          <div
            onClick={closeDetails}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 999,
              animation: `${panelVisible ? 'fdl-overlay-in' : 'fdl-overlay-out'} 0.3s ease forwards`,
            }}
          />

          {/* Panel */}
          <div
            className="fdl-drawer-panel"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '380px',
              maxWidth: '95vw',
              height: '100vh',
              backgroundColor: '#fff',
              zIndex: 1000,
              overflowY: 'auto',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              animation: `${panelVisible ? 'fdl-slide-in' : 'fdl-slide-out'} 0.42s cubic-bezier(0.32,0.72,0.37,1.05) forwards`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >

            {/* ── Header ── */}
            <div style={{
              padding: '22px 22px 18px',
              borderBottom: `2px dashed #e8eaed`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: PRIMARY }}>
                Process Details
              </h2>
              <button
                onClick={closeDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: TEXT_MUTED,
                  lineHeight: 1,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ×
              </button>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '20px 22px', flexGrow: 1 }}>

              {/* Current Batch Card */}
              <div style={{
                backgroundColor: '#f9fafb',
                border: `1px solid #e8eaed`,
                borderRadius: '10px',
                padding: '16px 18px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: '6px' }}>
                  Current Batch
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: TEXT_MAIN, marginBottom: '14px', letterSpacing: '-0.02em' }}>
                  {detailsPanel.batchNumber || detailsPanel.batch || '——'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: TEXT_MUTED, marginBottom: '2px' }}>Type</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: TEXT_MAIN }}>
                      {detailsPanel.type || detailsPanel.processType || '——'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: TEXT_MUTED, marginBottom: '2px' }}>Site</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: TEXT_MAIN }}>
                      {detailsPanel.site || detailsPanel.location || '——'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Process Timeline */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '16px' }}>🕐</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT_MAIN }}>Process Timeline</span>
                </div>

                {(() => {
                  const events = [];

                  if (detailsPanel.completedAt || (deriveStatus(detailsPanel) === 'Completed')) {
                    events.push({
                      label: 'Process Completed',
                      time: detailsPanel.completedAt
                        ? formatDate(detailsPanel.completedAt)
                        : (detailsPanel.updatedAt ? formatDate(detailsPanel.updatedAt) : '——'),
                      by: detailsPanel.completedBy || detailsPanel.operator || '——',
                    });
                  }

                  if (detailsPanel.qualityCheckedAt) {
                    events.push({
                      label: 'Quality Check Passed',
                      time: formatDate(detailsPanel.qualityCheckedAt),
                      by: detailsPanel.qualityCheckedBy || '——',
                    });
                  }

                  events.push({
                    label: 'Process Started',
                    time: detailsPanel.createdAt ? formatDate(detailsPanel.createdAt) : '——',
                    by: detailsPanel.createdBy || detailsPanel.operator || '——',
                  });

                  return events.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '18px', position: 'relative' }}>
                      <div style={{ flexShrink: 0, position: 'relative' }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: i === 0 ? PRIMARY : '#e8eaed',
                          border: `2px solid ${i === 0 ? PRIMARY : '#c4c4c4'}`,
                          marginTop: '2px',
                          position: 'relative',
                          zIndex: 1,
                        }} />
                        {i < events.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            left: '6px',
                            top: '16px',
                            width: '2px',
                            height: 'calc(100% + 10px)',
                            backgroundColor: '#e8eaed',
                            zIndex: 0,
                          }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_MAIN }}>{ev.label}</div>
                        <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px' }}>
                          {ev.time} by {ev.by}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Assigned Team */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '16px' }}>👥</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT_MAIN }}>Assigned Team</span>
                </div>

                {(() => {
                  const team = detailsPanel.processingTeam || detailsPanel.team || [];
                  if (team.length === 0) {
                    return (
                      <div style={{ fontSize: '13px', color: TEXT_MUTED, fontStyle: 'italic' }}>——</div>
                    );
                  }
                  return team.map((member, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: i < team.length - 1 ? `1px solid #f1f3f4` : 'none',
                    }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#c4c4c4',
                        backgroundImage: member?.avatar ? `url(${member.avatar})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#fff',
                      }}>
                        {!member?.avatar && (member?.name ? member.name.charAt(0).toUpperCase() : '?')}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: TEXT_MAIN }}>
                          {member?.name || '——'}
                        </div>
                        <div style={{ fontSize: '12px', color: TEXT_MUTED }}>
                          {member?.role || member?.position || '——'}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Divider */}
              <hr style={{ borderColor: '#e8eaed', margin: '0 0 18px' }} />

              {/* Metadata */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Metadata
                </div>
                <div className="fdl-meta-box">
                  <div>ID: {detailsPanel.id || detailsPanel._id || '——'}</div>
                  <div>Created: {detailsPanel.createdAt ? new Date(detailsPanel.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '——'}</div>
                  <div>Updated: {detailsPanel.updatedAt ? new Date(detailsPanel.updatedAt).toISOString().replace('T', ' ').slice(0, 19) : '——'}</div>
                  <div>Server: {detailsPanel.server || detailsPanel.cluster || 'Cluster-Main-01'}</div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </section>
  );
}

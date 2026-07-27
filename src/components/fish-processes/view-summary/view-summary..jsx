import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../process.module.scss';
import { OverlayTrigger, Popover } from "react-bootstrap";
import { SkeletonTable, SkeletonFilterBar, SkeletonStatGrid } from "../../shared/skeleton/Skeleton";
import { FaSearch, FaCalendarAlt, FaChevronDown, FaSlidersH, FaEllipsisV, FaPlus, FaChevronLeft, FaChevronRight, FaUsers, FaCogs } from "react-icons/fa";
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import ReactPaginate from "react-paginate";
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProcessingTeamModal from './ProcessingTeamModal';


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
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BG_PAGE,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: TEXT_MAIN,
  },
  contentWrap: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 36px',
    maxWidth: '1300px',
    margin: '0 auto',
    width: '100%',
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
function str(val, fallback = '—') {
  if (val == null || val === '') return fallback;
  if (typeof val === 'object') return val.name || val.title || fallback;
  return String(val);
}

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

function deriveType(history) {
  return str(pick(history, 'type', 'processType'));
}

function deriveStatus(history) {
  if (history.is_active) return 'In Progress';
  return 'Completed';
}

function deriveSite(history) {
  return str(pick(history, 'site', 'location', 'siteId'));
}

const STAGE_LABELS = { Washing: 'Washing Stage', Smoking: 'Smoking Stage', Drying: 'Drying Stage' };
const STAGE_ORDER = ['Washing', 'Smoking', 'Drying'];
const STAGE_COLORS = { Washing: '#4A90D9', Smoking: '#E8A020', Drying: '#28a745' };

function extractStageFromRemark(remark) {
  if (!remark) return null;
  const m = remark.match(/from (\w+)/);
  return m ? m[1] : null;
}

function buildStageBreakdown(histories, data) {
  const items = [];
  if (Array.isArray(histories) && histories.length > 0) {
    const sorted = [...histories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    sorted.forEach((h, i) => {
      const stageName = extractStageFromRemark(h.remarks) || STAGE_ORDER[i] || `Step ${i + 1}`;
      items.push({ ...h, stageName });
    });
  }
  if (data) {
    items.push({
      id: 'drying-final',
      stageName: 'Drying',
      wholeQuantity: data.wholeFishQuantity || 0,
      brokenQuantity: data.brokenFishQuantity || 0,
      damageLoss: data.damageOrLoss || 0,
      createdAt: data.updatedAt || data.createdAt,
      creator: null,
      remarks: 'Final Drying output',
    });
  }
  return items;
}

// ─── component ───────────────────────────────────────────────────────────────
export default function ViewSummary() {
  const navigate = useNavigate();
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sites, setSites] = useState([]);
  const [ponds, setPonds] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(65);
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [detailsPanel, setDetailsPanel] = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [teamModalProcess, setTeamModalProcess] = useState(null);
  const actionBtnRefs = useRef({});

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
        const [historyRes, sitesRes, pondsRes] = await Promise.all([
          Api.get('/latest-completed'),
          ApiV2.get('/v2/all-site'),
          Api.get(`/fish-stages?siteId=${isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0] || '')}`),
        ]);
        const data = Array.isArray(historyRes.data.data) ? historyRes.data.data : [];
        setMoveFishHistory(data);
        setFilteredData(data);
        setSites(Array.isArray(sitesRes.data?.data) ? sitesRes.data.data : []);
        setPonds(Array.isArray(pondsRes.data?.data) ? pondsRes.data.data : []);
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message || 'Unknown error';
        const status = error.response?.status || 'N/A';
        const statusText = error.response?.statusText || '';
        const endpoint = error.config?.url || '/latest-completed, /v2/all-site, /fish-stages?siteId=all';
        const method = error.config?.method || 'GET';
        console.error(`[${method}] ${endpoint} → ${status} ${statusText}: ${errMsg}`, error.response?.data || error);
        toast.error(
          <div>
            <strong>Failed to load processing records</strong>
            <div style={{fontSize:'12px',marginTop:'4px',color:'#6B7280'}}>
              {errMsg}
            </div>
            <div style={{fontSize:'11px',marginTop:'2px',color:'#9CA3AF'}}>
              {method.toUpperCase()} {endpoint} · HTTP {status}{statusText ? ` ${statusText}` : ''}
            </div>
          </div>,
          { autoClose: 8000 }
        );
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
        const createdDate = new Date(history.createdAt || history.date);
        const formattedDate = createdDate.toISOString().split('T')[0];
        return formattedDate === selectedDate;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(h =>
        (h.batchNumber || h.batch || h.id || '').toLowerCase().includes(q) ||
        (h.remark || (h.histories && h.histories.map(x => x.remarks).filter(Boolean).join(' ')) || '').toLowerCase().includes(q)
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

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Completed', label: 'Completed' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Saved Draft', label: 'Saved Draft' },
  ];

  const tableColumns = [
    {
      key: 'createdAt', label: 'Date Created',
      render: (value) => {
        const dateStr = formatDate(value);
        const [datePart, timePart] = dateStr.split(' ');
        return (
          <div style={{ fontSize: '12px', color: TEXT_MAIN, lineHeight: '1.4', whiteSpace: 'nowrap' }}>
            <div>{datePart}</div>
            <div style={{ color: TEXT_MUTED }}>{timePart}</div>
          </div>
        );
      },
    },
    {
      key: 'wholeFishQuantity', label: 'Qty Before',
      render: (value) => `${new Intl.NumberFormat().format(value || 0)} Units`,
    },
    {
      key: 'wholeFishQtyAfter', label: 'Whole (W)',
      render: (_value, row) => {
        const status = deriveStatus(row);
        const isInProgress = status === 'In Progress';
        const isSavedDraft = status === 'Saved Draft';
        if (isInProgress) {
          return (
            <div style={s.progressWrap}>
              <div style={s.progressBar}><div style={s.progressFill(67)} /></div>
              <span style={s.progressPct}>67%</span>
            </div>
          );
        }
        if (isSavedDraft) return <span style={{ color: TEXT_MUTED }}>—</span>;
        return (
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
            backgroundColor: '#e6f9ee', color: '#28a745',
          }}>
            {new Intl.NumberFormat().format(row.wholeFishQuantity || 0)}
          </span>
        );
      },
    },
    {
      key: 'cumulativeBrokenQuantity', label: 'Broken (B)',
      render: (_value, row) => {
        const status = deriveStatus(row);
        if (status === 'In Progress' || status === 'Saved Draft') return <span style={{ color: TEXT_MUTED }}>—</span>;
        return (
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
            backgroundColor: '#fff3e0', color: '#e07b00',
          }}>
            {new Intl.NumberFormat().format(row.cumulativeBrokenQuantity || 0)}
          </span>
        );
      },
    },
    {
      key: 'cumulativeDamageOrLoss', label: 'Damaged (D)',
      render: (_value, row) => {
        const status = deriveStatus(row);
        if (status === 'In Progress' || status === 'Saved Draft') return <span style={{ color: TEXT_MUTED }}>—</span>;
        return (
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
            backgroundColor: '#fdecea', color: '#dc3545',
          }}>
            {new Intl.NumberFormat().format(row.cumulativeDamageOrLoss || 0)}
          </span>
        );
      },
    },

    {
      key: '_status', label: 'Status',
      render: (_value, row) => {
        const status = deriveStatus(row);
        const displayStatus = status === 'Saved Draft' ? 'In Progress' : status;
        return (
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
            ...(displayStatus === 'Completed' && { backgroundColor: '#e6f9ee', color: '#28a745' }),
            ...(displayStatus === 'In Progress' && { backgroundColor: '#fff8e1', color: '#f9a825' }),
          }}>
            {displayStatus}
          </span>
        );
      },
    },
    {
      key: 'updatedAt', label: 'Last Updated',
      render: (value, row) => {
        const dateStr = formatDate(row.updatedAt || row.createdAt);
        const [datePart, timePart] = dateStr.split(' ');
        return (
          <div style={{ fontSize: '12px', color: TEXT_MAIN, lineHeight: '1.4', whiteSpace: 'nowrap' }}>
            <div>{datePart}</div>
            <div style={{ color: TEXT_MUTED }}>{timePart}</div>
          </div>
        );
      },
    },
    {
      key: '_actions', label: 'Actions', align: 'right',
      render: (_value, row, index) => {
        const status = deriveStatus(row);
        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              ref={btnRef => { if (btnRef) actionBtnRefs.current[index] = btnRef; }}
              style={s.actionBtn}
              onClick={e => {
                e.stopPropagation();
                if (openActionMenu === index) {
                  setOpenActionMenu(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({ top: rect.bottom + 4, left: rect.right - 180 });
                  setOpenActionMenu(index);
                }
              }}
            >
              <FaEllipsisV />
            </button>
            {openActionMenu === index && createPortal(
              <div style={{
                position: 'fixed', top: menuPosition.top, left: menuPosition.left,
                zIndex: 9999, backgroundColor: '#fff',
                border: `1px solid ${BORDER}`, borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: '180px', padding: '6px 0',
              }}>
                <>
                  <button style={menuItemStyle} onClick={() => { setOpenActionMenu(null); openDetails(row); }}>
                    <FaSearch style={{ marginRight: '8px', fontSize: '12px', color: TEXT_MUTED }} /> View Details
                  </button>
                  {status !== 'Completed' && (
                    <button style={menuItemStyle} onClick={() => {
                      setOpenActionMenu(null);
                      navigate(`/fish-processes/batch-processing/${row.id}`);
                    }}>
                      <span style={{ marginRight: '8px', fontSize: '12px' }}>▶</span> Continue Progress
                    </button>
                  )}
                  <div style={{ height: '1px', backgroundColor: BORDER, margin: '4px 12px' }} />
                  <button style={menuItemStyle} onClick={() => {
                    setOpenActionMenu(null);
                    setTeamModalProcess(row);
                  }}>
                    <FaUsers style={{ marginRight: '8px', fontSize: '12px', color: TEXT_MUTED }} /> Add Processing Team
                  </button>
                </>
              </div>,
              document.body
            )}
          </div>
        );
      },
    },
  ];

  // ── computed summary stats ────────────────────────────────────────────────
  const totalProcesses = moveFishHistory.length;
  const inProgress = moveFishHistory.filter(h => deriveStatus(h) === 'In Progress').length;
  const completed   = moveFishHistory.filter(h => deriveStatus(h) === 'Completed').length;
  const totalQty    = moveFishHistory.reduce((sum, h) => sum + (h.wholeFishQuantity || 0), 0);
  const totalDamage = moveFishHistory.reduce((sum, h) => sum + (h.cumulativeDamageOrLoss || 0), 0);
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

              <CustomDropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                placeholder="All Statuses"
              />
              <div style={s.filterIconBtn}>
                <FaSlidersH />
              </div>
            </div>

            {/* ── loading / error / empty / table ─────────────────────────── */}
            {loading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonStatGrid count={5} />
                <div style={{ height: 24 }} />
                <SkeletonFilterBar />
                <SkeletonTable rows={6} cols={6} />
              </div>
            ) : error ? (
              <ErrorState message={error} />
            ) : filteredData.length === 0 ? (
              <EmptyState title="No data available" />
            ) : (
              <div style={s.tablePanel}>
                <DataTable
                  columns={tableColumns}
                  data={paginatedData}
                />
              </div>
            )}

          </div>

          {/* ── table footer / pagination ─────────────────────────── */}
          {!loading && !error && filteredData.length > 0 && (
            <div style={{ ...s.tableFooter, flexDirection: 'column', gap: '10px', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
              <span>Showing {Math.min(itemsPerPage, filteredData.length - offset)} of {filteredData.length} processes</span>
              {pageCount > 1 && (
                <div style={{ ...s.paginationWrap }}>
                  <button
                    style={{ ...s.pageBtn(false), width: '32px' }}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    <FaChevronLeft size={11} />
                  </button>
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(pageCount, start + maxVisible);
                    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);

                    if (start > 0) {
                      pages.push(
                        <button key={0} style={s.pageBtn(false)} onClick={() => setCurrentPage(0)}>1</button>
                      );
                      if (start > 1) pages.push(<span key="sl" style={s.pageDots}>...</span>);
                    }
                    for (let i = start; i < end; i++) {
                      pages.push(
                        <button key={i} style={s.pageBtn(currentPage === i)} onClick={() => setCurrentPage(i)}>
                          {i + 1}
                        </button>
                      );
                    }
                    if (end < pageCount) {
                      if (end < pageCount - 1) pages.push(<span key="sr" style={s.pageDots}>...</span>);
                      pages.push(
                        <button key={pageCount - 1} style={s.pageBtn(false)} onClick={() => setCurrentPage(pageCount - 1)}>
                          {pageCount}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  <button
                    style={{ ...s.pageBtn(false), width: '32px' }}
                    onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={currentPage >= pageCount - 1}
                  >
                    <FaChevronRight size={11} />
                  </button>
                </div>
              )}
            </div>
          )}
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
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '420px',
              maxWidth: '100vw',
              height: '100vh',
              backgroundColor: '#fff',
              zIndex: 1000,
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.18)',
              transform: panelVisible ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {(() => {
              const drawerStatus = deriveStatus(detailsPanel);
              return (
                <>
                  {/* ── Header ── */}
                  <div style={{
                    padding: '22px 24px 16px',
                    borderBottom: '1px solid #F0F0F0',
                    position: 'relative',
                    flexShrink: 0,
                  }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '0.7rem', fontWeight: 700, color: '#B06426', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Process Details
                    </p>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#1C1C1C', paddingRight: '36px', lineHeight: 1.25 }}>
                      {str(pick(detailsPanel, 'batchNumber', 'batch')) || `#${(detailsPanel.id || detailsPanel._id || '').slice(0, 8).toUpperCase()}`}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        backgroundColor: drawerStatus === 'Completed' ? '#E8F5E9' : '#FFF8E1',
                        color: drawerStatus === 'Completed' ? '#2E7D32' : '#F9A825',
                      }}>
                        {drawerStatus}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#B0B8C1' }}>
                        ID: {(detailsPanel.id || detailsPanel._id || '').slice(0, 8)}...
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#B0B8C1' }}>
                      Created: {detailsPanel.createdAt ? formatDate(detailsPanel.createdAt) : '—'}
                    </p>
                    <button
                      onClick={closeDetails}
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid #EBEBEB',
                        background: '#F7F7F7',
                        color: '#555',
                        fontSize: '1rem',
                        lineHeight: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = '#EDEDED'; }}
                      onMouseOut={e => { e.currentTarget.style.background = '#F7F7F7'; }}
                    >
                      ×
                    </button>
                  </div>

                  {/* ── Hero Gradient Area ── */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '130px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    background: 'linear-gradient(160deg, #512728 0%, #6B3536 40%, #7A4040 70%, #512728 100%)',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `
                        radial-gradient(ellipse 100% 50% at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 70%),
                        radial-gradient(ellipse 60% 30% at 20% 40%, rgba(255,255,255,0.04) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 25% at 80% 60%, rgba(255,255,255,0.03) 0%, transparent 50%)
                      `,
                      zIndex: 1,
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80px', height: '80px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 2, fontSize: '2rem', color: 'rgba(255,255,255,0.4)',
                    }}>
                      <FaCogs />
                    </div>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)',
                      zIndex: 3,
                    }} />
                  </div>

                  {/* ── Body ── */}
                  <div style={{ flex: 1, padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* 2×2 Stat Grid */}
                    {(() => {
                      const total = (detailsPanel.cumulativeBrokenQuantity || 0) + (detailsPanel.cumulativeDamageOrLoss || 0) + (detailsPanel.wholeFishQuantity || 0);
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { label: 'Total Processed', value: new Intl.NumberFormat().format(total), suffix: 'units', valueColor: '#1A5276' },
                            { label: 'Whole Fish', value: new Intl.NumberFormat().format(detailsPanel.wholeFishQuantity || 0), suffix: 'units', valueColor: '#2E7D32' },
                            { label: 'Broken', value: new Intl.NumberFormat().format(detailsPanel.cumulativeBrokenQuantity || 0), suffix: 'units', valueColor: '#E07B00' },
                            { label: 'Damaged', value: new Intl.NumberFormat().format(detailsPanel.cumulativeDamageOrLoss || 0), suffix: 'units', valueColor: '#C0392B' },
                          ].map((stat, i) => (
                            <div key={i} style={{
                              background: '#FAFAFA',
                              border: '1px solid #EFEFEF',
                              borderRadius: '12px',
                              padding: '14px 16px',
                            }}>
                              <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#9AA0A6', fontWeight: 500 }}>{stat.label}</p>
                              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: stat.valueColor, lineHeight: 1.1 }}>
                                {stat.value}
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#AAB0B7', marginLeft: '4px' }}>{stat.suffix}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Batch Information */}
                    {(() => {
                      const pondId = pick(detailsPanel, 'pondId', 'sourcePond', 'pond');
                      const siteId = pick(detailsPanel, 'siteId', 'site', 'location');
                      const pondName = ponds.find(p => p.id === pondId)?.title || pondId || '—';
                      const siteName = sites.find(s => s.id === siteId)?.name || siteId || '—';
                      return (
                        <div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Batch Information
                          </p>
                          <div style={{ background: '#FAFAFA', border: '1px solid #EFEFEF', borderRadius: '12px', padding: '14px 16px' }}>
                            {[
                              { label: 'Source Pond', value: pondName },
                              { label: 'Site', value: siteName },
                              { label: 'Date Created', value: detailsPanel.createdAt ? formatDate(detailsPanel.createdAt) : '—' },
                              { label: 'Completed On', value: detailsPanel.completedAt ? formatDate(detailsPanel.completedAt) : detailsPanel.updatedAt ? formatDate(detailsPanel.updatedAt) : '—' },
                            ].map((row, i, arr) => (
                              <div key={row.label} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '6px 0',
                                borderBottom: i < arr.length - 1 ? '1px solid #EFEFEF' : 'none',
                              }}>
                                <span style={{ fontSize: '0.78rem', color: '#8C949B' }}>{row.label}</span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1C1C1C' }}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stage Breakdown */}
                    {(() => {
                      const stages = buildStageBreakdown(detailsPanel.histories, detailsPanel);
                      if (stages.length === 0) return null;
                      return (
                        <div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Stage Breakdown
                          </p>
                          <div style={{ position: 'relative', paddingLeft: '18px' }}>
                            <div style={{ position: 'absolute', left: '7px', top: '18px', bottom: '18px', width: '2px', background: '#E5E7EB' }} />
                            {stages.map((stage, idx) => {
                              const color = STAGE_COLORS[stage.stageName] || '#8C949B';
                              const isLast = idx === stages.length - 1;
                              return (
                                <div key={stage.id || idx} style={{ position: 'relative', paddingBottom: isLast ? 0 : '14px' }}>
                                  <div style={{
                                    position: 'absolute', left: '-13px', top: '3px',
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: color, border: '2px solid #fff',
                                    boxShadow: '0 0 0 2px #E5E7EB', zIndex: 1,
                                  }} />
                                  <div style={{
                                    background: '#FAFAFA', borderRadius: '12px',
                                    padding: '12px 14px', border: '1px solid #EFEFEF',
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{STAGE_LABELS[stage.stageName] || stage.stageName}</span>
                                      <span style={{ fontSize: '0.7rem', color: '#B0B8C1' }}>
                                        {stage.createdAt ? (() => {
                                          const d = new Date(stage.createdAt);
                                          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                        })() : ''}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 700 }}>W: {new Intl.NumberFormat().format(stage.wholeQuantity || 0)}</span>
                                      <span style={{ fontSize: '0.75rem', color: '#E07B00', fontWeight: 700 }}>B: {new Intl.NumberFormat().format(stage.brokenQuantity || 0)}</span>
                                      <span style={{ fontSize: '0.75rem', color: '#C0392B', fontWeight: 700 }}>D: {new Intl.NumberFormat().format(stage.damageLoss || 0)}</span>
                                    </div>

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Processing Team */}
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Processing Team
                      </p>
                      <div style={{ background: '#FAFAFA', border: '1px solid #EFEFEF', borderRadius: '12px', padding: '14px 16px' }}>
                        {(() => {
                          const team = detailsPanel.processingTeam || detailsPanel.team || [];
                          if (team.length === 0) {
                            return <p style={{ margin: 0, fontSize: '0.78rem', color: '#B0B8C1', fontStyle: 'italic' }}>No team assigned</p>;
                          }
                          const visible = team.slice(0, 4);
                          return (
                            <>
                              {visible.map((member, i) => (
                                <div key={i} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 0',
                                  borderBottom: i < visible.length - 1 ? '1px solid #EFEFEF' : 'none',
                                }}>
                                  <div style={{
                                    width: '34px', height: '34px', borderRadius: '50%',
                                    backgroundColor: '#c4c4c4',
                                    backgroundImage: member?.avatar ? `url(${member.avatar})` : 'none',
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    flexShrink: 0, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                                  }}>
                                    {!member?.avatar && (member?.name ? member.name.charAt(0).toUpperCase() : '?')}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1C1C1C' }}>
                                      {member?.name || '——'}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#B0B8C1' }}>
                                      {member?.role || member?.position || '——'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {team.length > 4 && (
                                <p style={{ margin: '8px 0 0 0', fontSize: '0.72rem', color: '#B0B8C1', fontStyle: 'italic' }}>
                                  +{team.length - 4} More Members
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div style={{ paddingBottom: '8px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Remarks
                      </p>
                      <div style={{ background: '#FAFAFA', border: '1px solid #EFEFEF', borderRadius: '12px', padding: '14px 16px' }}>
                        {(() => {
                          const historyRemarks = detailsPanel.histories?.map(h => h.remarks).filter(Boolean).join('\n');
                          const remark = historyRemarks || detailsPanel.remark || detailsPanel.remarks || detailsPanel.note || '—';
                          return (
                            <p style={{
                              margin: 0,
                              fontSize: '0.78rem',
                              lineHeight: 1.6,
                              color: remark === '—' ? '#B0B8C1' : '#2E3135',
                              fontStyle: remark === '—' ? 'italic' : 'normal',
                              whiteSpace: 'pre-wrap',
                            }}>
                              {remark}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover={false} theme="light" />

      <ProcessingTeamModal
        show={!!teamModalProcess}
        processId={teamModalProcess?.id || teamModalProcess?._id}
        existingTeam={teamModalProcess?.processingTeam || teamModalProcess?.team}
        onClose={() => setTeamModalProcess(null)}
        onSuccess={(members, error) => {
          if (error) {
            const errMsg = error.response?.data?.message || error.message || 'Unknown error';
            const status = error.response?.status || 'N/A';
            const statusText = error.response?.statusText || '';
            const endpoint = error.config?.url || '/processing-team';
            const method = error.config?.method || 'POST';
            console.error(`[${method}] ${endpoint} → ${status} ${statusText}: ${errMsg}`, error.response?.data || error);
            toast.error(
              <div>
                <strong>Failed to save processing team</strong>
                <div style={{fontSize:'12px',marginTop:'4px',color:'#6B7280'}}>{errMsg}</div>
                <div style={{fontSize:'11px',marginTop:'2px',color:'#9CA3AF'}}>
                  {method.toUpperCase()} {endpoint} · HTTP {status}{statusText ? ` ${statusText}` : ''}
                </div>
              </div>,
              { autoClose: 8000 }
            );
            return;
          }
          if (members) {
            toast.success(
              <div>
                <strong>Processing team saved</strong>
                <div style={{fontSize:'12px',marginTop:'4px',color:'#6B7280'}}>
                  {members.length} member{members.length !== 1 ? 's' : ''} assigned
                </div>
              </div>,
              { autoClose: 3000 }
            );
            setMoveFishHistory(prev =>
              prev.map(h =>
                (h.id === teamModalProcess?.id || h._id === teamModalProcess?._id)
                  ? { ...h, processingTeam: members }
                  : h
              )
            );
          }
        }}
      />
    </section>
  );
}

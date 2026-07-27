import React, { useState, useEffect, useRef, useCallback } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './ViewFish.module.scss';
import {
  BsSearch, BsChevronDown, BsPlusCircle, BsX
} from "react-icons/bs";
import {
  FaExchangeAlt, FaMapMarkerAlt, FaBoxOpen, FaWarehouse, FaFish
} from "react-icons/fa";
import { GiFishingNet, GiWaterTank } from "react-icons/gi";
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import { Modal, Button, Form } from 'react-bootstrap';
import { SkeletonTable, SkeletonStatGrid, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
import ReactPaginate from 'react-paginate';
import { ToastContainer, toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Api, { ApiV2 } from "../../shared/api/apiLink";

const ITEMS_PER_PAGE = 10;

/* ── Simple hash-based palette for site avatars ── */
const SITE_COLORS = [
  { bg: '#5127281A', text: '#512728' },
  { bg: '#2563EB1A', text: '#2563EB' },
  { bg: '#7C3AED1A', text: '#7C3AED' },
  { bg: '#0D94881A', text: '#0D9488' },
  { bg: '#D977061A', text: '#D97706' },
  { bg: '#BE185D1A', text: '#BE185D' },
  { bg: '#16A34A1A', text: '#16A34A' },
  { bg: '#DC26261A', text: '#DC2626' },
];

const siteColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SITE_COLORS[Math.abs(hash) % SITE_COLORS.length];
};

const pad = (n) => String(n).padStart(2, '0');

const fmtISODate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ViewFish() {
  const [transfers, setTransfers] = useState([]);
  const [summary, setSummary] = useState({ totalReceived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* ── Sidebar state ── */
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((prev) => !prev);
  const handleCloseSidebar = () => setShowSidebar(false);

  /* ── Stat card tooltip state ── */
  const [activeTooltip, setActiveTooltip] = useState(null);
  const tooltipRef = useRef(null);

  /* ── Filter pill dropdowns ── */
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [siteOptions, setSiteOptions] = useState([]);
  const [transferSites, setTransferSites] = useState([]);
  const cursorRef = useRef(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const userTypes = user?.userTypes || [];
  const isSuperAdmin = userTypes.includes('super_admin');
  const resolvedSiteId = isSuperAdmin ? (activeSite?.id || '') : (user?.siteId || user?.userSites?.[0]?.id || '');

  /* ── Move to Pond modal ── */
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pondOptions, setPondOptions] = useState([]);
  const [pondsLoading, setPondsLoading] = useState(false);
  const [moveForm, setMoveForm] = useState({ pondId: '', quantity: '' });
  const [moveSiteId, setMoveSiteId] = useState(resolvedSiteId);
  const [submittingMove, setSubmittingMove] = useState(false);
  const [moveError, setMoveError] = useState('');

  const fetchPonds = async (siteId) => {
    if (!siteId) { setPondOptions([]); return; }
    setPondsLoading(true);
    try {
      const res = await Api.get(`/fish-stages?siteId=${siteId}`);
      const list = res.data?.data || [];
      setPondOptions(list);
      setMoveForm(prev => ({ ...prev, pondId: '' }));
    } catch {
      setPondOptions([]);
    } finally {
      setPondsLoading(false);
    }
  };

  const openMoveModal = () => {
    const id = resolvedSiteId;
    setMoveSiteId(id);
    setMoveForm({ pondId: '', quantity: '' });
    setMoveError('');
    setShowMoveModal(true);
    if (id) fetchPonds(id);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    setMoveError('');

    const siteId = moveSiteId || resolvedSiteId;
    if (!siteId) {
      setMoveError('No site selected. Please select a site first.');
      return;
    }
    if (!moveForm.pondId) {
      setMoveError('Please select a destination pond.');
      return;
    }
    const qty = Number(moveForm.quantity);
    if (!qty || qty <= 0) {
      setMoveError('Please enter a valid quantity greater than 0.');
      return;
    }

    setSubmittingMove(true);
    try {
      const res = await ApiV2.post(`/v2/fish-transfer/remove?siteId=${siteId}`, {
        pondId: moveForm.pondId,
        quantity: qty,
      });
      const body = res.data;
      if (!body || body.success !== true) {
        throw new Error(body?.response_message || 'Failed to move fish to pond.');
      }
      toast.success(body.response_message || 'Fish moved to pond successfully!');
      setShowMoveModal(false);
      setMoveForm({ pondId: '', quantity: '' });
      loadTransfers();
    } catch (err) {
      const serverMsg = err?.response?.data?.response_message;
      const fallbackMsg = err?.response?.data?.message;
      const networkMsg = err?.message;
      const finalMsg = serverMsg || fallbackMsg || networkMsg || 'An unexpected error occurred. Please try again.';

      if (err?.response?.status === 400) {
        setMoveError(finalMsg || 'Invalid request. Please check your input.');
      } else if (err?.response?.status === 401) {
        setMoveError('Session expired. Please log in again.');
      } else if (err?.response?.status === 403) {
        setMoveError('You do not have permission to move fish to a pond.');
      } else if (err?.response?.status === 404) {
        setMoveError('The transfer record or pond was not found.');
      } else if (err?.response?.status === 409) {
        setMoveError(finalMsg || 'The requested quantity exceeds available stock.');
      } else if (err?.response?.status === 422) {
        setMoveError(finalMsg || 'Validation failed. Please check the pond and quantity.');
      } else if (err?.code === 'ECONNABORTED') {
        setMoveError('Request timed out. Please try again.');
      } else if (!err?.response) {
        setMoveError('Network error. Please check your connection and try again.');
      } else if (err?.response?.status >= 500) {
        setMoveError('Server error. Please try again later.');
      } else {
        setMoveError(typeof finalMsg === 'string' ? finalMsg : 'An unexpected error occurred.');
      }
    } finally {
      setSubmittingMove(false);
    }
  };

  /* ── Click-outside for tooltips ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setActiveTooltip(null);
      }
    };
    if (activeTooltip !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeTooltip]);

  /* ── Real API fetch ── */
  const loadTransfers = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    setError(null);
    try {
      const siteId = resolvedSiteId;
      if (!siteId) {
        setError('No site selected. Please select a site from the header or contact an administrator.');
        setTransfers([]);
        setSummary({ totalReceived: 0 });
        if (!append) setLoading(false);
        return;
      }
      const params = { siteId };
      if (append && cursorRef.current) params.cursor = cursorRef.current;
      const res = await ApiV2.get('/v2/fish-transfer-incoming', { params });
      const body = res.data;
      if (!body || body.success !== true) {
        throw new Error(body?.response_message || 'Failed to load incoming transfers.');
      }
      const list = body?.data?.transfers;
      if (!Array.isArray(list)) {
        if (!append) setTransfers([]);
        setSummary({ totalReceived: body?.summary?.totalReceived ?? 0 });
        if (!append) setLoading(false);
        return;
      }
      const mapped = list.map((t) => ({
        id: t.id,
        date: fmtISODate(t.createdAt),
        siteFrom: t.site?.name || t.siteFrom || 'Unknown',
        siteFromId: t.siteFrom,
        quantity: t.total ?? t.quantity ?? 0,
        total: t.total ?? 0,
        description: null,
        raw: t,
      }));
      setTransfers(prev => append ? [...prev, ...mapped] : mapped);
      setSummary({ totalReceived: body?.summary?.totalReceived ?? 0 });
      cursorRef.current = body?.pagination?.nextCursor || null;
      setHasMore(body?.pagination?.hasMore ?? false);
    } catch (err) {
      const msg = err?.response?.data?.response_message
        || err?.response?.data?.message
        || err?.message
        || 'Failed to load incoming transfers. Please try again.';
      setError(typeof msg === 'string' ? msg : 'An unexpected error occurred.');
      if (!append) { setTransfers([]); setSummary({ totalReceived: 0 }); }
    } finally {
      if (!append) setLoading(false);
      setLoadingMore(false);
    }
  }, [activeSite?.id, user?.siteId, user?.userSites?.[0]?.id]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  /* ── Fetch transfer-specific sites for filter dropdown & modal ── */
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/fish-transfer/all-site');
        const list = res.data?.data;
        if (Array.isArray(list)) {
          setTransferSites(list);
          setSiteOptions(list.map((s) => s.name).sort());
        }
      } catch {
        // silently fail
      }
    };
    fetchSites();
  }, []);

  /* ── Derived data ── */
  const filtered = transfers.filter((t) => {
    if (selectedSite && t.siteFrom !== selectedSite) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.siteFrom.toLowerCase().includes(q);
  });

  const totalFish = summary.totalReceived;
  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const offset = page * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(offset, offset + ITEMS_PER_PAGE);
  const pageMaxQty = pageItems.length ? Math.max(...pageItems.map((t) => t.quantity)) : 0;

  /* ── Handlers ── */
  const handleViewDetails = (t) => {
    setSelectedTransfer(t);
    setShowModal(true);
  };

  const formatNumber = (n) => new Intl.NumberFormat().format(n);

  /* ── Unique site names from backend fetch — falls back to transfer data ── */
  const allSites = siteOptions.length > 0 ? siteOptions : [...new Set(transfers.map((t) => t.siteFrom))].sort();

  const totalTransferRecords = transfers.length;

  /* ── Stat card definitions ── */
  const statCards = [
    {
      label: 'TOTAL RECEIVED',
      value: `${formatNumber(totalFish)} pcs`,
      sub: 'All incoming fish across transfers',
      icon: <GiFishingNet size={18} />,
      iconClass: styles.statIconMaroon,
      tooltipText: `Total of ${formatNumber(totalFish)} fish transferred to your site across all incoming transfers.`,
    },
    {
      label: 'TRANSFER RECORDS',
      value: `${formatNumber(totalTransferRecords)}`,
      sub: totalTransferRecords === 1 ? '1 incoming transfer' : `${totalTransferRecords} incoming transfers`,
      icon: <FaWarehouse size={16} />,
      iconClass: styles.statIconGreen,
      tooltipText: `${formatNumber(totalTransferRecords)} incoming transfer record${totalTransferRecords !== 1 ? 's' : ''} received.`,
    },
    {
      label: 'STOCK REMAINING',
      value: `${formatNumber(totalFish)} pcs`,
      sub: 'Awaiting pond assignment',
      icon: <FaExchangeAlt size={16} />,
      iconClass: styles.statIconBlue,
      tooltipText: `${formatNumber(totalFish)} fish are still awaiting pond assignment.`,
    },
  ];

  return (
    <section className={styles.body} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer />
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>Transfer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {selectedTransfer && (() => {
            const color = siteColor(selectedTransfer.siteFrom);
            return (
              <>
                <div className={styles.modalSiteBlock}>
                  <div className={styles.modalSiteAvatar} style={{ background: color.bg, color: color.text }}>
                    <FaMapMarkerAlt size={16} />
                  </div>
                  <span className={styles.modalSiteName}>{selectedTransfer.siteFrom}</span>
                </div>
                <div className={styles.modalDetailRow}>
                  <span className={styles.modalLabel}>Date</span>
                  <span className={styles.modalValue}>{selectedTransfer.date}</span>
                </div>
                <div className={styles.modalDetailRow}>
                  <span className={styles.modalLabel}>Quantity</span>
                  <span className={styles.modalValue}>{formatNumber(selectedTransfer.quantity)} pcs</span>
                </div>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Move to Pond Modal ── */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)} centered size="md">
        <div style={{
          background: '#ffffff', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          {/* Gradient Header */}
          <div style={{
            background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
            padding: '24px 28px', position: 'relative',
          }}>
            <button
              onClick={() => setShowMoveModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', cursor: 'pointer', fontSize: '18px',
              }}
            >
              <BsX />
            </button>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px', fontSize: '22px', color: '#ffffff',
            }}>
              <GiWaterTank />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Move to Pond
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>
              Transfer received fish into a pond on your site.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleMoveSubmit} style={{ padding: '28px' }}>
            {moveError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '0.82rem', color: '#B91C1C', lineHeight: 1.4,
              }}>
                {moveError}
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#8C949B',
                textTransform: 'uppercase', letterSpacing: '0.3px',
                marginBottom: '6px', display: 'block',
              }}>
                Site
              </label>
              <CustomDropdown
                value={moveSiteId}
                onChange={(value) => { setMoveSiteId(value); fetchPonds(value); }}
                placeholder="Select a site..."
                options={transferSites.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>

            {/* Pond dropdown */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#8C949B',
                textTransform: 'uppercase', letterSpacing: '0.3px',
                marginBottom: '6px', display: 'block',
              }}>
                Pond
              </label>
              <CustomDropdown
                value={moveForm.pondId}
                onChange={(value) => setMoveForm(p => ({ ...p, pondId: value }))}
                disabled={!moveSiteId}
                loading={pondsLoading}
                placeholder={pondsLoading ? 'Loading ponds...' : 'Select a pond'}
                options={pondOptions.map(p => ({ value: p.id, label: p.title || p.name }))}
              />
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#8C949B',
                textTransform: 'uppercase', letterSpacing: '0.3px',
                marginBottom: '6px', display: 'block',
              }}>
                Quantity (pcs)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={moveForm.quantity}
                  onChange={(e) => setMoveForm(p => ({ ...p, quantity: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: '14px',
                    border: '1px solid #e5e7eb', borderRadius: '10px',
                    outline: 'none', color: '#2E3135', background: '#FAFCFF',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#512728'; e.target.style.boxShadow = '0 0 0 3px rgba(81,39,40,0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '20px' }} />

            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                style={{
                  padding: '10px 24px', fontSize: '14px', fontWeight: 500,
                  border: '1px solid #e5e7eb', borderRadius: '10px',
                  background: '#ffffff', color: '#6B7280', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingMove || !moveForm.pondId || !moveForm.quantity}
                style={{
                  padding: '10px 24px', fontSize: '14px', fontWeight: 600,
                  border: 'none', borderRadius: '10px',
                  background: (submittingMove || !moveForm.pondId || !moveForm.quantity) ? '#9CA3AF' : '#512728',
                  color: '#ffffff', cursor: (submittingMove || !moveForm.pondId || !moveForm.quantity) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: (submittingMove || !moveForm.pondId || !moveForm.quantity) ? 'none' : '0 4px 12px rgba(81,39,40,0.2)',
                }}
              >
                <GiWaterTank size={14} /> {submittingMove ? 'Moving...' : 'Move to Pond'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>

      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={styles.content}>
          <main className={styles.mainCard} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span>Fish Operations</span>
              <span className={styles.separator}>&gt;</span>
              <span>Site Transfers</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Incoming</span>
            </div>

            {/* ── Header row ── */}
            <div className="mb-4">
              <h3 className={styles.headingTitle}>
                Site Transfers <span className={styles.incomingBadge}>Incoming</span>
              </h3>
              <p className={styles.headingSubtitle}>
                View all fish transferred to your site from other locations.
              </p>
            </div>

            {/* ── Loading state ── */}
            {loading && (
              <>
                <SkeletonStatGrid count={3} />
                <div className="mt-4"><SkeletonFilterBar /><SkeletonTable rows={6} /></div>
              </>
            )}

            {/* ── Error state ── */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center justify-content-between gap-2" role="alert" style={{ borderRadius: '10px' }}>
                <span>{error}</span>
                <button
                  onClick={loadTransfers}
                  style={{
                    background: '#DC2626', color: '#fff', border: 'none',
                    borderRadius: '6px', padding: '6px 16px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── Content ── */}
            {!loading && !error && (
              <>
                {/* ── Info strip — stat cards ── */}
                <div className={styles.statCardWrapper} ref={tooltipRef}>
                  {statCards.map((card, i) => (
                    <div
                      key={i}
                      className={styles.statCard}
                      onMouseEnter={() => setActiveTooltip(i)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
                    >
                      <div className={styles.statCardTop}>
                        <span className={styles.statLabel}>{card.label}</span>
                        <div className={`${styles.statIcon} ${card.iconClass}`}>{card.icon}</div>
                      </div>
                      <div className={styles.statValue}>{card.value}</div>
                      <div className={styles.statSub}>{card.sub}</div>
                      <div className={`${styles.statTooltip} ${activeTooltip === i ? styles.statTooltipVisible : ''}`}>
                        <span className={styles.tooltipText}>{card.tooltipText}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Move to Pond button (right-aligned) ── */}
                <div className="d-flex justify-content-end" style={{ marginBottom: '16px' }}>
                  <button
                    onClick={openMoveModal}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                      color: '#ffffff', border: 'none', borderRadius: '10px',
                      padding: '10px 22px', fontSize: '14px', fontWeight: 600,
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(81,39,40,0.25)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(81,39,40,0.35)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(81,39,40,0.25)'; }}
                  >
                    <GiWaterTank size={18} /> Move to Pond
                  </button>
                </div>

                {/* ── Filter / search row — always visible ── */}
                <div className={styles.filterRow}>
                  <div className={styles.searchWrapper}>
                    <BsSearch className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search by site..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      className={styles.searchInput}
                    />
                  </div>
                  {search && (
                    <button
                      onClick={() => { setSearch(''); setPage(0); }}
                      className={styles.clearBtn}
                    >
                      Clear
                    </button>
                  )}
                  <div className={styles.filterRight}>
                    <div style={{ position: 'relative' }}>
                      <button
                        className={`${styles.filterPill} ${showSiteMenu ? styles.filterPillActive : ''}`}
                        onClick={() => { setShowSiteMenu(!showSiteMenu); setShowMonthMenu(false); }}
                      >
                        {selectedSite || 'All Sites'} <BsChevronDown size={12} />
                      </button>
                      {showSiteMenu && (
                        <div className={styles.filterPillMenu}>
                          <div className={styles.filterPillMenuItem} onClick={() => { setSelectedSite(null); setShowSiteMenu(false); }}>All Sites</div>
                          {allSites.map((s) => (
                            <div key={s} className={styles.filterPillMenuItem} onClick={() => { setSelectedSite(s); setShowSiteMenu(false); }}>{s}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        className={`${styles.filterPill} ${showMonthMenu ? styles.filterPillActive : ''}`}
                        onClick={() => { setShowMonthMenu(!showMonthMenu); setShowSiteMenu(false); }}
                      >
                        {selectedMonthFilter === 'Custom Range' && customStartDate && customEndDate
                          ? `${customStartDate} – ${customEndDate}`
                          : selectedMonthFilter} <BsChevronDown size={12} />
                      </button>
                      {showMonthMenu && (
                        <div className={styles.filterPillMenu} style={{ padding: selectedMonthFilter === 'Custom Range' ? '12px' : '4px' }}>
                          {selectedMonthFilter === 'Custom Range' ? (
                            <div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8C949B' }}>Start Date</label>
                                <input
                                  type="date"
                                  value={customStartDate}
                                  onChange={(e) => setCustomStartDate(e.target.value)}
                                  style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.82rem' }}
                                />
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8C949B' }}>End Date</label>
                                <input
                                  type="date"
                                  value={customEndDate}
                                  onChange={(e) => setCustomEndDate(e.target.value)}
                                  style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.82rem' }}
                                />
                              </div>
                              <button
                                onClick={() => setShowMonthMenu(false)}
                                style={{ marginTop: '10px', width: '100%', padding: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#fff', background: '#512728', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Apply
                              </button>
                            </div>
                          ) : (
                            <>
                              <div
                                className={styles.filterPillMenuItem}
                                onClick={() => { setSelectedMonthFilter('All Time'); setShowMonthMenu(false); }}
                                style={{ fontWeight: selectedMonthFilter === 'All Time' ? 700 : 400 }}
                              >
                                All Time
                              </div>
                              <div
                                className={styles.filterPillMenuItem}
                                onClick={() => { setSelectedMonthFilter('This Month'); setShowMonthMenu(false); }}
                                style={{ fontWeight: selectedMonthFilter === 'This Month' ? 700 : 400 }}
                              >
                                This Month
                              </div>
                              <div
                                className={styles.filterPillMenuItem}
                                onClick={() => { setSelectedMonthFilter('Last Month'); setShowMonthMenu(false); }}
                                style={{ fontWeight: selectedMonthFilter === 'Last Month' ? 700 : 400 }}
                              >
                                Last Month
                              </div>
                              <div
                                className={styles.filterPillMenuItem}
                                onClick={() => { setSelectedMonthFilter('Custom Range'); }}
                                style={{ fontWeight: selectedMonthFilter === 'Custom Range' ? 700 : 400 }}
                              >
                                Custom Range
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Empty state ── */}
                {filtered.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <FaBoxOpen />
                    </div>
                    <div className={styles.emptyStateHeading}>
                      No incoming transfers found
                    </div>
                    <div className={styles.emptyStateSub}>
                      {search
                        ? `No transfers match "${search}". Try a different search term.`
                        : 'There are no incoming transfers to display yet.'}
                    </div>
                  </div>
                )}

                {/* ── Data content ── */}
                {filtered.length > 0 && (
                  <>
                    {/* ── Table ── */}
                    <DataTable
                      columns={[
                        { key: 'date', label: 'DATE' },
                        {
                          key: 'siteFrom',
                          label: 'SITE FROM',
                          render: (value) => {
                            const color = siteColor(value);
                            return (
                              <div className={styles.siteCell}>
                                <span className={styles.siteAvatar} style={{ background: color.bg, color: color.text }}>
                                  <FaMapMarkerAlt size={11} />
                                </span>
                                <span className={styles.siteName}>{value}</span>
                              </div>
                            );
                          }
                        },
                        {
                          key: 'quantity',
                          label: 'QUANTITY',
                          render: (value) => (
                            <>
                              {formatNumber(value)}
                              <div className={styles.qtyBarWrapper}>
                                <div className={styles.qtyBarFill} style={{ width: `${(value / pageMaxQty) * 100}%` }} />
                              </div>
                            </>
                          )
                        },
                      ]}
                      data={pageItems}
                      actions={(row) => (
                        <PortalDropdown
                          btnClass={styles.threeDotBtn}
                          stopPropagation
                          items={[
                            { label: 'View Details', onClick: () => handleViewDetails(row) },
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
                  Showing {offset + 1}&ndash;{Math.min(offset + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transfers
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

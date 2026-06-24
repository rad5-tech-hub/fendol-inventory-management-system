import React, { useState, useEffect, useRef } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './ViewFish.module.scss';
import {
  BsSearch, BsThreeDotsVertical, BsChevronDown, BsPlusCircle, BsX
} from "react-icons/bs";
import {
  FaExchangeAlt, FaMapMarkerAlt, FaBoxOpen, FaWarehouse, FaFish
} from "react-icons/fa";
import { GiFishingNet, GiWaterTank } from "react-icons/gi";
import { Dropdown, Modal, Button, Form } from 'react-bootstrap';
import { SkeletonTable, SkeletonStatGrid, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
import ReactPaginate from 'react-paginate';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import Api, { ApiV2 } from "../../shared/api/apiLink";

const generateMockTransfers = () => {
  const sites = ["Riverside Hatchery", "Mountain View Farm", "Green Valley Aquaculture", "Coastal Fish Farm", "Sunrise Tilapia Ltd", "Riverbend Aqua", "Highland Fisheries", "Delta Fish Co"];
  const descriptions = ["Juvenile tilapia for nursery pond", "Fingerlings for grow-out phase", "Mixed species for polyculture pond", "Catfish fingerlings for stocking", "Sex-reversed tilapia for grow-out", "Broodstock for hatchery", "Advanced fry for nursery", "Table-size fish for harvesting"];
  const data = [];
  for (let i = 1; i <= 24; i++) {
    data.push({
      id: i,
      date: new Date(2026, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      siteFrom: sites[i % sites.length],
      quantity: Math.floor(Math.random() * 4500) + 500,
      description: descriptions[i % descriptions.length],
    });
  }
  return data;
};

const MOCK_TRANSFERS = generateMockTransfers();

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

/* ── Derived display tag from description text — not a real backend field ── */
const deriveCategory = (desc) => {
  const d = desc.toLowerCase();
  if (d.includes('fingerling')) return { label: 'Fingerlings', cls: styles.pillFingerlings };
  if (d.includes('broodstock')) return { label: 'Broodstock', cls: styles.pillBroodstock };
  if (d.includes('table-size') || d.includes('harvest')) return { label: 'Ready for Harvest', cls: styles.pillHarvest };
  return { label: 'General Stock', cls: styles.pillGeneral };
};

export default function ViewFish() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* ── Sidebar state (matches HatchBatchSummary / Dashboard pattern) ── */
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((prev) => !prev);
  const handleCloseSidebar = () => setShowSidebar(false);

  /* ── Stat card tooltip state (matches Dashboard pattern) ── */
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

  const user = useSelector((store) => store.user);
  const userTypes = user?.userTypes || [];

  /* ── Move to Pond modal ── */
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pondOptions, setPondOptions] = useState([]);
  const [pondsLoading, setPondsLoading] = useState(false);
  const [moveForm, setMoveForm] = useState({ pondId: '', quantity: '' });
  const [moveSiteId, setMoveSiteId] = useState(user?.siteId || '');
  const [submittingMove, setSubmittingMove] = useState(false);
  const isSuperAdmin = userTypes.includes('super_admin');

  const fetchPonds = async (siteId) => {
    if (!siteId) return;
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
    const id = moveSiteId || user?.siteId || '';
    setMoveSiteId(id);
    setMoveForm({ pondId: '', quantity: '' });
    setShowMoveModal(true);
    if (id) fetchPonds(id);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!moveForm.pondId || !moveForm.quantity) return;
    setSubmittingMove(true);
    // TODO: wire actual API when available
    setTimeout(() => {
      setSubmittingMove(false);
      setShowMoveModal(false);
    }, 500);
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

  /* ── Simulated fetch ── */
  const loadTransfers = () => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      try {
        setTransfers(MOCK_TRANSFERS);
      } catch {
        setError("Failed to load transfers.");
      } finally {
        setLoading(false);
      }
    }, 600);
    return timer;
  };

  useEffect(() => {
    const timer = loadTransfers();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fetch sites from backend for filter dropdown ── */
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        if (Array.isArray(res.data?.data)) {
          setSiteOptions(res.data.data.map((s) => s.name).sort());
        }
      } catch {
        // silently fail — site filter falls back to empty
      }
    };
    fetchSites();
  }, []);

  /* ── Derived data ── */
  const filtered = transfers.filter((t) => {
    if (selectedSite && t.siteFrom !== selectedSite) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.siteFrom.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const totalFish = filtered.reduce((sum, t) => sum + t.quantity, 0);
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
      label: 'AVAILABLE STOCK',
      value: `${formatNumber(totalFish)} pcs`,
      sub: 'Current stock on site',
      icon: <FaWarehouse size={16} />,
      iconClass: styles.statIconGreen,
      tooltipText: `Current estimated stock of ${formatNumber(totalFish)} fish available on site.`,
    },
    {
      label: 'TOTAL TRANSFERS',
      value: formatNumber(filtered.length),
      sub: 'Individual transfer records',
      icon: <FaExchangeAlt size={16} />,
      iconClass: styles.statIconBlue,
      tooltipText: `${filtered.length} individual transfer records matching the current view.`,
    },
  ];

  return (
    <section className={styles.body}>
      <ToastContainer />
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>Transfer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {selectedTransfer && (() => {
            const color = siteColor(selectedTransfer.siteFrom);
            const cat = deriveCategory(selectedTransfer.description);
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
                <div className={styles.modalDetailRow}>
                  <span className={styles.modalLabel}>Description</span>
                  <span className={styles.modalValue}>
                    <span className={`${styles.categoryPill} ${cat.cls}`}>{cat.label}</span>
                    <span className="d-block mt-1" style={{ fontWeight: 400 }}>{selectedTransfer.description}</span>
                  </span>
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
            {isSuperAdmin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '12px', fontWeight: 600, color: '#8C949B',
                  textTransform: 'uppercase', letterSpacing: '0.3px',
                  marginBottom: '6px', display: 'block',
                }}>
                  Site
                </label>
                <Form.Select
                  value={moveSiteId}
                  onChange={(e) => { setMoveSiteId(e.target.value); fetchPonds(e.target.value); }}
                  style={{
                    fontSize: '14px', padding: '10px 12px',
                    border: '1px solid #e5e7eb', borderRadius: '10px',
                    color: '#2E3135', background: '#FAFCFF',
                  }}
                >
                  <option value="">Select a site...</option>
                  {(user?.userSites || []).map(s => (
                    <option key={s.id || s} value={s.id || s}>{s.name || s}</option>
                  ))}
                </Form.Select>
              </div>
            )}

            {/* Pond dropdown */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#8C949B',
                textTransform: 'uppercase', letterSpacing: '0.3px',
                marginBottom: '6px', display: 'block',
              }}>
                Pond
              </label>
              <Form.Select
                value={moveForm.pondId}
                onChange={(e) => setMoveForm(p => ({ ...p, pondId: e.target.value }))}
                disabled={pondsLoading || !moveSiteId}
                style={{
                  fontSize: '14px', padding: '10px 12px',
                  border: '1px solid #e5e7eb', borderRadius: '10px',
                  color: '#2E3135', background: '#FAFCFF',
                }}
              >
                <option value="">{pondsLoading ? 'Loading ponds...' : 'Select a pond'}</option>
                {pondOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.title || p.name}</option>
                ))}
              </Form.Select>
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

      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={styles.content}>
          <main className={styles.mainCard}>
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
              <h3 className={styles.headingTitle}>Site Transfers &mdash; Incoming</h3>
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
              <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <span>Failed to load transfer records. Please try again.</span>
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

                {/* ── Move to Pond button ── */}
                <div style={{ marginBottom: '16px' }}>
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
                      placeholder="Search by site or description..."
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
                    <div className={styles.tableContainer}>
                      <table className={`table ${styles.styled_table} mb-0`}>
                        <thead className={styles.theader}>
                          <tr>
                            <th>DATE</th>
                            <th>SITE FROM</th>
                            <th className={styles.qtyCell}>QUANTITY</th>
                            <th>DESCRIPTION</th>
                            <th style={{ textAlign: 'center', width: '80px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((t) => {
                            const color = siteColor(t.siteFrom);
                            const cat = deriveCategory(t.description);
                            return (
                              <tr key={t.id} className={styles.trow}>
                                <td style={{ color: '#8C949B' }}>{t.date}</td>
                                <td>
                                  <div className={styles.siteCell}>
                                    <span className={styles.siteAvatar} style={{ background: color.bg, color: color.text }}>
                                      <FaMapMarkerAlt size={11} />
                                    </span>
                                    <span className={styles.siteName}>{t.siteFrom}</span>
                                  </div>
                                </td>
                                <td className={styles.qtyCell}>
                                  {formatNumber(t.quantity)}
                                  <div className={styles.qtyBarWrapper}>
                                    <div className={styles.qtyBarFill} style={{ width: `${(t.quantity / pageMaxQty) * 100}%` }} />
                                  </div>
                                </td>
                                <td>
                                  <span className={`${styles.categoryPill} ${cat.cls}`}>{cat.label}</span>
                                  <span className="d-block mt-1" style={{ color: '#2E3135', fontWeight: 400 }}>{t.description}</span>
                                </td>
                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Dropdown align="end">
                                      <Dropdown.Toggle as="button" className={styles.threeDotBtn}>
                                        <BsThreeDotsVertical size={16} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu style={{ minWidth: 160 }}>
                                        <Dropdown.Item onClick={() => handleViewDetails(t)}>View Details</Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Pagination ── */}
                    {pageCount > 1 && (
                      <div className={styles.paginationFooter}>
                        <small className={styles.paginationInfo}>
                          Showing {offset + 1}&ndash;{Math.min(offset + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transfers
                        </small>
                        <div className={styles.pagination}>
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
                  </>
                )}
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

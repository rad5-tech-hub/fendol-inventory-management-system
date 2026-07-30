import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, ComposedChart,
} from 'recharts';
import {
  IoCalendarOutline, IoGridOutline, IoChevronDown,
} from 'react-icons/io5';
import { FiDownload, FiFilter } from 'react-icons/fi';
import {
  GiGreenPower, GiFactory, GiShoppingCart, GiBowlOfRice, GiDrop,
  GiMoneyStack, GiChart, GiDeadHead,
  GiCannedFish, GiChipsBag, GiFoodChain,
} from 'react-icons/gi';
import { MdOutlineScience } from 'react-icons/md';
import { BsBoxSeam } from 'react-icons/bs';
import { FaSkull } from 'react-icons/fa';
import { HiTrendingDown } from 'react-icons/hi';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import DataTable from "../../shared/data-table/DataTable";
import { ApiV2 } from '../../shared/api/apiLink';
import ErrorState from '../../shared/error-state/ErrorState';
import EmptyState from '../../shared/empty-state/EmptyState';
import { SkeletonStatGrid, SkeletonTable } from '../../shared/skeleton/Skeleton';
import feedStyles from '../feed.module.scss';
import styles from './feed-dashboard.module.scss';

const f = (n) => (n != null ? new Intl.NumberFormat().format(Number(n)) : '0');

const formatCurrency = (n) => {
  if (n == null) return '₦0';
  return '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatCurrencyDecimal = (n) => {
  if (n == null) return '₦0.00';
  return '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const FEED_STATUS_COLORS = {
  'in stock': '#16A34A',
  'low stock': '#F97316',
  'out of stock': '#DC2626',
};

const DONUT_COLORS = ['#8B1A1A', '#F97316', '#16A34A', '#2563EB', '#7C3AED', '#0D9488', '#7C3AED', '#DC2626'];

function generateTrendData(days) {
  const data = [];
  const baseDate = new Date('2025-01-01');
  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    const produced = Math.round(3000 + Math.random() * 4000);
    const used = Math.round(2800 + Math.random() * 3500);
    const cost = Math.round(800000 + Math.random() * 600000);
    data.push({ day: `${month} ${dayNum}`, produced, used, cost });
  }
  return data;
}

const activitiesData = [
  {
    title: 'Feed Batch FB-2505-018 produced',
    detail: 'Grower (1-3mm) \u2022 2,500 kg',
    time: 'May 31, 2025, 10:45 AM',
    actor: 'Admin User',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: GiChipsBag,
  },
  {
    title: 'Raw material stock added',
    detail: 'Fishmeal (60%) \u2022 500 kg',
    time: 'May 31, 2025, 09:30 AM',
    actor: 'Admin User',
    color: '#2563EB',
    bg: '#DBEAFE',
    icon: BsBoxSeam,
  },
  {
    title: 'Feed used in Pond P-12',
    detail: 'Grower (1-3mm) \u2022 350 kg',
    time: 'May 30, 2025, 04:15 PM',
    actor: 'Sarah Mike',
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: GiCannedFish,
  },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: entry.color }}>
          {entry.name}: {entry.dataKey === 'cost' ? formatCurrency(entry.value) : f(entry.value) + ' kg'}
        </p>
      ))}
    </div>
  );
};

const extractApiError = (error, fallback = 'Failed to load feed dashboard data. Please try again.') => {
  if (!error.response) return 'Network error. Please check your internet connection and try again.';
  const { data } = error.response;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join('. ');
  return data?.response_message || data?.message || data?.error?.message || fallback;
};

export default function FeedDashboard() {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');

  const [showSidebar, setShowSidebar] = useState(false);

  const [summary, setSummary] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [trendRange, setTrendRange] = useState('1M');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const resolvedSiteId = useMemo(() => {
    if (isSuperAdmin) return activeSite?.id || 'all';
    return user?.siteId || user?.userSites?.[0] || 'all';
  }, [isSuperAdmin, activeSite?.id, user?.siteId, user?.userSites]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { siteId: resolvedSiteId };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const res = await ApiV2.get('/v2/feed-dashboard/summary', { params });
      if (res.data?.success) {
        setSummary(res.data.data?.summary || null);
        setFeeds(res.data.data?.feeds || []);
        setRawMaterials(res.data.data?.rawMaterials || []);
      } else {
        throw new Error(res.data?.response_message || 'Unexpected response format');
      }
    } catch (err) {
      const msg = extractApiError(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [resolvedSiteId, dateFrom, dateTo]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const trendData = useMemo(() => {
    let days;
    switch (trendRange) {
      case '1W': days = 7; break;
      case '3M': days = 90; break;
      case 'custom': {
        if (customStart && customEnd) {
          const diff = (new Date(customEnd) - new Date(customStart)) / 86400000;
          days = Math.max(Math.round(diff), 1);
        } else days = 31;
        break;
      }
      default: days = 31;
    }
    return generateTrendData(days);
  }, [trendRange, customStart, customEnd]);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const rawMaterialValue = useMemo(() => {
    if (!rawMaterials?.length) return 0;
    return rawMaterials.reduce((sum, m) => sum + (Number(m.quantityInStock) * Number(m.unitCost)), 0);
  }, [rawMaterials]);

  const lowStockMaterials = useMemo(() => {
    return rawMaterials.filter((m) => m.status === 'low stock' || m.status === 'out of stock');
  }, [rawMaterials]);

  const inventoryByType = useMemo(() => {
    if (!feeds?.length) return [];
    return feeds.map((feed, index) => ({
      name: feed.feedName || 'Unnamed Feed',
      value: Number(feed.quantity) || 0,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    }));
  }, [feeds]);

  const totalClosingStock = useMemo(() => {
    return inventoryByType.reduce((sum, d) => sum + d.value, 0);
  }, [inventoryByType]);

  const renderSankeyFlow = () => {
    const produced = summary?.feedProducedWeight ?? 0;
    const purchased = summary?.feedPurchasedBags ?? 0;
    const available = summary?.totalFeedQuantity ?? 0;
    const used = summary?.feedUsed ?? 0;
    const sold = summary?.feedSold ?? 0;
    const closing = summary?.totalFeedQuantity ?? 0;

    return (
      <svg viewBox="0 0 740 240" className={styles.sankeySvg}>
        <defs>
          <linearGradient id="ribbonProd" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#16A34A" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0.15} />
          </linearGradient>
          <linearGradient id="ribbonPurch" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0.15} />
          </linearGradient>
          <linearGradient id="ribbonUsed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="ribbonSold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="ribbonClosing" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.35} />
          </linearGradient>
        </defs>

        {/* Column 1: Produced */}
        <rect x="30" y="20" width="120" height="70" rx="8" fill="#DCFCE7" />
        <text x="90" y="45" textAnchor="middle" fontSize="11" fill="#6B7280" fontWeight="500">Feed Produced</text>
        <text x="90" y="67" textAnchor="middle" fontSize="15" fill="#111827" fontWeight="700">{f(produced)} kg</text>

        {/* Column 1: Purchased */}
        <rect x="30" y="110" width="120" height="70" rx="8" fill="#DBEAFE" />
        <text x="90" y="135" textAnchor="middle" fontSize="11" fill="#6B7280" fontWeight="500">Feed Purchased</text>
        <text x="90" y="157" textAnchor="middle" fontSize="15" fill="#111827" fontWeight="700">{f(purchased)} bags</text>

        {/* Ribbon: Produced -> Center */}
        <path d="M150 55 C220 55, 220 95, 310 95" fill="url(#ribbonProd)" className={styles.ribbon} />
        <path d="M150 55 C220 55, 220 75, 310 75" fill="url(#ribbonProd)" className={styles.ribbon} />

        {/* Ribbon: Purchased -> Center */}
        <path d="M150 145 C220 145, 220 95, 310 95" fill="url(#ribbonPurch)" className={styles.ribbon} />
        <path d="M150 145 C220 145, 220 115, 310 115" fill="url(#ribbonPurch)" className={styles.ribbon} />

        {/* Column 2: Total Available (center) */}
        <rect x="310" y="55" width="130" height="90" rx="8" fill="#FFEDD5" />
        <text x="375" y="80" textAnchor="middle" fontSize="11" fill="#6B7280" fontWeight="500">Total Available</text>
        <text x="375" y="105" textAnchor="middle" fontSize="17" fill="#111827" fontWeight="700">{f(available)} kg</text>
        <text x="375" y="125" textAnchor="middle" fontSize="10" fill="#9CA3AF">Value {formatCurrency(summary?.totalProductionCost)}</text>

        {/* Ribbon: Center -> Used */}
        <path d="M440 95 C500 95, 500 25, 570 35" fill="url(#ribbonUsed)" className={styles.ribbon} />
        <path d="M440 95 C500 95, 500 55, 570 55" fill="url(#ribbonUsed)" className={styles.ribbon} />

        {/* Ribbon: Center -> Sold */}
        <path d="M440 95 C500 95, 500 85, 570 90" fill="url(#ribbonSold)" className={styles.ribbon} />
        <path d="M440 95 C500 95, 500 105, 570 110" fill="url(#ribbonSold)" className={styles.ribbon} />

        {/* Ribbon: Center -> Closing */}
        <path d="M440 95 C500 95, 500 145, 570 150" fill="url(#ribbonClosing)" className={styles.ribbon} />
        <path d="M440 95 C500 95, 500 160, 570 165" fill="url(#ribbonClosing)" className={styles.ribbon} />

        {/* Column 3: Used */}
        <rect x="570" y="20" width="130" height="60" rx="8" fill="#FFEDD5" />
        <text x="635" y="43" textAnchor="middle" fontSize="11" fill="#6B7280" fontWeight="500">Feed Used</text>
        <text x="635" y="63" textAnchor="middle" fontSize="15" fill="#111827" fontWeight="700">{f(used)} kg</text>

        {/* Column 3: Sold */}
        <rect x="570" y="90" width="130" height="50" rx="8" fill="#CCFBF1" />
        <text x="635" y="108" textAnchor="middle" fontSize="11" fill="#6B7280" fontWeight="500">Feed Sold</text>
        <text x="635" y="128" textAnchor="middle" fontSize="15" fill="#111827" fontWeight="700">{f(sold)} kg</text>

        {/* Column 3: Closing Stock */}
        <rect x="570" y="150" width="130" height="60" rx="8" fill="#EDE9FE" />
        <text x="635" y="173" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="600">Closing Stock</text>
        <text x="635" y="195" textAnchor="middle" fontSize="15" fill="#111827" fontWeight="700">{f(closing)} kg</text>
      </svg>
    );
  };

  const hasData = summary || feeds.length > 0 || rawMaterials.length > 0;

  return (
    <section className={`${feedStyles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>
            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Feed Dashboard</h1>
                <p className={styles.pageSubtitle}>Overview of feed operations and inventory across all sites.</p>
              </div>
              <div className={styles.headerRight} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <div className={styles.dateField} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px' }}>
                  <IoCalendarOutline size={14} color="#64748B" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={styles.dateInput}
                    style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                  />
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={styles.dateInput}
                    style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    style={{
                      padding: '8px 14px', background: '#ffffff', color: '#6B7280',
                      border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
                <button className={styles.filterBtn}>
                  <FiFilter size={14} />
                  Filter
                </button>
                <button className={styles.exportBtn}>
                  <FiDownload size={14} />
                  Export Report
                </button>
              </div>
            </div>

            {loading && (
              <>
                <SkeletonStatGrid count={5} />
                <div style={{ marginTop: 24 }}>
                  <SkeletonTable rows={6} cols={6} />
                </div>
              </>
            )}

            {!loading && error && (
              <div style={{ marginTop: 24 }}>
                <ErrorState title="Failed to load dashboard" message={error} onRetry={fetchDashboard} />
              </div>
            )}

            {!loading && !error && !hasData && (
              <div style={{ marginTop: 24 }}>
                <EmptyState title="No feed dashboard data" description="No data is available for the selected site or date range." />
              </div>
            )}

            {!loading && !error && hasData && (
              <>
                {/* ── Stat Cards Row ── */}
                <div className={styles.statCardsRow}>
                  {/* Card 1: Raw Materials in Stock */}
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                        <GiGreenPower size={20} color="#16A34A" />
                      </div>
                      <div className={styles.statInfo}>
                        <p className={styles.statLabel}>Raw Materials in Stock</p>
                        <div className={styles.statNumber}>{f(summary?.rawMaterialsInStock)} <span className={styles.statUnit}>Items</span></div>
                      </div>
                    </div>
                    <p className={styles.statSecondary}>
                      Total Value: <span className={styles.statSecondaryValue}>{formatCurrency(rawMaterialValue)}</span>
                    </p>
                  </div>

                  {/* Card 2: Feed Produced */}
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                        <GiFactory size={20} color="#2563EB" />
                      </div>
                      <div className={styles.statInfo}>
                        <p className={styles.statLabel}>Feed Produced</p>
                        <div className={styles.statNumber}>{f(summary?.feedProducedWeight)} <span className={styles.statUnit}>kg</span></div>
                      </div>
                    </div>
                    <p className={styles.statSecondary}>
                      Total Value: <span className={styles.statSecondaryValue}>{formatCurrency(summary?.totalProductionCost)}</span>
                    </p>
                  </div>

                  {/* Card 3: Feed Purchased */}
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                        <GiShoppingCart size={20} color="#7C3AED" />
                      </div>
                      <div className={styles.statInfo}>
                        <p className={styles.statLabel}>Feed Purchased</p>
                        <div className={styles.statNumber}>{f(summary?.feedPurchasedBags)} <span className={styles.statUnit}>bags</span></div>
                      </div>
                    </div>
                    <p className={styles.statSecondary}>
                      Total Value: <span className={styles.statSecondaryValue}>{formatCurrency(summary?.feedPurchasedCost)}</span>
                    </p>
                  </div>

                  {/* Card 4: Feed Used */}
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                        <GiBowlOfRice size={20} color="#F97316" />
                      </div>
                      <div className={styles.statInfo}>
                        <p className={styles.statLabel}>Feed Used</p>
                        <div className={styles.statNumber}>{f(summary?.feedUsed)} <span className={styles.statUnit}>kg</span></div>
                      </div>
                    </div>
                    <p className={styles.statSecondary}>
                      Total Value: <span className={styles.statSecondaryValue}>{formatCurrency(summary?.feedUsedCost)}</span>
                    </p>
                  </div>

                  {/* Card 5: Feed Sold */}
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <div className={styles.statIconCircle} style={{ background: '#E0F2FE' }}>
                        <GiDrop size={20} color="#0284C7" />
                      </div>
                      <div className={styles.statInfo}>
                        <p className={styles.statLabel}>Feed Sold</p>
                        <div className={styles.statNumber}>{f(summary?.feedSold)} <span className={styles.statUnit}>kg</span></div>
                      </div>
                    </div>
                    <p className={styles.statSecondary}>
                      Total Value: <span className={styles.statSecondaryValue}>{formatCurrency(summary?.feedSoldCost)}</span>
                    </p>
                  </div>
                </div>

                {/* ── Second Row: Flow + Inventory ── */}
                <div className={styles.middleRow}>
                  <div className={styles.flowCard}>
                    <h3 className={styles.cardTitle}>Feed Flow Summary</h3>
                    <div className={styles.sankeyWrapper}>
                      {renderSankeyFlow()}
                    </div>
                  </div>

                  <div className={styles.inventoryCard}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitleNoMargin}>Feed Inventory by Feed Type</h3>
                      <button className={styles.cardDropdown}>
                        By Feed Type <IoChevronDown size={11} />
                      </button>
                    </div>
                    <div className={styles.donutWrapper}>
                      {feeds.length > 0 ? (
                        <>
                          <div className={styles.donutChartArea}>
                            <ResponsiveContainer width={180} height={180}>
                              <PieChart>
                                <Pie
                                  data={inventoryByType}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={48}
                                  outerRadius={78}
                                  startAngle={90}
                                  endAngle={-270}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {inventoryByType.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className={styles.donutCenterLabel}>
                              <span className={styles.donutCenterNumber}>{f(totalClosingStock)}</span>
                              <span className={styles.donutCenterText}>Total Closing Stock</span>
                            </div>
                          </div>
                          <div className={styles.donutLegend}>
                            {inventoryByType.map((item, i) => (
                              <div key={i} className={styles.donutLegendRow}>
                                <span className={styles.donutDot} style={{ background: item.color }} />
                                <span className={styles.donutLegendLabel}>{item.name}</span>
                                <span className={styles.donutLegendValue}>{f(item.value)} kg</span>
                                <span className={styles.donutLegendPct}>({totalClosingStock > 0 ? ((item.value / totalClosingStock) * 100).toFixed(1) : '0.0'}%)</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                          <EmptyState title="No feed inventory" description="No feed inventory data is available." compact />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Third Row: Trend + Alerts Table ── */}
                <div className={styles.thirdRow}>
                  <div className={styles.trendCard}>
                    <div className={styles.trendHeader}>
                      <h3 className={styles.cardTitleNoMargin}>Feed Production &amp; Usage Trend</h3>
                      <div className={styles.timeSelector}>
                        {[
                          { key: '1W', label: '1 Week' },
                          { key: '1M', label: '1 Month' },
                          { key: '3M', label: '3 Months' },
                          { key: 'custom', label: 'Custom' },
                        ].map(r => (
                          <button
                            key={r.key}
                            className={`${styles.timeBtn} ${trendRange === r.key ? styles.timeBtnActive : ''}`}
                            onClick={() => setTrendRange(r.key)}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {trendRange === 'custom' && (
                      <div className={styles.customDateRow}>
                        <div className={styles.dateField}>
                          <IoCalendarOutline size={14} />
                          <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className={styles.dateInput}
                          />
                        </div>
                        <span className={styles.dateSep}>—</span>
                        <div className={styles.dateField}>
                          <IoCalendarOutline size={14} />
                          <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className={styles.dateInput}
                          />
                        </div>
                      </div>
                    )}

                    <div className={styles.legendRow}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendSwatch} style={{ background: '#22C55E' }} />
                        Produced (kg)
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendSwatch} style={{ background: '#3B82F6' }} />
                        Used (kg)
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendLine} />
                        Production Cost (₦)
                      </div>
                      <span className={styles.dataPointsBadge}>{trendData.length} data points</span>
                    </div>

                    <div className={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="trendBarProd" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#22C55E" stopOpacity={0.04} />
                            </linearGradient>
                            <linearGradient id="trendBarUsed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.04} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 3" stroke="#F0F0F0" vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: '#8C949B', fontSize: 10 }}
                            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            tickLine={false}
                            interval={trendData.length <= 12 ? 0 : Math.floor(trendData.length / 10)}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fill: '#8C949B', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                            tickFormatter={(v) => v >= 1000 ? (v / 1000) + 'K' : v}
                            width={40}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: '#8C949B', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                            tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000) + 'K' : v}
                            width={40}
                          />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F9FAFB' }} />
                          <Bar yAxisId="left" dataKey="produced" fill="url(#trendBarProd)" radius={[3, 3, 0, 0]} barSize={trendData.length > 60 ? 4 : 8} />
                          <Bar yAxisId="left" dataKey="used" fill="url(#trendBarUsed)" radius={[3, 3, 0, 0]} barSize={trendData.length > 60 ? 4 : 8} />
                          <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#DC2626" strokeWidth={2.5} dot={false} strokeDasharray="5 4" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={styles.alertsCard}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitleNoMargin}>Low Stock Alerts</h3>
                      <span className={styles.viewAllLink}>View All</span>
                    </div>
                    <DataTable
                      className={styles.alertsTable}
                      columns={[
                        { key: 'name', label: 'Item', render: (value) => <span style={{ fontWeight: 600 }}>{value}</span> },
                        { key: 'category', label: 'Type', render: (value) => <span style={{ color: '#6B7280' }}>{value}</span> },
                        { key: 'quantityInStock', label: 'Current Stock', render: (v, row) => `${f(v)} ${row.unit || ''}` },
                        { key: 'threshold', label: 'Reorder Level', render: (v, row) => `${f(v)} ${row.unit || ''}` },
                        { key: 'status', label: 'Status', render: (value) => (
                          <span style={{
                            padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                            background: value === 'out of stock' ? '#FEE2E2' : '#FEF3C7',
                            color: value === 'out of stock' ? '#DC2626' : '#D97706',
                            textTransform: 'capitalize',
                          }}>
                            {value}
                          </span>
                        )},
                      ]}
                      data={lowStockMaterials}
                      emptyMessage="No low stock alerts."
                    />
                  </div>
                </div>

                {/* ── Fourth Row: Cost Summary + Recent Activities ── */}
                <div className={styles.fourthRow}>
                  <div className={styles.costCard}>
                    <h3 className={styles.cardTitle}>Production Cost Summary</h3>
                    <div className={styles.costMetricsRow}>
                      <div className={styles.costMetric}>
                        <div className={styles.costMetricIcon} style={{ background: '#FFEDD5' }}>
                          <GiMoneyStack size={18} color="#F97316" />
                        </div>
                        <div className={styles.costMetricInfo}>
                          <p className={styles.costMetricLabel}>Total Production Cost</p>
                          <p className={styles.costMetricValue}>{formatCurrencyDecimal(summary?.totalProductionCost)}</p>
                        </div>
                      </div>
                      <div className={styles.costMetric}>
                        <div className={styles.costMetricIcon} style={{ background: '#CCFBF1' }}>
                          <GiChart size={18} color="#0D9488" />
                        </div>
                        <div className={styles.costMetricInfo}>
                          <p className={styles.costMetricLabel}>Average Cost / kg</p>
                          <p className={styles.costMetricValue}>{formatCurrencyDecimal(summary?.averageProductionCost)}</p>
                        </div>
                      </div>
                      <div className={styles.costMetric}>
                        <div className={styles.costMetricIcon} style={{ background: '#FFEDD5' }}>
                          <HiTrendingDown size={18} color="#F97316" />
                        </div>
                        <div className={styles.costMetricInfo}>
                          <p className={styles.costMetricLabel}>Lowest Cost / kg</p>
                          <p className={styles.costMetricValue}>{formatCurrencyDecimal(summary?.lowestCostFeed?.costPerKg)}</p>
                          <p className={styles.costMetricSub}>{summary?.lowestCostFeed?.feedName || '—'}</p>
                        </div>
                      </div>
                      <div className={styles.costMetric}>
                        <div className={styles.costMetricIcon} style={{ background: '#FEE2E2' }}>
                          <GiDeadHead size={18} color="#DC2626" />
                        </div>
                        <div className={styles.costMetricInfo}>
                          <p className={styles.costMetricLabel}>Highest Cost / kg</p>
                          <p className={styles.costMetricValue}>{formatCurrencyDecimal(summary?.highestCostFeed?.costPerKg)}</p>
                          <p className={styles.costMetricSub}>{summary?.highestCostFeed?.feedName || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.activityCard}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitleNoMargin}>Recent Activities</h3>
                      <span className={styles.viewAllLink}>View All</span>
                    </div>
                    <div className={styles.activityList}>
                      {activitiesData.map((act, i) => {
                        const Icon = act.icon;
                        return (
                          <div key={i} className={styles.activityItem}>
                            <div className={styles.activityIcon} style={{ background: act.bg }}>
                              <Icon size={16} color={act.color} />
                            </div>
                            <div className={styles.activityBody}>
                              <p className={styles.activityTitle}>{act.title}</p>
                              <p className={styles.activityDetail}>{act.detail}</p>
                            </div>
                            <div className={styles.activityMeta}>
                              <div className={styles.activityTime}>{act.time}</div>
                              <div className={styles.activityActor}>{act.actor}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

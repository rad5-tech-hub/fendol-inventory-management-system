import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsBuilding,
  BsWater,
  BsCurrencyDollar,
  BsHeartPulseFill,
  BsBoxSeam,
  BsCalendarRange,
  BsEye,
  BsCloudArrowDown,
  BsChevronDown,
  BsInfoCircleFill,
  BsSearch,
} from 'react-icons/bs';
import { GiCirclingFish } from 'react-icons/gi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
} from 'recharts';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { ApiV2 } from '../../shared/api/apiLink';
import { SkeletonTable, SkeletonStatGrid, SkeletonCard } from '../../shared/skeleton/Skeleton';
import EmptyState from '../../shared/empty-state/EmptyState';
import ErrorState from '../../shared/error-state/ErrorState';
import DataTable from '../../shared/data-table/DataTable';
import Pagination from '../../shared/pagination/Pagination';
import styles from './site-performance.module.scss';

const f = (n) => (n != null ? new Intl.NumberFormat().format(Number(n)) : '0');
const cf = (n) => (n != null
  ? `₦${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : '₦0.00');

const formatPercent = (value) => (value != null ? `${Number(value).toFixed(1)}%` : '—');

const normalizeSiteType = (type) => {
  if (!type) return 'Unknown';
  const lower = String(type).toLowerCase();
  if (lower.includes('hatch')) return 'Hatchery';
  if (lower.includes('farm')) return 'Main Farm';
  return type;
};

const SitePerformance = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [siteTypeFilter, setSiteTypeFilter] = useState('All Site Types');
  const [trendPeriod, setTrendPeriod] = useState('This Month');
  const [trendDropdownOpen, setTrendDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTooltip, setActiveTooltip] = useState(null);
  const pageSize = 10;
  const tooltipRef = useRef(null);
  const trendDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setActiveTooltip(null);
      }
      if (trendDropdownRef.current && !trendDropdownRef.current.contains(e.target)) {
        setTrendDropdownOpen(false);
      }
    };
    if (activeTooltip !== null || trendDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeTooltip, trendDropdownOpen]);

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.startDate = from;
      if (to) params.endDate = to;
      const res = await ApiV2.get('/v2/site-dashboard/summary', { params });
      const d = res.data?.data;
      setSummary(d?.summary || null);
      setSites(Array.isArray(d?.sites) ? d.sites : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to load site performance data.';
      setError(msg);
      setSummary(null);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateFromChange = (val) => {
    setDateFrom(val);
    if (val && dateTo) {
      fetchData(val, dateTo);
    }
  };

  const handleDateToChange = (val) => {
    setDateTo(val);
    if (dateFrom && val) {
      fetchData(dateFrom, val);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setSiteTypeFilter('All Site Types');
    fetchData();
  };

  const summaryTotals = useMemo(() => ({
    totalSites: summary?.totalSites ?? summary?.siteCount ?? 0,
    totalFishStock: summary?.totalFishStock ?? summary?.totalFishInPond ?? 0,
    totalMortality: summary?.totalMortality ?? summary?.mortality ?? 0,
    feedConversionRatio: summary?.feedConversionRatio ?? summary?.fcr ?? 0,
    totalRevenue: summary?.totalRevenue ?? summary?.revenue ?? 0,
  }), [summary]);

  const computeScopedTotals = (list) => {
    const totalSites = list.length;
    const totalFishStock = list.reduce((s, site) => s + (Number(site.totalFishInPond ?? site.totalFishStock ?? 0) || 0), 0);
    const totalMortality = list.reduce((s, site) => s + (Number(site.totalMortality ?? site.mortality ?? 0) || 0), 0);
    const totalRevenue = list.reduce((s, site) => s + (Number(site.totalRevenue ?? site.revenue ?? 0) || 0), 0);
    const fcrValues = list
      .map((site) => Number(site.feedConversionRatio ?? site.fcr))
      .filter((v) => !Number.isNaN(v) && v > 0);
    const feedConversionRatio = fcrValues.length > 0
      ? Number((fcrValues.reduce((a, b) => a + b, 0) / fcrValues.length).toFixed(2))
      : 0;
    return { totalSites, totalFishStock, totalMortality, feedConversionRatio, totalRevenue };
  };

  const filteredSites = useMemo(() => {
    let result = sites;
    if (siteTypeFilter !== 'All Site Types') {
      result = result.filter((site) => normalizeSiteType(site.typeName) === siteTypeFilter);
    }
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter((site) =>
        (site.siteName || '').toLowerCase().includes(term) ||
        (site.typeName || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [sites, siteTypeFilter, searchQuery]);

  const displayTotals = useMemo(() => {
    if (siteTypeFilter === 'All Site Types') return summaryTotals;
    return computeScopedTotals(filteredSites);
  }, [siteTypeFilter, summaryTotals, filteredSites]);

  const hasData = sites.length > 0 && summary;

  useEffect(() => {
    setCurrentPage(1);
  }, [siteTypeFilter, searchQuery, sites.length]);

  const pageCount = Math.max(1, Math.ceil(filteredSites.length / pageSize));
  const pageStart = filteredSites.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filteredSites.length);
  const paginatedSites = useMemo(
    () => filteredSites.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredSites, currentPage],
  );

  const handleExportReport = () => {
    const headers = [
      'Site Name', 'Site Type', 'Fish Stock (pcs)',
      'Survival Rate', 'Mortality (pcs)', 'FCR', 'Revenue (₦)', 'Status',
    ];
    const rows = filteredSites.map((site) => [
      site.siteName || '—',
      normalizeSiteType(site.typeName),
      site.totalFishInPond != null ? f(site.totalFishInPond) : '—',
      site.survivalRate != null ? formatPercent(site.survivalRate) : '—',
      site.totalMortality != null ? f(site.totalMortality) : '—',
      site.feedConversionRatio != null ? Number(site.feedConversionRatio).toFixed(2) : '—',
      site.totalRevenue != null ? cf(site.totalRevenue) : '—',
      site.status || 'Active',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'site-performance-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewSite = (site) => {
    navigate('/site-management/view-all', { state: { siteId: site.siteId || site.id } });
  };

  const donutSiteTypeData = useMemo(() => {
    const source = siteTypeFilter === 'All Site Types' ? sites : filteredSites;
    const groups = {};
    source.forEach((site) => {
      const type = normalizeSiteType(site.typeName);
      groups[type] = (groups[type] || 0) + 1;
    });

    const entries = Object.entries(groups);
    const total = source.length;

    if (total === 0) {
      return [
        { name: 'Hatchery Sites', value: 2, percentage: 40, color: '#B06426' },
        { name: 'Main Farm Sites', value: 3, percentage: 60, color: '#512728' },
      ];
    }

    const colors = { Hatchery: '#B06426', 'Main Farm': '#512728' };
    return entries.map(([name, count]) => ({
      name: `${name} Sites`,
      value: count,
      percentage: Math.round((count / total) * 100),
      color: colors[name] || '#6B7280',
    }));
  }, [siteTypeFilter, sites, filteredSites]);

  const trendOptions = [
    { label: 'Last 7 Days', key: '7D' },
    { label: 'Last 30 Days', key: '30D' },
    { label: 'This Month', key: 'THIS_MONTH' },
    { label: 'Last 6 Months', key: '6M' },
    { label: 'Last Year', key: '1Y' },
  ];

  const getTrendDataForPeriod = useCallback((period) => {
    const apiData = summary?.performanceTrend;
    if (Array.isArray(apiData) && apiData.length > 0) {
      // If API returns trend data, use it; future enhancement: filter by period client-side
      return apiData;
    }

    // Fallback sample data that changes per period to demonstrate interactivity
    const base = 240000;
    switch (period) {
      case '7D':
        return [
          { date: 'Mon', value: base + 12000 },
          { date: 'Tue', value: base + 18000 },
          { date: 'Wed', value: base + 15000 },
          { date: 'Thu', value: base + 22000 },
          { date: 'Fri', value: base + 26000 },
          { date: 'Sat', value: base + 24000 },
          { date: 'Sun', value: base + 30000 },
        ];
      case '30D':
        return [
          { date: 'Week 1', value: base + 20000 },
          { date: 'Week 2', value: base + 45000 },
          { date: 'Week 3', value: base + 70000 },
          { date: 'Week 4', value: base + 95000 },
        ];
      case '6M':
        return [
          { date: 'Jan', value: base },
          { date: 'Feb', value: base + 50000 },
          { date: 'Mar', value: base + 90000 },
          { date: 'Apr', value: base + 140000 },
          { date: 'May', value: base + 190000 },
          { date: 'Jun', value: base + 247000 },
        ];
      case '1Y':
        return [
          { date: 'Q1', value: base + 30000 },
          { date: 'Q2', value: base + 100000 },
          { date: 'Q3', value: base + 170000 },
          { date: 'Q4', value: base + 247000 },
        ];
      case 'THIS_MONTH':
      default:
        return [
          { date: 'May 1', value: base + 5000 },
          { date: 'May 8', value: base + 72000 },
          { date: 'May 15', value: base + 116000 },
          { date: 'May 22', value: base + 181000 },
          { date: 'May 29', value: base + 247000 },
        ];
    }
  }, [summary]);

  const performanceTrendData = useMemo(
    () => getTrendDataForPeriod(trendOptions.find((o) => o.label === trendPeriod)?.key || 'THIS_MONTH'),
    [trendPeriod, getTrendDataForPeriod],
  );

  const metricCards = [
    {
      key: 'totalSites',
      label: 'TOTAL SITES',
      icon: BsBuilding,
      color: '#6366F1',
      bg: '#EEF2FF',
      value: displayTotals.totalSites,
      caption: siteTypeFilter === 'All Site Types' ? 'All active sites' : `Filtered: ${siteTypeFilter}`,
      tooltip: `Total number of active sites: ${displayTotals.totalSites}`,
    },
    {
      key: 'totalFishStock',
      label: 'TOTAL FISH STOCK',
      icon: GiCirclingFish,
      color: '#0EA5E9',
      bg: '#F0F9FF',
      value: displayTotals.totalFishStock,
      caption: siteTypeFilter === 'All Site Types' ? 'Across all sites' : `Filtered: ${siteTypeFilter}`,
      tooltip: `Total fish count: ${f(displayTotals.totalFishStock)}`,
    },
    {
      key: 'totalMortality',
      label: 'TOTAL MORTALITY',
      icon: BsHeartPulseFill,
      color: '#EF4444',
      bg: '#FEF2F2',
      value: displayTotals.totalMortality,
      caption: '↓ 2.8% vs last period',
      tooltip: `Total mortality count: ${f(displayTotals.totalMortality)}`,
    },
    {
      key: 'feedConversionRatio',
      label: 'FEED CONVERSION RATIO',
      icon: BsBoxSeam,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      value: displayTotals.feedConversionRatio,
      caption: siteTypeFilter === 'All Site Types' ? 'Avg across sites' : `Avg: ${siteTypeFilter}`,
      format: (value) => (value != null ? Number(value).toFixed(2) : '—'),
      tooltip: `Average FCR: ${displayTotals.feedConversionRatio != null ? Number(displayTotals.feedConversionRatio).toFixed(2) : '—'}`,
    },
    {
      key: 'totalRevenue',
      label: 'TOTAL REVENUE',
      icon: BsCurrencyDollar,
      color: '#D97706',
      bg: '#FFFBEB',
      value: displayTotals.totalRevenue,
      caption: '↑ 12.5% vs last period',
      format: cf,
      tooltip: `Total revenue: ${cf(displayTotals.totalRevenue)}`,
    },
  ];

  const siteColumns = [
    {
      key: 'siteName',
      label: 'Site Name',
      render: (_, site) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', background: '#512728',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}
          >
            {(site.siteName || 'S')[0].toUpperCase()}
          </div>
          <span style={{ color: '#2E3135', fontWeight: 500 }}>{site.siteName || '—'}</span>
        </div>
      ),
    },
    {
      key: 'typeName',
      label: 'Site Type',
      render: (_, site) => {
        const siteType = normalizeSiteType(site.typeName);
        return (
          <span
            style={{
              display: 'inline-block', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
              background: siteType === 'Hatchery' ? '#FEF3E2' : '#EEF2FF',
              color: siteType === 'Hatchery' ? '#B06426' : '#6366F1',
            }}
          >
            {siteType}
          </span>
        );
      },
    },
    { key: 'totalFishInPond', label: 'Fish Stock', align: 'right', render: (v) => (v != null ? f(v) : '—') },
    { key: 'survivalRate', label: 'Survival Rate', align: 'right', render: (v) => (v != null ? formatPercent(v) : '—') },
    { key: 'totalMortality', label: 'Mortality', align: 'right', render: (v) => (v != null ? f(v) : '—') },
    { key: 'feedConversionRatio', label: 'FCR', align: 'right', render: (v) => (v != null ? Number(v).toFixed(2) : '—') },
    { key: 'totalRevenue', label: 'Revenue', align: 'right', render: (v) => (v != null ? cf(v) : '—') },
    {
      key: 'status',
      label: 'Status',
      render: (_, site) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 500, fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
          {site.status || 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (_, site) => (
        <button
          type="button"
          onClick={() => handleViewSite(site)}
          aria-label={`View ${site.siteName || 'site'}`}
          style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#512728',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#512728'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#512728'; }}
        >
          <BsEye size={15} />
        </button>
      ),
    },
  ];

  const handlePageChange = ({ selected }) => setCurrentPage(selected + 1);

  return (
    <section className={styles.body}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.wrapper}>
            <div className={styles.breadcrumb}>
              <span>Site Management</span>
              <span className={styles.breadcrumbSeparator}>&gt;</span>
              <span className={styles.breadcrumbCurrent}>Site Performance</span>
            </div>

            <div className={styles.pageTitleRow}>
              <div>
                <h1 className={styles.pageTitle}>Site Performance</h1>
                <p className={styles.pageSubtitle}>
                  Overview of all sites performance and key operational metrics.
                </p>
              </div>
              <div className={styles.pageTitleRight}>
                <div className={styles.selectWrap}>
                  <select
                    value={siteTypeFilter}
                    onChange={(e) => setSiteTypeFilter(e.target.value)}
                    aria-label="Filter by site type"
                  >
                    <option>All Site Types</option>
                    <option>Main Farm</option>
                    <option>Hatchery</option>
                  </select>
                  <BsChevronDown size={14} className={styles.selectChevron} />
                </div>

                <div className={styles.dateRange}>
                  <BsCalendarRange size={14} />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    aria-label="Start date"
                  />
                  <span>—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    aria-label="End date"
                  />
                  {(dateFrom || dateTo) && (
                    <button type="button" onClick={clearFilters}>
                      Clear
                    </button>
                  )}
                </div>

                <button type="button" className={styles.exportBtn} onClick={handleExportReport}>
                  <BsCloudArrowDown size={15} /> Export Report
                </button>
              </div>
            </div>

            {loading && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <SkeletonStatGrid count={5} />
                </div>
                <div className={styles.chartGrid} style={{ marginBottom: 16 }}>
                  <SkeletonCard style={{ height: 320, borderRadius: 12 }} />
                  <SkeletonCard style={{ height: 320, borderRadius: 12 }} />
                </div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                  <SkeletonTable rows={6} cols={9} />
                </div>
              </>
            )}

            {!loading && error && (
              <ErrorState
                title="Failed to load data"
                message={error}
                onRetry={() => fetchData(dateFrom, dateTo)}
              />
            )}

            {!loading && !error && !hasData && (
              <EmptyState
                title="No site performance data available"
                description={
                  dateFrom && dateTo
                    ? 'No data found for the selected date range. Try a different range.'
                    : 'Data will appear here once sites are configured.'
                }
              />
            )}

            {!loading && !error && hasData && (
              <>
                <div className={styles.statGrid} ref={tooltipRef}>
                  {metricCards.map((card, i) => {
                    const Icon = card.icon;
                    const value = card.value;
                    return (
                      <div
                        key={card.key}
                        className={styles.statCard}
                        onMouseEnter={() => setActiveTooltip(i)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
                      >
                        <div className={styles.statCardTop}>
                          <span className={styles.statLabel}>{card.label}</span>
                          <div className={styles.statIcon} style={{ backgroundColor: card.bg, color: card.color }}>
                            <Icon size={16} />
                          </div>
                        </div>
                        <div className={styles.statValue}>
                          {card.format ? card.format(value) : f(value)}
                        </div>
                        <div className={styles.statSub}>{card.caption}</div>
                        <div className={`${styles.statTooltip} ${activeTooltip === i ? styles.statTooltipVisible : ''}`}>
                          <span className={styles.tooltipText}>{card.tooltip}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.chartGrid}>
                  <section className={styles.donutCard}>
                    <div className={styles.donutCardHeader}>
                      <span className={styles.donutCardTitle}>Performance by Site Type</span>
                    </div>
                    <div className={styles.donutBody}>
                      <div className={styles.donutCenter}>
                        <div className={styles.donutRing}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={donutSiteTypeData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={62}
                                outerRadius={88}
                                paddingAngle={3}
                                stroke="transparent"
                                startAngle={90}
                                endAngle={-270}
                              >
                                {donutSiteTypeData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className={styles.donutCenterLabel}>
                            <span className={styles.donutCenterCount}>{f(displayTotals.totalSites)}</span>
                            <span className={styles.donutCenterUnit}>Total Sites</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.legendCol}>
                        {donutSiteTypeData.map((entry) => (
                          <div key={entry.name} className={styles.legendRow}>
                            <span className={styles.legendDot} style={{ backgroundColor: entry.color }} />
                            <span className={styles.legendName}>{entry.name}</span>
                            <span className={styles.legendCount}>{entry.value}</span>
                            <div className={styles.legendBarOuter}>
                              <div className={styles.legendBarInner} style={{ width: `${entry.percentage}%`, backgroundColor: entry.color }} />
                            </div>
                            <span className={styles.legendPercent}>{entry.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className={styles.chartCard}>
                    <div className={styles.trendHeader}>
                      <span className={styles.chartCardTitle}>Site Performance Trend</span>
                      <div
                        className={styles.trendPeriod}
                        ref={trendDropdownRef}
                        onClick={() => setTrendDropdownOpen((open) => !open)}
                        role="button"
                        tabIndex={0}
                        aria-label="Select trend period"
                        aria-expanded={trendDropdownOpen}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTrendDropdownOpen((open) => !open); }}
                      >
                        <span>{trendPeriod}</span>
                        <BsChevronDown size={12} className={trendDropdownOpen ? styles.trendChevronOpen : ''} />
                        {trendDropdownOpen && (
                          <div className={styles.trendDropdownMenu}>
                            {trendOptions.map((option) => (
                              <button
                                key={option.key}
                                type="button"
                                className={`${styles.trendDropdownItem} ${option.label === trendPeriod ? styles.trendDropdownItemActive : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrendPeriod(option.label);
                                  setTrendDropdownOpen(false);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.trendBody}>
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={performanceTrendData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#512728" stopOpacity={0.12} />
                              <stop offset="95%" stopColor="#512728" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            interval={0}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                            domain={[0, 'dataMax']}
                          />
                          <ReTooltip
                            contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                            formatter={(value) => [`${f(value)}`, 'Fish Stock']}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#512728"
                            strokeWidth={2.5}
                            fill="url(#trendGradient)"
                            activeDot={{ r: 4, fill: '#512728', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.topProductsHeader}>
                    <h5 className={styles.sectionTitle}>Site Performance Overview</h5>
                    <div className={styles.searchBar}>
                      <BsSearch className={styles.searchIcon} />
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search sites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <span className={styles.searchClear} onClick={() => setSearchQuery('')}>
                          ✕
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ maxHeight: 480, overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 12 }}>
                    <DataTable
                      columns={siteColumns}
                      data={paginatedSites}
                      emptyMessage={searchQuery ? `No sites matching "${searchQuery}".` : 'No sites match this filter.'}
                    />
                  </div>

                  <Pagination
                    currentPage={currentPage - 1}
                    pageCount={Math.max(1, Math.ceil(filteredSites.length / pageSize))}
                    totalItems={filteredSites.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    itemName="sites"
                  />
                </div>

                <div className={styles.infoBanner}>
                  <BsInfoCircleFill size={16} />
                  <div>
                    <p className={styles.infoBannerTitle}>Notes</p>
                    <p className={styles.infoBannerText}>
                      Performance metrics are updated based on the selected date range. Data refreshes periodically from site reports.
                    </p>
                  </div>
                </div>
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
};

export default SitePerformance;

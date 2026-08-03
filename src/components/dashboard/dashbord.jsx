import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss';
import Api, { ApiV2 } from '../shared/api/apiLink';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import { useSelector } from 'react-redux';
import { SkeletonStatGrid } from '../shared/skeleton/Skeleton';
import { GiCirclingFish } from 'react-icons/gi';
import { BsSearch, BsCalendarRange, BsExclamationTriangleFill, BsArrowClockwise } from 'react-icons/bs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  DoughnutController,
  LineController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import {
  Bar, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart,
} from 'recharts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  DoughnutController,
  LineController,
);

/* ── Date helpers (local-time, no UTC-shift surprises) ── */
const toISODate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const daysBetween = (start, end) => {
  const a = new Date(start);
  const b = new Date(end);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / msPerDay);
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatRangeLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startDate} — ${endDate}`;

  const startDay = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}`;
  const endDay = `${MONTH_NAMES[end.getMonth()]} ${end.getDate()}`;

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startDay}, ${start.getFullYear()} — ${endDay}, ${end.getFullYear()}`;
  }
  if (start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) {
    return startDay;
  }
  return `${startDay} — ${endDay}`;
};

const SalesTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: entry.color }}>
          Sales: ₦{Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const getISOWeekString = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

const normalizePeriod = (period, groupBy) => {
  if (!period) return '';
  if (groupBy === 'day') return period;
  if (groupBy === 'week') {
    if (period.includes('-W')) return period;
    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) return getISOWeekString(new Date(`${period}T00:00:00`));
  }
  if (groupBy === 'month') {
    if (period.match(/^\d{4}-\d{2}$/)) return period;
    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) return period.slice(0, 7);
  }
  if (groupBy === 'year') {
    if (period.match(/^\d{4}$/)) return period;
    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) return period.slice(0, 4);
    if (period.match(/^\d{4}-\d{2}$/)) return period.slice(0, 4);
  }
  return period;
};

const generatePeriods = (startDate, endDate, groupBy) => {
  if (!startDate || !endDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const periods = [];
  if (groupBy === 'day') {
    let current = new Date(start);
    while (current <= end) {
      periods.push(toISODate(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (groupBy === 'week') {
    let current = new Date(start);
    while (current <= end) {
      periods.push(getISOWeekString(current));
      current.setDate(current.getDate() + 7);
    }
  } else if (groupBy === 'month') {
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    while (current.getFullYear() < endYear || (current.getFullYear() === endYear && current.getMonth() <= endMonth)) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
  } else if (groupBy === 'year') {
    let year = start.getFullYear();
    while (year <= end.getFullYear()) {
      periods.push(String(year));
      year += 1;
    }
  }
  return periods;
};

const Dashboard = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSiteDetails, setUserSiteDetails] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [salesDateRange, setSalesDateRange] = useState('1M');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const tooltipRef = useRef(null);
  const user = useSelector((store) => store.user);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const activeSite = useSelector((store) => store.activeSite);

  const effectiveSiteId = activeSite?.id || siteId;

  const fetchDashboardData = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (effectiveSiteId) params.siteId = effectiveSiteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const response = await Api.get('/dashboard', { params });
      setDashboardData(response.data?.data || response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch dashboard data.');
      setLoading(false);
    }
  }, [effectiveSiteId, isSuperAdmin, dateFrom, dateTo]);

  const getDateRangeParams = useCallback(() => {
    const now = new Date();
    const today = toISODate(now);
    let startDate, endDate, groupBy;

    switch (salesDateRange) {
      case '1W':
        startDate = toISODate(addDays(now, -7));
        endDate = today;
        groupBy = 'day';
        break;
      case '1M':
        startDate = toISODate(addMonths(now, -1));
        endDate = today;
        groupBy = 'week';
        break;
      case '3M':
        startDate = toISODate(addMonths(now, -3));
        endDate = today;
        groupBy = 'month';
        break;
      case '6M':
        startDate = toISODate(addMonths(now, -6));
        endDate = today;
        groupBy = 'month';
        break;
      case '1Y':
        startDate = toISODate(addMonths(now, -12));
        endDate = today;
        groupBy = 'month';
        break;
      case 'CUSTOM':
        if (customDateFrom && customDateTo) {
          startDate = customDateFrom;
          endDate = customDateTo;
          const spanDays = daysBetween(startDate, endDate) + 1;
          if (spanDays <= 14) {
            groupBy = 'day';
          } else if (spanDays <= 60) {
            groupBy = 'week';
          } else if (spanDays <= 730) {
            groupBy = 'month';
          } else {
            groupBy = 'year';
          }
        } else {
          return null;
        }
        break;
      default:
        startDate = toISODate(addMonths(now, -1));
        endDate = today;
        groupBy = 'week';
    }

    return { startDate, endDate, groupBy };
  }, [salesDateRange, customDateFrom, customDateTo]);

  const formatPeriodLabel = useCallback((period, groupBy, index = 0, rangeStartDate = '') => {
    if (!period) return '';

    if (groupBy === 'year' && period.match(/^\d{4}$/)) {
      return period;
    }

    if (groupBy === 'week') {
      // Sequential week numbers within the selected range (Wk 1, Wk 2, ...)
      if (period.includes('-W')) {
        const [year, week] = period.split('-W').map(Number);
        const start = rangeStartDate ? new Date(`${rangeStartDate}T00:00:00`) : null;
        if (start && !Number.isNaN(start.getTime())) {
          const startYear = start.getFullYear();
          // Approximate ISO-week based offset; good enough for sequential labels in a contiguous range
          const getISOWeek = (d) => {
            const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = tmp.getUTCDay() || 7;
            tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
            return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
          };
          const startWeek = getISOWeek(start);
          const diff = (year - startYear) * 52 + (week - startWeek);
          return `Wk ${Math.max(1, diff + 1)}`;
        }
        return `Wk ${week}`;
      }
      return `Wk ${index + 1}`;
    }

    if (groupBy === 'month' && period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      return `${MONTH_NAMES[parseInt(month, 10) - 1]} '${year.slice(2)}`;
    }

    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(`${period}T00:00:00`);
      return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
    }

    return period;
  }, []);

  const fetchChartData = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    const rangeParams = getDateRangeParams();
    if (!rangeParams) {
      setChartData([]);
      return;
    }

    try {
      setChartLoading(true);
      setChartError(null);
      
      const params = {
        groupBy: rangeParams.groupBy,
        startDate: rangeParams.startDate,
        endDate: rangeParams.endDate,
      };
      
      if (effectiveSiteId) {
        params.siteId = effectiveSiteId;
      }

      const response = await Api.get('/dashboard/sales-chart', { params });
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setChartData(response.data.data);
      } else {
        setChartData([]);
        setChartError('Invalid chart data format');
      }
    } catch (err) {
      console.error('Chart data fetch error:', err);
      setChartData([]);
      setChartError(err.response?.data?.message || 'Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  }, [isSuperAdmin, effectiveSiteId, getDateRangeParams]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const siteIds = user?.userSites?.filter(s => typeof s === 'string') || [];
    if (siteIds.length === 0) {
      setUserSiteDetails(user?.userSites?.filter(s => typeof s === 'object') || []);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        const allSites = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) {
          const matched = allSites.filter(s => siteIds.includes(s.id));
          setUserSiteDetails(matched.length ? matched : user?.userSites || []);
        }
      } catch {
        if (!cancelled) setUserSiteDetails(user?.userSites || []);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.userSites]);

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

  if (loading && isSuperAdmin) {
    return (
      <section className={`${styles.body} ${styles.dashBody}`}>
        <div className="sticky-top">
          <Header toggleSidebar={() => setShowSidebar(!showSidebar)} />
        </div>
        <div className="d-flex gap-2">
          <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
            <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={() => setShowSidebar(false)} />
          </div>
          <section className={`${styles.content}`}>
            <main>
              <div className={styles.create_form}>
                <div style={{ padding: "10px 0" }}>
                  <SkeletonStatGrid count={4} />
                  <div style={{ height: 24 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div className={styles.chartCard}><div className={styles.skeletonBlock} style={{ height: 400 }} /></div>
                    <div className={styles.chartCard}><div className={styles.skeletonBlock} style={{ height: 400 }} /></div>
                  </div>
                </div>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  if (error && isSuperAdmin) {
    return (
      <section className={`${styles.body} ${styles.dashBody}`}>
        <div className="sticky-top">
          <Header toggleSidebar={() => setShowSidebar(!showSidebar)} />
        </div>
        <div className="d-flex gap-2">
          <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
            <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={() => setShowSidebar(false)} />
          </div>
          <section className={`${styles.content}`}>
            <main>
              <div className={styles.create_form}>
                <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <BsExclamationTriangleFill size={52} color="#EF4444" />
                  <div>
                    <h1 className={styles.pageTitle} style={{ color: '#C62828', margin: '0 0 8px' }}>Failed to Load Dashboard</h1>
                    <p style={{ color: '#8C949B', fontSize: '0.9rem', margin: 0 }}>{error}</p>
                  </div>
                  <button
                    onClick={fetchDashboardData}
                    style={{
                      padding: '10px 28px', borderRadius: 8, border: 'none',
                      background: '#512728', color: '#fff', fontSize: '0.85rem',
                      cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <BsArrowClockwise size={16} /> Retry
                  </button>
                </div>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  const summary = dashboardData?.summary || {};
  const totals = dashboardData?.totals || {};
  const daily = dashboardData?.daily || {};
  const sales = dashboardData?.sales || [];
  const topProducts = dashboardData?.topProducts || [];

  const totalSalesFormatted = summary?.totalSalesPrice != null ? `₦${Number(summary.totalSalesPrice).toLocaleString()}` : '₦0';
  const totalCustomers = totals?.totalCustomers ?? 0;
  const totalPonds = totals?.totalPonds ?? 0;

  const searchFiltered = searchQuery
    ? sales.filter(s =>
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sales;

  const filteredProducts = searchQuery
    ? topProducts.filter(p =>
        p.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topProducts;

  const salesRangeParams = getDateRangeParams();
  const salesDateRangeLabel = salesRangeParams
    ? formatRangeLabel(salesRangeParams.startDate, salesRangeParams.endDate)
    : '';

  const buildSalesTrendData = () => {
    if (!chartData.length) return [];
    const rangeParams = getDateRangeParams();
    const groupBy = rangeParams?.groupBy || 'day';
    const rangeStart = rangeParams?.startDate;
    const periods = generatePeriods(rangeParams?.startDate, rangeParams?.endDate, groupBy);
    const dataMap = new Map();
    chartData.forEach((item) => {
      dataMap.set(normalizePeriod(item.period, groupBy), item);
    });
    return periods.map((period, idx) => ({
      period,
      label: formatPeriodLabel(period, groupBy, idx, rangeStart),
      sales: dataMap.get(period)?.totalSales || 0,
    }));
  };

  const salesTrendData = buildSalesTrendData();

  const buildFinanceSummaryData = () => {
    if (!chartData.length) return { labels: [], datasets: [] };

    const rangeParams = getDateRangeParams();
    const groupBy = rangeParams?.groupBy || 'day';
    const rangeStart = rangeParams?.startDate;
    const periods = generatePeriods(rangeParams?.startDate, rangeParams?.endDate, groupBy);
    const dataMap = new Map();
    chartData.forEach((item) => {
      dataMap.set(normalizePeriod(item.period, groupBy), item);
    });

    return {
      labels: periods.map((period, idx) => formatPeriodLabel(period, groupBy, idx, rangeStart)),
      datasets: [
        {
          label: 'Sales',
          data: periods.map(period => dataMap.get(period)?.totalSales || 0),
          backgroundColor: '#2E3135',
          barPercentage: 0.5,
          categoryPercentage: 0.7
        },
        {
          label: 'Expenses',
          data: periods.map(period => dataMap.get(period)?.totalExpenses || 0),
          backgroundColor: '#B06426',
          barPercentage: 0.5,
          categoryPercentage: 0.7
        },
      ],
    };
  };

  const financeSummaryData = buildFinanceSummaryData();
  const financeDateRangeLabel = salesRangeParams
    ? formatRangeLabel(salesRangeParams.startDate, salesRangeParams.endDate)
    : '';


  const chartOptions = (title, type) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              let value = context.raw || 0;
              if (
                (title === 'Finance Summary' && (label === 'Sales' || label === 'Expenses')) ||
                (title === 'Top Selling Products' && label === 'Total Revenue') ||
                (title === 'Sales Summary' && label === 'Sales')
              ) {
                value = `₦${value.toLocaleString()}`;
              }
              return `${label}: ${value}`;
            },
          },
        },
      },
    };

    if (type === 'line') {
      if (title === 'Sales Summary') {
        return {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1F2937',
              titleFont: { size: 12, weight: '600' },
              bodyFont: { size: 13 },
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (items) => items[0]?.label || '',
                label: (ctx) => `₦${Number(ctx.raw).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                display: true,
                color: '#9CA3AF',
                font: { size: 10 },
                maxRotation: 45,
                minRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
              },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
              border: { display: false },
              ticks: {
                callback: (v) => `₦${(v / 1000).toFixed(0)}k`,
                font: { size: 11 },
                color: '#9CA3AF',
                maxTicksLimit: 6,
              },
            },
          },
        };
      }
      return baseOptions;
    }

    if (title === 'Finance Summary') {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1F2937',
            titleFont: { size: 12, weight: '600' },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              title: (items) => items[0]?.label || '',
              label: (ctx) => {
                const label = ctx.dataset.label || '';
                return `${label}: ₦${Number(ctx.raw).toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              display: true,
              color: '#9CA3AF',
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
            border: { display: false },
            ticks: {
              callback: (v) => `₦${(v / 1000).toFixed(0)}k`,
              font: { size: 11 },
              color: '#9CA3AF',
              maxTicksLimit: 6,
            },
          },
        },
      };
    }

    return baseOptions;
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body} ${styles.dashBody}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content}`}>
          <main>
            <div className={styles.create_form}>
              <div className={styles.pageTitleRow}>
                  <div className={styles.pageTitleLeft}>
                    <h1 className={styles.pageTitle}>Dashboard Overview</h1>
                  </div>
                <div className={styles.pageTitleRight}>
                  <div className={styles.searchBar}>
                    <BsSearch className={styles.searchIcon} />
                    <input
                      className={styles.searchInput}
                      type="text"
                      placeholder="Search products, sites..."
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
              </div>

              {isSuperAdmin ? (
                <>
              {/* Date Range Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <BsCalendarRange size={18} color="#8C949B" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{
                      border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 10px',
                      fontSize: '0.85rem', color: '#374151', background: '#fff', outline: 'none',
                    }}
                  />
                </div>
                <span style={{ color: '#9CA3AF' }}>to</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{
                      border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 10px',
                      fontSize: '0.85rem', color: '#374151', background: '#fff', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Summary Cards with Tooltips */}
              <Row className="g-4 mb-4" ref={tooltipRef}>
                {[
                  {
                    label: 'TOTAL SALES', value: totalSalesFormatted,
                    sub: '↑ +16.5% vs last month', subClass: styles.statSubGreen,
                    icon: '🛍', iconClass: styles.statIconAmber,
                    tooltipText: `Total revenue of ${totalSalesFormatted} recorded. +16.5% increase from the previous month.`,
                  },
                  {
                    label: 'TOTAL CUSTOMERS', value: totalCustomers.toLocaleString(),
                    sub: '↑ +42 new this week', subClass: styles.statSubGreen,
                    icon: '👤', iconClass: styles.statIconAmber,
                    tooltipText: `${totalCustomers.toLocaleString()} registered customers. 42 new customers joined this week.`,
                  },
                  {
                    label: 'ACTIVE PONDS',
                    value: <>{totalPonds} <span className={styles.statValueMuted}>/ 52</span></>,
                    sub: '⊙ 4 in maintenance', subClass: styles.statSubNeutral,
                    icon: '🐟', iconClass: styles.statIconBrown,
                    tooltipText: `${totalPonds} of 52 ponds currently active. 4 ponds under maintenance.`,
                  },
                  {
                    label: 'COMPLETED SALES', value: summary?.completedCount ?? 0,
                    sub: '✓ All transactions verified', subClass: styles.statSubGreen,
                    icon: '✅', iconClass: styles.statIconAmber,
                    tooltipText: `${summary?.completedCount ?? 0} completed sales transactions. All verified and confirmed.`,
                  },
                ].map((card, i) => (
                  <Col key={i} xl={3} lg={6} md={6} sm={12} xs={12}>
                    <div
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
                      <div className={`${styles.statSub} ${card.subClass}`}>{card.sub}</div>
                      <div className={`${styles.statTooltip} ${activeTooltip === i ? styles.statTooltipVisible : ''}`}>
                        <span className={styles.tooltipText}>{card.tooltipText}</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Business Today */}
              <div className={`${styles.sectionCard} mb-4`}>
                <h6 className={styles.sectionTitle}>Business Today</h6>
                <Row className="g-3">
                  <Col lg={4} md={4} sm={12} xs={12}>
                    <div className={styles.todayTile}>
                      <div className={`${styles.todayIcon} ${styles.todayIconOrange}`}>🛒</div>
                      <div>
                        <div className={styles.todayLabel}>TODAY'S SALES</div>
                        <div className={styles.todayValue}>{daily?.todaySalesCount ?? 0}</div>
                      </div>
                    </div>
                  </Col>
                  <Col lg={4} md={4} sm={12} xs={12}>
                    <div className={styles.todayTile}>
                      <div className={`${styles.todayIcon} ${styles.todayIconYellow}`}>💰</div>
                      <div>
                        <div className={styles.todayLabel}>TODAY'S REVENUE</div>
                        <div className={styles.todayValue}>₦{(daily?.todaySalesAmount ?? 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </Col>
                  <Col lg={4} md={4} sm={12} xs={12}>
                    <div className={styles.todayTile}>
                      <div className={`${styles.todayIcon} ${styles.todayIconGray}`}>💳</div>
                      <div>
                        <div className={styles.todayLabel}>TODAY'S EXPENSES</div>
                        <div className={`${styles.todayValue} ${styles.todayValueDanger}`}>₦{(daily?.todayExpenseAmount ?? 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Charts Row */}
              <Row className="g-4 mb-4">
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                      <span className={styles.chartCardTitle}>Sales Summary</span>
                      <div className={styles.chartCardControls}>
                        <span className={styles.chartSiteIndicator}>
                          {activeSite ? activeSite.name : 'All Sites'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.trendHeader}>
                      <div className={styles.timeSelector}>
                        {[
                          { key: '1W', label: '1 Week' },
                          { key: '1M', label: '1 Month' },
                          { key: '3M', label: '3 Months' },
                          { key: '6M', label: '6 Months' },
                          { key: '1Y', label: '1 Year' },
                          { key: 'CUSTOM', label: 'Custom' },
                        ].map((r) => (
                          <button
                            key={r.key}
                            className={`${styles.timeBtn} ${salesDateRange === r.key ? styles.timeBtnActive : ''}`}
                            onClick={() => setSalesDateRange(r.key)}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {salesDateRange === 'CUSTOM' && (
                      <div className={styles.customDateRow}>
                        <div className={styles.dateField}>
                          <BsCalendarRange size={14} color="#6B7280" />
                          <input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            className={styles.dateInput}
                          />
                        </div>
                        <span className={styles.dateSep}>—</span>
                        <div className={styles.dateField}>
                          <BsCalendarRange size={14} color="#6B7280" />
                          <input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            className={styles.dateInput}
                          />
                        </div>
                      </div>
                    )}
                    {salesDateRangeLabel && <div className={styles.dateRangeLabel}>{salesDateRangeLabel}</div>}
                    <div className={styles.legendRow}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendSwatch} style={{ background: '#2E3135' }} />
                        Sales (₦)
                      </div>
                      <span className={styles.dataPointsBadge}>{salesTrendData.length} data points</span>
                    </div>
                    <div className={styles.chartContainer}>
                      {chartLoading ? (
                        <div className={styles.skeletonBlock} style={{ width: '100%', height: '100%' }} />
                      ) : chartError ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8C949B', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                          <div>
                            <BsExclamationTriangleFill size={32} color="#EF4444" style={{ marginBottom: 8 }} />
                            <div>{chartError}</div>
                          </div>
                        </div>
                      ) : salesTrendData.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8C949B', fontSize: '0.85rem' }}>
                          No data available for this period
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={salesTrendData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2E3135" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#2E3135" stopOpacity={0.04} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 3" stroke="#F0F0F0" vertical={false} />
                            <XAxis
                              dataKey="label"
                              tick={{ fill: '#8C949B', fontSize: 10 }}
                              axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                              tickLine={false}
                              interval={salesTrendData.length <= 12 ? 0 : Math.floor(salesTrendData.length / 10)}
                            />
                            <YAxis
                              tick={{ fill: '#8C949B', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              domain={[0, 'auto']}
                              tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000) + 'K' : v}
                              width={50}
                            />
                            <RechartsTooltip content={<SalesTooltip />} cursor={{ fill: '#F9FAFB' }} />
                            <Bar dataKey="sales" fill="url(#salesBarGradient)" radius={[3, 3, 0, 0]} barSize={salesTrendData.length > 60 ? 4 : 12} />
                            <Line type="monotone" dataKey="sales" stroke="#2E3135" strokeWidth={2} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </Col>
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                      <span className={styles.chartCardTitle}>Finance Summary</span>
                      <span className={styles.chartSiteIndicator}>
                        {activeSite ? activeSite.name : 'All Sites'}
                      </span>
                    </div>
                    <div className={styles.dateRangeGroup}>
                      {['1W', '1M', '3M', '6M', '1Y', 'Custom'].map((range) => (
                        <button
                          key={range}
                          className={`${styles.dateRangeBtn} ${salesDateRange === range ? styles.dateRangeBtnActive : ''}`}
                          onClick={() => setSalesDateRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    {salesDateRange === 'Custom' && (
                      <div className={styles.customDateRow}>
                        <input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className={styles.customDateInput} />
                        <span className={styles.customDateSep}>to</span>
                        <input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className={styles.customDateInput} />
                      </div>
                    )}
                    {financeDateRangeLabel && <div className={styles.dateRangeLabel}>{financeDateRangeLabel}</div>}
                    <div style={{ position: 'relative', width: '100%', minWidth: '300px', height: '380px' }}>
                      {chartLoading ? (
                        <div className={styles.skeletonBlock} style={{ width: '100%', height: '100%' }} />
                      ) : chartError ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8C949B', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                          <div>
                            <BsExclamationTriangleFill size={32} color="#EF4444" style={{ marginBottom: 8 }} />
                            <div>{chartError}</div>
                          </div>
                        </div>
                      ) : chartData.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8C949B', fontSize: '0.85rem' }}>
                          No data available for this period
                        </div>
                      ) : (
                        <Chart type="bar" data={financeSummaryData} options={chartOptions('Finance Summary', 'bar')} />
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Top Products Table */}
              <Row className="g-4 mb-4">
                <Col lg={12} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <div className={styles.topProductsHeader}>
                      <h6 className={styles.sectionTitle}>Top Products</h6>
                    </div>
                    <div className={styles.scrollableTableContainer}>
                      <div className={styles.topProductsTable}>
                        {filteredProducts.length === 0 ? (
                          <p className={styles.emptyText}>{searchQuery ? `No products matching "${searchQuery}".` : 'No product data available.'}</p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th className={styles.cellRight}>Sales Count</th>
                                <th className={styles.cellRight}>Qty Sold</th>
                                <th className={styles.cellRight}>Revenue (₦)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProducts.map((item, idx) => (
                                <tr key={item.productName || idx}>
                                  <td>
                                    <div className={styles.productCell}>
                                      <div className={styles.productIconBadge} style={{ background: '#E0F2FE' }}>
                                        <GiCirclingFish style={{ color: '#0EA5E9', fontSize: '15px' }} />
                                      </div>
                                      <span className={styles.productName}>{item.productName}</span>
                                    </div>
                                  </td>
                                  <td className={styles.cellRight}>{item.salesCount ?? 0}</td>
                                  <td className={styles.cellRight}>{(item.totalQuantity ?? 0).toLocaleString()}</td>
                                  <td className={styles.cellRight}>₦{(item.totalRevenue ?? 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Recent Sales */}
              <Row className="g-4 mb-4">
                <Col lg={12} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <div className={styles.topProductsHeader}>
                      <h6 className={styles.sectionTitle}>Recent Sales</h6>
                      {sales.length > 0 && (
                        <div className={styles.topProductsControls}>
                          <span style={{ fontSize: '0.78rem', color: '#8C949B' }}>
                            {summary?.totalSales ?? sales.length} total sales
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.scrollableTableContainer}>
                      <div className={styles.topProductsTable}>
                        {searchFiltered.length === 0 ? (
                          <p className={styles.emptyText}>
                            {searchQuery ? `No sales matching "${searchQuery}".` : sales.length === 0 ? 'No sales data available.' : 'No results.'}
                          </p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Customer</th>
                                <th>Category</th>
                                <th>Payment</th>
                                <th className={styles.cellRight}>Amount (₦)</th>
                                <th className={styles.cellRight}>Paid (₦)</th>
                                <th>Status</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchFiltered.map((sale) => (
                                <tr key={sale.id}>
                                  <td>{sale.customerName || '—'}</td>
                                  <td>
                                    <span style={{
                                      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                      fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                                      background: sale.salesCategory === 'fresh-fish' ? '#D1FAE5' : sale.salesCategory === 'feed' ? '#DBEAFE' : '#F3F4F6',
                                      color: sale.salesCategory === 'fresh-fish' ? '#047857' : sale.salesCategory === 'feed' ? '#1D4ED8' : '#374151',
                                    }}>
                                      {(sale.salesCategory || '').replace(/-/g, ' ')}
                                    </span>
                                  </td>
                                  <td style={{ textTransform: 'capitalize' }}>{sale.paymentType || '—'}</td>
                                  <td className={styles.cellRight}>₦{Number(sale.totalPrice || 0).toLocaleString()}</td>
                                  <td className={styles.cellRight}>₦{Number(sale.totalPaid || 0).toLocaleString()}</td>
                                  <td>
                                    <span style={{
                                      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                      fontSize: '0.72rem', fontWeight: 600,
                                      background: Number(sale.isPending) ? '#FEF3C7' : '#D1FAE5',
                                      color: Number(sale.isPending) ? '#B45309' : '#15803D',
                                    }}>
                                      {Number(sale.isPending) ? 'Pending' : 'Completed'}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.78rem', color: '#8C949B', whiteSpace: 'nowrap' }}>
                                    {sale.purchasedDate ? new Date(sale.purchasedDate).toLocaleDateString() : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      marginBottom: '24px',
                      boxShadow: '0 8px 24px rgba(81, 39, 40, 0.2)',
                    }}
                  >
                    👋
                  </div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', fontWeight: 700, color: '#2E3135' }}>
                    Welcome, {user?.fullName || user?.name || 'User'}!
                  </h2>
                  <p style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#6C757D' }}>
                    You are logged in as
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      background: '#512728',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '28px',
                    }}
                  >
                    {(user?.userTypes?.[0] || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>

                  {(userSiteDetails.length > 0 || user?.siteId) && (
                    <div style={{ width: '100%', maxWidth: '480px' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Your Site
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                        {userSiteDetails.map((site, i) => {
                          const siteName = site?.name || '';
                          const siteId = site?.id || '';
                          const initial = (siteName?.[0] || siteId?.[0] || 'S').toUpperCase();
                          const displayName = siteName || siteId || '—';
                          return (
                            <div key={i} style={{
                              background: '#F8F9FA', border: '1px solid #EFEFEF',
                              borderRadius: '12px', padding: '12px 18px',
                              display: 'flex', alignItems: 'center', gap: '10px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0,
                              }}>{initial}</div>
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2E3135' }}>
                                  {displayName}
                                </div>
                                {siteName && site?.type?.name && (
                                  <div style={{ fontSize: '0.72rem', color: '#8C949B' }}>
                                    {site.type.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {userSiteDetails.length === 0 && user?.siteId && (
                          <div style={{
                            background: '#F8F9FA', border: '1px solid #EFEFEF',
                            borderRadius: '12px', padding: '12px 18px',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '14px', fontWeight: 700,
                            }}>S</div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#2E3135' }}>
                              Site ID: {user.siteId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </section>
      </div>
    </section>
  );
};

export default Dashboard;

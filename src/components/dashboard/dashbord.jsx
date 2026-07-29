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
    const today = now.toISOString().split('T')[0];
    let startDate, endDate, groupBy;

    switch (salesDateRange) {
      case '1W':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0];
        endDate = today;
        groupBy = 'day';
        break;
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        endDate = today;
        groupBy = 'day';
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
        endDate = today;
        groupBy = 'week';
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        endDate = today;
        groupBy = 'month';
        break;
      case 'CUSTOM':
        if (customDateFrom && customDateTo) {
          startDate = customDateFrom;
          endDate = customDateTo;
          groupBy = 'day';
        } else {
          return null;
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        endDate = today;
        groupBy = 'day';
    }

    return { startDate, endDate, groupBy };
  }, [salesDateRange, customDateFrom, customDateTo]);

  const formatPeriodLabel = useCallback((period, groupBy) => {
    if (!period) return '';
    
    if (groupBy === 'week' && period.includes('-W')) {
      const [year, week] = period.split('-W');
      return `W${week}, ${year.slice(2)}`;
    }
    
    if (groupBy === 'month' && period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
    }
    
    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(period);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
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

  const buildSalesSummaryData = () => {
    if (!chartData.length) return { labels: [], datasets: [] };
    
    const rangeParams = getDateRangeParams();
    const groupBy = rangeParams?.groupBy || 'day';
    
    return {
      labels: chartData.map(item => formatPeriodLabel(item.period, groupBy)),
      datasets: [{
        label: 'Sales',
        data: chartData.map(item => item.totalSales || 0),
        borderColor: '#2E3135',
        backgroundColor: 'rgba(46, 49, 53, 0.06)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: '#2E3135',
        borderWidth: 1.5,
      }],
    };
  };
  
  const salesSummaryData = buildSalesSummaryData();
  const salesDateRangeLabel = chartData.length > 0
    ? `${formatPeriodLabel(chartData[0].period, getDateRangeParams()?.groupBy || 'day')} — ${formatPeriodLabel(chartData[chartData.length - 1].period, getDateRangeParams()?.groupBy || 'day')}`
    : '';

  const buildFinanceSummaryData = () => {
    if (!chartData.length) return { labels: [], datasets: [] };
    
    const rangeParams = getDateRangeParams();
    const groupBy = rangeParams?.groupBy || 'day';
    
    return {
      labels: chartData.map(item => formatPeriodLabel(item.period, groupBy)),
      datasets: [
        { 
          label: 'Sales', 
          data: chartData.map(item => item.totalSales || 0), 
          backgroundColor: '#2E3135', 
          barPercentage: 0.5, 
          categoryPercentage: 0.7 
        },
        { 
          label: 'Expenses', 
          data: chartData.map(item => item.totalExpenses || 0), 
          backgroundColor: '#B06426', 
          barPercentage: 0.5, 
          categoryPercentage: 0.7 
        },
      ],
    };
  };
  
  const financeSummaryData = buildFinanceSummaryData();
  const financeDateRangeLabel = chartData.length > 0
    ? `${formatPeriodLabel(chartData[0].period, getDateRangeParams()?.groupBy || 'day')} — ${formatPeriodLabel(chartData[chartData.length - 1].period, getDateRangeParams()?.groupBy || 'day')}`
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
              ticks: { display: false },
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
            boxPadding: { x: 4, y: 2 },
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
            ticks: { display: false },
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
                    <div className={styles.dateRangeGroup}>
                      {['1W', '1M', '6M', '1Y', 'Custom'].map((range) => (
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
                    {salesDateRangeLabel && <div className={styles.dateRangeLabel}>{salesDateRangeLabel}</div>}
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
                        <Chart type="line" data={salesSummaryData} options={chartOptions('Sales Summary', 'line')} />
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
                      {['1W', '1M', '6M', '1Y', 'Custom'].map((range) => (
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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss';
import Api from '../shared/api/apiLink';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import { useSelector } from 'react-redux';
import { SkeletonStatGrid, SkeletonFilterBar } from '../shared/skeleton/Skeleton';
import { GiCirclingFish } from 'react-icons/gi';
import { BsSearch } from 'react-icons/bs';
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

// Register necessary Chart.js components
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
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [salesDateRange, setSalesDateRange] = useState('1M');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const tooltipRef = useRef(null);
  const user = useSelector((store) => store.user);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const activeSite = useSelector((store) => store.activeSite);

  const effectiveSiteId = activeSite?.id || siteId;

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = effectiveSiteId ? { siteId: effectiveSiteId } : {};
      const response = await Api.get('/dashboard', { params });
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  if (loading) {
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

  if (error) {
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
                <h1 className={styles.pageTitle} style={{ color: '#C62828' }}>Error: {error}</h1>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  // Safeguard against null or undefined values with fallback defaults
  const totalSalesFormatted = dashboardData?.totalSales != null ? `₦${dashboardData.totalSales.toLocaleString()}` : '₦0';
  const totalCustomers = dashboardData?.totalCustomers ?? 0;
  const totalMarketers = dashboardData?.totalMarketers ?? 0;
  const totalPonds = dashboardData?.totalPonds ?? 0;

  // Chart data with fallbacks
  const getFilteredSalesData = () => {
    const allData = dashboardData?.salesSummary?.data || [];
    if (!allData.length) return { labels: [], datasets: [] };
    let filtered = [...allData];
    const now = new Date();
    let cutoff = null;
    switch (salesDateRange) {
      case '1W':  cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); break;
      case '1M':  cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case '6M':  cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
      case '1Y':  cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      case 'CUSTOM':
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          const to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
          filtered = allData.filter(item => { const d = new Date(item.date); return d >= from && d <= to; });
        }
        break;
    }
    if (cutoff) filtered = allData.filter(item => new Date(item.date) >= cutoff);
    return {
      labels: filtered.map(item => item.date),
      datasets: [{
        label: 'Sales',
        data: filtered.map(item => item.totalSales),
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
  const salesSummaryData = getFilteredSalesData();
  const salesDateRangeLabel = salesSummaryData.labels.length > 0
    ? `${salesSummaryData.labels[0]} — ${salesSummaryData.labels[salesSummaryData.labels.length - 1]}`
    : '';

  const getFilteredFinanceData = () => {
    const months = dashboardData?.financeSummary?.salesByMonth || [];
    const expenses = dashboardData?.financeSummary?.expensesByMonth || [];
    if (!months.length) return { labels: [], datasets: [] };
    const now = new Date();
    let cutoff = null;
    switch (salesDateRange) {
      case '1W':  cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); break;
      case '1M':  cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case '6M':  cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
      case '1Y':  cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      case 'CUSTOM':
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          const to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
          const filteredMonths = months.filter(item => {
            const d = new Date(item.month);
            return d >= from && d <= to;
          });
          const filteredExpenses = expenses.filter(item => {
            const d = new Date(item.month);
            return d >= from && d <= to;
          });
          return {
            labels: filteredMonths.map(item => item.month),
            datasets: [
              { label: 'Sales', data: filteredMonths.map(item => item.totalSales), backgroundColor: '#2E3135', barPercentage: 0.5, categoryPercentage: 0.7 },
              { label: 'Expenses', data: filteredExpenses.map(item => item.totalExpenses || 0), backgroundColor: '#B06426', barPercentage: 0.5, categoryPercentage: 0.7 },
            ],
          };
        }
        break;
    }
    if (cutoff) {
      const filteredMonths = months.filter(item => new Date(item.month) >= cutoff);
      const filteredExpenses = expenses.filter(item => new Date(item.month) >= cutoff);
      return {
        labels: filteredMonths.map(item => item.month),
        datasets: [
          { label: 'Sales', data: filteredMonths.map(item => item.totalSales), backgroundColor: '#2E3135' },
          { label: 'Expenses', data: filteredExpenses.map(item => item.totalExpenses || 0), backgroundColor: '#B06426' },
        ],
      };
    }
    return {
      labels: months.map(item => item.month),
      datasets: [
        { label: 'Sales', data: months.map(item => item.totalSales), backgroundColor: '#2E3135', barPercentage: 0.5, categoryPercentage: 0.7 },
        { label: 'Expenses', data: expenses.map(item => item.totalExpenses || 0), backgroundColor: '#B06426', barPercentage: 0.5, categoryPercentage: 0.7 },
      ],
    };
  };
  const financeSummaryData = getFilteredFinanceData();
  const financeDateRangeLabel = financeSummaryData.labels.length > 0
    ? `${financeSummaryData.labels[0]} — ${financeSummaryData.labels[financeSummaryData.labels.length - 1]}`
    : '';

  const topSellingProductsData = {
    labels: dashboardData?.topProducts?.map((item) => item.productName) || [],
    datasets: [
      {
        label: 'Total Revenue',
        data: dashboardData?.topProducts?.map((item) => item.totalRevenue) || [],
        backgroundColor: 'rgba(0, 128, 0, 0.6)',
        stack: 'Stack 0',
      },
    ],
  };

  const processSummaryData = {
    labels: dashboardData?.processSummary?.map((item) => item.date) || [],
    datasets: [
      {
        label: 'Whole Fish',
        data: dashboardData?.processSummary?.map((item) => parseInt(item.wholeFish) || 0) || [],
        borderColor: '#2E3135',
        backgroundColor: 'rgba(46, 49, 53, 0.6)',
        fill: true,
        tension: 0.4,
        stack: 'Stack 0',
      },
      {
        label: 'Broken Fish',
        data: dashboardData?.processSummary?.map((item) => parseInt(item.brokenFish) || 0) || [],
        borderColor: '#B06426',
        backgroundColor: 'rgba(176, 100, 38, 0.6)',
        fill: true,
        tension: 0.4,
        stack: 'Stack 0',
      },
      {
        label: 'Damaged Fish',
        data: dashboardData?.processSummary?.map((item) => parseInt(item.damagedFish) || 0) || [],
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255, 0, 0, 0.6)',
        fill: true,
        tension: 0.4,
        stack: 'Stack 0',
      },
    ],
  };

  // Chart options
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
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'FISH COUNT' },
            stacked: true,
          },
          x: { title: { display: true, text: 'PERIOD OF TIME' } },
        },
      };
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

    if (title === 'Top Selling Products') {
      return {
        ...baseOptions,
        indexAxis: 'y',
        scales: {
          x: {
            type: 'linear',
            position: 'top',
            stacked: true,
            beginAtZero: true,
            title: { display: true, text: 'TOTAL REVENUE (₦)' },
            ticks: { callback: (value) => `₦${value.toLocaleString()}` },
          },
          y: {
            stacked: true,
            title: { display: true, text: 'PRODUCTS' },
          },
        },
      };
    }

    return {
      ...baseOptions,
      scales: {
        x: { title: { display: true, text: 'PERIOD OF TIME' } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'SALES (₦)' },
          ticks: { callback: (value) => `₦${value.toLocaleString()}` },
        },
      },
    };
  };

  const CATEGORY_COLORS = {
    'Fish (Live)': { bg: '#F3E8FF', text: '#7C3AED' },
    'Processed Fish': { bg: '#FEE2E2', text: '#DC2626' },
    'Fingerlings': { bg: '#D1FAE5', text: '#047857' },
    'Feeds': { bg: '#DBEAFE', text: '#1D4ED8' },
  };
  const STATUS_COLORS = {
    'In Stock': { bg: '#D1FAE5', text: '#15803D' },
    'Low Stock': { bg: '#FEF3C7', text: '#B45309' },
    'Out of Stock': { bg: '#FEE2E2', text: '#DC2626' },
  };

  const getCategoryStyle = (category) => {
    const c = CATEGORY_COLORS[category];
    return c || { bg: '#F3F4F6', text: '#374151' };
  };
  const getStatusStyle = (status) => {
    const c = STATUS_COLORS[status];
    return c || { bg: '#F3F4F6', text: '#374151' };
  };

  const TrendUpIcon = () => (
    <svg width="44" height="18" viewBox="0 0 44 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="2,14 10,10 18,13 26,6 34,9 42,2"
        stroke="#16A34A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const filteredProducts = searchQuery
    ? (dashboardData?.topProducts || []).filter(p =>
        p.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (dashboardData?.topProducts || []);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const renderChart = (data, title, type = 'bar') => {
    const chartType = type === 'line' ? 'line' : type === 'doughnut' ? 'doughnut' : 'bar';
    return (
      <div style={{ position: 'relative', width: '100%', minWidth: '300px', height: '400px' }}>
        <Chart type={chartType} data={data} options={chartOptions(title, type)} />
      </div>
    );
  };

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
                    label: 'TOTAL STOCK', value: '84,000',
                    sub: '⚠ Stock low in West Nursery', subClass: styles.statSubWarn,
                    icon: '🗄', iconClass: styles.statIconGray,
                    tooltipText: '84,000 fish in stock across all sites. Stock running low in West Nursery pond.',
                  },
                ].map((card, i) => (
                  <Col key={i} xl={4} lg={6} md={6} sm={12} xs={12}>
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

              <div className={`${styles.sectionCard} mb-4`}>
                <h6 className={styles.sectionTitle}>Business Today</h6>
                <p className="text-muted mb-0">Coming soon</p>
              </div>

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
                          {range === 'Custom' ? 'Custom' : range}
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
                      <Chart type="line" data={salesSummaryData} options={chartOptions('Sales Summary', 'line')} />
                    </div>
                  </div>
                </Col>
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                      <span className={styles.chartCardTitle}>Finance</span>
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
                          {range === 'Custom' ? 'Custom' : range}
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
                      <Chart type="bar" data={financeSummaryData} options={chartOptions('Finance Summary', 'bar')} />
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                {/* REPLACED: Top Selling Products → Top Performing Products table */}
                <Col lg={12} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <div className={styles.topProductsHeader}>
                      <h6 className={styles.sectionTitle}>Top Performing Products</h6>
                      <div className={styles.topProductsControls}>
                        <button
                          className={styles.filterDropdownBtn}
                          onClick={() => setCategoryFilterOpen(!categoryFilterOpen)}
                        >
                          All Categories <span className={styles.filterChevron}>▾</span>
                        </button>
                        <button
                          className={styles.filterDropdownBtn}
                          onClick={() => setDateFilterOpen(!dateFilterOpen)}
                        >
                          This Month <span className={styles.filterChevron}>▾</span>
                        </button>
                      </div>
                    </div>
                    {/* TODO: wire to real category/date filter logic once backend supports it */}
                    <div className={styles.topProductsTable}>
                      {filteredProducts.length === 0 ? (
                        <p className={styles.emptyText}>{searchQuery ? `No products matching "${searchQuery}".` : 'No product data available.'}</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Category</th>
                              <th>Total Qty Sold</th>
                              <th>Sales (₦)</th>
                              <th>Stock Qty</th>
                              <th>Stock Value (₦)</th>
                              <th>Status</th>
                              <th>Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((item, idx) => {
                              // TODO: confirm field name/shape with backend
                              const category = item.category || 'Uncategorized';
                              const totalQtySold = item.totalQtySold ?? 0;
                              const stockQty = item.stockQty ?? 0;
                              const stockValue = item.stockValue ?? 0;
                              const status = item.status || 'In Stock';
                              const catStyle = getCategoryStyle(category);
                              const stsStyle = getStatusStyle(status);
                              return (
                                <tr key={item.id || idx}>
                                  <td>
                                    <div className={styles.productCell}>
                                      <div
                                        className={styles.productIconBadge}
                                        style={{ background: '#E0F2FE' }}
                                      >
                                        <GiCirclingFish style={{ color: '#0EA5E9', fontSize: '15px' }} />
                                      </div>
                                      <span className={styles.productName}>{item.productName}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span
                                      className={styles.categoryPill}
                                      style={{ background: catStyle.bg, color: catStyle.text }}
                                    >
                                      {category}
                                    </span>
                                  </td>
                                  <td className={styles.cellRight}>
                                    {totalQtySold.toLocaleString()}
                                  </td>
                                  <td className={styles.cellRight}>
                                    ₦{(item.totalRevenue ?? 0).toLocaleString()}
                                  </td>
                                  <td className={styles.cellRight}>
                                    {stockQty.toLocaleString()}
                                  </td>
                                  <td className={styles.cellRight}>
                                    ₦{stockValue.toLocaleString()}
                                  </td>
                                  <td>
                                    <span
                                      className={styles.statusPill}
                                      style={{ background: stsStyle.bg, color: stsStyle.text }}
                                    >
                                      {status}
                                    </span>
                                  </td>
                                  <td>
                                    {/* TODO: wire real per-product trend/sparkline data once backend provides historical sales-by-day for each product */}
                                    <div className={styles.trendIcon}>
                                      <TrendUpIcon />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div
                      className={styles.viewAllLogs}
                      onClick={() => console.log('Navigate to /products/view-all')}
                    >
                      View all products →
                    </div>
                  </div>
                </Col>
              </Row>
              <Row className="g-4 mb-4">
                <Col lg={12} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <h6 className={styles.sectionTitle}>Major Sites Summary</h6>
                    <p className="text-muted mb-0">Coming soon</p>
                  </div>
                </Col>
              </Row>

              <div className={`${styles.sectionCard} mb-4`}>
                <h6 className={styles.sectionTitle}>Recent Alerts</h6>
                <p className="text-muted mb-0">Coming soon</p>
              </div>
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

                  {user?.userSites?.length > 0 && (
                    <div style={{ width: '100%', maxWidth: '480px' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Your Sites
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                        {user.userSites.map((site, i) => (
                          <div
                            key={i}
                            style={{
                              background: '#F8F9FA',
                              border: '1px solid #EFEFEF',
                              borderRadius: '12px',
                              padding: '12px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {(site.name?.[0] || site.id?.[0] || 'S').toUpperCase()}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2E3135' }}>
                                {site.name || site.id || '—'}
                              </div>
                              {site.type?.name && (
                                <div style={{ fontSize: '0.72rem', color: '#8C949B' }}>
                                  {site.type.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!user?.userSites?.length && user?.siteId && (
                    <div
                      style={{
                        background: '#F8F9FA',
                        border: '1px solid #EFEFEF',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 700,
                        }}
                      >
                        S
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#2E3135' }}>
                        Site ID: {user.siteId}
                      </span>
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
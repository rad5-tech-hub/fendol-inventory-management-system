import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss';
import Api from '../shared/api/apiLink';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import { useSelector } from 'react-redux';
import { SkeletonStatGrid, SkeletonFilterBar } from '../shared/skeleton/Skeleton';
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
  const [salesDateRange, setSalesDateRange] = useState('1M');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
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
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                      className={styles.searchInput}
                      type="text"
                      placeholder="Search ponds, inventory..."
                      readOnly
                    />
                  </div>
                </div>
              </div>

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
                <Row className="g-3">
                  <Col lg={4} md={4} sm={12} xs={12}>
                    <div className={styles.todayTile}>
                      <div className={`${styles.todayIcon} ${styles.todayIconOrange}`}>🛒</div>
                      <div>
                        <div className={styles.todayLabel}>TODAY'S SALES</div>
                        <div className={styles.todayValue}>₦ 450,000</div>
                      </div>
                    </div>
                  </Col>
                  <Col lg={4} md={4} sm={12} xs={12}>
                    <div className={styles.todayTile}>
                      <div className={`${styles.todayIcon} ${styles.todayIconYellow}`}>📦</div>
                      <div>
                        <div className={styles.todayLabel}>TODAY'S ORDERS</div>
                        <div className={styles.todayValue}>12</div>
                      </div>
                    </div>
                  </Col>
                  <Col lg={4} md={4} sm={12} xs={12}>
                    <div className={styles.todayTile}>
                      <div className={`${styles.todayIcon} ${styles.todayIconGray}`}>📋</div>
                      <div>
                        <div className={styles.todayLabel}>TODAY'S EXPENSES</div>
                        <div className={`${styles.todayValue} ${styles.todayValueDanger}`}>₦ 120,000</div>
                      </div>
                    </div>
                  </Col>
                </Row>
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
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <h6 className={styles.sectionTitle}>Top Selling Products</h6>
                    <div className={styles.productList}>
                      {(dashboardData?.topProducts || []).length === 0 && (
                        <p className={styles.emptyText}>No product data available.</p>
                      )}
                      {(dashboardData?.topProducts || []).map((item, idx) => (
                        <div key={idx} className={styles.productListRow}>
                          <span className={styles.productListName}>{item.productName}</span>
                          <span className={styles.productListRevenue}>
                            ₦ {item.totalRevenue?.toLocaleString?.() ?? item.totalRevenue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <h6 className={styles.sectionTitle}>Major Sites Summary</h6>
                    <Row className="g-3">
                      <Col md={6} sm={12} xs={12}>
                        <div className={styles.siteSummaryCard}>
                          <div className={styles.siteSummaryHeader}>
                            <span className={styles.siteSummaryIcon}>📍</span>
                            <span className={styles.siteSummaryName}>Main Hatchery</span>
                            <span className={`${styles.siteBadge} ${styles.siteBadgeActive}`}>Active</span>
                          </div>
                          <div className={styles.siteSummaryStats}>
                            <div>
                              <div className={styles.siteSummaryStatLabel}>Active Ponds</div>
                              <div className={styles.siteSummaryStatValue}>24</div>
                            </div>
                            <div>
                              <div className={styles.siteSummaryStatLabel}>Est. Stock</div>
                              <div className={styles.siteSummaryStatValue}>45k</div>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} sm={12} xs={12}>
                        <div className={styles.siteSummaryCard}>
                          <div className={styles.siteSummaryHeader}>
                            <span className={styles.siteSummaryIcon}>📍</span>
                            <span className={styles.siteSummaryName}>West Nursery</span>
                            <span className={`${styles.siteBadge} ${styles.siteBadgeReview}`}>Needs Review</span>
                          </div>
                          <div className={styles.siteSummaryStats}>
                            <div>
                              <div className={styles.siteSummaryStatLabel}>Active Ponds</div>
                              <div className={styles.siteSummaryStatValue}>18</div>
                            </div>
                            <div>
                              <div className={styles.siteSummaryStatLabel}>Est. Stock</div>
                              <div className={`${styles.siteSummaryStatValue} ${styles.statValueDanger}`}>12k</div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              <div className={`${styles.sectionCard} mb-4`}>
                <div className={styles.alertsHeader}>
                  <h6 className={styles.sectionTitle}>Recent Alerts</h6>
                  <div className={styles.alertsHelpIcon}>?</div>
                </div>
                <div className={styles.alertsList}>
                  <div className={styles.alertRow}>
                    <div className={`${styles.alertDot} ${styles.alertDotRed}`}>⚠</div>
                    <div className={styles.alertContent}>
                      <div className={styles.alertText}>Feed level critically low in Pond 4 (West Nursery).</div>
                      <div className={styles.alertTime}>10 mins ago</div>
                    </div>
                  </div>
                  <div className={styles.alertRow}>
                    <div className={`${styles.alertDot} ${styles.alertDotGreen}`}>ℹ</div>
                    <div className={styles.alertContent}>
                      <div className={styles.alertText}>New site admin John Doe assigned to Main Hatchery.</div>
                      <div className={styles.alertTime}>3 hours ago</div>
                    </div>
                  </div>
                  <div className={styles.alertRow}>
                    <div className={`${styles.alertDot} ${styles.alertDotGray}`}>✓</div>
                    <div className={styles.alertContent}>
                      <div className={styles.alertText}>Weekly water quality assessment completed.</div>
                      <div className={styles.alertTime}>5 hours ago</div>
                    </div>
                  </div>
                </div>
                <div className={styles.viewAllLogs}>View All Logs</div>
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
};

export default Dashboard;
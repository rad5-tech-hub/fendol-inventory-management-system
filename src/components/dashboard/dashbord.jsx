import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss';
import Api from '../shared/api/apiLink';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import { useSelector } from 'react-redux';
import SiteSelector from '../shared/site-selector/SiteSelector';
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
                <h1 className={styles.pageTitle}>Loading...</h1>
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
  const salesSummaryData = {
    labels: dashboardData?.salesSummary?.data?.map((item) => item.date) || [],
    datasets: [
      {
        label: 'Sales',
        data: dashboardData?.salesSummary?.data?.map((item) => item.totalSales) || [],
        borderColor: '#2E3135',
        backgroundColor: 'rgba(46, 49, 53, 0.2)',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const financeSummaryData = {
    labels: dashboardData?.financeSummary?.salesByMonth?.map((item) => item.month) || [],
    datasets: [
      {
        label: 'Sales',
        data: dashboardData?.financeSummary?.salesByMonth?.map((item) => item.totalSales) || [],
        backgroundColor: '#2E3135',
      },
      {
        label: 'Expenses',
        data: dashboardData?.financeSummary?.expensesByMonth?.map((item) => item.totalExpenses || 0) || [],
        backgroundColor: '#B06426',
      },
    ],
  };

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
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'SALES (₦)' },
              ticks: { callback: (value) => `₦${value.toLocaleString()}` },
            },
            x: { title: { display: true, text: 'PERIOD OF TIME' } },
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
                    <SiteSelector value={siteId} onChange={(id) => setSiteId(id)} />
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

              <Row className="g-4 mb-4">
                <Col xl={4} lg={6} md={6} sm={12} xs={12}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <span className={styles.statLabel}>TOTAL SALES</span>
                      <div className={`${styles.statIcon} ${styles.statIconAmber}`}>🛍</div>
                    </div>
                    <div className={styles.statValue}>{totalSalesFormatted}</div>
                    <div className={`${styles.statSub} ${styles.statSubGreen}`}>
                      ↑ +16.5% vs last month
                    </div>
                  </div>
                </Col>
                <Col xl={4} lg={6} md={6} sm={12} xs={12}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <span className={styles.statLabel}>TOTAL CUSTOMERS</span>
                      <div className={`${styles.statIcon} ${styles.statIconAmber}`}>👤</div>
                    </div>
                    <div className={styles.statValue}>{totalCustomers.toLocaleString()}</div>
                    <div className={`${styles.statSub} ${styles.statSubGreen}`}>
                      ↑ +42 new this week
                    </div>
                  </div>
                </Col>
                <Col xl={4} lg={6} md={6} sm={12} xs={12}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <span className={styles.statLabel}>ACTIVE PONDS</span>
                      <div className={`${styles.statIcon} ${styles.statIconBrown}`}>🐟</div>
                    </div>
                    <div className={styles.statValue}>
                      {totalPonds} <span className={styles.statValueMuted}>/ 52</span>
                    </div>
                    <div className={`${styles.statSub} ${styles.statSubNeutral}`}>
                      ⊙ 4 in maintenance
                    </div>
                  </div>
                </Col>
                <Col xl={4} lg={6} md={6} sm={12} xs={12}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardTop}>
                      <span className={styles.statLabel}>TOTAL STOCK</span>
                      <div className={`${styles.statIcon} ${styles.statIconGray}`}>🗄</div>
                    </div>
                    <div className={styles.statValue}>84,000</div>
                    <div className={`${styles.statSub} ${styles.statSubWarn}`}>
                      ⚠ Stock low in West Nursery
                    </div>
                  </div>
                </Col>
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
                        <span className={styles.viewDetails}>View Details &rsaquo;</span>
                      </div>
                    </div>
                    {renderChart(salesSummaryData, 'Sales Summary', 'line')}
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
                    {renderChart(financeSummaryData, 'Finance Summary', 'bar')}
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
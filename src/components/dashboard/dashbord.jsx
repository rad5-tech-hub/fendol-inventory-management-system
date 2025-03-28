import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import styles from './dashboard.module.scss';
import Api from '../shared/api/apiLink';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await Api.get('/dashboard');
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <section className={`${styles.body}`}>
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
                <h4 className="fw-semibold my-5">Loading...</h4>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${styles.body}`}>
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
                <h4 className="fw-semibold my-5 text-danger">Error: {error}</h4>
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

  // Ensure chart data exists with fallbacks
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

  // Chart options (unchanged for brevity, but ensure they handle empty data gracefully)
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
            min: 0,
            max: 15000,
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
    return <Chart type={chartType} data={data} options={chartOptions(title, type)} />;
  };

  return (
    <section className={`${styles.body}`}>
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
              <h4 className="fw-semibold my-4">Dashboard Overview</h4>
              <Row className="g-4 mb-4">
                <Col lg={3} md={6} sm={12} xs={12}>
                  <Card className={`shadow rounded-0 border-0 ${styles.board} ${styles.salesCard}`}>
                    <Card.Body>
                      <Card.Title className="fw-semibold mb-3 fs-6">Total Sales</Card.Title>
                      <Card.Text className="fs-4 fw-bold text-white">{totalSalesFormatted}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} sm={12} xs={12}>
                  <Card className={`shadow rounded-0 border-0 ${styles.board}`}>
                    <Card.Body>
                      <Card.Title className="fw-semibold mb-3 fs-6">Total Customers</Card.Title>
                      <Card.Text className="fs-4 fw-bold">{totalCustomers}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} sm={12} xs={12}>
                  <Card className={`shadow rounded-0 border-0 ${styles.board}`}>
                    <Card.Body>
                      <Card.Title className="fw-semibold mb-3 fs-6">Total Marketers</Card.Title>
                      <Card.Text className="fs-4 fw-bold">{totalMarketers}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} sm={12} xs={12}>
                  <Card className={`shadow rounded-0 border-0 ${styles.board}`}>
                    <Card.Body>
                      <Card.Title className="fw-semibold mb-3 fs-6">Total Ponds</Card.Title>
                      <Card.Text className="fs-4 fw-bold">{totalPonds}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="g-4 mb-4">
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={`shadow rounded ${styles.chartDash}`}>
                    {renderChart(salesSummaryData, 'Sales Summary', 'line')}
                  </div>
                </Col>
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={`shadow rounded ${styles.chartDash}`}>
                    {renderChart(financeSummaryData, 'Finance Summary', 'bar')}
                  </div>
                </Col>
              </Row>
              <Row className="g-4">
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={`shadow rounded ${styles.chartDash}`}>
                    {renderChart(topSellingProductsData, 'Top Selling Products', 'bar')}
                  </div>
                </Col>
                <Col lg={6} md={12} sm={12} xs={12}>
                  <div className={`shadow rounded ${styles.chartDash}`}>
                    {renderChart(processSummaryData, 'Process Summary', 'line')}
                  </div>
                </Col>
              </Row>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
};

export default Dashboard;
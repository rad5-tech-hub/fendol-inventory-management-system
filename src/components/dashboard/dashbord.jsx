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
  // State declarations
  const [showSidebar, setShowSidebar] = useState(false);
  const [dashboardData, setDashboardData] = useState(null); // State for fetched data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch data from /dashboard endpoint on component mount
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

  // Handle loading state
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

  // Handle error state
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

  // Format card data with Naira symbol where applicable
  const totalSalesFormatted = `₦${dashboardData.totalSales.toLocaleString()}`;
  const totalCustomers = dashboardData.totalCustomers;
  const totalMarketers = dashboardData.totalMarketers;
  const totalPonds = dashboardData.totalPonds;

  // Prepare chart data with Naira symbol for monetary values
  const salesSummaryData = {
    labels: dashboardData.salesSummary.data.map((item) => item.date),
    datasets: [
      {
        label: 'Sales',
        data: dashboardData.salesSummary.data.map((item) => item.totalSales),
        borderColor: '#2E3135', // Dark gray
        backgroundColor: 'rgba(46, 49, 53, 0.2)', // Dark gray with opacity
        tension: 0.4,
        fill: false, // Line chart, no fill
      },
    ],
  };

  const financeSummaryData = {
    labels: dashboardData.financeSummary.salesByMonth.map((item) => item.month),
    datasets: [
      {
        label: 'Sales',
        data: dashboardData.financeSummary.salesByMonth.map((item) => item.totalSales),
        backgroundColor: '#2E3135', // Dark gray
      },
      {
        label: 'Expenses',
        data: dashboardData.financeSummary.expensesByMonth.map((item) => item.totalExpenses || 0), // Use totalExpenses
        backgroundColor: '#B06426', // Brown
      },
    ],
  };

  const topSellingProductsData = {
    labels: dashboardData.topProducts.map((item) => item.salesCategory),
    datasets: [
      // {
      //   label: 'Unit Sold',
      //   data: Array(dashboardData.topProducts.length).fill(1), // Placeholder, as unit sold data is not provided
      //   backgroundColor: '#B06426', // Brown
      //   stack: 'Stack 0',
      //   barPercentage: 0.5,
      //   categoryPercentage: 0.8,
      // },
      {
        label: 'Total Revenue',
        data: dashboardData.topProducts.map((item) => item.totalRevenue),
        backgroundColor: 'rgba(0, 128, 0, 0.6)', // Green
        stack: 'Stack 0',
      },
    ],
  };

  const processSummaryData = {
    labels: dashboardData.processSummary.map((item) => item.date),
    datasets: [
      {
        label: 'Whole Fish',
        data: dashboardData.processSummary.map((item) => parseInt(item.wholeFish)),
        borderColor: '#2E3135', // Dark gray
        backgroundColor: 'rgba(46, 49, 53, 0.6)', // Dark gray with opacity
        fill: true,
        tension: 0.4,
        stack: 'Stack 0', // Stack the area charts
      },
      {
        label: 'Broken Fish',
        data: dashboardData.processSummary.map((item) => parseInt(item.brokenFish)),
        borderColor: '#B06426', // Brown
        backgroundColor: 'rgba(176, 100, 38, 0.6)', // Brown with opacity
        fill: true,
        tension: 0.4,
        stack: 'Stack 0',
      },
      {
        label: 'Damaged Fish',
        data: dashboardData.processSummary.map((item) => parseInt(item.damagedFish)),
        borderColor: '#FF0000', // Red
        backgroundColor: 'rgba(255, 0, 0, 0.6)', // Red with opacity
        fill: true,
        tension: 0.4,
        stack: 'Stack 0',
      },
    ],
  };

  // Chart options with Naira symbol in labels and tooltips
  const chartOptions = (title, type) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              let value = context.raw;
              // Add Naira symbol to monetary values
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
              title: {
                display: true,
                text: 'SALES (₦)',
              },
              ticks: {
                callback: (value) => `₦${value.toLocaleString()}`, // Add Naira symbol to y-axis ticks
              },
            },
            x: {
              title: {
                display: true,
                text: 'PERIOD OF TIME',
              },
            },
          },
        };
      }
      // Process Summary as a stacked area chart
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'FISH COUNT',
            },
            stacked: true, // Stack the y-axis
          },
          x: {
            title: {
              display: true,
              text: 'PERIOD OF TIME',
            },
          },
        },
      };
    }

    if (title === 'Top Selling Products') {
      return {
        ...baseOptions,
        indexAxis: 'y', // Horizontal bars
        scales: {
          x: [
            // {
            //   type: 'linear',
            //   position: 'bottom',
            //   stacked: true,
            //   beginAtZero: true,
            //   title: {
            //     display: true,
            //     text: 'UNIT SOLD',
            //   },
            //   min: 0,
            //   max: 10, // Adjust based on your data range
            // },
            {
              type: 'linear',
              position: 'top',
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'TOTAL REVENUE (₦)',
              },
              min: 0,
              max: 15000, // Adjust based on your data range
              ticks: {
                callback: (value) => `₦${value.toLocaleString()}`, // Add Naira symbol to top x-axis ticks
              },
            },
          ],
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'PRODUCTS',
            },
          },
        },
      };
    }

    // Finance Summary as clustered bars (not stacked)
    return {
      ...baseOptions,
      scales: {
        x: {
          title: {
            display: true,
            text: 'PERIOD OF TIME',
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'SALES (₦)',
          },
          ticks: {
            callback: (value) => `₦${value.toLocaleString()}`, // Add Naira symbol to y-axis ticks
          },
        },
      },
    };
  };

  // Sidebar toggle functions
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  // Render chart function
  const renderChart = (data, title, type = 'bar') => {
    const chartType = type === 'line' ? 'line' : type === 'doughnut' ? 'doughnut' : 'bar';
    return <Chart type={chartType} data={data} options={chartOptions(title, type)} />;
  };

  // Main dashboard render
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
              {/* Dashboard Cards */}
              <Row className="g-4 mb-4">
                <Col lg={3} md={6} sm={12} xs={12}>
                  <Card className={`shadow rounded-0 border-0 ${styles.board} ${styles.salesCard}`}>
                    <Card.Body>
                      <Card.Title className="fw-semibold mb-3  fs-6">Total Sales</Card.Title>
                      <Card.Text className="fs-4 fw-bold text-white">{totalSalesFormatted}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} sm={12} xs={12}>
                  <Card className={`shadow rounded-0  border-0 ${styles.board}`}>
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
              {/* Charts Section */}
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
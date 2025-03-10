import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss'; // Adjust the import as needed
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
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register necessary components
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
  Filler
);

export default function Dashboard() {
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const [dataLine] = useState(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return months.map((month) => ({
      label: month,
      profit: Math.floor(Math.random() * 101), // Random profit from 0 to 100
      loss: Math.floor(Math.random() * 101),   // Random loss from 0 to 100
    }));
  });

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

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
              <h4 className="fw-semibold my-5">Dashboard</h4>
              <Row xs={1} md={1} lg={2} className="g-4">
                <Col>
                  <div className={`shadow rounded ${styles.board} p-3`}>
                    <Bar
                      data={{
                        labels: ['Feeds', 'Stocks', 'Ponds'],
                        datasets: [
                          {
                            label: 'Analysis',
                            data: [300, 400, 500],
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                          },
                          {
                            label: 'Loss',
                            data: [30, 40, 50],
                            backgroundColor: 'rgba(176, 100, 39, 0.6)',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Data Analysis',
                          },
                        },
                      }}
                    />
                  </div>
                </Col>
                <Col>
                  <div className={`shadow rounded d-flex justify-content-center ${styles.board} p-3`}>
                    <Doughnut
                      data={{
                        labels: ['Feeds', 'Stocks', 'Ponds'],
                        datasets: [
                          {
                            data: [300, 400, 500],
                            backgroundColor: [
                              'rgba(75, 192, 192, 0.6)',
                              'rgba(176, 100, 39, 0.4)',
                              'rgba(255, 205, 86, 0.6)',
                            ],
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Data Analysis',
                          },
                        },
                      }}
                    />
                  </div>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col xs={12}>
                  <div className="shadow p-4 rounded">
                    <Line
                      data={{
                        labels: dataLine.map((item) => item.label),
                        datasets: [
                          {
                            label: 'Profit',
                            data: dataLine.map((item) => item.profit),
                            borderColor: 'rgba(75, 192, 192, 0.6)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                            tension: 0.4,
                          },
                          {
                            label: 'Loss',
                            data: dataLine.map((item) => item.loss),
                            borderColor: 'rgba(255, 99, 132, 0.6)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Monthly Profit and Loss Analysis',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100, // Maximum value set to 100
                            ticks: {
                              stepSize: 20, // Optional: control step size for readability
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}
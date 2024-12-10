import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss'; // Adjust the import as needed
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement, // Add this for Line chart
    LineElement,  // Add this for Line chart
    BarElement,
    ArcElement, // Add this for Doughnut chart
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2'; // Ensure imports are at the top
import { Value } from 'sass'; // Ensure this is moved to the top

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
    Legend
);

export default function Dashboard() {
    const [dataLine, setDataLine] = useState(() => {
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
    
        return months.map((month) => {
          const profit = Math.floor(Math.random() * 101); // Random percentage for profit
          const loss = 100 - profit; // Remaining percentage for loss
    
          return {
            label: month,
            profit: `${profit}%`,
            loss: `${loss}%`,
          };
        });
    });
    
  return (
    <section className={styles.body}>
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar}`}>
          <SideBar className={styles.sidebarItem} />
        </div>
        <section className={`${styles.content}`}>
          <main>
            <div className={styles.create_form}>
              <h4 className='fw-semibold my-5'>Dashboard</h4>
              <Row lg={2} sm={1} md={2} xs={1}>
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
              <div className="shadow mt-4 p-4">
                    <Line
                        data={{
                        labels: dataLine.map((item) => item.label), // Months as labels
                        datasets: [
                            {
                            label: 'Profit (%)',
                            data: dataLine.map((item) => parseInt(item.profit)), // Profit values
                            borderColor: 'rgba(75, 192, 192, 0.6)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                            tension: 0.4, // Smoothing effect for line
                            },
                            {
                            label: 'Loss (%)',
                            data: dataLine.map((item) => parseInt(item.loss)), // Loss values
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
                            max: 100, // Maximum percentage
                            },
                        },
                        }}
                    />
               </div>

            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { GiCirclingFish, GiEggClutch } from 'react-icons/gi';
import { FaChartLine, FaSkull, FaExchangeAlt, FaHeartbeat } from 'react-icons/fa';
import { IoArrowBackOutline, IoPrintOutline } from 'react-icons/io5';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const infoCards = [
  { label: 'Eggs Produced', value: f(120000), sub: '1.20 kg', icon: GiEggClutch, color: '#8B5CF6' },
  { label: 'Hatchability Rate', value: '75.4%', sub: '90,480 hatched', icon: FaChartLine, color: '#22C55E' },
  { label: 'Fry Produced', value: f(87360), sub: 'Estimated', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Survival Rate', value: '89.2%', sub: 'After 7 Days', icon: FaHeartbeat, color: '#14B8A6' },
  { label: 'Total Mortality', value: f(10720), sub: '11.8%', icon: FaSkull, color: '#EF4444' },
  { label: 'Transferred to Nursery', value: f(66500), sub: 'Last: May 24, 2025', icon: FaExchangeAlt, color: '#3B82F6' },
];

const timelineSteps = [
  { title: 'Date Injected', date: 'May 25, 2025 08:30 AM', detail: 'Eggs fertilized and placed in incubator', color: '#3B82F6', icon: '•' },
  { title: 'Date Stripped', date: 'May 26, 2025 09:15 AM', detail: 'Eggs stripped from females', color: '#F97316', icon: '•' },
  { title: 'Date Hatched', date: 'May 28, 2025 07:40 AM', detail: 'Larvae hatched successfully', color: '#22C55E', icon: '•' },
  { title: 'Fry Counted', date: 'May 28, 2025 02:30 PM', detail: 'Fry counted and recorded', color: '#14B8A6', icon: '•' },
  { title: 'Transferred to Nursery', date: 'May 24, 2025 10:20 AM', detail: 'Fry transferred to Nursery Pond N-01', color: '#8B5CF6', icon: '•' },
];

const femaleData = [
  { id: 'F-001', weight: 3.20, role: 'Primary' },
  { id: 'F-002', weight: 3.10, role: 'Primary' },
  { id: 'F-003', weight: 3.00, role: 'Secondary' },
];

const maleData = [
  { id: 'M-001', weight: 2.70, role: 'Primary' },
  { id: 'M-002', weight: 2.60, role: 'Primary' },
  { id: 'M-003', weight: 2.50, role: 'Secondary' },
];

const costData = [
  { name: 'Feed', value: 62500, color: '#3B82F6' },
  { name: 'Labour', value: 48000, color: '#F97316' },
  { name: 'Energy', value: 32000, color: '#22C55E' },
  { name: 'Medicine', value: 18000, color: '#8B5CF6' },
  { name: 'Others', value: 24950, color: '#94A3B8' },
];

const totalCost = costData.reduce((sum, d) => sum + d.value, 0);
const costPerFry = (185450 / 87360).toFixed(2);

const transferRows = [
  { date: 'May 24, 2025', dest: 'Nursery Pond N-01', qty: 66500, size: '0.45 g', by: 'John Doe' },
  { date: 'May 15, 2025', dest: 'Nursery Pond N-02', qty: 5000, size: '0.40 g', by: 'Peter James' },
  { date: 'May 08, 2025', dest: 'Nursery Pond N-01', qty: 3000, size: '0.35 g', by: 'Esther Sunday' },
];

const totalTransferred = transferRows.reduce((s, r) => s + r.qty, 0);

const StatusBadge = ({ status }) => {
  const bg = '#E8F5E9';
  const color = '#2E7D32';
  return <span className={styles.statusBadge} style={{ background: bg, color }}>{status}</span>;
};

export default function HatchBatchSummary() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExtraMales, setShowExtraMales] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const formatCurrency = (v) => '₦' + f(v);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.summaryPage}>
            <div className={styles.breadcrumb}>
              <span>Hatchery</span>
              <span className={styles.separator}>&gt;</span>
              <span>Hatch Batches</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>HB-2025-006</span>
            </div>

            <div className={styles.summaryHeader}>
              <div className={styles.summaryTitle}>
                <h3>Hatch Batch Summary</h3>
                <StatusBadge status="Completed" />
              </div>
              <div className={styles.summaryActions}>
                <button className={styles.outlineBtn} onClick={() => {}}>Edit Batch</button>
                <button className={styles.outlineBtn} onClick={() => {}}>Transfer to Nursery</button>
                <button className={styles.primaryBtn} onClick={() => {}}>
                  <IoPrintOutline size={16} /> Print Summary
                </button>
              </div>
            </div>

            <div className={styles.infoStrip}>
              {infoCards.map((card, i) => (
                <div key={i} className={styles.infoCard}>
                  <div className={styles.infoIcon} style={{ background: card.color + '1A' }}>
                    <card.icon size={18} color={card.color} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>{card.label}</div>
                    <div className={styles.infoValue}>{card.value}</div>
                    {card.sub && <span className={styles.infoSub}>{card.sub}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryTwoCol}>
              {/* LEFT COLUMN */}
              <div>
                {/* Batch Information */}
                <div className={styles.colCard}>
                  <h5>Batch Information</h5>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Hatch Batch Number</span>
                    <span className={styles.detailValue}>HB-2025-006</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Site</span>
                    <span className={styles.detailValue}>Main Hatchery</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Tank / Incubator</span>
                    <span className={styles.detailValue}>Incubator Tank - 03</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Injected</span>
                    <span className={styles.detailValue}>May 25, 2025</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Stripped</span>
                    <span className={styles.detailValue}>May 26, 2025</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Hatched</span>
                    <span className={styles.detailValue}>May 28, 2025</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Batch Status</span>
                    <StatusBadge status="Completed" />
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Created By</span>
                    <span className={styles.detailValue}>John Doe</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Created</span>
                    <span className={styles.detailValue}>May 25, 2025 08:45 AM</span>
                  </div>
                </div>

                {/* Hatch Timeline */}
                <div className={styles.colCard}>
                  <h5>Hatch Timeline</h5>
                  <div className={styles.timeline}>
                    {timelineSteps.map((step, i) => (
                      <div key={i} className={styles.timelineItem}>
                        <div className={styles.timelineDot} style={{ background: step.color + '20', color: step.color }}>
                          <span style={{ fontSize: '0.8rem' }}>{step.icon}</span>
                        </div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTitle}>{step.title}</div>
                          <div className={styles.timelineDate}>{step.date}</div>
                          <div className={styles.timelineDetail}>{step.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Production Details */}
                <div className={styles.colCard}>
                  <h5>Production Details</h5>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Weight of Eggs (kg)</span>
                    <span className={styles.detailValue}>1.20</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Number of Eggs</span>
                    <span className={styles.detailValue}>{f(120000)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Hatchability Percentage (%)</span>
                    <span className={`${styles.detailValue} ${styles.successValue}`}>75.4%</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fry Produced (Estimated)</span>
                    <span className={styles.detailValue}>{f(87360)}</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Initial Fry Count</span>
                    <span className={styles.detailValue}>{f(87360)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Final Fry Count (7 Days)</span>
                    <span className={styles.detailValue}>{f(77920)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Mortality</span>
                    <span className={`${styles.detailValue} ${styles.dangerValue}`}>{f(10720)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Survival Rate (%)</span>
                    <span className={`${styles.detailValue} ${styles.successValue}`}>89.2%</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className={styles.summaryRight}>
                {/* Broodstock Used */}
                <div className={styles.colCard}>
                  <h5>Broodstock Used</h5>
                  <div className={styles.broodstockGrid}>
                    {/* Female */}
                    <div>
                      <div className={styles.broodstockSubtitle}>Female Broodstock (3)</div>
                      <table className={styles.broodstockMiniTable}>
                        <thead>
                          <tr>
                            <th>ID/Tag</th>
                            <th>Avg Wt (kg)</th>
                            <th>Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {femaleData.map((f, i) => (
                            <tr key={i}>
                              <td>{f.id}</td>
                              <td>{f.weight.toFixed(2)}</td>
                              <td>{f.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className={styles.broodstockTotal}>
                        <span className={styles.totalItem}>Total Females: <strong>3</strong></span>
                        <span className={styles.totalItem}>Avg Weight: <strong>3.10 kg</strong></span>
                      </div>
                    </div>
                    {/* Male */}
                    <div>
                      <div className={styles.broodstockSubtitle}>Male Broodstock (6)</div>
                      <table className={styles.broodstockMiniTable}>
                        <thead>
                          <tr>
                            <th>ID/Tag</th>
                            <th>Avg Wt (kg)</th>
                            <th>Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {maleData.map((m, i) => (
                            <tr key={i}>
                              <td>{m.id}</td>
                              <td>{m.weight.toFixed(2)}</td>
                              <td>{m.role}</td>
                            </tr>
                          ))}
                          {showExtraMales && (
                            <>
                              <tr><td>M-004</td><td>2.40</td><td>Secondary</td></tr>
                              <tr><td>M-005</td><td>2.55</td><td>Primary</td></tr>
                              <tr><td>M-006</td><td>2.45</td><td>Secondary</td></tr>
                            </>
                          )}
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', cursor: 'pointer', color: '#512728', fontWeight: 600, padding: '8px 6px' }}
                              onClick={() => setShowExtraMales(!showExtraMales)}>
                              {showExtraMales ? '▲ Show less' : '▾ 3 more males'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className={styles.broodstockTotal}>
                        <span className={styles.totalItem}>Total Males: <strong>6</strong></span>
                        <span className={styles.totalItem}>Avg Weight: <strong>2.63 kg</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className={styles.colCard}>
                  <h5>Cost Summary</h5>
                  <div className={styles.costCenter}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={costData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                          {costData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: -120, textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '0.68rem', color: '#8C949B', fontWeight: 600 }}>Total Cost</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2E3135' }}>{formatCurrency(totalCost)}</div>
                    </div>
                  </div>
                  <div className={styles.costLegend}>
                    {costData.map((item, i) => (
                      <div key={i} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: item.color }} />
                        <span>{item.name}</span>
                        <span className={styles.legendValue}>{((item.value / totalCost) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.costPerFry}>
                    Cost Per Fry (Estimated): <strong>{formatCurrency(Number(costPerFry))}</strong>
                  </div>
                </div>

                {/* Transfer Summary */}
                <div className={styles.colCard}>
                  <h5>Transfer Summary</h5>
                  <div className={styles.tableWrapper}>
                    <table className={styles.broodstockMiniTable}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Destination</th>
                          <th>Qty</th>
                          <th>Avg Size</th>
                          <th>Transferred By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferRows.map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: '0.8rem', color: '#8C949B' }}>{r.date}</td>
                            <td>{r.dest}</td>
                            <td>{f(r.qty)}</td>
                            <td>{r.size}</td>
                            <td>{r.by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.transferTotal}>Total Transferred: {f(totalTransferred)}</div>
                </div>

                {/* Audit Information */}
                <div className={styles.colCard}>
                  <h5>Audit Information</h5>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Created By</span>
                    <span className={styles.detailValue}>John Doe</span>
                  </div>
                  <div className={styles.detailRow} style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, marginTop: 4 }}>
                    <span className={styles.detailLabel}>Date Created</span>
                    <span className={styles.detailValue}>May 25, 2025 08:45 AM</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Updated By</span>
                    <span className={styles.detailValue}>John Doe</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Updated</span>
                    <span className={styles.detailValue}>May 28, 2025 02:35 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks / Notes */}
            <div className={styles.notesCard}>
              <h5>Remarks / Notes</h5>
              <p>Water temperature maintained between 27°C – 29°C throughout incubation. Good water quality and aeration resulted in high hatchability.</p>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

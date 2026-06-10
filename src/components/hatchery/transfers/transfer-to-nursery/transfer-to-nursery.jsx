import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaExchangeAlt, FaArrowLeft, FaClock, FaCheckCircle } from 'react-icons/fa';
import { BsFileText, BsInfoCircle } from 'react-icons/bs';
import { GiCirclingFish } from 'react-icons/gi';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const recentTransfers = [
  { date: 'May 24, 2025', pond: 'N-01', quantity: 66500, avgSize: '0.45 g', recordedBy: 'John Doe' },
  { date: 'May 15, 2025', pond: 'N-02', quantity: 5000, avgSize: '0.40 g', recordedBy: 'Peter James' },
  { date: 'May 08, 2025', pond: 'N-01', quantity: 3000, avgSize: '0.35 g', recordedBy: 'Esther Sunday' },
  { date: 'Apr 30, 2025', pond: 'N-03', quantity: 2000, avgSize: '0.32 g', recordedBy: 'John Doe' },
];

export default function TransferToNursery() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

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
          <main className={styles.page}>
            <div className={styles.breadcrumb}>
              <span>Hatchery</span>
              <span className={styles.separator}>&gt;</span>
              <span>Transfers</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Transfer to Nursery</span>
            </div>

            <div className={styles.pageHeader}>
              <h4>Transfer to Nursery</h4>
              <div className={styles.headerActions}>
                <button className={styles.outlineBtn} onClick={() => navigate('/hatchery/transfers/transfer-history')}>
                  <FaArrowLeft size={14} /> Back to Transfers
                </button>
              </div>
            </div>

            <div className={styles.transferTwoCol}>
              {/* LEFT - Transfer Information */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <BsFileText size={20} color="#F97316" />
                  <h5>Transfer Information</h5>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Hatch Batch <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Select defaultValue="HB-2025-006">
                      <option>HB-2025-006</option>
                    </Form.Select>
                    <small style={{ color: '#8C949B', fontSize: '0.75rem' }}>Hatch Date: May 28, 2025</small>
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Source Hatchery Tank / Unit <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Select defaultValue="Incubator Tank - 03">
                      <option>Incubator Tank - 03</option>
                    </Form.Select>
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Destination Nursery Pond <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Select defaultValue="Nursery Pond N-01">
                      <option>Nursery Pond N-01</option>
                    </Form.Select>
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Transfer Date <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control type="text" defaultValue="May 28, 2025" />
                      <span style={{ position: 'absolute', right: 10, top: 8, color: '#8C949B', pointerEvents: 'none' }}>
                        <BsFileText size={14} />
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Transfer Quantity (pcs) <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Control type="text" defaultValue="66,500" />
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Estimated Avg. Size
                    </Form.Label>
                    <Form.Control type="text" defaultValue="0.45 g" />
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      Recorded By <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Select defaultValue="John Doe">
                      <option>John Doe</option>
                    </Form.Select>
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Enter remarks (optional)"
                      maxLength={300}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    <div className={styles.charCounter}>{remarks.length} / 300</div>
                  </div>
                </div>

                <div className={styles.createActions}>
                  <button className={styles.outlineBtn} onClick={() => {}}>Save Draft</button>
                  <button className={styles.primaryBtn} onClick={() => {}}>
                    <FaCheckCircle size={14} /> Complete Transfer
                  </button>
                </div>
              </div>

              {/* RIGHT - Summary & Recent */}
              <div className={styles.transferRightStack}>
                {/* Transfer Summary */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <BsFileText size={20} color="#3B82F6" />
                    <h5>Transfer Summary</h5>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Fry Count (Current)</span>
                    <span className={styles.detailValue}>{f(77920)} pcs</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Mortality</span>
                    <span className={styles.detailValue}>{f(850)} pcs</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Current Survival Rate</span>
                    <span className={styles.detailValue} style={{ color: '#22C55E', fontWeight: 700 }}>89.1%</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Available for Transfer</span>
                    <span className={styles.detailValue}>{f(77070)} pcs</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Transfer Quantity</span>
                    <span className={styles.transferSummaryValue}>{f(66500)} pcs</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Remaining After Transfer</span>
                    <span className={styles.remainingValue}>{f(10570)} pcs</span>
                  </div>
                </div>

                {/* Recent Transfers */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <FaClock size={20} color="#8C949B" />
                    <h5>Recent Transfers (This Batch)</h5>
                  </div>
                  <table className={styles.broodstockMiniTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>To Nursery Pond</th>
                        <th>Quantity (pcs)</th>
                        <th>Avg. Size</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransfers.map((t, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: '0.75rem', color: '#8C949B' }}>{t.date}</td>
                          <td>{t.pond}</td>
                          <td className="text-end">{f(t.quantity)}</td>
                          <td>{t.avgSize}</td>
                          <td style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t.recordedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 12 }}>
                    <span className={styles.viewAllLink} onClick={() => navigate('/hatchery/transfers/transfer-history')}>
                      View all transfers &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidelines Card */}
            <div className={styles.guidelinesCard}>
              <div className={styles.sectionHeader}>
                <BsInfoCircle size={20} color="#22C55E" />
                <h5 style={{ color: '#2E3135' }}>Transfer Guidelines</h5>
              </div>
              <div className={styles.guidelinesColumns}>
                <ul className={styles.guidelinesList}>
                  <li>Ensure water temperature is similar between source and destination.</li>
                  <li>Acclimatize fry properly before release into nursery pond.</li>
                  <li>Transfer during cool hours to reduce stress.</li>
                </ul>
                <ul className={styles.guidelinesList}>
                  <li>Avoid overcrowding in nursery ponds.</li>
                  <li>Record accurate quantities for better tracking and reporting.</li>
                </ul>
              </div>
              <div className={styles.guidelinesFish}>
                <GiCirclingFish size={120} color="#BBF7D0" />
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoLayersOutline,
  IoLeafOutline,
  IoDownloadOutline,
} from 'react-icons/io5';
import {
  FaCircle,
  FaSkull,
  FaFish,
  FaArrowRight,
  FaShoppingCart,
  FaClock,
  FaBoxOpen,
  FaPlus,
  FaCheckCircle,
} from 'react-icons/fa';
import { GiCirclingFish, GiCannedFish, GiChipsBag } from 'react-icons/gi';
import { MdWarning, MdOutlinePointOfSale, MdOutlineBarChart } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import styles from '../batch-dashboard.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const infoCards = [
  { label: 'Current Pond', value: 'Pond Alpha-02', sub: 'Main Farm', icon: IoLocationOutline, color: '#F97316' },
  { label: 'Fish Type', value: 'Tilapia', icon: GiCirclingFish, color: '#3B82F6' },
  { label: 'Date Introduced', value: 'May 28, 2025', icon: IoCalendarOutline, color: '#8B5CF6' },
  { label: 'Initial Quantity', value: f(12500), icon: IoLayersOutline, color: '#F97316' },
  { label: 'Current Quantity', value: f(12450), icon: IoLayersOutline, color: '#14B8A6' },
  { label: 'Mortality', value: '50 (0.40%)', icon: FaSkull, color: '#EF4444' },
  { label: 'Current Stage', value: 'Growing', icon: IoLeafOutline, color: '#22C55E' },
];

const timelineData = [
  {
    title: 'Fish Added', date: 'May 28, 2025 \u2022 09:45 AM', icon: FaCheckCircle, color: '#22C55E',
    detail: '12,500 Tilapia fingerlings added to Pond Alpha-01',
    stat: '12,500 pcs', person: 'by John Doe',
  },
  {
    title: 'Movement (Sorting)', date: 'Jun 05, 2025 \u2022 10:30 AM', icon: FaArrowRight, color: '#3B82F6',
    detail: 'Moved to Pond Alpha-02 after sorting',
    stat: '12,300 pcs', person: 'by Peter James',
  },
  {
    title: 'Sampling', date: 'Jun 12, 2025 \u2022 09:00 AM', icon: FaCircle, color: '#14B8A6',
    detail: 'Routine sampling and weight check',
    stat: '12,250 pcs', person: 'by Esther Sunday',
  },
  {
    title: 'Mortality', date: 'Jun 18, 2025 \u2022 08:15 AM', icon: FaSkull, color: '#EF4444',
    detail: 'Natural mortality recorded',
    stat: '50 pcs', person: 'by Samuel Okoro',
  },
  {
    title: 'Broodstock Transfer', date: 'Jun 22, 2025 \u2022 02:30 PM', icon: FaArrowRight, color: '#8B5CF6',
    detail: 'Broodstock selected and moved to hatchery',
    stat: '100 pcs', person: 'by John Doe',
  },
  {
    title: 'Fresh Fish Sale', date: 'Jun 25, 2025 \u2022 11:05 AM', icon: FaShoppingCart, color: '#F97316',
    detail: 'Sold as fresh fish',
    stat: '200 pcs', person: 'by Peter James',
  },
  {
    title: 'Ongoing', date: '\u2014', icon: FaClock, color: '#9CA3AF',
    detail: 'Current stage of the batch',
    stat: '12,450 pcs Remaining', person: '',
  },
];

const perfData = [
  { label: 'Initial Quantity', value: '12,500 pcs', icon: IoLayersOutline, color: '#F97316' },
  { label: 'Current Quantity', value: '12,450 pcs', icon: IoLayersOutline, color: '#14B8A6' },
  { label: 'Mortality', value: '50 pcs', icon: FaSkull, color: '#EF4444', danger: true },
  { label: 'Fresh Fish Sold', value: '200 pcs', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Broodstock Transfer', value: '100 pcs', icon: FaArrowRight, color: '#8B5CF6' },
  { label: 'Total Harvested', value: '0 pcs', icon: GiCannedFish, color: '#14B8A6' },
  { label: 'Whole Fish Produced', value: '0 pcs', icon: GiChipsBag, color: '#22C55E' },
  { label: 'Broken Fish Produced', value: '0 pcs', icon: GiChipsBag, color: '#F97316' },
  { label: 'Damaged Fish Produced', value: '0 pcs', icon: MdWarning, color: '#EF4444' },
];

export default function BatchSummary() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('notes');

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
            <div className={styles.backLink} onClick={() => navigate('/batch-dashboard')}>
              <IoArrowBackOutline size={16} /> Back to Batch Dashboard
            </div>

            <div className={styles.summaryHeader}>
              <div className={styles.summaryTitle}>
                <h3>Batch Summary</h3>
                <span className={styles.batchIdPill}>FDL-BT-2025-001</span>
                <span className={styles.statusBadge} style={{ background: '#E8F5E9', color: '#2E7D32' }}>Active</span>
              </div>
              <div className={styles.summaryActions}>
                <button className={styles.exportBtn} onClick={() => {}}>
                  <IoDownloadOutline size={16} /> Export Report
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
                    <div className={styles.infoValue}>
                      {card.value}
                      {card.sub && <span style={{ fontSize: '0.72rem', color: '#8C949B', fontWeight: 500, display: 'block' }}>{card.sub}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.threeCol}>
              {/* Left: Timeline */}
              <div>
                <div className={styles.colCard}>
                  <h5>Batch Journey Timeline</h5>
                  <div className={styles.timeline}>
                    {timelineData.map((item, i) => (
                      <div key={i} className={styles.timelineItem}>
                        <div className={styles.timelineDot} style={{ background: item.color + '20', color: item.color }}>
                          <item.icon size={12} />
                        </div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTitle}>{item.title}</div>
                          <div className={styles.timelineDate}>{item.date}</div>
                          <div className={styles.timelineDetail}>
                            <div>{item.detail}</div>
                            <div><span className={styles.timelineStat}>{item.stat}</span></div>
                            {item.person && <div className={styles.timelinePerson}>{item.person}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.viewAllLink} onClick={() => {}}>View Full Timeline &rarr;</div>
                </div>
              </div>

              {/* Center: Performance + History */}
              <div>
                <div className={styles.colCard}>
                  <h5>Performance Summary</h5>
                  <div className={styles.perfGrid}>
                    {perfData.map((item, i) => (
                      <div key={i} className={styles.perfCell}>
                        <div className={styles.perfIcon} style={{ background: item.color + '1A' }}>
                          <item.icon size={16} color={item.color} />
                        </div>
                        <div className={styles.perfLabel}>{item.label}</div>
                        <div className={`${styles.perfValue}${item.danger ? ' ' + styles.danger : ''}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.colCard}>
                  <h5>Processing / Harvest History</h5>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className="text-start">Date</th>
                          <th className="text-start">Type</th>
                          <th className="text-start">Qty Taken</th>
                          <th className="text-end">Qty (pcs)</th>
                          <th className="text-start">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontSize: '0.82rem', color: '#8C949B' }} className="text-start">Jun 05, 2025</td>
                          <td className="text-start">Sorting</td>
                          <td className="text-start">Pond Alpha-01 → Pond Alpha-02</td>
                          <td className="text-end">12,300</td>
                          <td className="text-start">Peter James</td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: '0.82rem', color: '#8C949B' }} className="text-start">Jun 22, 2025</td>
                          <td className="text-start">Broodstock</td>
                          <td className="text-start">Pond Alpha-02 → Hatchery Unit-01</td>
                          <td className="text-end">100</td>
                          <td className="text-start">John Doe</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.viewAllLink} style={{ marginTop: '12px' }} onClick={() => {}}>View All Movements &rarr;</div>
                </div>
              </div>

              {/* Right: Financial + Audit */}
              <div>
                <div className={styles.colCard}>
                  <h5>Financial Summary</h5>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Fresh Fish Sales</span>
                    <span className={styles.finValue}>₦320,000</span>
                  </div>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Whole Fish Sales</span>
                    <span className={styles.finValue}>₦0</span>
                  </div>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Broken Fish Sales</span>
                    <span className={styles.finValue}>₦0</span>
                  </div>
                  <div className={styles.finDivider}></div>
                  <div className={`${styles.financialRow} ${styles.finTotal}`}>
                    <span className={styles.finLabel}>Total Revenue</span>
                    <span className={styles.finValue}>₦320,000</span>
                  </div>
                  <div className={`${styles.financialRow} ${styles.finTotal}`}>
                    <span className={styles.finLabel}>Total Costs</span>
                    <span className={styles.finValue}>₦125,000</span>
                  </div>
                  <div className={styles.finDivider}></div>
                  <div className={`${styles.financialRow} ${styles.finProfit}`}>
                    <span className={styles.finLabel}><MdOutlineBarChart size={16} style={{ marginRight: 4 }} />Estimated Profit</span>
                    <span className={styles.finValue}>₦195,000</span>
                  </div>
                </div>

                <div className={styles.colCard}>
                  <h5>Audit Information</h5>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Created By</div>
                    <div className={styles.auditValue}>John Doe</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Date Created</div>
                    <div className={styles.auditValue}>May 28, 2025 09:45 AM</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Last Updated By</div>
                    <div className={styles.auditValue}>Peter James</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Last Updated</div>
                    <div className={styles.auditValue}>Jun 25, 2025 11:05 AM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tabs */}
            <div className={styles.tabs}>
              <div className={`${styles.tab} ${activeTab === 'notes' ? styles.activeTab : ''}`} onClick={() => setActiveTab('notes')}>Batch Notes</div>
              <div className={`${styles.tab} ${activeTab === 'attachments' ? styles.activeTab : ''}`} onClick={() => setActiveTab('attachments')}>Attachments</div>
              <div className={`${styles.tab} ${activeTab === 'documents' ? styles.activeTab : ''}`} onClick={() => setActiveTab('documents')}>Related Documents</div>
            </div>

            <div className={styles.tabPanel}>
              {activeTab === 'notes' && (
                <div>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><FaBoxOpen size={40} /></div>
                    <p>No notes added yet.</p>
                    <div className={styles.emptySub}>Add notes about this batch for future reference.</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className={styles.addNoteBtn} onClick={() => {}}>
                      <FaPlus size={12} /> Add Note
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'attachments' && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><FaBoxOpen size={40} /></div>
                  <p>No attachments yet.</p>
                  <div className={styles.emptySub}>Upload files related to this batch.</div>
                </div>
              )}
              {activeTab === 'documents' && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><FaBoxOpen size={40} /></div>
                  <p>No related documents.</p>
                  <div className={styles.emptySub}>Link documents to this batch for easy access.</div>
                </div>
              )}
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

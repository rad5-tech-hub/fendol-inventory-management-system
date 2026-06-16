import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoLayersOutline,
} from 'react-icons/io5';
import {
  FaSkull,
  FaArrowRight,
  FaClock,
  FaBoxOpen,
  FaPlus,
  FaCheckCircle,
} from 'react-icons/fa';
import { GiCirclingFish, GiCannedFish } from 'react-icons/gi';
import { MdWarning } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { SkeletonTable } from '../../shared/skeleton/Skeleton';
import { ApiV2 } from '../../shared/api/apiLink';
import styles from '../batch-dashboard.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const stageColors = {
  Pond: { bg: '#E8F5E9', color: '#2E7D32' },
  Harvesting: { bg: '#FEF3C7', color: '#92400E' },
  Processing: { bg: '#FFF3E0', color: '#E65100' },
  Completed: { bg: '#F3F4F6', color: '#374151' },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const formatShortDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`;
};

export default function BatchSummary() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batch, setBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [activeCardTip, setActiveCardTip] = useState(null);
  const [showAllCards, setShowAllCards] = useState(false);
  const infoStripRef = useRef(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await ApiV2.get(`/v2/batch-summary/${batchId}`);
        setBatch(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch batch summary.');
      } finally {
        setLoading(false);
      }
    };
    if (batchId) fetchSummary();
  }, [batchId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoStripRef.current && !infoStripRef.current.contains(e.target)) {
        setActiveCardTip(null);
      }
    };
    if (activeCardTip !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeCardTip]);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  if (loading) {
    return (
      <section className={`${styles.body}`}>
        <div className="sticky-top"><Header toggleSidebar={toggleSidebar} /></div>
        <div className="d-flex gap-2">
          <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
            <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
          </div>
          <section className={`${styles.content} flex-grow-1`}>
            <main className={styles.page}>
              <div style={{ padding: '20px 0' }}>
                <SkeletonTable rows={6} cols={4} />
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  if (error || !batch) {
    return (
      <section className={`${styles.body}`}>
        <div className="sticky-top"><Header toggleSidebar={toggleSidebar} /></div>
        <div className="d-flex gap-2">
          <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
            <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
          </div>
          <section className={`${styles.content} flex-grow-1`}>
            <main className={styles.page}>
              <div className={styles.emptyState}>
                <p>{error || 'Batch not found.'}</p>
                <div className={styles.backLink} onClick={() => navigate('/batch-dashboard')}>
                  <IoArrowBackOutline size={16} /> Back to Batch Dashboard
                </div>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  const isCompleted = !!batch.endDate;
  const stageCfg = stageColors[batch.currentStage] || { bg: '#F3F4F6', color: '#374151' };

  const totalInitial = (batch.fishStocks || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
  const totalHarvested = (batch.harvestLogs || []).reduce((s, x) => s + (Number(x.actual_quantity) || 0), 0);
  const totalDamaged = (batch.damagedFish || []).length;
  const totalProcessed = (batch.fishProcesses || []).reduce((s, x) => s + (Number(x.wholeFishQuantity) || 0) + (Number(x.brokenFishQuantity) || 0) + (Number(x.damageOrLoss) || 0), 0);
  const currentQty = Math.max(0, totalInitial - totalHarvested - totalDamaged);

  const infoCards = [
    { label: 'Current Stage', value: batch.currentStage || '—', icon: IoLayersOutline, color: '#22C55E' },
    { label: 'Date Created', value: formatShortDate(batch.createdAt), icon: IoCalendarOutline, color: '#8B5CF6' },
    { label: 'Initial Quantity', value: `${f(totalInitial)} pcs`, icon: GiCirclingFish, color: '#F97316' },
    { label: 'Current Quantity', value: `${f(currentQty)} pcs`, icon: IoLayersOutline, color: '#14B8A6' },
    { label: 'Total Harvested', value: `${f(totalHarvested)} pcs`, icon: GiCannedFish, color: '#8B5CF6' },
    { label: 'Mortality Events', value: `${f(totalDamaged)}`, icon: FaSkull, color: '#EF4444' },
    { label: 'Comments', value: batch.comments || 'No comments', icon: FaCheckCircle, color: '#3B82F6' },
  ];

  const perfData = [
    { label: 'Initial Quantity', value: `${f(totalInitial)} pcs`, icon: IoLayersOutline, color: '#F97316' },
    { label: 'Current Quantity', value: `${f(currentQty)} pcs`, icon: IoLayersOutline, color: '#14B8A6' },
    { label: 'Mortality Events', value: `${f(totalDamaged)}`, icon: FaSkull, color: '#EF4444', danger: true },
    { label: 'Total Harvested', value: `${f(totalHarvested)} pcs`, icon: GiCannedFish, color: '#14B8A6' },
    { label: 'Fish Processed', value: `${f(totalProcessed)} pcs`, icon: GiCannedFish, color: '#22C55E' },
  ];

  const harvestTimeline = (batch.harvestLogs || []).map((h) => ({
    title: 'Harvest',
    date: formatDate(h.createdAt),
    icon: FaArrowRight,
    color: '#F97316',
    detail: `Harvest from ${h.pondName || 'pond'}`,
    stat: `${f(Number(h.actual_quantity) || 0)} pcs`,
    person: h.remarks ? `Remarks: ${h.remarks}` : '',
  }));

  const fishStockEvents = (batch.fishStocks || []).map((fs) => ({
    title: 'Fish Stock',
    date: formatDate(fs.createdAt),
    icon: GiCirclingFish,
    color: '#3B82F6',
    detail: `Batch #${fs.batchNumber} — Stock entry`,
    stat: `${f(Number(fs.quantity) || 0)} pcs`,
    person: '',
  }));

  const timelineData = [
    ...fishStockEvents,
    ...harvestTimeline,
    {
      title: batch.endDate ? 'Completed' : 'Ongoing',
      date: batch.endDate ? formatDate(batch.endDate) : '—',
      icon: batch.endDate ? FaCheckCircle : FaClock,
      color: batch.endDate ? '#22C55E' : '#9CA3AF',
      detail: batch.endDate ? 'Batch process completed' : 'Current stage of the batch',
      stat: batch.endDate ? '' : `${f(currentQty)} pcs Remaining`,
      person: '',
    },
  ];

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
                <span className={styles.batchIdPill}>FDL-BT-{String(batch.batchNumber).padStart(4, '0')}</span>
                <span className={styles.statusBadge} style={{ background: isCompleted ? '#F3F4F6' : '#E8F5E9', color: isCompleted ? '#374151' : '#2E7D32' }}>
                  {isCompleted ? 'Completed' : 'Active'}
                </span>
              </div>
              <div className={styles.summaryActions}>
                <button className={styles.exportBtn} onClick={() => {}}>
                  <IoArrowBackOutline size={16} /> Export Report
                </button>
              </div>
            </div>

            <div className={styles.infoStripWrap}>
              <div className={styles.infoStrip} ref={infoStripRef}>
                {infoCards.map((card, i) => (
                  <div
                    key={i}
                    className={`${styles.infoCard} ${!showAllCards && i >= 4 ? styles.infoCardHidden : ''}`}
                    onMouseEnter={() => setActiveCardTip(i)}
                    onMouseLeave={() => setActiveCardTip(null)}
                    onClick={() => setActiveCardTip(activeCardTip === i ? null : i)}
                  >
                    <div className={styles.infoIcon} style={{ background: card.color + '1A' }}>
                      <card.icon size={18} color={card.color} />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>{card.label}</div>
                      <div className={styles.infoValue}>{card.value}</div>
                    </div>
                    <div className={`${styles.infoTooltip} ${activeCardTip === i ? styles.infoTooltipVisible : ''}`}>
                      <span className={styles.infoTooltipText}>{card.value}</span>
                    </div>
                  </div>
                ))}
              </div>
              {infoCards.length > 4 && (
                <div className={styles.showMoreDesktop}>
                  <button
                    className={styles.showMoreBtn}
                    onClick={() => setShowAllCards(!showAllCards)}
                  >
                    {showAllCards ? 'Show less' : `Show ${infoCards.length - 4} more`}
                    <span className={styles.showMoreArrow} style={{ transform: showAllCards ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </button>
                </div>
              )}
            </div>

            <div className={styles.threeCol}>
              {/* Left: Timeline */}
              <div>
                <div className={styles.colCard}>
                  <h5>Batch Journey Timeline</h5>
                  <div className={styles.timeline}>
                    {timelineData.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No timeline events.</p>
                      </div>
                    ) : (
                      timelineData.map((item, i) => (
                        <div key={i} className={styles.timelineItem}>
                          <div className={styles.timelineDot} style={{ background: item.color + '20', color: item.color }}>
                            <item.icon size={12} />
                          </div>
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineTitle}>{item.title}</div>
                            <div className={styles.timelineDate}>{item.date}</div>
                            <div className={styles.timelineDetail}>
                              <div>{item.detail}</div>
                              {item.stat && <div><span className={styles.timelineStat}>{item.stat}</span></div>}
                              {item.person && <div className={styles.timelinePerson}>{item.person}</div>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                  <h5>Harvest History</h5>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className="text-start">Date</th>
                          <th className="text-start">Pond</th>
                          <th className="text-end">Pre Qty</th>
                          <th className="text-end">Harvested</th>
                          <th className="text-end">Post Qty</th>
                          <th className="text-start">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(batch.harvestLogs || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-3" style={{ color: '#8C949B', fontWeight: 600 }}>
                              No harvest records.
                            </td>
                          </tr>
                        ) : (
                          (batch.harvestLogs || []).map((h, i) => (
                            <tr key={h.id || i}>
                              <td style={{ fontSize: '0.82rem', color: '#8C949B' }} className="text-start">
                                {formatShortDate(h.createdAt)}
                              </td>
                              <td className="text-start">{h.pondName || '—'}</td>
                              <td className="text-end">{f(Number(h.pre_quantity) || 0)}</td>
                              <td className="text-end">{f(Number(h.actual_quantity) || 0)}</td>
                              <td className="text-end">{f(Number(h.post_quantity) || 0)}</td>
                              <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>
                                {h.addedByRole || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right: Audit Info */}
              <div>
                <div className={styles.colCard}>
                  <h5>Batch Information</h5>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Batch Number</div>
                    <div className={styles.auditValue}>FDL-BT-{String(batch.batchNumber).padStart(4, '0')}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Current Stage</div>
                    <div className={styles.auditValue}>{batch.currentStage || '—'}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Status</div>
                    <div className={styles.auditValue}>{isCompleted ? 'Completed' : 'Active'}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Comments</div>
                    <div className={styles.auditValue}>{batch.comments || '—'}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Start Date</div>
                    <div className={styles.auditValue}>{batch.startDate || '—'}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>End Date</div>
                    <div className={styles.auditValue}>{batch.endDate || '—'}</div>
                  </div>
                </div>

                <div className={styles.colCard}>
                  <h5>Audit Information</h5>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Created At</div>
                    <div className={styles.auditValue}>{formatDate(batch.createdAt)}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Last Updated</div>
                    <div className={styles.auditValue}>{formatDate(batch.updatedAt)}</div>
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

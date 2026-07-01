import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoLayersOutline,
  IoLocationOutline,
  IoArrowUpOutline,
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
import DataTable from '../../shared/data-table/DataTable';
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
  const totalWholeProduced = (batch.fishProcesses || []).reduce((s, x) => s + (Number(x.wholeFishQuantity) || 0), 0);
  const totalBrokenProduced = (batch.fishProcesses || []).reduce((s, x) => s + (Number(x.brokenFishQuantity) || 0), 0);
  const totalDamagedProduced = (batch.fishProcesses || []).reduce((s, x) => s + (Number(x.damageOrLoss) || 0), 0);
  const totalProcessed = totalWholeProduced + totalBrokenProduced + totalDamagedProduced;
  const currentQty = Math.max(0, totalInitial - totalHarvested - totalDamaged);

  const mortalityPct = totalInitial > 0 ? ((totalDamaged / totalInitial) * 100).toFixed(2) : '0.00';

  // TODO: confirm field names with backend
  const movements = batch.movements || [];
  const samplings = batch.samplings || [];
  const broodstockTransfers = batch.broodstockTransfers || [];
  const salesLogs = batch.salesLogs || [];

  // Financial placeholder fields (TODO: confirm field names with backend)
  const freshFishSales = batch.freshFishSales || 0;
  const wholeFishSales = batch.wholeFishSales || 0;
  const brokenFishSales = batch.brokenFishSales || 0;
  const totalRevenue = batch.totalRevenue || 0;
  const totalCosts = batch.totalCosts || 0;
  const estimatedProfit = batch.estimatedProfit || 0;

  // TODO: confirm field names with backend
  const createdBy = batch.createdBy || '—';
  const updatedBy = batch.updatedBy || '—';

  const infoCards = [
    {
      label: 'Current Pond',
      value: batch.pondName || 'Pond Alpha-02',
      subLabel: 'Main Farm',
      tooltipText: `${batch.pondName || 'Pond Alpha-02'} — Main Farm`,
      icon: IoLocationOutline,
      color: '#3B82F6',
    },
    {
      label: 'Fish Type',
      value: batch.fishType || 'Tilapia',
      subLabel: '',
      icon: GiCirclingFish,
      color: '#3B82F6',
    },
    {
      label: 'Date Introduced',
      value: formatShortDate(batch.createdAt),
      subLabel: '',
      icon: IoCalendarOutline,
      color: '#8B5CF6',
    },
    {
      label: 'Initial Quantity',
      value: `${f(totalInitial)} pcs`,
      subLabel: '',
      icon: IoLayersOutline,
      color: '#F97316',
    },
    {
      label: 'Current Quantity',
      value: `${f(currentQty)} pcs`,
      subLabel: '',
      icon: GiCannedFish,
      color: '#14B8A6',
    },
    {
      label: 'Mortality',
      value: `${f(totalDamaged)} (${mortalityPct}%)`,
      subLabel: '',
      icon: FaSkull,
      color: '#EF4444',
      danger: true,
    },
    {
      label: 'Current Stage',
      value: batch.currentStage || '—',
      subLabel: '',
      icon: FaCheckCircle,
      color: '#22C55E',
    },
  ];

  const totalFreshFishSold = (salesLogs).reduce((s, x) => s + (Number(x.quantity) || 0), 0); // TODO: confirm field name with backend
  const totalBroodstockTransferred = (broodstockTransfers).reduce((s, x) => s + (Number(x.quantity) || 0), 0); // TODO: confirm field name with backend

  const perfData = [
    { label: 'Initial Quantity', value: `${f(totalInitial)} pcs`, icon: IoLayersOutline, color: '#F97316' },
    { label: 'Current Quantity', value: `${f(currentQty)} pcs`, icon: GiCannedFish, color: '#14B8A6' },
    { label: 'Mortality', value: `${f(totalDamaged)} pcs`, icon: FaSkull, color: '#EF4444', danger: true },
    { label: 'Fresh Fish Sold', value: `${f(totalFreshFishSold)} pcs`, icon: GiCannedFish, color: '#3B82F6' },
    { label: 'Broodstock Transfer', value: `${f(totalBroodstockTransferred)} pcs`, icon: GiCirclingFish, color: '#8B5CF6' },
    { label: 'Total Harvested', value: `${f(totalHarvested)} pcs`, icon: GiCannedFish, color: '#14B8A6' },
    { label: 'Whole Fish Produced', value: `${f(totalWholeProduced)} pcs`, icon: GiCannedFish, color: '#22C55E' },
    { label: 'Broken Fish Produced', value: `${f(totalBrokenProduced)} pcs`, icon: GiCannedFish, color: '#F97316' },
    { label: 'Damaged Fish Produced', value: `${f(totalDamagedProduced)} pcs`, icon: FaSkull, color: '#EF4444' },
  ];

  const harvestTimeline = (batch.harvestLogs || []).map((h) => ({
    title: 'Harvest',
    date: formatDate(h.createdAt),
    _sortDate: new Date(h.createdAt).getTime(),
    icon: FaArrowRight,
    color: '#F97316',
    detail: `Harvest from ${h.pondName || 'pond'}`,
    stat: `${f(Number(h.actual_quantity) || 0)} pcs`,
    person: h.remarks ? `Remarks: ${h.remarks}` : '',
  }));

  // TODO: confirm field name/shape with backend
  const movementEvents = movements.map((m) => ({
    title: 'Movement (Sorting)',
    date: formatDate(m.createdAt),
    _sortDate: new Date(m.createdAt).getTime(),
    icon: GiCannedFish,
    color: '#8B5CF6',
    detail: m.detail || `Movement from ${m.fromPond || 'pond'} to ${m.toPond || 'pond'}`,
    stat: m.quantity ? `${f(Number(m.quantity))} pcs` : '',
    person: m.addedBy ? `by ${m.addedBy}` : '',
  }));

  // TODO: confirm field name/shape with backend
  const samplingEvents = samplings.map((s) => ({
    title: 'Sampling',
    date: formatDate(s.createdAt),
    _sortDate: new Date(s.createdAt).getTime(),
    icon: GiCirclingFish,
    color: '#F97316',
    detail: s.detail || 'Routine sampling / weight check',
    stat: s.avgWeight ? `${s.avgWeight} g` : '',
    person: s.addedBy ? `by ${s.addedBy}` : '',
  }));

  const mortalityEvents = (batch.damagedFish || []).map((d) => ({
    title: 'Mortality',
    date: formatDate(d.createdAt),
    _sortDate: new Date(d.createdAt).getTime(),
    icon: FaSkull,
    color: '#EF4444',
    detail: d.reason || d.cause || 'Mortality event',
    stat: d.quantity ? `${f(Number(d.quantity))} pcs` : '',
    person: d.addedBy ? `by ${d.addedBy}` : '',
    danger: true,
  }));

  // TODO: confirm field name/shape with backend
  const broodstockEvents = broodstockTransfers.map((b) => ({
    title: 'Broodstock Transfer',
    date: formatDate(b.createdAt),
    _sortDate: new Date(b.createdAt).getTime(),
    icon: GiCirclingFish,
    color: '#8B5CF6',
    detail: b.detail || `Transfer to ${b.toHatchery || 'hatchery unit'}`,
    stat: b.quantity ? `${f(Number(b.quantity))} pcs` : '',
    person: b.addedBy ? `by ${b.addedBy}` : '',
    emphasizeTitle: true,
  }));

  // TODO: confirm field name/shape with backend
  const salesEvents = salesLogs.map((sl) => ({
    title: 'Fresh Fish Sale',
    date: formatDate(sl.createdAt),
    _sortDate: new Date(sl.createdAt).getTime(),
    icon: GiCannedFish,
    color: '#22C55E',
    detail: sl.detail || `Sale of fresh fish`,
    stat: sl.quantity ? `${f(Number(sl.quantity))} pcs` : '',
    person: sl.addedBy ? `by ${sl.addedBy}` : '',
  }));

  const fishStockEvents = (batch.fishStocks || []).map((fs) => ({
    title: 'Fish Added',
    date: formatDate(fs.createdAt),
    _sortDate: new Date(fs.createdAt).getTime(),
    icon: GiCirclingFish,
    color: '#3B82F6',
    detail: `Batch #${fs.batchNumber} — Stock entry`,
    stat: `${f(Number(fs.quantity) || 0)} pcs`,
    person: '',
  }));

  const allSortedEvents = [
    ...fishStockEvents,
    ...movementEvents,
    ...samplingEvents,
    ...mortalityEvents,
    ...broodstockEvents,
    ...salesEvents,
    ...harvestTimeline,
  ].sort((a, b) => a._sortDate - b._sortDate);

  const timelineData = [
    ...allSortedEvents,
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
              </div>
            </div>

            <div className={styles.pageSubtitle}>
              Complete lifecycle and performance summary of this fish batch.
            </div>

            <div className={styles.infoStripWrap}>
              <div className={styles.infoStrip} ref={infoStripRef}>
                {infoCards.map((card, i) => (
                  <div
                    key={i}
                    className={styles.infoCard}
                    style={{ borderLeft: `3px solid ${activeCardTip === i ? card.color : 'transparent'}` }}
                    onMouseEnter={() => setActiveCardTip(i)}
                    onMouseLeave={() => setActiveCardTip(null)}
                    onClick={() => setActiveCardTip(activeCardTip === i ? null : i)}
                  >
                    <div className={styles.infoIcon} style={{ background: card.color + '1A' }}>
                      <card.icon size={18} color={card.color} />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>{card.label}</div>
                      <div className={`${styles.infoValue}${card.danger ? ' ' + styles.infoValueDanger : ''}`}>{card.value}</div>
                      {card.subLabel && <div className={styles.infoSubLabel}>{card.subLabel}</div>}
                    </div>
                    <div className={`${styles.infoTooltip} ${activeCardTip === i ? styles.infoTooltipVisible : ''}`}>
                      <span className={styles.infoTooltipText}>{card.tooltipText || card.value}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                            {item.emphasizeTitle ? (
                              <div className={styles.timelineEmphasizedTitle} style={{ color: item.color }}>
                                {item.title}
                              </div>
                            ) : (
                              <div className={styles.timelineTitle}>{item.title}</div>
                            )}
                            <div className={styles.timelineDate}>{item.date}</div>
                            <div className={styles.timelineDetail}>
                              <div>{item.detail}</div>
                              {item.stat && (
                                <div>
                                  <span className={`${styles.timelineStat}${item.danger ? ' ' + styles.danger : ''}`}>
                                    {item.stat}
                                  </span>
                                </div>
                              )}
                              {item.person && <div className={styles.timelinePerson}>{item.person}</div>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* View Full Timeline link */}
                  <div className={styles.viewAllRow} onClick={() => { console.log('View Full Timeline clicked'); /* TODO: confirm navigation target */ }}>
                    <span className={styles.viewAllRowLabel}>View Full Timeline</span>
                    <span className={styles.viewAllRowArrow}><FaArrowRight size={12} /></span>
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
                  <h5>Processing / Harvest History</h5>
                  <DataTable
                    columns={[
                      { key: 'createdAt', label: 'Date', render: (value) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{formatShortDate(value)}</span> },
                      { key: 'type', label: 'Type', render: () => 'Harvest' },
                      { key: 'pre_quantity', label: 'Qty Taken', align: 'right', render: (value) => f(Number(value) || 0) },
                      { key: 'wholeFishQuantity', label: 'Whole', align: 'right', render: (value) => value ? f(Number(value)) : '—' },
                      { key: 'brokenFishQuantity', label: 'Broken', align: 'right', render: (value) => value ? f(Number(value)) : '—' },
                      { key: 'damageOrLoss', label: 'Damaged', align: 'right', render: (value) => value ? f(Number(value)) : '—' },
                      { key: 'actual_quantity', label: 'Qty (pcs)', align: 'right', render: (value) => f(Number(value) || 0) },
                      { key: 'addedByRole', label: 'Recorded By', render: (value) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{value || '—'}</span> },
                    ]}
                    data={batch.harvestLogs || []}
                    emptyMessage="No processing or harvest records."
                  />
                  {/* View All Movements link */}
                  <div className={styles.viewAllRow} onClick={() => { console.log('View All Movements clicked'); /* TODO: confirm navigation target */ }}>
                    <span className={styles.viewAllRowLabel}>View All Movements</span>
                    <span className={styles.viewAllRowArrow}><FaArrowRight size={12} /></span>
                  </div>
                </div>
              </div>

              {/* Right: Financial Summary + Batch Info + Audit Info */}
              <div>
                {/* NEW: Financial Summary card — placed above Batch Information; confirm placement with user */}
                <div className={styles.colCard}>
                  <h5>Financial Summary</h5>
                  {/* TODO: confirm field names with backend */}
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Fresh Fish Sales</span>
                    <span className={styles.finValue}>₦{f(freshFishSales)}</span>
                  </div>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Whole Fish Sales</span>
                    <span className={styles.finValue}>₦{f(wholeFishSales)}</span>
                  </div>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Broken Fish Sales</span>
                    <span className={styles.finValue}>₦{f(brokenFishSales)}</span>
                  </div>
                  <div className={styles.finDivider} />
                  <div className={`${styles.financialRow} ${styles.finTotal}`}>
                    <span className={styles.finLabel}>Total Revenue</span>
                    <span className={styles.finValue} style={{ color: '#22C55E' }}>₦{f(totalRevenue)}</span>
                  </div>
                  <div className={`${styles.financialRow} ${styles.finTotal}`}>
                    <span className={styles.finLabel}>Total Costs</span>
                    <span className={styles.finValue} style={{ color: '#EF4444' }}>₦{f(totalCosts)}</span>
                  </div>
                  <div className={styles.finCallout}>
                    <span className={styles.finCalloutLabel}>
                      <IoArrowUpOutline size={14} /> Estimated Profit
                    </span>
                    <span className={styles.finCalloutValue}>₦{f(estimatedProfit)}</span>
                  </div>
                </div>

                {/* Batch Information was removed per user request — Financial Summary above replaces it */}

                {/* MODIFIED: Audit Information — split Created At into Created By / Date Created */}
                <div className={styles.colCard}>
                  <h5>Audit Information</h5>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Created By</div>
                    <div className={styles.auditValue}>{createdBy}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Date Created</div>
                    <div className={styles.auditValue}>{formatDate(batch.createdAt)}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Last Updated By</div>
                    <div className={styles.auditValue}>{updatedBy}</div>
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

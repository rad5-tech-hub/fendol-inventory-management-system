import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoLayersOutline,
  IoLocationOutline,
  IoClose,
} from 'react-icons/io5';
import {
  FaSkull,
  FaArrowRight,
  FaClock,
  FaPlus,
  FaCheckCircle,
  FaRegStickyNote,
} from 'react-icons/fa';
import { GiCirclingFish, GiCannedFish } from 'react-icons/gi';
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
  const [activeCardTip, setActiveCardTip] = useState(null);
  const infoStripRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [comments, setComments] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!batchId) return;
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
  }, [batchId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      toast.warn('Please enter a note.');
      return;
    }
    setNoteSubmitting(true);
    const noteToast = toast.loading('Saving note...');
    try {
      await ApiV2.patch(`/v2/edit/${batch.batchNumber}`, { comments: comments.trim() });
      toast.update(noteToast, { render: 'Note saved successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      setShowNoteModal(false);
      await fetchSummary();
    } catch (err) {
      toast.update(noteToast, { render: 'Failed to save note. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    } finally {
      setNoteSubmitting(false);
    }
  };

  useEffect(() => {
    if (batchId) fetchSummary();
  }, [batchId, fetchSummary]);

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

  // ── Core metrics from the API response ─────────────────────────────────
  const initialQuantity = Number(batch.startQuantity) || 0;
  const currentQuantity = (batch.fishStages || []).reduce((s, x) => s + (Number(x.totalQuantity) || 0), 0);
  const totalHarvested = batch.totalHarvestedFish ?? 0;
  const totalDamaged = batch.totalDamagedFish ?? 0;
  const mortalityPct = initialQuantity > 0 ? ((totalDamaged / initialQuantity) * 100).toFixed(2) : '0.00';

  const currentPonds = (batch.fishStages || [])
    .map((s) => s.title)
    .filter(Boolean)
    .join(', ') || '—';

  const infoCards = [
    {
      label: 'Current Pond',
      value: currentPonds,
      subLabel: batch.currentStage || '',
      tooltipText: `Current pond(s): ${currentPonds}`,
      icon: IoLocationOutline,
      color: '#3B82F6',
    },
    {
      label: 'Date Introduced',
      value: formatShortDate(batch.startDate),
      icon: IoCalendarOutline,
      color: '#8B5CF6',
    },
    {
      label: 'Initial Quantity',
      value: `${f(initialQuantity)} pcs`,
      icon: IoLayersOutline,
      color: '#F97316',
    },
    {
      label: 'Current Quantity',
      value: `${f(currentQuantity)} pcs`,
      icon: GiCannedFish,
      color: '#14B8A6',
    },
    {
      label: 'Mortality',
      value: `${f(totalDamaged)} (${mortalityPct}%)`,
      icon: FaSkull,
      color: '#EF4444',
      danger: true,
    },
    {
      label: 'Current Stage',
      value: batch.currentStage || '—',
      icon: FaCheckCircle,
      color: '#22C55E',
    },
  ];

  const perfData = [
    { label: 'Initial Quantity', value: `${f(initialQuantity)} pcs`, icon: IoLayersOutline, color: '#F97316' },
    { label: 'Current Quantity', value: `${f(currentQuantity)} pcs`, icon: GiCannedFish, color: '#14B8A6' },
    { label: 'Mortality', value: `${f(totalDamaged)} pcs`, icon: FaSkull, color: '#EF4444', danger: true },
    { label: 'Total Harvested', value: `${f(totalHarvested)} pcs`, icon: GiCannedFish, color: '#14B8A6' },
  ];

  // ── Timeline built from pond activities ────────────────────────────────
  const timelineData = (batch.pondActivities || [])
    .map((a) => {
      const action = (a.action || '').toLowerCase();
      const isHarvest = action.includes('harvest');
      const isDamage = action.includes('damage') || action.includes('mortality');
      return {
        title: a.action || 'Activity',
        date: formatDate(a.createdAt),
        _sortDate: new Date(a.createdAt).getTime(),
        icon: isHarvest ? FaArrowRight : isDamage ? FaSkull : GiCirclingFish,
        color: isHarvest ? '#F97316' : isDamage ? '#EF4444' : '#3B82F6',
        detail: a.description || '',
        stat: '',
        person: a.performerName ? `by ${a.performerName}` : '',
      };
    })
    .sort((a, b) => a._sortDate - b._sortDate);

  const timelineWithStatus = [
    ...timelineData,
    {
      title: batch.endDate ? 'Completed' : 'Ongoing',
      date: batch.endDate ? formatDate(batch.endDate) : '—',
      icon: batch.endDate ? FaCheckCircle : FaClock,
      color: batch.endDate ? '#22C55E' : '#9CA3AF',
      detail: batch.endDate ? 'Batch process completed' : 'Current stage of the batch',
      stat: batch.endDate ? '' : `${f(currentQuantity)} pcs Remaining`,
      person: '',
    },
  ];

  // ── Harvest / damaged history ──────────────────────────────────────────
  const historyData = [
    ...(batch.harvestLogs || []).map((h) => ({
      ...h,
      type: 'Harvest',
      quantity: h.actual_quantity,
      displayDate: h.createdAt,
    })),
    ...(batch.damagedFish || []).map((d) => ({
      ...d,
      type: 'Damaged / Mortality',
      quantity: d.quantity,
      displayDate: d.createdAt,
    })),
  ].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));

  // ── Resource usage ───────────────────────────────────────────────────────
  const storeUsed = batch.storeUsed || { totalQuantity: 0, totalCost: 0 };
  const feedUsed = batch.feedUsed || { totalQuantity: 0, totalCost: 0 };

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
              <div className={styles.summaryActions} />
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
              {/* Left: Batch Journey Timeline */}
              <div>
                <div className={styles.colCard}>
                  <h5>Batch Journey Timeline</h5>
                  <div className={styles.timeline}>
                    {timelineWithStatus.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No timeline events.</p>
                      </div>
                    ) : (
                      timelineWithStatus.map((item, i) => (
                        <div key={i} className={styles.timelineItem}>
                          <div className={styles.timelineDot} style={{ background: item.color + '20', color: item.color }}>
                            <item.icon size={12} />
                          </div>
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineTitle}>{item.title}</div>
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
                  <div className={styles.viewAllRow} onClick={() => { console.log('View Full Timeline clicked'); }}>
                    <span className={styles.viewAllRowLabel}>View Full Timeline</span>
                    <span className={styles.viewAllRowArrow}><FaArrowRight size={12} /></span>
                  </div>
                </div>
              </div>

              {/* Center: Performance Summary + History */}
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
                      { key: 'displayDate', label: 'Date', render: (value) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{formatShortDate(value)}</span> },
                      { key: 'type', label: 'Type' },
                      { key: 'quantity', label: 'Qty (pcs)', align: 'right', render: (value) => f(Number(value) || 0) },
                      { key: 'pondName', label: 'Pond', render: (value) => value || '—' },
                    ]}
                    data={historyData}
                    emptyMessage="No processing or harvest records."
                  />
                </div>
              </div>

              {/* Right: Resource Usage + Mini Audit */}
              <div>
                <div className={styles.colCard}>
                  <h5>Resource Usage</h5>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Store Used</span>
                    <span className={styles.finValue}>{f(Number(storeUsed.totalQuantity) || 0)} units</span>
                  </div>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Feed Used</span>
                    <span className={styles.finValue}>{f(Number(feedUsed.totalQuantity) || 0)} kg</span>
                  </div>
                  <div className={styles.finDivider} />
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Store Records</span>
                    <span className={styles.finValue}>{f((batch.storeHistories || []).length)} entries</span>
                  </div>
                  <div className={styles.financialRow}>
                    <span className={styles.finLabel}>Feed Records</span>
                    <span className={styles.finValue}>{f((batch.feedHistories || []).length)} entries</span>
                  </div>
                </div>

                <div className={styles.colCard}>
                  <h5>Batch Details</h5>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Site ID</div>
                    <div className={styles.auditValue}>{batch.siteId || '—'}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Created</div>
                    <div className={styles.auditValue}>{formatDate(batch.createdAt)}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Last Updated</div>
                    <div className={styles.auditValue}>{formatDate(batch.updatedAt)}</div>
                  </div>
                  <div className={styles.auditRow}>
                    <div className={styles.auditLabel}>Comments</div>
                    <div className={styles.auditValue}>{batch.comments || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tabs — only Batch Notes */}
            <div className={styles.tabs}>
              <div className={`${styles.tab} ${styles.activeTab}`}>Batch Notes</div>
            </div>

            <div className={styles.tabPanel}>
              {batch.comments ? (
                <div className={styles.commentsBox}>
                  <div className={styles.commentsText}>{batch.comments}</div>
                </div>
              ) : (
                <div>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><FaRegStickyNote size={40} /></div>
                    <p>No notes added yet.</p>
                    <div className={styles.emptySub}>Add notes about this batch for future reference.</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className={styles.addNoteBtn} onClick={() => { setComments(batch.comments || ''); setShowNoteModal(true); }}>
                  <FaPlus size={12} /> {batch.comments ? 'Edit Note' : 'Add Note'}
                </button>
              </div>
            </div>

            {/* ── ADD NOTE MODAL ── */}
            {showNoteModal && (
              <div className={styles.modalOverlay} onClick={() => setShowNoteModal(false)}>
                <div className={styles.noteModal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.noteModalHeader}>
                    <div className={styles.noteModalTitleGroup}>
                      <span className={styles.noteModalIcon}><FaRegStickyNote size={18} /></span>
                      <div>
                        <h4 className={styles.noteModalTitle}>Add Note</h4>
                        <p className={styles.noteModalSubtitle}>FDL-BT-{String(batch.batchNumber).padStart(4, '0')}</p>
                      </div>
                    </div>
                    <button className={styles.noteModalClose} onClick={() => setShowNoteModal(false)}>
                      <IoClose size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleAddNote}>
                    <div className={styles.noteModalBody}>
                      <div className={styles.noteField}>
                        <label className={styles.noteLabel}>Note</label>
                        <textarea
                          className={styles.noteTextarea}
                          placeholder="Write your observation or note..."
                          rows={4}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          required
                          disabled={noteSubmitting}
                        />
                      </div>
                    </div>
                    <div className={styles.noteModalFooter}>
                      <button type="button" className={styles.noteCancelBtn} onClick={() => setShowNoteModal(false)} disabled={noteSubmitting}>
                        Cancel
                      </button>
                      <button type="submit" className={styles.noteSubmitBtn} disabled={noteSubmitting}>
                        {noteSubmitting ? <><span className={styles.noteSpinner} /> Saving...</> : <><FaPlus size={14} /> Add Note</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

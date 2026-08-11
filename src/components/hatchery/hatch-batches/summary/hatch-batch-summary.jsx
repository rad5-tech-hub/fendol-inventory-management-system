import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GiCirclingFish, GiEggClutch } from 'react-icons/gi';
import { FaChartLine, FaExchangeAlt, FaHeartbeat, FaSkull } from 'react-icons/fa';
import { BsGenderFemale, BsGenderMale } from 'react-icons/bs';
import { IoArrowBackOutline, IoPrintOutline, IoPencilOutline } from 'react-icons/io5';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api, { ApiV2 } from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const FALLBACK_INFO_CARDS = [
  { label: 'Eggs Produced', value: f(120000), sub: '1.20 kg', icon: GiEggClutch, color: '#8B5CF6' },
  { label: 'Hatchability Rate', value: '75.4%', sub: '90,480 hatched', icon: FaChartLine, color: '#22C55E' },
  { label: 'Fry Produced', value: f(87360), sub: 'Estimated', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Survival Rate', value: '89.2%', sub: 'After 7 Days', icon: FaHeartbeat, color: '#F43F5E' },
  { label: 'Total Mortality', value: f(10720), sub: '11.8%', icon: FaSkull, color: '#dc3545' },
  { label: 'Transferred to Nursery', value: f(66500), sub: 'Last: May 24, 2025', icon: FaExchangeAlt, color: '#3B82F6' },
];

const FALLBACK_TIMELINE = [
  { title: 'Date Injected', date: 'May 25, 2025 08:30 AM', detail: 'Eggs fertilized and placed in incubator', color: '#3B82F6', icon: '\u2022' },
  { title: 'Date Stripped', date: 'May 26, 2025 09:15 AM', detail: 'Eggs stripped from females', color: '#F97316', icon: '\u2022' },
  { title: 'Date Hatched', date: 'May 28, 2025 07:40 AM', detail: 'Larvae hatched successfully', color: '#22C55E', icon: '\u2022' },
  { title: 'Fry Counted', date: 'May 28, 2025 02:30 PM', detail: 'Fry counted and recorded', color: '#14B8A6', icon: '\u2022' },
  { title: 'Transferred to Nursery', date: 'May 24, 2025 10:20 AM', detail: 'Fry transferred to Nursery Pond N-01', color: '#8B5CF6', icon: '\u2022' },
];


const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const StatusBadge = ({ status }) => {
  const colors = {
    active: { bg: '#E8F5E9', color: '#2E7D32' },
    completed: { bg: '#E3F2FD', color: '#1565C0' },
    pending: { bg: '#FFF8E1', color: '#F57F17' },
  };
  const s = (status || '').toLowerCase();
  const palette = colors[s] || { bg: '#F3F4F6', color: '#374151' };
  return <span className={styles.statusBadge} style={{ background: palette.bg, color: palette.color }}>{status || 'N/A'}</span>;
};

export default function HatchBatchSummary() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchData, setBatchData] = useState(null);
  const [sites, setSites] = useState([]);


  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const openTransferModal = () => {
    navigate(`/hatchery/transfers/transfer-to-nursery?batchId=${batchId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchRes, sitesRes] = await Promise.all([
          ApiV2.get(`/v2/hatch-batches/${batchId}`),
          ApiV2.get('/v2/all-site'),
        ]);
        const data = batchRes.data?.data || batchRes.data;
        if (data && data.id) {
          setBatchData(data);
          setError('');
        } else {
          setError('Batch data not found.');
        }
        const siteList = Array.isArray(sitesRes.data?.data) ? sitesRes.data.data : [];
        setSites(siteList);
      } catch {
        setError('Failed to load batch summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId]);

  const siteName = batchData
    ? (sites.find((s) => s.id === batchData.siteId)?.name || 'Unknown Site')
    : 'Main Hatchery';

  const infoCards = batchData
    ? FALLBACK_INFO_CARDS.map((card, i) => {
        const updated = { ...card };
        if (i === 0) {
          updated.value = f(batchData.estimatedFryCount);
          updated.sub = `${f(batchData.weightOfEgg)} g`;
        }
        if (i === 1) {
          updated.value = `${batchData.hatchabilityPercentage}%`;
          updated.sub = `${f(batchData.estimatedFryCount)} estimated`;
        }
        if (i === 2) {
          updated.value = f(batchData.fryProduced);
          updated.sub = 'Actual';
        }
        if (i === 3) {
          updated.value = `${batchData.survivalRate}%`;
          updated.sub = 'After hatch';
        }
        if (i === 4) {
          updated.value = f(batchData.mortality || 0);
          const mortalityPct = batchData.estimatedFryCount > 0
            ? ((batchData.mortality / batchData.estimatedFryCount) * 100).toFixed(1)
            : '0.0';
          updated.sub = `${mortalityPct}%`;
        }
        if (i === 5) {
          updated.value = f(batchData.fryMoved || 0);
          updated.sub = batchData.fryMoved > 0 ? 'Transferred' : 'Not yet';
        }
        return updated;
      })
    : FALLBACK_INFO_CARDS;

  const timelineSteps = batchData
    ? (() => {
        const eventMap = {
          injected: { title: 'Date Injected', detail: 'Eggs fertilized and placed in incubator', color: '#3B82F6' },
          stripped: { title: 'Date Stripped', detail: 'Eggs stripped from females', color: '#F97316' },
          hatched: { title: 'Date Hatched', detail: 'Larvae hatched successfully', color: '#22C55E' },
        };
        const eventSteps = (batchData.events || []).map((ev) => {
          const tmpl = eventMap[ev.action];
          return {
            title: tmpl?.title || ev.action,
            date: formatDate(ev.date),
            detail: tmpl?.detail || '',
            color: tmpl?.color || '#6B7280',
            icon: '\u2022',
          };
        });
        const extraSteps = [
          { title: 'Fry Counted', date: formatDate(batchData.dateHatched) + ' 02:30 PM', detail: 'Fry counted and recorded', color: '#14B8A6', icon: '\u2022' },
          { title: 'Transferred to Nursery', date: 'Pending', detail: 'Awaiting transfer', color: '#8B5CF6', icon: '\u2022' },
        ];
        return [...eventSteps, ...extraSteps];
      })()
    : FALLBACK_TIMELINE;

  const femaleCount = batchData ? batchData.noOfFemaleBroodstock : 3;
  const maleCount = batchData ? batchData.maleBroodStock : 6;
  const avgFemaleWeight = batchData ? Number(batchData.avgWeightOfFemale).toFixed(2) : '3.10';
  const avgMaleWeight = batchData ? Number(batchData.avgWeightOfMaleBroodstock).toFixed(2) : '2.63';



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
              <span className={styles.breadcrumbActive}>{batchData ? batchData.hatchbatchNo : 'HB-2025-006'}</span>
            </div>

            <div className={styles.summaryHeader}>
              <div className={styles.summaryTitle}>
                <h3>Hatch Batch Summary</h3>
                <StatusBadge status={batchData ? batchData.status : 'Completed'} />
              </div>
              <div className={styles.summaryActions}>
                <button className={styles.outlineBtn} onClick={() => navigate('/hatchery/hatch-batches/create', { state: { batch: batchData } })}><IoPencilOutline size={16} /> Edit Batch</button>
                <button className={styles.outlineBtn} onClick={openTransferModal}><FaExchangeAlt size={14} /> Transfer to Nursery</button>
                <button className={styles.primaryBtn} onClick={() => {}}>
                  <IoPrintOutline size={16} /> Print Summary
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: '0.95rem' }}>
                Loading batch summary...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#EF4444', fontSize: '0.95rem' }}>
                {error}
              </div>
            ) : (
              <>
                <div className={styles.summarySubtitle}>Detailed overview of the hatch batch from spawning to fry production.</div>
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
                    <span className={styles.detailValue}>{batchData ? batchData.hatchbatchNo : 'HB-2025-006'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Site</span>
                    <span className={styles.detailValue}>{siteName}</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Injected</span>
                    <span className={styles.detailValue}>{batchData ? formatDate(batchData.dateInjected) : 'May 25, 2025'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Stripped</span>
                    <span className={styles.detailValue}>{batchData ? formatDate(batchData.dateStripped) : 'May 26, 2025'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Hatched</span>
                    <span className={styles.detailValue}>{batchData ? formatDate(batchData.dateHatched) : 'May 28, 2025'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Batch Status</span>
                    <StatusBadge status={batchData ? batchData.status : 'Completed'} />
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Created By</span>
                    <span className={styles.detailValue}>{batchData ? (batchData.createdBy?.length > 20 ? '—' : batchData.createdBy) : 'John Doe'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date Created</span>
                    <span className={styles.detailValue}>{batchData ? formatDateTime(batchData.createdAt) : 'May 25, 2025 08:45 AM'}</span>
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

              </div>

              {/* RIGHT COLUMN */}
              <div className={styles.summaryRight}>
                {/* Production Details */}
                <div className={styles.colCard}>
                  <h5>Production Details</h5>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Weight of Eggs (g)</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.weightOfEgg) : '1,200'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Estimated Fry Count</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.estimatedFryCount) : f(120000)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Hatchability (%)</span>
                    <span className={`${styles.detailValue} ${styles.successValue}`}>{batchData ? `${batchData.hatchabilityPercentage}%` : '75.4%'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fry Produced (Est.)</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.fryProduced) : f(87360)}</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fry Produced</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.fryProduced) : f(87360)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fry Moved</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.fryMoved || 0) : '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Mortality</span>
                    <span className={`${styles.detailValue} ${styles.dangerValue}`}>{batchData ? f(batchData.mortality || 0) : f(10720)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Survival Rate (%)</span>
                    <span className={`${styles.detailValue} ${styles.successValue}`}>{batchData ? `${batchData.survivalRate}%` : '89.2%'}</span>
                  </div>
                </div>

                {/* Broodstock Used */}
                <div className={styles.colCard}>
                  <h5>Broodstock Used</h5>
                  <div className={styles.broodstockGrid}>
                    <div>
                      <div className={styles.broodstockTagFemale}>
                        <BsGenderFemale size={14} /> Female Broodstock ({femaleCount})
                      </div>
                      <div className={styles.broodstockTotal}>
                        <span className={styles.totalItem}>Total Females: <strong>{femaleCount}</strong></span>
                        <span className={styles.totalItem}>Avg Weight: <strong>{avgFemaleWeight} kg</strong></span>
                      </div>
                    </div>
                    <div>
                      <div className={styles.broodstockTagMale}>
                        <BsGenderMale size={14} /> Male Broodstock ({maleCount})
                      </div>
                      <div className={styles.broodstockTotal}>
                        <span className={styles.totalItem}>Total Males: <strong>{maleCount}</strong></span>
                        <span className={styles.totalItem}>Avg Weight: <strong>{avgMaleWeight} kg</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Information */}
                <div className={styles.colCard} style={{ marginBottom: 0 }}>
                  <h5>Audit Information</h5>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>Created By</span>
                    <span className={styles.auditName}>{batchData ? (batchData.createdBy?.length > 20 ? '—' : batchData.createdBy) : 'John Doe'}</span>
                    <span className={styles.auditDate}>{batchData ? formatDateTime(batchData.createdAt) : 'May 25, 2025 08:45 AM'}</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>Last Updated By</span>
                    <span className={styles.auditName}>{batchData ? (batchData.updatedBy?.length > 20 ? '—' : batchData.updatedBy) : 'John Doe'}</span>
                    <span className={styles.auditDate}>{batchData ? formatDateTime(batchData.updatedAt) : 'May 28, 2025 02:35 PM'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Remarks / Notes */}
            <div className={styles.notesCard} style={{ marginTop: '20px' }}>
              <h5>Remarks / Notes</h5>
              <p>{batchData ? (batchData.comments || 'No remarks.') : 'Water temperature maintained between 27\u00B0C \u2013 29\u00B0C throughout incubation. Good water quality and aeration resulted in high hatchability.'}</p>
            </div>
              </>
            )}
          </main>

        </section>
      </div>
    </section>
  );
}

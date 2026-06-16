import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { GiCirclingFish, GiEggClutch } from 'react-icons/gi';
import { FaChartLine, FaExchangeAlt } from 'react-icons/fa';
import { IoArrowBackOutline, IoPrintOutline } from 'react-icons/io5';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api, { ApiV2 } from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const FALLBACK_INFO_CARDS = [
  { label: 'Eggs Produced', value: f(120000), sub: '1.20 kg', icon: GiEggClutch, color: '#8B5CF6' },
  { label: 'Hatchability Rate', value: '75.4%', sub: '90,480 hatched', icon: FaChartLine, color: '#22C55E' },
  { label: 'Fry Produced', value: f(87360), sub: 'Estimated', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Transferred to Nursery', value: f(66500), sub: 'Last: May 24, 2025', icon: FaExchangeAlt, color: '#3B82F6' },
];

const FALLBACK_TIMELINE = [
  { title: 'Date Injected', date: 'May 25, 2025 08:30 AM', detail: 'Eggs fertilized and placed in incubator', color: '#3B82F6', icon: '\u2022' },
  { title: 'Date Stripped', date: 'May 26, 2025 09:15 AM', detail: 'Eggs stripped from females', color: '#F97316', icon: '\u2022' },
  { title: 'Date Hatched', date: 'May 28, 2025 07:40 AM', detail: 'Larvae hatched successfully', color: '#22C55E', icon: '\u2022' },
  { title: 'Fry Counted', date: 'May 28, 2025 02:30 PM', detail: 'Fry counted and recorded', color: '#14B8A6', icon: '\u2022' },
  { title: 'Transferred to Nursery', date: 'May 24, 2025 10:20 AM', detail: 'Fry transferred to Nursery Pond N-01', color: '#8B5CF6', icon: '\u2022' },
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

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStep, setTransferStep] = useState('form');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [selectedPondId, setSelectedPondId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferError, setTransferError] = useState('');
  const [ponds, setPonds] = useState([]);
  const [pondsLoading, setPondsLoading] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const formatCurrency = (v) => '\u20A6' + f(v);

  const openTransferModal = () => {
    setTransferStep('form');
    setTransferSubmitting(false);
    setTransferResult(null);
    setSelectedPondId('');
    setTransferQty(batchData?.fryProduced || '');
    setTransferError('');
    setPonds([]);
    setPondsLoading(true);
    Api.get(`/fish-stages?siteId=${batchData?.siteId || 'all'}`).then(res => {
      let list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (list.length === 0 && batchData?.siteId) {
        return Api.get('/fish-stages?siteId=all').then(res2 => {
          setPonds(Array.isArray(res2.data?.data) ? res2.data.data : []);
        });
      }
      setPonds(list);
    }).catch(() => {}).finally(() => setPondsLoading(false));
    setShowTransferModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedPondId) {
      setTransferError('Please select a pond.');
      return;
    }
    if (!transferQty || Number(transferQty) <= 0) {
      setTransferError('Please enter a valid quantity.');
      return;
    }
    setTransferError('');
    setTransferStep('processing');
    setTransferSubmitting(true);
    try {
      const res = await ApiV2.post(`/v2/hatch-to-pond/${batchId}`, {
        pondId: selectedPondId,
        quantity: Number(transferQty),
      });
      setTransferResult(res.data?.data || res.data);
      setTransferStep('success');
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.response_message || d?.error?.message || d?.message || 'Transfer failed. Please try again.';
      setTransferError(typeof msg === 'string' ? msg : 'Transfer failed. Please try again.');
      setTransferStep('form');
    } finally {
      setTransferSubmitting(false);
    }
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
        if (i === 1) {
          updated.value = `${batchData.hatchabilityPercentage}%`;
          updated.sub = `${f(batchData.fryProduced)} hatched`;
        }
        if (i === 2) {
          updated.value = f(batchData.fryProduced);
          updated.sub = 'Actual';
        }
        if (i === 0) {
          updated.sub = `${batchData.weightOfEgg} kg`;
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

  const transferRows = (batchData?.events || [])
    .filter(ev => ev.action === 'transferred')
    .map(ev => ({
      date: formatDate(ev.date),
      dest: ev.details || 'Nursery Pond',
      qty: Number(ev.quantity) || 0,
      size: ev.size || '—',
    }));
  const totalTransferred = transferRows.reduce((s, r) => s + r.qty, 0);
  const pondTitle = ponds.find(p => p.id === selectedPondId)?.title || selectedPondId;

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
                <button className={styles.outlineBtn} onClick={() => navigate('/hatchery/hatch-batches/create', { state: { batch: batchData } })}>Edit Batch</button>
                <button className={styles.outlineBtn} onClick={openTransferModal}>Transfer to Nursery</button>
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
                    <span className={styles.detailValue}>{batchData ? '—' : 'John Doe'}</span>
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

                {/* Production Details */}
                <div className={styles.colCard}>
                  <h5>Production Details</h5>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Weight of Eggs (kg)</span>
                    <span className={styles.detailValue}>{batchData ? batchData.weightOfEgg : '1.20'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Number of Eggs</span>
                    <span className={styles.detailValue}>{f(120000)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Hatchability Percentage (%)</span>
                    <span className={`${styles.detailValue} ${styles.successValue}`}>{batchData ? `${batchData.hatchabilityPercentage}%` : '75.4%'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fry Produced (Estimated)</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.fryProduced) : f(87360)}</span>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Initial Fry Count</span>
                    <span className={styles.detailValue}>{batchData ? f(batchData.fryProduced) : f(87360)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Final Fry Count (7 Days)</span>
                    <span className={styles.detailValue}>{f(77920)}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className={styles.summaryRight}>
                {/* Broodstock Used */}
                <div className={styles.colCard}>
                  <h5>Broodstock Used</h5>
                  <div className={styles.broodstockGrid}>
                    <div>
                      <div className={styles.broodstockSubtitle}>Female Broodstock ({femaleCount})</div>
                      <div className={styles.broodstockTotal}>
                        <span className={styles.totalItem}>Total Females: <strong>{femaleCount}</strong></span>
                        <span className={styles.totalItem}>Avg Weight: <strong>{avgFemaleWeight} kg</strong></span>
                      </div>
                    </div>
                    <div>
                      <div className={styles.broodstockSubtitle}>Male Broodstock ({maleCount})</div>
                      <div className={styles.broodstockTotal}>
                        <span className={styles.totalItem}>Total Males: <strong>{maleCount}</strong></span>
                        <span className={styles.totalItem}>Avg Weight: <strong>{avgMaleWeight} kg</strong></span>
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
                  {transferRows.length > 0 ? (
                    <>
                      <div className={styles.tableWrapper}>
                        <table className={styles.broodstockMiniTable}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Destination</th>
                              <th>Qty</th>
                              <th>Avg Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transferRows.map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontSize: '0.8rem', color: '#8C949B' }}>{r.date}</td>
                                <td>{r.dest}</td>
                                <td>{f(r.qty)}</td>
                                <td>{r.size}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.transferTotal}>Total Transferred: {f(totalTransferred)}</div>
                    </>
                  ) : (
                    <p style={{ color: '#8C949B', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                      No transfers recorded yet.
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Remarks / Notes */}
            <div className={styles.notesCard}>
              <h5>Remarks / Notes</h5>
              <p>{batchData ? (batchData.comments || 'No remarks.') : 'Water temperature maintained between 27\u00B0C \u2013 29\u00B0C throughout incubation. Good water quality and aeration resulted in high hatchability.'}</p>
            </div>
              </>
            )}
          </main>

          {/* ===== TRANSFER TO NURSERY MODAL ===== */}
          {showTransferModal && (
            <>
              <style>{`
                @keyframes twFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
                @keyframes twSwim { 0%{transform:translateX(-40px)} 50%{transform:translateX(0)} 100%{transform:translateX(40px) scaleX(-1)} }
                @keyframes twBubble { 0%{transform:translateY(0) scale(1);opacity:.6} 100%{transform:translateY(-50px) scale(.3);opacity:0} }
                @keyframes twPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 50%{box-shadow:0 0 0 18px rgba(34,197,94,0)} }
                @keyframes twSlideUp { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
                @keyframes twScaleIn { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
                @keyframes twRipple { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.8);opacity:0} }
                @keyframes twProgress { 0%{width:0%} 100%{width:100%} }
                @keyframes twFadeInUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
                @keyframes twCelebrate { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
              `}</style>
              <div style={{
                position:'fixed', inset:0, zIndex:1050,
                background:'rgba(15,23,42,0.55)',
                backdropFilter:'blur(6px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:20,
                animation:'twSlideUp .25s ease',
              }} onClick={() => transferStep !== 'processing' && setShowTransferModal(false)}>
                <div style={{
                  background:'#fff', borderRadius:24, maxWidth:520, width:'100%',
                  boxShadow:'0 32px 80px rgba(0,0,0,0.2)',
                  overflow:'hidden', position:'relative',
                  animation:'twScaleIn .3s ease',
                }} onClick={e => e.stopPropagation()}>

                  {/* CLOSE BUTTON */}
                  {transferStep !== 'processing' && (
                    <button onClick={() => setShowTransferModal(false)} style={{
                      position:'absolute', top:14, right:16, zIndex:10,
                      border:'none', background:'rgba(0,0,0,0.06)', color:'#6B7280',
                      width:32, height:32, borderRadius:'50%',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', fontSize:'1.1rem', lineHeight:1,
                      transition:'all .2s',
                    }} onMouseOver={e => e.currentTarget.style.background='rgba(0,0,0,0.12)'}
                       onMouseOut={e => e.currentTarget.style.background='rgba(0,0,0,0.06)'}>&times;</button>
                  )}

                  {transferStep === 'form' && (
                    <div style={{ padding:32 }}>
                      {/* HEADER */}
                      <div style={{ textAlign:'center', marginBottom:28 }}>
                        <div style={{
                          width:64, height:64, borderRadius:'50%',
                          background:'linear-gradient(135deg,#512728,#6B3536)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          margin:'0 auto 16px',
                          animation:'twFloat 3s ease-in-out infinite',
                        }}>
                          <FaExchangeAlt size={26} color="#E8D5D5" style={{ transform:'rotate(90deg)' }} />
                        </div>
                        <h4 style={{ fontWeight:700, fontSize:'1.25rem', color:'#1F2937', margin:'0 0 6px' }}>
                          Transfer to Nursery
                        </h4>
                        <p style={{ color:'#6B7280', fontSize:'0.85rem', margin:0 }}>
                          Move fry from <strong>{batchData?.hatchbatchNo || 'this batch'}</strong> to a nursery pond
                        </p>
                      </div>

                      {/* BATCH PREVIEW CARD */}
                      <div style={{
                        background:'linear-gradient(135deg,#FDF2F2,#FCE8E8)',
                        borderRadius:14, padding:16, marginBottom:24,
                        border:'1px solid #F3CDCD',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:'0.72rem', color:'#512728', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Batch Details</span>
                          <StatusBadge status={batchData?.status} />
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div>
                            <div style={{ fontSize:'0.82rem', color:'#374151' }}>
                              <span style={{ color:'#6B7280' }}>Batch:</span> <strong>{batchData?.hatchbatchNo}</strong>
                            </div>
                            <div style={{ fontSize:'0.82rem', color:'#374151', marginTop:2 }}>
                              <span style={{ color:'#6B7280' }}>Fry Available:</span> <strong>{batchData ? f(batchData.fryProduced) : '—'}</strong>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'0.82rem', color:'#374151' }}>
                              <span style={{ color:'#6B7280' }}>Site:</span> {siteName}
                            </div>
                            <div style={{ fontSize:'0.82rem', color:'#374151', marginTop:2 }}>
                              <span style={{ color:'#6B7280' }}>Hatched:</span> {batchData ? formatDate(batchData.dateHatched) : '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FORM FIELDS */}
                      <div style={{ marginBottom:20 }}>
                        <label style={{
                          display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:6,
                        }}>
                          <span style={{ color:'#dc3545' }}>*</span> Destination Pond
                        </label>
                        <div style={{ position:'relative' }}>
                          <select value={selectedPondId} onChange={e => setSelectedPondId(e.target.value)}
                            style={{
                              width:'100%', padding:'11px 14px 11px 40px',
                              border:'1.5px solid ' + (transferError && !selectedPondId ? '#EF4444' : '#E5E7EB'),
                              borderRadius:12, fontSize:'0.88rem', color:'#1F2937',
                              outline:'none', background:'#F9FAFB',
                              appearance:'none', cursor:'pointer',
                              transition:'border-color .2s',
                            }}
                            onFocus={e => { e.target.style.borderColor='#512728'; e.target.style.background='#fff'; }}
                            onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }}>
                            <option value="">{pondsLoading ? 'Loading ponds…' : (ponds.length === 0 ? 'No ponds available' : 'Select a pond')}</option>
                            {ponds.map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                          <span style={{
                            position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                            color:'#9CA3AF', fontSize:'1rem', pointerEvents:'none',
                          }}>🌿</span>
                        </div>
                      </div>

                      <div style={{ marginBottom:24 }}>
                        <label style={{
                          display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:6,
                        }}>
                          <span style={{ color:'#dc3545' }}>*</span> Quantity to Transfer
                        </label>
                        <div style={{ position:'relative' }}>
                          <input type="number" value={transferQty} onChange={e => setTransferQty(e.target.value)}
                            placeholder="0"
                            style={{
                              width:'100%', padding:'11px 14px 11px 40px',
                              border:'1.5px solid ' + (transferError && (!transferQty || Number(transferQty) <= 0) ? '#EF4444' : '#E5E7EB'),
                              borderRadius:12, fontSize:'0.88rem', color:'#1F2937',
                              outline:'none', background:'#F9FAFB',
                              transition:'border-color .2s',
                            }}
                            onFocus={e => { e.target.style.borderColor='#512728'; e.target.style.background='#fff'; }}
                            onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }} />
                          <span style={{
                            position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                            color:'#9CA3AF', fontSize:'0.85rem', pointerEvents:'none', fontWeight:600,
                          }}>#</span>
                        </div>
                        {transferError && (
                          <p style={{ color:'#EF4444', fontSize:'0.78rem', margin:'6px 0 0' }}>{transferError}</p>
                        )}
                      </div>

                      {/* DECORATIVE FISH */}
                      <div style={{
                        textAlign:'center', marginBottom:20, position:'relative', height:30, overflow:'hidden',
                      }}>
                        <span style={{
                          display:'inline-block', fontSize:'1.2rem', opacity:0.2,
                          animation:'twSwim 4s ease-in-out infinite',
                        }}>🐟</span>
                        <span style={{
                          display:'inline-block', fontSize:'0.8rem', opacity:0.15,
                          position:'absolute', left:'35%', bottom:0,
                          animation:'twBubble 3s ease-in-out infinite',
                        }}>○</span>
                        <span style={{
                          display:'inline-block', fontSize:'0.6rem', opacity:0.1,
                          position:'absolute', right:'30%', bottom:2,
                          animation:'twBubble 2.5s ease-in-out infinite 0.5s',
                        }}>○</span>
                      </div>

                      {/* ACTIONS */}
                      <div style={{ display:'flex', gap:12 }}>
                        <button onClick={() => setShowTransferModal(false)} style={{
                          flex:1, padding:'12px 0',
                          border:'1.5px solid #E5E7EB', borderRadius:12,
                          background:'#fff', color:'#6B7280',
                          fontSize:'0.88rem', fontWeight:600, cursor:'pointer',
                          transition:'all .2s',
                        }} onMouseOver={e => { e.currentTarget.style.borderColor='#D1D5DB'; e.currentTarget.style.background='#F9FAFB'; }}
                           onMouseOut={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.background='#fff'; }}>Cancel</button>
                        <button onClick={handleTransfer} disabled={transferSubmitting} style={{
                          flex:1, padding:'12px 0',
                          border:'none', borderRadius:12,
                          background:'linear-gradient(135deg,#512728,#6B3536)',
                          color:'#fff', fontSize:'0.88rem', fontWeight:600, cursor:'pointer',
                          opacity:transferSubmitting ? 0.7 : 1,
                          transition:'all .2s',
                        }} onMouseOver={e => !transferSubmitting && (e.currentTarget.style.background='linear-gradient(135deg,#3D1E1F,#512728)')}
                           onMouseOut={e => !transferSubmitting && (e.currentTarget.style.background='linear-gradient(135deg,#512728,#6B3536)')}>
                          {transferSubmitting ? 'Preparing…' : '🚀 Start Transfer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {transferStep === 'processing' && (
                    <div style={{ padding:48, textAlign:'center' }}>
                      {/* ANIMATED SCENE */}
                      <div style={{ position:'relative', height:160, marginBottom:32 }}>
                        {/* Water wave background */}
                        <div style={{
                          position:'absolute', inset:0, top:'40%',
                          background:'linear-gradient(180deg, #DBEAFE 0%, #BFDBFE 100%)',
                          borderRadius:'50% 50% 0 0',
                        }} />
                        {/* Hatchery icon */}
                        <div style={{
                          position:'absolute', left:'12%', top:'30%',
                          fontSize:'2rem', opacity:0.8, animation:'twFloat 2.5s ease-in-out infinite',
                        }}>🏭</div>
                        {/* Pond icon */}
                        <div style={{
                          position:'absolute', right:'12%', top:'30%',
                          fontSize:'2.2rem', opacity:0.8, animation:'twFloat 3s ease-in-out infinite 0.5s',
                        }}>🌊</div>
                        {/* Swimming fish */}
                        <div style={{
                          position:'absolute', left:'25%', top:'45%', fontSize:'1.8rem',
                          animation:'twSwim 2.5s ease-in-out infinite',
                        }}>🐟</div>
                        <div style={{
                          position:'absolute', left:'40%', top:'55%', fontSize:'1.4rem',
                          animation:'twSwim 3s ease-in-out infinite 0.4s',
                        }}>🐟</div>
                        <div style={{
                          position:'absolute', left:'55%', top:'42%', fontSize:'1.5rem',
                          animation:'twSwim 2.8s ease-in-out infinite 0.8s',
                        }}>🐟</div>
                        {/* Bubbles */}
                        <span style={{ position:'absolute', left:'30%', bottom:0, fontSize:'0.7rem', opacity:0.3, animation:'twBubble 2s ease-in-out infinite' }}>○</span>
                        <span style={{ position:'absolute', right:'35%', bottom:2, fontSize:'0.5rem', opacity:0.2, animation:'twBubble 2.5s ease-in-out infinite 0.3s' }}>○</span>
                        <span style={{ position:'absolute', left:'50%', bottom:0, fontSize:'0.6rem', opacity:0.25, animation:'twBubble 1.8s ease-in-out infinite 0.7s' }}>○</span>
                      </div>

                      <h4 style={{ fontWeight:700, fontSize:'1.1rem', color:'#1F2937', margin:'0 0 8px' }}>
                        Transferring Fry…
                      </h4>
                      <p style={{ color:'#6B7280', fontSize:'0.85rem', margin:'0 0 24px' }}>
                        Moving <strong>{f(Number(transferQty))}</strong> fry to <strong>{pondTitle}</strong>
                      </p>

                      {/* PROGRESS BAR */}
                      <div style={{
                        width:'100%', height:6, background:'#E5E7EB', borderRadius:3, overflow:'hidden',
                        marginBottom:8,
                      }}>
                        <div style={{
                          height:'100%', borderRadius:3,
                          background:'linear-gradient(90deg,#512728,#22C55E)',
                          animation:'twProgress 2.5s ease-in-out infinite',
                        }} />
                      </div>
                      <p style={{ color:'#9CA3AF', fontSize:'0.75rem', margin:0, animation:'twPulse 2s infinite' }}>
                        Please wait while the transfer is being processed…
                      </p>
                    </div>
                  )}

                  {transferStep === 'success' && transferResult && (
                    <div style={{ padding:32 }}>
                      {/* CELEBRATION HEADER */}
                      <div style={{ textAlign:'center', marginBottom:24 }}>
                        <div style={{
                          width:72, height:72, borderRadius:'50%',
                          background:'linear-gradient(135deg,#FCE8E8,#F3CDCD)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          margin:'0 auto 16px',
                          animation:'twCelebrate .6s ease',
                        }}>
                          <span style={{ fontSize:'2rem' }}>🎉</span>
                        </div>
                        <h4 style={{ fontWeight:700, fontSize:'1.25rem', color:'#512728', margin:'0 0 6px' }}>
                          Transfer Complete!
                        </h4>
                        <p style={{ color:'#6B7280', fontSize:'0.85rem', margin:0 }}>
                          {transferResult.pond?.title
                            ? `Batch successfully moved to ${transferResult.pond.title}`
                            : 'Batch successfully transferred to nursery'}
                        </p>
                      </div>

                      {/* RESULT CARD */}
                      <div style={{
                        background:'linear-gradient(135deg,#FDF2F2,#FCE8E8)',
                        borderRadius:16, padding:20, marginBottom:24,
                        border:'1px solid #F3CDCD',
                        animation:'twFadeInUp .4s ease .15s both',
                      }}>
                        {/* Pond & Batch columns */}
                        <div style={{ display:'flex', gap:16 }}>
                          {/* Pond info */}
                          <div style={{ flex:1, background:'#fff', borderRadius:12, padding:16, border:'1px solid #E5E7EB' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                              <span style={{ fontSize:'1.2rem' }}>🌿</span>
                              <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#512728', textTransform:'uppercase', letterSpacing:'0.04em' }}>Pond</span>
                            </div>
                            <div style={{ fontSize:'0.95rem', fontWeight:600, color:'#1F2937' }}>{transferResult.pond?.title || 'Nursery Pond'}</div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'0.8rem', color:'#6B7280' }}>
                              <span>Quantity: <strong style={{ color:'#512728' }}>{transferResult.pond?.quantity ? f(transferResult.pond.quantity) : f(Number(transferQty))}</strong></span>
                              <span>Batch #<strong>{transferResult.pond?.batchNumber || '—'}</strong></span>
                            </div>
                          </div>
                          {/* Batch status */}
                          <div style={{ flex:1, background:'#fff', borderRadius:12, padding:16, border:'1px solid #E5E7EB' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                              <span style={{ fontSize:'1.2rem' }}>📦</span>
                              <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#512728', textTransform:'uppercase', letterSpacing:'0.04em' }}>Batch</span>
                            </div>
                            <div style={{ fontSize:'0.95rem', fontWeight:600, color:'#1F2937' }}>{transferResult.hatchBatch?.hatchbatchNo || batchData?.hatchbatchNo}</div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'0.8rem', color:'#6B7280' }}>
                              <span>Status: <StatusBadge status={transferResult.hatchBatch?.status || 'moved'} /></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FUN CELEBRATION ELEMENTS */}
                      <div style={{
                        display:'flex', justifyContent:'center', gap:6, marginBottom:24,
                        fontSize:'1.4rem',
                      }}>
                        <span style={{ animation:'twFloat 2s ease-in-out infinite' }}>🐟</span>
                        <span style={{ animation:'twFloat 2.2s ease-in-out infinite .2s' }}>🐠</span>
                        <span style={{ animation:'twFloat 1.8s ease-in-out infinite .4s' }}>🐡</span>
                        <span style={{ animation:'twFloat 2.5s ease-in-out infinite .1s' }}>🐟</span>
                      </div>

                      {/* SUCCESS MESSAGE */}
                      {transferResult.message && (
                        <div style={{
                          textAlign:'center', marginBottom:24,
                          animation:'twFadeInUp .4s ease .3s both',
                        }}>
                          <p style={{ color:'#512728', fontSize:'0.88rem', fontStyle:'italic', margin:0 }}>
                            "{transferResult.message}"
                          </p>
                        </div>
                      )}

                      {/* ACTIONS */}
                      <div style={{ display:'flex', gap:12 }}>
                        <button onClick={() => { setShowTransferModal(false); window.location.reload(); }} style={{
                          flex:1, padding:'12px 0',
                          border:'1.5px solid #E5E7EB', borderRadius:12,
                          background:'#fff', color:'#6B7280',
                          fontSize:'0.88rem', fontWeight:600, cursor:'pointer',
                          transition:'all .2s',
                        }} onMouseOver={e => { e.currentTarget.style.borderColor='#D1D5DB'; e.currentTarget.style.background='#F9FAFB'; }}
                           onMouseOut={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.background='#fff'; }}>
                          Close
                        </button>
                        <button onClick={() => { setShowTransferModal(false); navigate('/hatchery/hatch-batches/view-all'); }} style={{
                          flex:1, padding:'12px 0',
                          border:'none', borderRadius:12,
                          background:'linear-gradient(135deg,#512728,#6B3536)',
                          color:'#fff', fontSize:'0.88rem', fontWeight:600, cursor:'pointer',
                          transition:'all .2s',
                        }} onMouseOver={e => e.currentTarget.style.background='linear-gradient(135deg,#3D1E1F,#512728)'}
                           onMouseOut={e => e.currentTarget.style.background='linear-gradient(135deg,#512728,#6B3536)'}>
                          View All Batches →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

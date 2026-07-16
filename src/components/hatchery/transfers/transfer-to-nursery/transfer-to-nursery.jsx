import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import CustomDropdown from "../../../shared/custom-dropdown/CustomDropdown";
import { toast } from 'react-toastify';
import { FaExchangeAlt, FaArrowLeft, FaClock, FaCheckCircle } from 'react-icons/fa';
import { BsFileText, BsInfoCircle } from 'react-icons/bs';
import { GiCirclingFish } from 'react-icons/gi';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api, { ApiV2 } from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

export default function TransferToNursery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');

  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const [batchData, setBatchData] = useState(null);
  const [sites, setSites] = useState([]);
  const [pageLoading, setPageLoading] = useState(!!batchId);
  const [pageError, setPageError] = useState('');

  const [ponds, setPonds] = useState([]);
  const [pondsLoading, setPondsLoading] = useState(false);

  const [selectedPondId, setSelectedPondId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [sourceTank, setSourceTank] = useState('');
  const [avgSize, setAvgSize] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [shooterCount, setShooterCount] = useState('');

  const [transferStep, setTransferStep] = useState('form');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [transferError, setTransferError] = useState('');
  const [wasSavedAsDraft, setWasSavedAsDraft] = useState(false);

  useEffect(() => {
    if (!batchId) {
      setPageLoading(false);
      setPageError('No batch selected. Select a batch first.');
      return;
    }
    const init = async () => {
      setPageLoading(true);
      setPageError('');
      try {
        const [batchRes, sitesRes] = await Promise.all([
          ApiV2.get(`/v2/hatch-batches/${batchId}`),
          ApiV2.get('/v2/all-site'),
        ]);
        const data = batchRes.data?.data || batchRes.data;
        setBatchData(data);
        setSites(Array.isArray(sitesRes.data?.data) ? sitesRes.data.data : []);
        setTransferQty(data.fryProduced || '');
        setTransferDate(new Date().toISOString().split('T')[0]);

        setPondsLoading(true);
        try {
          const siteParam = isSuperAdmin ? (data.siteId || 'all') : (user?.siteId || 'all');
          const pondsRes = await Api.get(`/fish-stages?siteId=${siteParam}`);
          let list = Array.isArray(pondsRes.data?.data) ? pondsRes.data.data : [];
          if (list.length === 0 && siteParam !== 'all' && isSuperAdmin) {
            const fallback = await Api.get('/fish-stages?siteId=all');
            list = Array.isArray(fallback.data?.data) ? fallback.data.data : [];
          }
          setPonds(list);
        } catch {
        } finally {
          setPondsLoading(false);
        }
      } catch {
        setPageError('Failed to load batch data.');
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [batchId]);

  const handleTransfer = async (isDraft) => {
    if (!selectedPondId) { setTransferError('Please select a destination pond.'); return; }
    if (!transferQty || Number(transferQty) <= 0) { setTransferError('Please enter a valid quantity.'); return; }
    setTransferError('');
    setTransferStep('processing');
    setTransferSubmitting(true);
    setWasSavedAsDraft(isDraft);
    try {
      const res = await ApiV2.post(`/v2/hatch-to-pond/${batchId}`, {
        pondId: selectedPondId,
        quantity: Number(transferQty),
        shooterCount: shooterCount ? Number(shooterCount) : undefined,
      });
      setTransferResult(res.data?.data || res.data);
      if (isDraft) {
        toast.success('Transfer saved as draft.');
        setTransferStep('form');
        setTransferSubmitting(false);
      } else {
        setTransferStep('success');
        setTransferSubmitting(false);
      }
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.response_message || d?.error?.message || d?.message || 'Transfer failed. Please try again.';
      setTransferError(typeof msg === 'string' ? msg : 'Transfer failed. Please try again.');
      setTransferStep('form');
      setTransferSubmitting(false);
    }
  };

  const siteName = sites.find(s => s.id === batchData?.siteId)?.name || '—';

  return (
    <section className={`${styles.body}`}>
      <style>{`
        @keyframes v2TwFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes v2TwBubble { 0%{transform:translateY(0) scale(1);opacity:.6} 100%{transform:translateY(-50px) scale(.3);opacity:0} }
        @keyframes v2TwProgress { 0%{width:5%} 60%{width:70%} 100%{width:100%} }
        @keyframes v2TwScaleIn { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
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

            {pageLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8C949B' }}>Loading batch data...</div>
            ) : pageError ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#dc3545' }}>{pageError}</div>
            ) : transferStep === 'processing' ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ position: 'relative', height: 160, marginBottom: 32 }}>
                  <div style={{
                    position: 'absolute', inset: 0, top: '40%',
                    background: 'linear-gradient(180deg, #DBEAFE 0%, #BFDBFE 100%)',
                    borderRadius: 12,
                  }} />
                  <div style={{
                    position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%)',
                    fontSize: '2.8rem', animation: 'v2TwFloat 1.5s ease-in-out infinite',
                  }}>🐟</div>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      position: 'absolute', left: `${25 + i * 18}%`, bottom: '25%',
                      width: 8 + i * 2, height: 8 + i * 2, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.5)',
                      animation: `v2TwBubble ${1.5 + i * 0.4}s ease-in-out infinite ${i * 0.3}s`,
                    }} />
                  ))}
                  <div style={{
                    position: 'absolute', bottom: '18%', left: 0, right: 0, height: 2,
                    background: 'rgba(255,255,255,0.3)', borderRadius: 1,
                  }} />
                </div>
                <div style={{
                  width: '80%', height: 6, background: '#E5E7EB', borderRadius: 3,
                  margin: '0 auto 20px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: 'linear-gradient(90deg,#512728,#8B4546)',
                    animation: 'v2TwProgress 2.5s ease-in-out forwards',
                  }} />
                </div>
                <h5 style={{ fontWeight: 700, color: '#1F2937', margin: '0 0 6px' }}>Transferring Fry</h5>
                <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
                  Moving {f(Number(transferQty))} fry to {ponds.find(p => p.id === selectedPondId)?.title || selectedPondId}...
                </p>
              </div>
            ) : transferStep === 'success' ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: '#E8F5E9', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  animation: 'v2TwScaleIn .5s ease',
                  boxShadow: '0 0 0 4px rgba(34,197,94,0.15)',
                }}>
                  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1F2937', margin: '0 0 6px' }}>
                  Transfer Initiated!
                </h4>
                <p style={{ color: '#6B7280', fontSize: '0.88rem', margin: '0 0 24px' }}>
                  Fry has been scheduled for transfer to the nursery pond.
                </p>
                <div style={{
                  background: '#F9FAFB', borderRadius: 14, padding: 16,
                  marginBottom: 24, textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Batch</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1F2937' }}>{batchData?.hatchbatchNo || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Destination</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1F2937' }}>{ponds.find(p => p.id === selectedPondId)?.title || selectedPondId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quantity</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#22C55E' }}>{f(Number(transferQty))} fry</span>
                  </div>
                </div>
                <button onClick={() => navigate(-1)} style={{
                  width: '100%', padding: '12px 0',
                  border: 'none', borderRadius: 12,
                  background: 'linear-gradient(135deg,#512728,#6B3536)',
                  color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all .2s',
                }} onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg,#3D1E1F,#512728)'}
                   onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg,#512728,#6B3536)'}>
                  Done
                </button>
              </div>
            ) : (
              <div className={styles.transferTwoCol}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <BsFileText size={20} color="#F97316" />
                    <h5>Transfer Information</h5>
                  </div>

                  {transferError && (
                    <div style={{
                      background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                      padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#B91C1C',
                    }}>
                      {transferError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Hatch Batch <span style={{ color: '#dc3545' }}>*</span>
                      </Form.Label>
                      <CustomDropdown
                        options={[{ value: batchData?.hatchbatchNo || '', label: batchData?.hatchbatchNo || '—' }]}
                        value={batchData?.hatchbatchNo || ''}
                        disabled
                      />
                      <small style={{ color: '#8C949B', fontSize: '0.75rem' }}>
                        Site: {siteName}
                      </small>
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Source Hatchery Tank / Unit <span style={{ color: '#dc3545' }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter tank / unit"
                        value={sourceTank}
                        onChange={(e) => setSourceTank(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Destination Nursery Pond <span style={{ color: '#dc3545' }}>*</span>
                      </Form.Label>
                      <CustomDropdown
                        options={ponds.map(p => ({ value: p.id, label: p.title }))}
                        value={selectedPondId}
                        onChange={(val) => { setSelectedPondId(val); setTransferError(''); }}
                        placeholder={pondsLoading ? 'Loading ponds...' : (ponds.length === 0 ? 'No ponds available' : 'Select a pond')}
                        disabled={pondsLoading}
                      />
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Transfer Date <span style={{ color: '#dc3545' }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Transfer Quantity (pcs) <span style={{ color: '#dc3545' }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={transferQty}
                        onChange={(e) => { setTransferQty(e.target.value); setTransferError(''); }}
                      />
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Estimated Avg. Size
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 0.45 g"
                        value={avgSize}
                        onChange={(e) => setAvgSize(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Recorded By <span style={{ color: '#dc3545' }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your name"
                        value={recordedBy}
                        onChange={(e) => setRecordedBy(e.target.value)}
                      />
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
                    <div className="col-md-6">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        Number of Shooter
                      </Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Enter count (optional)"
                        value={shooterCount}
                        onChange={(e) => setShooterCount(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className={styles.createActions}>
                    <button
                      className={styles.outlineBtn}
                      disabled={transferSubmitting}
                      onClick={() => handleTransfer(true)}
                    >
                      {transferSubmitting ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                      className={styles.primaryBtn}
                      disabled={transferSubmitting}
                      onClick={() => handleTransfer(false)}
                    >
                      <FaCheckCircle size={14} /> {transferSubmitting ? 'Transferring...' : 'Complete Transfer'}
                    </button>
                  </div>
                </div>

                <div className={styles.transferRightStack}>
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <BsFileText size={20} color="#3B82F6" />
                      <h5>Transfer Summary</h5>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Total Fry Count (Current)</span>
                      <span className={styles.detailValue}>{batchData ? f(Number(batchData.fryProduced) || 0) : '—'} pcs</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Number of Shooter</span>
                      <span className={styles.detailValue}>{shooterCount ? f(Number(shooterCount)) : '—'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Available for Transfer</span>
                      <span className={styles.detailValue}>{batchData ? f(Number(batchData.fryProduced) || 0) : '—'} pcs</span>
                    </div>
                    <div className={styles.detailDivider} />
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Transfer Quantity</span>
                      <span className={styles.transferSummaryValue}>{transferQty ? f(Number(transferQty)) : 0} pcs</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Remaining After Transfer</span>
                      <span className={styles.remainingValue}>
                        {batchData && transferQty ? f(Math.max(0, Number(batchData.fryProduced) - Number(transferQty))) : '—'} pcs
                      </span>
                    </div>
                  </div>

                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <FaClock size={20} color="#8C949B" />
                      <h5>Batch Details</h5>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Batch No</span>
                      <span className={styles.detailValue}>{batchData?.hatchbatchNo || '—'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Site</span>
                      <span className={styles.detailValue}>{siteName}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Fry Produced</span>
                      <span className={styles.detailValue}>{batchData ? f(Number(batchData.fryProduced) || 0) : '—'} pcs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {transferStep === 'form' && (
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
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

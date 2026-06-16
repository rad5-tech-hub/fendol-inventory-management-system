import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Pagination, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { IoSearchOutline, IoFilterOutline, IoRefreshOutline, IoEyeOutline, IoPencilOutline, IoSendOutline, IoTrashOutline } from 'react-icons/io5';
import { GiCirclingFish } from 'react-icons/gi';
import { FaChartLine, FaCheckCircle, FaPlus, FaExchangeAlt } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api, { ApiV2 } from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const hatchabilityColor = (v) => {
  if (v >= 70) return { bg: '#E8F5E9', color: '#22C55E' };
  if (v >= 50) return { bg: '#FFF3E0', color: '#F97316' };
  return { bg: '#FFEBEE', color: '#EF4444' };
};

const FALLBACK_STATS = [
  { label: 'Active Batches', value: '—', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Completed Batches', value: '—', icon: FaCheckCircle, color: '#22C55E' },
  { label: 'Total Fry Produced', value: '—', icon: GiCirclingFish, color: '#3B82F6' },
  { label: 'Average Hatchability', value: '—', icon: FaChartLine, color: '#8B5CF6' },
];

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapApiBatchToRow = (item) => ({
  id: item.id,
  batchNo: item.hatchbatchNo,
  dateInjected: formatDate(item.dateInjected),
  dateStripped: formatDate(item.dateStripped),
  dateHatched: formatDate(item.dateHatched),
  _dateInjected: item.dateInjected || '',
  _dateStripped: item.dateStripped || '',
  _dateHatched: item.dateHatched || '',
  females: item.noOfFemaleBroodstock,
  males: item.maleBroodStock,
  eggWeight: Number(item.weightOfEgg),
  hatchability: Number(item.hatchabilityPercentage),
  fryProduced: item.fryProduced,
  siteId: item.siteId,
  status: item.status,
  comments: item.comments,
});

export default function ViewAllBatches() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSiteId, setFilterSiteId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sites, setSites] = useState([]);

  const [transferBatch, setTransferBatch] = useState(null);
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

  const openTransferModal = (row) => {
    setTransferBatch(row);
    setTransferStep('form');
    setTransferSubmitting(false);
    setTransferResult(null);
    setSelectedPondId('');
    setTransferQty(row.fryProduced || '');
    setTransferError('');
    setPonds([]);
    setPondsLoading(true);
    Api.get(`/fish-stages?siteId=${row.siteId || 'all'}`).then(res => {
      let list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (list.length === 0 && row.siteId) {
        return Api.get('/fish-stages?siteId=all').then(res2 => {
          setPonds(Array.isArray(res2.data?.data) ? res2.data.data : []);
        });
      }
      setPonds(list);
    }).catch(() => {}).finally(() => setPondsLoading(false));
    setShowTransferModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedPondId) { setTransferError('Please select a pond.'); return; }
    if (!transferQty || Number(transferQty) <= 0) { setTransferError('Please enter a valid quantity.'); return; }
    setTransferError('');
    setTransferStep('processing');
    setTransferSubmitting(true);
    try {
      const res = await ApiV2.post(`/v2/hatch-to-pond/${transferBatch.id}`, {
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

  const StatusBadge = ({ status }) => {
    const colors = {
      active: { bg: '#E8F5E9', color: '#2E7D32' },
      completed: { bg: '#E3F2FD', color: '#1565C0' },
      pending: { bg: '#FFF8E1', color: '#F57F17' },
    };
    const s = (status || '').toLowerCase();
    const palette = colors[s] || { bg: '#F3F4F6', color: '#374151' };
    return <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', fontWeight:600, lineHeight:1, background:palette.bg, color:palette.color }}>{status || 'N/A'}</span>;
  };

  const fDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const siteName = transferBatch
    ? (sites.find((s) => s.id === transferBatch.siteId)?.name || 'Unknown Site')
    : '';

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await ApiV2.get('/v2/hatch-batches');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setBatches(data.map(mapApiBatchToRow));
        setError('');
      } catch {
        setError('Failed to load hatch batches.');
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setSites(data);
      } catch {
        setSites([]);
      }
    };
    fetchSites();
  }, []);

  const filteredBatches = batches.filter((b) => {
    if (searchTerm && !b.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterSiteId && b.siteId !== filterSiteId) return false;
    if (filterDateFrom && b._dateInjected && b._dateInjected < filterDateFrom) return false;
    if (filterDateTo && b._dateInjected && b._dateInjected > filterDateTo) return false;
    return true;
  });

  const dateMin = batches.length > 0
    ? batches.reduce((min, b) => b._dateInjected && b._dateInjected < min ? b._dateInjected : min, batches[0]._dateInjected || '')
    : '';
  const dateMax = batches.length > 0
    ? batches.reduce((max, b) => b._dateInjected && b._dateInjected > max ? b._dateInjected : max, batches[0]._dateInjected || '')
    : '';

  const handleReset = () => {
    setSearchTerm('');
    setFilterSiteId('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const statCards = batches.length > 0
    ? [
        { label: 'Active Batches', value: String(batches.filter(b => b.status === 'active').length), icon: GiCirclingFish, color: '#F97316' },
        { label: 'Completed Batches', value: String(batches.filter(b => b.status === 'completed').length), icon: FaCheckCircle, color: '#22C55E' },
        { label: 'Total Fry Produced', value: f(batches.reduce((s, b) => s + (b.fryProduced || 0), 0)), icon: GiCirclingFish, color: '#3B82F6' },
        { label: 'Average Hatchability', value: (batches.reduce((s, b) => s + (b.hatchability || 0), 0) / batches.length).toFixed(1) + '%', icon: FaChartLine, color: '#8B5CF6' },
      ]
    : FALLBACK_STATS;

  const ActionDropdown = ({ row }) => {
    const [open, setOpen] = useState(false);
    return (
      <Dropdown show={open} onToggle={setOpen} align="end">
        <Dropdown.Toggle as="button" className={styles.threeDotBtn} onClick={() => setOpen(!open)}>
          <BsThreeDotsVertical size={16} />
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ minWidth: 210 }}>
          <Dropdown.Item onClick={() => navigate(`/hatchery/hatch-batches/summary/${row.id}`)}>
            <IoEyeOutline size={16} style={{ marginRight: 10 }} /> View Summary
          </Dropdown.Item>
          <Dropdown.Item onClick={() => navigate('/hatchery/hatch-batches/create', { state: { batch: row } })}>
            <IoPencilOutline size={16} style={{ marginRight: 10 }} /> Edit Batch
          </Dropdown.Item>
          <Dropdown.Item onClick={() => { setOpen(false); openTransferModal(row); }}>
            <IoSendOutline size={16} style={{ marginRight: 10 }} /> Transfer to Nursery
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => {}} style={{ color: '#dc3545', fontWeight: 600 }}>
            <IoTrashOutline size={16} style={{ marginRight: 10 }} /> Delete Batch
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  };

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
              <span>Hatch Batches</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>All Batches</span>
            </div>

              <div className={styles.pageHeader}>
                <h4>All Hatch Batches</h4>
                <div className={styles.headerActions}>
                  <button className={styles.primaryBtn} onClick={() => navigate('/hatchery/hatch-batches/create')}>
                    <FaPlus size={12} /> New Hatch Batch
                  </button>
                </div>
              </div>

            <div className={styles.statGrid}>
              {statCards.map((card, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <div className={styles.statIcon} style={{ background: card.color + '1A' }}>
                      <card.icon size={20} color={card.color} />
                    </div>
                    <span className={styles.statLabel}>{card.label}</span>
                  </div>
                  <div className={styles.statValue}>{card.value}</div>
                  <div className={styles.statLink} onClick={() => {}}>View details &rarr;</div>
                </div>
              ))}
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <input type="text" placeholder="Search batch number&hellip;" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <IoSearchOutline size={16} className={styles.searchIcon} />
              </div>
              <div className={styles.filterSelect}>
                <Form.Select value={filterSiteId} onChange={(e) => setFilterSiteId(e.target.value)}>
                  <option value="">All Sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </div>
              <div className={styles.dateRange}>
                <IoFilterOutline size={14} />
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, marginRight: 2 }}>From</span>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} min={dateMin} max={dateMax} style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', color: '#374151', outline: 'none', width: 120, cursor: 'pointer' }} />
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, margin: '0 2px 0 6px' }}>To</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} min={dateMin} max={dateMax} style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', color: '#374151', outline: 'none', width: 120, cursor: 'pointer' }} />
              </div>
              <button className={styles.resetBtn} onClick={handleReset}>
                <IoRefreshOutline size={14} /> Reset
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className="text-start">Batch Number <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Date Injected <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Date Stripped <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Date Hatched <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-end">Females</th>
                    <th className="text-end">Males</th>
                    <th className="text-end">Egg Wt (kg)</th>
                    <th className="text-end">Hatchability</th>
                    <th className="text-end">Fry Produced</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: '0.9rem' }}>
                        Loading hatch batches...
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: '0.9rem' }}>
                        {error || (batches.length > 0 ? 'No batches match your filters.' : 'No hatch batches found.')}
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((row) => {
                      const hc = hatchabilityColor(row.hatchability);
                      return (
                        <tr key={row.id}>
                          <td className="text-start" style={{ fontWeight: 600 }}>{row.batchNo}</td>
                          <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.dateInjected}</td>
                          <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.dateStripped}</td>
                          <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.dateHatched}</td>
                          <td className="text-end">{row.females}</td>
                          <td className="text-end">{row.males}</td>
                          <td className="text-end">{row.eggWeight.toFixed(2)}</td>
                          <td className="text-end"><span className={styles.stageBadge} style={{ background: hc.bg, color: hc.color }}>{row.hatchability}%</span></td>
                          <td className="text-end">{f(row.fryProduced)}</td>
                          <td className="text-start">
                            <div className={styles.actionsCell}>
                              <ActionDropdown row={row} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationRow}>
                <span className={styles.paginationInfo}>{filteredBatches.length === 0 ? 'No batches' : `Showing 1 to ${Math.min(filteredBatches.length, 6)} of ${filteredBatches.length} batches`}</span>
              <div className="d-flex align-items-center gap-3">
                <Pagination>
                  <Pagination.First />
                  <Pagination.Prev />
                  <Pagination.Item active={activePage === 1} onClick={() => setActivePage(1)}>{1}</Pagination.Item>
                  <Pagination.Item active={activePage === 2} onClick={() => setActivePage(2)}>{2}</Pagination.Item>
                  <Pagination.Item active={activePage === 3} onClick={() => setActivePage(3)}>{3}</Pagination.Item>
                  <Pagination.Item active={activePage === 4} onClick={() => setActivePage(4)}>{4}</Pagination.Item>
                  <Pagination.Item active={activePage === 5} onClick={() => setActivePage(5)}>{5}</Pagination.Item>
                  <Pagination.Ellipsis />
                  <Pagination.Item active={activePage === 7} onClick={() => setActivePage(7)}>{7}</Pagination.Item>
                  <Pagination.Next />
                  <Pagination.Last />
                </Pagination>
                <Form.Select style={{ width: 120, fontSize: '0.85rem' }}>
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                </Form.Select>
              </div>
            </div>
          </main>

          {/* ===== TRANSFER TO NURSERY MODAL ===== */}
          {showTransferModal && transferBatch && (
            <>
              <style>{`
                @keyframes v2TwFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
                @keyframes v2TwSwim { 0%{transform:translateX(-40px)} 50%{transform:translateX(0)} 100%{transform:translateX(40px) scaleX(-1)} }
                @keyframes v2TwBubble { 0%{transform:translateY(0) scale(1);opacity:.6} 100%{transform:translateY(-50px) scale(.3);opacity:0} }
                @keyframes v2TwSlideUp { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
                @keyframes v2TwScaleIn { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
                @keyframes v2TwProgress { 0%{width:0%} 100%{width:100%} }
                @keyframes v2TwFadeInUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
              `}</style>
              <div style={{
                position:'fixed', inset:0, zIndex:1050,
                background:'rgba(15,23,42,0.55)',
                backdropFilter:'blur(6px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:20,
                animation:'v2TwSlideUp .25s ease',
              }} onClick={() => transferStep !== 'processing' && setShowTransferModal(false)}>
                <div style={{
                  background:'#fff', borderRadius:24, maxWidth:520, width:'100%',
                  boxShadow:'0 32px 80px rgba(0,0,0,0.2)',
                  overflow:'hidden', position:'relative',
                  animation:'v2TwScaleIn .3s ease',
                }} onClick={e => e.stopPropagation()}>

                  {/* CLOSE */}
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
                      <div style={{ textAlign:'center', marginBottom:28 }}>
                        <div style={{
                          width:64, height:64, borderRadius:'50%',
                          background:'linear-gradient(135deg,#512728,#6B3536)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          margin:'0 auto 16px',
                          animation:'v2TwFloat 3s ease-in-out infinite',
                        }}>
                          <FaExchangeAlt size={26} color="#E8D5D5" style={{ transform:'rotate(90deg)' }} />
                        </div>
                        <h4 style={{ fontWeight:700, fontSize:'1.25rem', color:'#1F2937', margin:'0 0 6px' }}>
                          Transfer to Nursery
                        </h4>
                        <p style={{ color:'#6B7280', fontSize:'0.85rem', margin:0 }}>
                          Move fry from <strong>{transferBatch.batchNo}</strong> to a nursery pond
                        </p>
                      </div>

                      <div style={{
                        background:'linear-gradient(135deg,#FDF2F2,#FCE8E8)',
                        borderRadius:14, padding:16, marginBottom:24,
                        border:'1px solid #F3CDCD',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:'0.72rem', color:'#512728', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Batch Details</span>
                          <StatusBadge status={transferBatch.status} />
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div>
                            <div style={{ fontSize:'0.82rem', color:'#374151' }}>
                              <span style={{ color:'#6B7280' }}>Batch:</span> <strong>{transferBatch.batchNo}</strong>
                            </div>
                            <div style={{ fontSize:'0.82rem', color:'#374151', marginTop:2 }}>
                              <span style={{ color:'#6B7280' }}>Fry Available:</span> <strong>{f(transferBatch.fryProduced)}</strong>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'0.82rem', color:'#374151' }}>
                              <span style={{ color:'#6B7280' }}>Site:</span> {siteName}
                            </div>
                            <div style={{ fontSize:'0.82rem', color:'#374151', marginTop:2 }}>
                              <span style={{ color:'#6B7280' }}>Hatched:</span> {fDate(transferBatch._dateHatched) || '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom:20 }}>
                        <label style={{ display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:6 }}>
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
                            <option value="">{pondsLoading ? 'Loading ponds\u2026' : (ponds.length === 0 ? 'No ponds available' : 'Select a pond')}</option>
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
                        <label style={{ display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:6 }}>
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

                      <div style={{ textAlign:'center', marginBottom:20, position:'relative', height:30, overflow:'hidden' }}>
                        <span style={{ display:'inline-block', fontSize:'1.2rem', opacity:0.2, animation:'v2TwSwim 4s ease-in-out infinite' }}>🐟</span>
                        <span style={{ display:'inline-block', fontSize:'0.8rem', opacity:0.15, position:'absolute', left:'35%', bottom:0, animation:'v2TwBubble 3s ease-in-out infinite' }}>○</span>
                        <span style={{ display:'inline-block', fontSize:'0.6rem', opacity:0.1, position:'absolute', right:'30%', bottom:2, animation:'v2TwBubble 2.5s ease-in-out infinite 0.5s' }}>○</span>
                      </div>

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
                          {transferSubmitting ? 'Preparing\u2026' : '\uD83D\uDE80 Start Transfer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {transferStep === 'processing' && (
                    <div style={{ padding:48, textAlign:'center' }}>
                      <div style={{ position:'relative', height:160, marginBottom:32 }}>
                        <div style={{
                          position:'absolute', inset:0, top:'40%',
                          background:'linear-gradient(180deg, #DBEAFE 0%, #BFDBFE 100%)',
                          borderRadius:12,
                        }} />
                        {/* fish */}
                        <div style={{
                          position:'absolute', left:'50%', top:'30%', transform:'translateX(-50%)',
                          fontSize:'2.8rem', animation:'v2TwFloat 1.5s ease-in-out infinite',
                        }}>🐟</div>
                        {/* bubbles */}
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{
                            position:'absolute', left:`${25 + i * 18}%`, bottom:'25%',
                            width:8 + i*2, height:8 + i*2, borderRadius:'50%',
                            background:'rgba(255,255,255,0.5)',
                            animation:`v2TwBubble ${1.5 + i*0.4}s ease-in-out infinite ${i*0.3}s`,
                          }} />
                        ))}
                        <div style={{
                          position:'absolute', bottom:'18%', left:0, right:0, height:2,
                          background:'rgba(255,255,255,0.3)',
                          borderRadius:1,
                        }} />
                      </div>
                      <div style={{
                        width:'80%', height:6, background:'#E5E7EB', borderRadius:3,
                        margin:'0 auto 20px', overflow:'hidden',
                      }}>
                        <div style={{
                          height:'100%', borderRadius:3,
                          background:'linear-gradient(90deg,#512728,#8B4546)',
                          animation:'v2TwProgress 2.5s ease-in-out forwards',
                        }} />
                      </div>
                      <h5 style={{ fontWeight:700, color:'#1F2937', margin:'0 0 6px' }}>Transferring Fry</h5>
                      <p style={{ color:'#6B7280', fontSize:'0.85rem', margin:0 }}>
                        Moving {f(Number(transferQty))} fry to {ponds.find(p => p.id === selectedPondId)?.title || selectedPondId}...
                      </p>
                    </div>
                  )}

                  {transferStep === 'success' && (
                    <div style={{ padding:40, textAlign:'center' }}>
                      <div style={{
                        width:80, height:80, borderRadius:'50%',
                        background:'#E8F5E9', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        margin:'0 auto 20px',
                        animation:'v2TwScaleIn .5s ease',
                        boxShadow:'0 0 0 4px rgba(34,197,94,0.15)',
                      }}>
                        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h4 style={{ fontWeight:700, fontSize:'1.25rem', color:'#1F2937', margin:'0 0 6px' }}>
                        Transfer Initiated!
                      </h4>
                      <p style={{ color:'#6B7280', fontSize:'0.88rem', margin:'0 0 24px' }}>
                        Fry has been scheduled for transfer to the nursery pond.
                      </p>
                      <div style={{
                        background:'#F9FAFB', borderRadius:14, padding:16,
                        marginBottom:24, textAlign:'left',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                          <span style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Batch</span>
                          <span style={{ fontSize:'0.88rem', fontWeight:600, color:'#1F2937' }}>{transferBatch.batchNo}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                          <span style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Destination</span>
                          <span style={{ fontSize:'0.88rem', fontWeight:600, color:'#1F2937' }}>{ponds.find(p => p.id === selectedPondId)?.title || selectedPondId}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Quantity</span>
                          <span style={{ fontSize:'0.88rem', fontWeight:600, color:'#22C55E' }}>{f(Number(transferQty))} fry</span>
                        </div>
                      </div>
                      <button onClick={() => window.location.reload()} style={{
                        width:'100%', padding:'12px 0',
                        border:'none', borderRadius:12,
                        background:'linear-gradient(135deg,#512728,#6B3536)',
                        color:'#fff', fontSize:'0.88rem', fontWeight:600, cursor:'pointer',
                        transition:'all .2s',
                      }} onMouseOver={e => e.currentTarget.style.background='linear-gradient(135deg,#3D1E1F,#512728)'}
                         onMouseOut={e => e.currentTarget.style.background='linear-gradient(135deg,#512728,#6B3536)'}>
                        Done
                      </button>
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

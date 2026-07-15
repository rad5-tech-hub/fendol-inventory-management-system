import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Modal, Form } from 'react-bootstrap';
import CustomDropdown from "../../../shared/custom-dropdown/CustomDropdown";
import { toast } from 'react-toastify';
import { IoSearchOutline, IoFilterOutline, IoRefreshOutline, IoEyeOutline, IoPencilOutline, IoSendOutline, IoTrashOutline } from 'react-icons/io5';
import { GiCirclingFish } from 'react-icons/gi';
import { FaChartLine, FaCheckCircle, FaPlus, FaExchangeAlt, FaTruck } from 'react-icons/fa';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceDot,
} from 'recharts';
import SideBar from '../../../shared/sidebar/sidebar';
import PortalDropdown from '../../../shared/portal-dropdown/PortalDropdown';
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

const formatShortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#2E3135' }}>{payload[0].value}{unit}</p>
    </div>
  );
};

const renderChart = (data, color, unit, yDomain) => {
  const peak = data.reduce((max, d) => d.value > max.value ? d : max, data[0]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#8C949B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={yDomain} tick={{ fill: '#8C949B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: color }} fill={color} fillOpacity={0.08} />
        <ReferenceDot x={peak.name} y={peak.value} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
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
  fryMoved: item.fryMoved || 0,
  mortality: item.mortality || 0,
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

  const [moveBatch, setMoveBatch] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePondId, setMovePondId] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [moveError, setMoveError] = useState('');
  const [movePonds, setMovePonds] = useState([]);
  const [movePondsLoading, setMovePondsLoading] = useState(false);

  const [summary, setSummary] = useState({ total: 0, totalFryProduced: 0, averageHatchability: 0, activeCount: 0, completedCount: 0 });
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const openTransferModal = (row) => {
    navigate(`/hatchery/transfers/transfer-to-nursery?batchId=${row.id}`);
  };

  const openMoveModal = (row) => {
    setMoveBatch(row);
    setMovePondId('');
    setMoveQty(String((row.fryProduced || 0) - (row.fryMoved || 0)));
    setMoveError('');
    setMovePondsLoading(true);
    setMovePonds([]);
    Api.get(`/fish-stages?siteId=${row.siteId || 'all'}`)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setMovePonds(list);
      })
      .catch(() => setMovePonds([]))
      .finally(() => setMovePondsLoading(false));
    setShowMoveModal(true);
  };

  const handleMoveSubmit = async () => {
    if (!movePondId) { setMoveError('Please select a pond.'); return; }
    if (!moveQty || Number(moveQty) <= 0) { setMoveError('Please enter a valid quantity.'); return; }
    setMoveError('');
    setMoveSubmitting(true);
    try {
      await ApiV2.patch(`/v2/hatch-batches-moved/${moveBatch.id}`, {
        pondId: movePondId,
        quantity: Number(moveQty),
      });
      toast.success('Hatch batch marked as moved!', { className: 'dark-toast' });
      setShowMoveModal(false);
      setMoveBatch(null);
      fetchBatches(filterDateFrom, filterDateTo);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.message || d?.error || 'Failed to mark as moved. Please try again.';
      setMoveError(typeof msg === 'string' ? msg : 'Failed to mark as moved.');
    } finally {
      setMoveSubmitting(false);
    }
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

  const fetchBatches = async (startDate, endDate) => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await ApiV2.get('/v2/hatch-batches', { params });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      const s = res.data?.summary || {};
      setSummary({
        total: s.total || 0,
        totalFryProduced: s.totalFryProduced || 0,
        averageHatchability: s.averageHatchability || 0,
        activeCount: s.activeCount || 0,
        completedCount: s.completedCount || 0,
      });
      setBatches(data.map(mapApiBatchToRow));
      setCursor(res.data?.pagination?.nextCursor || null);
      setHasMore(res.data?.pagination?.hasMore || false);
      setError('');
    } catch {
      setError('Failed to load hatch batches.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches(filterDateFrom, filterDateTo);
  }, [filterDateFrom, filterDateTo]);

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

  const statCards = summary.total > 0
    ? [
        { label: 'Active Batches', value: String(summary.activeCount), icon: GiCirclingFish, color: '#F97316' },
        { label: 'Completed Batches', value: String(summary.completedCount), icon: FaCheckCircle, color: '#22C55E' },
        { label: 'Total Fry Produced', value: f(summary.totalFryProduced), icon: GiCirclingFish, color: '#3B82F6' },
        { label: 'Average Hatchability', value: summary.averageHatchability.toFixed(1) + '%', icon: FaChartLine, color: '#8B5CF6' },
      ]
    : FALLBACK_STATS;

  const sortedBatches = [...batches].filter(b => b._dateInjected).sort((a, b) => a._dateInjected.localeCompare(b._dateInjected));
  const chartData = sortedBatches.length > 0
    ? sortedBatches.map(b => ({
        name: formatShortDate(b._dateInjected),
        hatchability: b.hatchability,
        fryProduced: b.fryProduced,
        mortality: b.mortality,
      }))
    : [{ name: 'No data', hatchability: 0, fryProduced: 0, mortality: 0 }];

  const ActionDropdown = ({ row }) => {
    const [open, setOpen] = useState(false);
    return (
      <PortalDropdown
        show={open}
        onToggle={setOpen}
        btnClass={styles.threeDotBtn}
        menuStyle={{ minWidth: 210 }}
        items={[
          { label: <><IoEyeOutline size={16} style={{ marginRight: 10 }} /> View Summary</>, onClick: () => navigate(`/hatchery/hatch-batches/summary/${row.id}`) },
          { label: <><IoPencilOutline size={16} style={{ marginRight: 10 }} /> Edit Batch</>, onClick: () => navigate('/hatchery/hatch-batches/create', { state: { batch: row } }) },
          { label: <><IoSendOutline size={16} style={{ marginRight: 10 }} /> Transfer to Nursery</>, onClick: () => openTransferModal(row) },
          { label: <><FaTruck size={16} style={{ marginRight: 10 }} /> Mark as Moved</>, onClick: () => openMoveModal(row) },
          { divider: true },
          { label: <><IoTrashOutline size={16} style={{ marginRight: 10 }} /> Delete Batch</>, onClick: () => {}, style: { color: '#dc3545', fontWeight: 600 } },
        ]}
      />
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
              <span className={styles.breadcrumbActive}>Hatchery Dashboard</span>
            </div>

              <div className={styles.pageHeader}>
                <h4>Hatchery Dashboard</h4>
                <div className={styles.headerActions}>
                  <button className={styles.primaryBtn} onClick={() => navigate('/hatchery/hatch-batches/create')}>
                    <FaPlus size={12} /> New Hatch Batch
                  </button>
                </div>
              </div>

            <div className={styles.statGridFill}>
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

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Hatchability Trend (%)</h5>
                  <span className={styles.chartDropdown}>This Month ▾</span>
                </div>
                {renderChart(chartData.map(d => ({ name: d.name, value: d.hatchability })), '#F97316', '%', [0, 100])}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Fry Production Trend (pcs)</h5>
                  <span className={styles.chartDropdown}>This Month ▾</span>
                </div>
                {renderChart(chartData.map(d => ({ name: d.name, value: d.fryProduced })), '#3B82F6', '', [0, 'auto'])}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Mortality Trend (pcs)</h5>
                  <span className={styles.chartDropdown}>This Month ▾</span>
                </div>
                {renderChart(chartData.map(d => ({ name: d.name, value: d.mortality })), '#EF4444', '', [0, 'auto'])}
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <input type="text" placeholder="Search batch number&hellip;" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <IoSearchOutline size={16} className={styles.searchIcon} />
              </div>
              <div className={styles.filterSelect}>
                <CustomDropdown
                  options={[{ value: '', label: 'All Sites' }, ...sites.map(s => ({ value: s.id, label: s.name }))]}
                  value={filterSiteId}
                  onChange={(val) => setFilterSiteId(val)}
                />
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
                    <th className="text-end">Fry Moved</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {loading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: '0.9rem' }}>
                        Loading hatch batches...
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: '0.9rem' }}>
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
                          <td className="text-end">{f(row.fryMoved)}</td>
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

            <div className={styles.paginationRow} style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', paddingTop: 12, paddingBottom: 12, borderTop: '1px solid #e5e7eb', boxShadow: '0 -2px 6px rgba(0,0,0,0.04)' }}>
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
                <CustomDropdown
                  options={[
                    { value: '45', label: '45 / page' },
                    { value: '100', label: '100 / page' },
                    { value: '200', label: '200 / page' },
                  ]}
                  placeholder="45 / page"
                  style={{ width: 120 }}
                />
              </div>
            </div>
          </main>

        </section>
      </div>

      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)} centered backdrop>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937' }}>
            Mark as Moved
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {moveBatch && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: 4 }}>Batch</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1F2937' }}>{moveBatch.batchNo}</div>
            </div>
          )}
          <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>
            Select Pond
          </Form.Label>
          <CustomDropdown
            options={movePonds.map(p => ({ value: p.id, label: p.title }))}
            value={movePondId}
            onChange={(val) => setMovePondId(val)}
            placeholder={movePondsLoading ? 'Loading ponds...' : (movePonds.length === 0 ? 'No ponds available' : 'Select a pond')}
            disabled={movePondsLoading}
          />
          <div style={{ marginTop: 16 }}>
            <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>
              Quantity to Move
            </Form.Label>
            <Form.Control
              type="number"
              value={moveQty}
              onChange={(e) => setMoveQty(e.target.value)}
              onWheel={(e) => e.target.blur()}
            />
          </div>
          {moveBatch && (
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#9CA3AF' }}>
              Available: {f((moveBatch.fryProduced || 0) - (moveBatch.fryMoved || 0))} fry
            </div>
          )}
          {moveError && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6, color: '#dc3545', fontSize: '0.85rem' }}>
              {moveError}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none', paddingTop: 0 }}>
          <button className={styles.outlineBtn} onClick={() => setShowMoveModal(false)} disabled={moveSubmitting}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={handleMoveSubmit} disabled={moveSubmitting}>
            {moveSubmitting ? '\u23F3 Moving...' : 'Mark as Moved'}
          </button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

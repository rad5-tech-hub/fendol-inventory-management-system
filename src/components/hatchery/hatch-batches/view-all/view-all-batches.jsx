import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Pagination, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { IoSearchOutline, IoFilterOutline, IoRefreshOutline } from 'react-icons/io5';
import { GiCirclingFish } from 'react-icons/gi';
import { FaChartLine, FaCheckCircle, FaPlus } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import { ApiV2 } from '../../../shared/api/apiLink';
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

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

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
        <Dropdown.Menu style={{ minWidth: 180 }}>
          <Dropdown.Item onClick={() => navigate(`/hatchery/hatch-batches/summary/${row.id}`)}>View Summary</Dropdown.Item>
          <Dropdown.Item onClick={() => navigate('/hatchery/hatch-batches/create', { state: { batch: row } })}>Edit Batch</Dropdown.Item>
          <Dropdown.Item onClick={() => {}}>Transfer to Nursery</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => {}} style={{ color: '#dc3545', fontWeight: 600 }}>Delete Batch</Dropdown.Item>
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
        </section>
      </div>
    </section>
  );
}

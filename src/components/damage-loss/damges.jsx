import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SideBar from "../shared/sidebar/sidebar";
import Header from "../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './damge.module.scss';
import ErrorState from "../shared/error-state/ErrorState";
import EmptyState from "../shared/empty-state/EmptyState";
import Api from '../shared/api/apiLink';
import { SkeletonTable } from "../shared/skeleton/Skeleton";
import DataTable from "../shared/data-table/DataTable";
import Pagination from "../shared/pagination/Pagination";
import { BsSearch, BsPlusLg, BsX, BsCalendar3 } from "react-icons/bs";

const f = (n) => (n != null ? new Intl.NumberFormat().format(Number(n)) : '0');

const formatDate = (isoDate) => {
  if (!isoDate) return '\u2014';
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function DamageLoss() {
  const navigate = useNavigate();
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = user?.userTypes || [];
  const isSuperAdmin = userTypes.includes('super_admin');
  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const [pondMap, setPondMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [overviewPeriod, setOverviewPeriod] = useState('daily');

  const siteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0] || '');

  // Fetch pond list to map pondId -> name
  useEffect(() => {
    (async () => {
      try {
        const params = {};
        if (siteId) params.siteId = siteId;
        const res = await Api.get('/fish-stages', { params });
        if (Array.isArray(res.data?.data)) {
          const map = {};
          res.data.data.forEach(p => { if (p.id) map[p.id] = p.title || p.name; });
          setPondMap(map);
        }
      } catch (_) { /* non-critical */ }
    })();
  }, [siteId]);

  const fetchDamageRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch all pages via cursor loop (backend paginates)
      const allRecords = [];
      let cursor = null;
      let hasMore = true;
      while (hasMore) {
        const params = {};
        if (siteId) params.siteId = siteId;
        if (cursor) params.cursor = cursor;
        const response = await Api.get('/damaged-fish', { params });
        const records = Array.isArray(response.data?.data) ? response.data.data : [];
        allRecords.push(...records);
        const pagination = response.data?.pagination || {};
        hasMore = pagination.hasMore === true;
        cursor = pagination.nextCursor || null;
        if (!hasMore) break;
        if (allRecords.length > 5000) break;
      }
      setDamageRecords(allRecords);
    } catch (_) {
      setError("Error fetching damage/loss records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchDamageRecords();
  }, [fetchDamageRecords]);

  const getPondName = (record) => {
    if (record.pondId && pondMap[record.pondId]) return pondMap[record.pondId];
    if (record.sourcePond) {
      if (typeof record.sourcePond === 'string') return record.sourcePond;
      if (typeof record.sourcePond === 'object' && record.sourcePond?.title) return record.sourcePond.title;
      if (typeof record.sourcePond === 'object' && record.sourcePond?.name) return record.sourcePond.name;
    }
    return '\u2014';
  };

  const filteredRecords = useMemo(() => {
    return damageRecords.filter((record) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q
        || getPondName(record).toLowerCase().includes(q)
        || (record.remarks || '').toLowerCase().includes(q)
        || (record.description || '').toLowerCase().includes(q);
      const rDate = new Date(record.createdAt);
      const matchesDateFrom = !dateFrom || rDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || rDate <= new Date(dateTo + 'T23:59:59');
      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [damageRecords, searchQuery, dateFrom, dateTo]);

  // ── Overview stats (independent of table filters) ──
  const overview = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setHours(0,0,0,0);
    weekStart.setDate(now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const getQty = (r) => Number(r.quantity ?? r.actual_quantity ?? 0) || 0;
    let daily = 0, weekly = 0, monthly = 0, total = 0;
    damageRecords.forEach(r => {
      const q = getQty(r);
      total += q;
      const d = new Date(r.createdAt);
      const dStr = d.toISOString().split('T')[0];
      if (dStr === todayStr) daily += q;
      if (d >= weekStart) weekly += q;
      if (d >= monthStart) monthly += q;
    });
    return { daily, weekly, monthly, total };
  }, [damageRecords]);

  const customLoss = useMemo(() => {
    if (!customFrom && !customTo) return null;
    const getQty = (r) => Number(r.quantity ?? r.actual_quantity ?? 0) || 0;
    const from = customFrom ? new Date(customFrom) : null;
    const to = customTo ? new Date(customTo + 'T23:59:59') : null;
    if (from && to && from > to) return 0;
    return damageRecords
      .filter(r => {
        const d = new Date(r.createdAt);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .reduce((sum, r) => sum + getQty(r), 0);
  }, [damageRecords, customFrom, customTo]);

  useEffect(() => { setCurrentPage(0); }, [searchQuery, dateFrom, dateTo]);

  const pageCount = Math.ceil(filteredRecords.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentRecords = filteredRecords.slice(offset, offset + itemsPerPage);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo;

  const columns = useMemo(() => [
    { key: 'createdAt', label: 'DATE', width: '16%', render: (val) => <span style={{ color: '#8C949B', whiteSpace: 'nowrap' }}>{formatDate(val)}</span> },
    { key: 'pondId', label: 'POND', width: '24%', render: (_, row) => <span>{getPondName(row)}</span> },
    { key: 'quantity', label: 'QUANTITY', width: '14%', align: 'right', render: (val) => <span style={{ fontWeight: 600 }}>{f(val)}</span> },
    { key: 'remarks', label: 'REMARK', width: '46%', render: (val, row) => (
      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {val || row.description || '\u2014'}
      </span>
    )},
  ], [pondMap]);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content} flex-grow-1`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', paddingBottom: 0 }}>
            <div style={{ flexShrink: 0 }}>
              {/* ── Breadcrumb + Header Actions ── */}
              <div className={styles.headerRow}>
                <div className={styles.breadcrumb}>
                  <span onClick={() => navigate('/manage-fish')} style={{ cursor: 'pointer' }}>Manage Fish</span>
                  <span className={styles.separator}>&rsaquo;</span>
                  <span className={styles.breadcrumbActive}>Damage / Loss</span>
                </div>
                <button
                  className={styles.primaryBtn}
                  onClick={() => navigate('/manage-fish/damage-fish')}
                >
                  <BsPlusLg size={13} /> Record Damage
                </button>
              </div>

              {/* ── Page Title ── */}
              <h2 className={styles.headingTitle}>Damage / Loss</h2>
              <p className={styles.headingSubtitle}>
                View and track all recorded fish damage and mortality events.
              </p>

              {/* ── Overview Card + Period Picker ── */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ width: 260, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 8, background: overviewPeriod === 'custom' ? '#F3E8FF' : overviewPeriod === 'weekly' ? '#DBEAFE' : overviewPeriod === 'monthly' ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: overviewPeriod === 'custom' ? '#7C3AED' : overviewPeriod === 'weekly' ? '#1D4ED8' : overviewPeriod === 'monthly' ? '#15803D' : '#B45309', fontSize: 16, flexShrink: 0 }}>●</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                      {overviewPeriod === 'daily' ? 'Daily losses' : overviewPeriod === 'weekly' ? 'Weekly losses' : overviewPeriod === 'monthly' ? 'Monthly losses' : (customFrom || customTo) ? `Losses ${customFrom || '…'} → ${customTo || '…'}` : 'Custom losses'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#2E3135', lineHeight: 1.2 }}>
                      {overviewPeriod === 'daily' ? f(overview.daily) : overviewPeriod === 'weekly' ? f(overview.weekly) : overviewPeriod === 'monthly' ? f(overview.monthly) : customLoss !== null ? f(customLoss) : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: '#8C949B' }}>
                      {overviewPeriod === 'daily' ? 'Today' : overviewPeriod === 'weekly' ? 'Last 7 days' : overviewPeriod === 'monthly' ? 'This month' : (customFrom && customTo ? `${customFrom} to ${customTo}` : customFrom ? `From ${customFrom}` : customTo ? `Until ${customTo}` : 'Pick a range')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ width: 160, height: 34, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, padding: '0 10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', outline: 'none', }}>
                    <select value={overviewPeriod} onChange={e => setOverviewPeriod(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: '#374151', background: 'transparent', cursor: 'pointer', minWidth: 0, height: '100%' }}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {overviewPeriod === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 34 }}>
                      <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, minWidth: 110 }} />
                      <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>
                      <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, minWidth: 110 }} />
                      {(customFrom || customTo) && <button onClick={() => { setCustomFrom(''); setCustomTo(''); }} style={{ background: 'transparent', border: 'none', color: '#8C949B', cursor: 'pointer', padding: 0, lineHeight: 1 }}><BsX size={14} /></button>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Controls Bar ── */}
              <div className={styles.controlsBar}>
                <div className={styles.searchBox}>
                  <BsSearch size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by pond or remark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                      <BsX size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.dateRange}>
                  <label className={styles.filterLabel}>Date Range</label>
                  <div className={styles.dateFields}>
                    <div className={styles.dateField}>
                      <BsCalendar3 size={11} className={styles.dateIcon} />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <span className={styles.dateSep}>&ndash;</span>
                    <div className={styles.dateField}>
                      <BsCalendar3 size={11} className={styles.dateIcon} />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button className={styles.resetBtn} onClick={resetFilters}>
                    <BsX size={14} /> Reset
                  </button>
                )}
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* ── Loading ── */}
              {loading && (
                <div style={{ padding: '20px 0' }}>
                  <SkeletonTable rows={5} cols={4} />
                </div>
              )}

              {/* ── Error ── */}
              {!loading && error && (
                <div style={{ padding: '20px 0' }}>
                  <ErrorState message={error} onRetry={fetchDamageRecords} />
                </div>
              )}

              {/* ── Empty ── */}
              {!loading && !error && filteredRecords.length === 0 && (
                <div style={{ padding: '20px 0' }}>
                  <EmptyState
                    title={hasActiveFilters ? 'No matches found' : 'No damage/loss records'}
                    description={hasActiveFilters ? 'Try adjusting your search or date filters.' : 'Record a damage or mortality event to get started.'}
                  />
                </div>
              )}

              {/* ── Table ── */}
              {!loading && !error && filteredRecords.length > 0 && (
                <div className={styles.tableCard} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div className={styles.tableHeader}>
                    <h4>Damage / Loss Records ({filteredRecords.length})</h4>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <DataTable
                      className={styles.dataTable}
                      columns={columns}
                      data={currentRecords}
                    />
                  </div>
                </div>
              )}
            </div>
            {!loading && !error && filteredRecords.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageCount={pageCount}
                totalItems={filteredRecords.length}
                pageSize={itemsPerPage}
                onPageChange={({ selected }) => setCurrentPage(selected)}
                itemName="records"
              />
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

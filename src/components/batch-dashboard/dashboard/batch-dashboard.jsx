import React, { useState, useEffect, useCallback } from 'react';
import { Pagination, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  IoLayersOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoRefreshOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5';
import { FaCheckCircle, FaSkull } from 'react-icons/fa';
import { GiCirclingFish, GiCannedFish } from 'react-icons/gi';
import { MdOutlinePointOfSale } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { SkeletonTable, SkeletonStatGrid } from '../../shared/skeleton/Skeleton';
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

export default function BatchDashboard() {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const [showSidebar, setShowSidebar] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchBatches = useCallback(async (cursorVal = null) => {
    setLoading(true);
    setError('');
    try {
      const siteId = isSuperAdmin ? activeSite?.id : (user?.siteId || '');
      const params = {};
      if (siteId) params.siteId = siteId;
      if (cursorVal) params.cursor = cursorVal;
      const response = await ApiV2.get('/v2/batches', { params });
      const body = response.data;
      const list = Array.isArray(body.data) ? body.data : [];
      setData(prev => cursorVal ? [...prev, ...list] : list);
      setHasMore(body.pagination?.hasMore || false);
      setCursor(body.pagination?.nextCursor || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches.');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, activeSite, user]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleLoadMore = () => {
    if (cursor && hasMore) fetchBatches(cursor);
  };

  const filteredData = data.filter((batch) => {
    const term = searchTerm.toLowerCase();
    const batchNo = String(batch.batchNumber);
    const comments = (batch.comments || '').toLowerCase();
    if (term && !batchNo.includes(term) && !comments.includes(term)) return false;
    if (stageFilter && (batch.currentStage || '') !== stageFilter) return false;
    const isCompleted = !!batch.endDate;
    if (statusFilter === 'Active' && isCompleted) return false;
    if (statusFilter === 'Completed' && !isCompleted) return false;
    return true;
  });

  const totalFish = (stocks) => (stocks || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
  const totalProcessed = (processes) => (processes || []).reduce((s, x) => s + (Number(x.wholeFishQuantity) || 0) + (Number(x.brokenFishQuantity) || 0) + (Number(x.damageOrLoss) || 0), 0);
  const totalHarvested = (logs) => (logs || []).reduce((s, x) => s + (Number(x.actual_quantity) || 0), 0);
  const totalDamaged = (fish) => (fish || []).length;

  const activeBatches = data.filter((b) => !b.endDate).length;
  const completedBatches = data.filter((b) => !!b.endDate).length;
  const totalFishActive = data.filter((b) => !b.endDate).reduce((s, b) => s + totalFish(b.fishStocks), 0);
  const totalHarvestedAll = data.reduce((s, b) => s + totalHarvested(b.harvestLogs), 0);
  const totalDamagedAll = data.reduce((s, b) => s + totalDamaged(b.damagedFish), 0);

  const statCards = [
    { label: 'Total Active Batches', value: f(activeBatches), icon: IoLayersOutline, color: '#3B82F6' },
    { label: 'Total Completed Batches', value: f(completedBatches), icon: FaCheckCircle, color: '#22C55E' },
    { label: 'Total Fish in Active Batches', value: f(totalFishActive), icon: GiCirclingFish, color: '#F97316' },
    { label: 'Total Harvested Fish', value: f(totalHarvestedAll), icon: GiCannedFish, color: '#8B5CF6' },
    { label: 'Total Mortality Events', value: f(totalDamagedAll), icon: FaSkull, color: '#EF4444' },
  ];

  const stages = [...new Set(data.map((b) => b.currentStage).filter(Boolean))];

  const StageBadge = ({ stage }) => {
    const c = stageColors[stage] || { bg: '#F3F4F6', color: '#374151' };
    return <span className={styles.stageBadge} style={{ background: c.bg, color: c.color }}>{stage || '—'}</span>;
  };

  const StatusBadge = ({ completed }) => (
    <span className={styles.statusBadge} style={{ background: completed ? '#F3F4F6' : '#E8F5E9', color: completed ? '#374151' : '#2E7D32' }}>
      {completed ? 'Completed' : 'Active'}
    </span>
  );

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

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
            <div className={styles.pageHeader}>
              <h4>Batch Dashboard</h4>
              <div className={styles.headerActions}>
                <button className={styles.howItWorksBtn} onClick={() => {}}>
                  <IoHelpCircleOutline size={18} /> How it works
                </button>
              </div>
            </div>

            {loading && !data.length ? (
              <>
                <SkeletonStatGrid count={5} />
                <SkeletonTable rows={5} cols={8} />
              </>
            ) : error ? (
              <div className={styles.emptyState}>
                <p>{error}</p>
              </div>
            ) : (
              <>
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
                    </div>
                  ))}
                </div>

                <div className={styles.filterBar}>
                  <div className={styles.searchWrapper}>
                    <input
                      type="text"
                      placeholder="Search batch number&hellip;"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <IoSearchOutline size={16} className={styles.searchIcon} />
                  </div>
                  <div className={styles.filterSelect}>
                    <Form.Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                      <option value="">All Stages</option>
                      {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                  </div>
                  <div className={styles.filterSelect}>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </Form.Select>
                  </div>
                  <button className={styles.filterBtn} onClick={() => {}}>
                    <IoFilterOutline size={16} /> Filters
                  </button>
                  <button className={styles.resetBtn} onClick={() => { setSearchTerm(''); setStageFilter(''); setStatusFilter(''); }}>
                    <IoRefreshOutline size={14} /> Reset
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className="text-start">Batch Number</th>
                        <th className="text-start">Date Created <span style={{ cursor: 'pointer' }}>↕</span></th>
                        <th className="text-start">Comments</th>
                        <th className="text-start">Current Stage</th>
                        <th className="text-end">Fish Stocks</th>
                        <th className="text-end">Processed</th>
                        <th className="text-end">Harvested</th>
                        <th className="text-end">Mortality</th>
                        <th className="text-start">Status</th>
                        <th className="text-start">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-4" style={{ color: '#8C949B', fontWeight: 600 }}>
                            No batches found.
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((batch, idx) => {
                          const batchId = batch.batchNumber || batch.id || idx;
                          return (
                            <tr key={batch.batchNumber || batch.id || idx}>
                              <td style={{ fontWeight: 600 }} className="text-start">
                                FDL-BT-{String(batch.batchNumber).padStart(4, '0')}
                              </td>
                              <td style={{ fontSize: '0.82rem', color: '#8C949B' }} className="text-start">
                                {formatDate(batch.createdAt)}
                              </td>
                              <td className="text-start" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {batch.comments || '—'}
                              </td>
                              <td className="text-start"><StageBadge stage={batch.currentStage} /></td>
                              <td className="text-end">{f(totalFish(batch.fishStocks))}</td>
                              <td className="text-end">{f(totalProcessed(batch.fishProcesses))}</td>
                              <td className="text-end">{f(totalHarvested(batch.harvestLogs))}</td>
                              <td className={`text-end ${styles.mortalityValue}`}>{f(totalDamaged(batch.damagedFish))}</td>
                              <td className="text-start"><StatusBadge completed={!!batch.endDate} /></td>
                              <td className="text-start">
                                <div className={styles.actionsCell}>
                                  <button className={styles.viewBtn} onClick={() => navigate(`/batch-dashboard/summary/${batch.batchNumber}`)}>
                                    View Summary
                                  </button>
                                  <button className={styles.threeDotBtn} onClick={() => {}}><BsThreeDotsVertical size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {hasMore && (
                  <div className="text-center mt-3">
                    <button
                      className={styles.viewBtn}
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}

                <div className={styles.paginationRow}>
                  <span className={styles.paginationInfo}>
                    Showing {filteredData.length} of {data.length} batches
                  </span>
                </div>
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  IoLayersOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoRefreshOutline,
  IoHelpCircleOutline,
  IoEyeOutline,
} from 'react-icons/io5';
import { FaCheckCircle, FaSkull, FaDollarSign } from 'react-icons/fa';
import { GiCirclingFish, GiCannedFish } from 'react-icons/gi';
import { MdOutlinePointOfSale } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import CustomDropdown from '../../shared/custom-dropdown/CustomDropdown';
import DataTable from '../../shared/data-table/DataTable';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 35;

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const siteId = isSuperAdmin ? activeSite?.id : (user?.siteId || '');
      let cursor = null;
      const allData = [];
      do {
        const params = { limit: 50 };
        if (siteId) params.siteId = siteId;
        if (cursor) params.cursor = cursor;
        const response = await ApiV2.get('/v2/batches', { params });
        const body = response.data;
        const list = Array.isArray(body.data) ? body.data : [];
        allData.push(...list);
        cursor = body.pagination?.hasMore ? body.pagination.nextCursor : null;
      } while (cursor);
      setData(allData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches.');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, activeSite, user]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

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

  const pageCount = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const totalFish = (stocks) => (stocks || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
  const totalProcessed = (processes) => (processes || []).reduce((s, x) => s + (Number(x.wholeFishQuantity) || 0) + (Number(x.brokenFishQuantity) || 0) + (Number(x.damageOrLoss) || 0), 0);
  const totalHarvested = (logs) => (logs || []).reduce((s, x) => s + (Number(x.actual_quantity) || 0), 0);
  const totalDamaged = (fish) => (fish || []).length;

  const activeBatches = data.filter((b) => !b.endDate).length;
  const completedBatches = data.filter((b) => !!b.endDate).length;
  const totalFishActive = data.filter((b) => !b.endDate).reduce((s, b) => s + totalFish(b.fishStocks), 0);
  const totalHarvestedAll = data.reduce((s, b) => s + totalHarvested(b.harvestLogs), 0);
  const totalDamagedAll = data.reduce((s, b) => s + totalDamaged(b.damagedFish), 0);

  // TODO: wire totalRevenue with actual sales/pricing data
  const statCards = [
    { label: 'Total Active Batches', value: f(activeBatches), icon: IoLayersOutline, color: '#3B82F6' },
    { label: 'Total Completed Batches', value: f(completedBatches), icon: FaCheckCircle, color: '#22C55E' },
    { label: 'Total Fish in Active Batches', value: f(totalFishActive), icon: GiCirclingFish, color: '#F97316' },
    { label: 'Total Harvested Fish', value: f(totalHarvestedAll), icon: GiCannedFish, color: '#8B5CF6' },
    { label: 'Total Mortality Events', value: f(totalDamagedAll), icon: FaSkull, color: '#EF4444' },
    { label: 'Total Revenue Generated', value: f(0), icon: FaDollarSign, color: '#059669' },
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
                <SkeletonStatGrid count={6} />
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
                    <CustomDropdown
                      options={[
                        { value: '', label: 'All Stages' },
                        ...stages.map((s) => ({ value: s, label: s })),
                      ]}
                      value={stageFilter}
                      onChange={setStageFilter}
                      placeholder="All Stages"
                    />
                  </div>
                  <div className={styles.filterSelect}>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'All Statuses' },
                        { value: 'Active', label: 'Active' },
                        { value: 'Completed', label: 'Completed' },
                      ]}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      placeholder="All Statuses"
                    />
                  </div>
                  <button className={styles.filterBtn} onClick={() => {}}>
                    <IoFilterOutline size={16} /> Filters
                  </button>
                  <button className={styles.resetBtn} onClick={() => { setSearchTerm(''); setStageFilter(''); setStatusFilter(''); }}>
                    <IoRefreshOutline size={14} /> Reset
                  </button>
                </div>

                <DataTable
                  columns={[
                    { key: 'batchNumber', label: 'Batch Number', render: (value) => <span style={{ fontWeight: 600 }}>FDL-BT-{String(value).padStart(4, '0')}</span> },
                    { key: 'createdAt', label: 'Date Created', render: (value) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{formatDate(value)}</span> },
                    { key: 'comments', label: 'Descriptions', render: (value) => <span style={{ maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span> },
                    { key: 'currentStage', label: 'Current Stage', render: (value) => <StageBadge stage={value} /> },
                    { key: 'endDate', label: 'Status', render: (value) => <StatusBadge completed={!!value} /> },
                  ]}
                  data={paginatedData}
                  emptyMessage="No batches found."
                  actions={(row) => (
                    <PortalDropdown
                      btnClass={styles.threeDotBtn}
                      menuStyle={{ minWidth: 210 }}
                      stopPropagation
                      items={[
                        { label: <><IoEyeOutline size={16} style={{ marginRight: 10 }} /> View Summary</>, onClick: () => navigate(`/batch-dashboard/summary/${row.batchNumber}`) },
                      ]}
                    />
                  )}
                />

                {filteredData.length > itemsPerPage && (
                  <div className={styles.paginationRow} style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', paddingTop: 12, paddingBottom: 12 }}>
                    <span className={styles.paginationInfo}>
                      Showing {Math.min(itemsPerPage, filteredData.length - (currentPage - 1) * itemsPerPage)} of {filteredData.length} batches
                    </span>
                    <Pagination className="mb-0">
                      <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pageCount}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

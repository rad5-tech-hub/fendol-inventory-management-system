import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCalendarOutline, IoChevronDown,
} from 'react-icons/io5';
import {
  FiDownload, FiSearch, FiRefreshCw,
  FiChevronLeft, FiChevronRight,
  FiEye, FiCheckCircle, FiXCircle, FiEdit2,
  FiTrendingUp, FiTrendingDown,
} from 'react-icons/fi';
import { GiChipsBag, GiMoneyStack } from 'react-icons/gi';
import { BsBoxSeam } from 'react-icons/bs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import DataTable from "../../shared/data-table/DataTable";
import { ApiV2 } from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './production-history.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const padBatch = (n) => '#' + String(n).padStart(3, '0');

const FEED_COLORS = [
  '#7C3AED', '#F97316', '#16A34A', '#2563EB',
  '#D97706', '#DB2777', '#0891B2', '#65A30D',
];

const getFeedColor = (feedName) => {
  if (!feedName) return '#9CA3AF';
  let hash = 0;
  for (let i = 0; i < feedName.length; i++) {
    hash = feedName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FEED_COLORS[Math.abs(hash) % FEED_COLORS.length];
};

const STATUS_STYLES = {
  completed: { bg: '#DCFCE7', color: '#15803D' },
  'in progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626' },
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusDisplay = (status) => {
  if (status === 'in progress') return 'In Progress';
  return toTitleCase(status);
};

export default function FeedProductionHistory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  /* ----- data state ----- */
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  /* ----- filters ----- */
  const [search, setSearch] = useState('');
  const [feedTypeFilter, setFeedTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');

  /* ----- pagination ----- */
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [completingBatch, setCompletingBatch] = useState(null);
  const [cancellingBatch, setCancellingBatch] = useState(null);

  /* ----- data fetching ----- */
  const fetchBatches = useCallback(async (cursor = null) => {
    setLoading(true);
    setFetchError('');
    try {
      const params = {};
      if (cursor) params.cursor = cursor;
      const res = await ApiV2.get('/v2/feed-production-batch', { params });
      if (res.data?.success) {
        const newData = Array.isArray(res.data.data) ? res.data.data : [];
        setData(prev => cursor ? [...prev, ...newData] : newData);
        setSummary(res.data.summary || null);
        setNextCursor(res.data.pagination?.nextCursor || null);
        setHasMore(res.data.pagination?.hasMore || false);
      } else {
        throw new Error(res.data?.response_message || 'Unexpected response format');
      }
    } catch (err) {
      const errMsg = !err.response
        ? 'Network error. Please check your internet connection and try again.'
        : err.response?.status >= 500
          ? 'Server error. Please try again later.'
          : err.response?.data?.response_message
            || err.response?.data?.message
            || 'Failed to load production history.';
      setFetchError(errMsg);
      toast.error(errMsg, { autoClose: 6000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  /* ----- unique filter options ----- */
  const feedTypeOptions = useMemo(() => {
    const set = new Set(data.map(b => b.feed?.feedName).filter(Boolean));
    return ['all', ...set];
  }, [data]);

  const statusOptions = useMemo(() => {
    const set = new Set(data.map(b => b.status).filter(Boolean));
    return ['all', ...set];
  }, [data]);

  const siteOptions = useMemo(() => {
    const set = new Set(data.map(b => b.siteType?.name).filter(Boolean));
    return ['all', ...set];
  }, [data]);

  /* ----- computed batch total cost ----- */
  const batchTotalCost = (b) => {
    if (!Array.isArray(b.rawMaterials)) return 0;
    return b.rawMaterials.reduce((sum, rm) => sum + Number(rm.amount || 0), 0);
  };

  /* ----- filter + search ----- */
  const filteredBatches = useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(b =>
        String(b.batchNumber).includes(q) ||
        (b.feed?.feedName || '').toLowerCase().includes(q) ||
        (b.staff?.name || '').toLowerCase().includes(q) ||
        (b.siteType?.name || '').toLowerCase().includes(q) ||
        (b.machineUsed || '').toLowerCase().includes(q)
      );
    }
    if (feedTypeFilter !== 'all') {
      result = result.filter(b => b.feed?.feedName === feedTypeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    if (siteFilter !== 'all') {
      result = result.filter(b => b.siteType?.name === siteFilter);
    }
    return result;
  }, [data, search, feedTypeFilter, statusFilter, siteFilter]);

  const totalFiltered = filteredBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  /* reset page when filters change */
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ----- paginate ----- */
  const displayBatches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, page, pageSize]);

  /* ----- table data shape ----- */
  const tableData = useMemo(() => {
    return displayBatches.map((b) => ({
      batchNo: padBatch(b.batchNumber),
      feedType: b.feed?.feedName || '--',
      siteType: b.siteType?.name || '--',
      startPeriod: b.productionStartDate,
      endPeriod: b.productionEndDate,
      qty: Number(b.totalFeedProduced || 0),
      unit: 'kg',
      totalCost: batchTotalCost(b),
      costPerKg: Number(b.costPerKg || 0),
      producedBy: b.staff?.name || '--',
      status: b.status || 'unknown',
      _raw: b,
    }));
  }, [displayBatches]);

  /* ----- action handlers ----- */
  const handleViewDetails = (row) => {
    navigate(`/feed/production/detail/${row._raw.batchNumber}`);
  };

  const handleCompleteBatch = async (row) => {
    const confirmed = window.confirm(`Complete batch ${row.batchNo}?`);
    if (!confirmed) return;
    setCompletingBatch(row._raw.batchNumber);
    try {
      await ApiV2.patch(`/v2/feed-production-batch/${row._raw.batchNumber}`, { status: 'completed' });
      toast.success(`Batch ${row.batchNo} completed successfully!`);
      fetchBatches();
    } catch (err) {
      const msg = err.response?.data?.response_message
        || err.response?.data?.message
        || 'Failed to complete batch.';
      toast.error(msg, { autoClose: 6000 });
    } finally {
      setCompletingBatch(null);
    }
  };

  const handleCancelBatch = async (row) => {
    const confirmed = window.confirm(`Cancel batch ${row.batchNo}? This action cannot be undone.`);
    if (!confirmed) return;
    setCancellingBatch(row._raw.batchNumber);
    try {
      await ApiV2.patch(`/v2/feed-production-batch/${row._raw.batchNumber}`, { status: 'cancelled' });
      toast.success(`Batch ${row.batchNo} cancelled.`);
      fetchBatches();
    } catch (err) {
      const msg = err.response?.data?.response_message
        || err.response?.data?.message
        || 'Failed to cancel batch.';
      toast.error(msg, { autoClose: 6000 });
    } finally {
      setCancellingBatch(null);
    }
  };

  const handleEditBatch = (row) => {
    navigate('/feed/production/create', { state: { editBatch: row._raw } });
  };

  const getActionItems = (row) => {
    const items = [
      {
        label: <><FiEye size={14} style={{ marginRight: 10 }} /> View Details</>,
        onClick: () => handleViewDetails(row),
      },
      {
        label: <><FiEdit2 size={14} style={{ marginRight: 10 }} /> Edit</>,
        onClick: () => handleEditBatch(row),
      },
    ];
    if (row.status === 'in progress') {
      const isCompleting = completingBatch === row._raw.batchNumber;
      const isCancelling = cancellingBatch === row._raw.batchNumber;
      items.push({
        label: <><FiCheckCircle size={14} style={{ marginRight: 10 }} /> {isCompleting ? 'Completing...' : 'Complete Batch'}</>,
        onClick: () => handleCompleteBatch(row),
        style: { color: '#15803D', fontWeight: 600 },
        disabled: isCompleting,
      });
      items.push({
        label: <><FiXCircle size={14} style={{ marginRight: 10 }} /> {isCancelling ? 'Cancelling...' : 'Cancel Batch'}</>,
        onClick: () => handleCancelBatch(row),
        style: { color: '#DC2626', fontWeight: 600 },
        disabled: isCancelling,
      });
    }
    return items;
  };

  /* ----- reset filters ----- */
  const handleReset = () => {
    setSearch('');
    setFeedTypeFilter('all');
    setStatusFilter('all');
    setSiteFilter('all');
    setPage(1);
  };

  /* ----- pagination helpers ----- */
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  /* ----- render ----- */
  return (
    <section className={`${feedStyles.body}`}>
      <ToastContainer />
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>

            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Feed Management</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Feed Production</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Production History</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Feed Production History</h1>
                <p className={styles.pageSubtitle}>View and track all feed production batches.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.secBtn}>
                  <IoCalendarOutline size={14} />
                  May 1, 2025 - May 31, 2025
                  <IoChevronDown size={12} />
                </button>
                <button className={styles.secBtn} onClick={() => fetchBatches()}>
                  <FiRefreshCw size={14} />
                  Refresh
                </button>
                <button className={styles.secBtn} disabled>
                  <FiDownload size={14} />
                  Export
                </button>
              </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <BsBoxSeam size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Batches</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : f(summary?.totalBatches ?? data.length)}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>This Month</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiChipsBag size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Feed Produced</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : f(summary?.totalFeedProduced ?? 0)}
                      <span className={styles.statUnit}> kg</span>
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>All batches</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                    <GiMoneyStack size={20} color="#7C3AED" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Production Cost</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : formatCurrency(summary?.totalProductionCost ?? 0)}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>All batches</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FEF2F2' }}>
                    <FiTrendingUp size={20} color="#DC2626" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Highest Cost Feed</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : summary?.highestCostFeed?.feedName ?? '--'}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>
                  {summary?.highestCostFeed
                    ? `${formatCurrency(summary.highestCostFeed.averageCostPerKg)} / kg`
                    : 'No data'}
                </p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#F0FDF4' }}>
                    <FiTrendingDown size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Lowest Cost Feed</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : summary?.lowestCostFeed?.feedName ?? '--'}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>
                  {summary?.lowestCostFeed
                    ? `${formatCurrency(summary.lowestCostFeed.averageCostPerKg)} / kg`
                    : 'No data'}
                </p>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by batch no., feed type or produced by..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className={styles.filterDropdown}
                value={feedTypeFilter}
                onChange={(e) => setFeedTypeFilter(e.target.value)}
              >
                <option value="all">All Feed Types</option>
                {feedTypeOptions.filter(o => o !== 'all').map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select
                className={styles.filterDropdown}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {statusOptions.filter(o => o !== 'all').map(opt => (
                  <option key={opt} value={opt}>{statusDisplay(opt)}</option>
                ))}
              </select>

              <select
                className={styles.filterDropdown}
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
              >
                <option value="all">All Sites</option>
                {siteOptions.filter(o => o !== 'all').map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <button className={styles.resetBtn} onClick={handleReset}>
                <FiRefreshCw size={13} />
                Reset
              </button>
            </div>

            {/* ── Data Table ── */}
            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <DataTable
                  className={styles.table}
                  columns={[
                    {
                      key: 'batchNo',
                      label: 'Batch No.',
                      render: (value) => <span className={styles.batchNoCell}>{value}</span>,
                    },
                    {
                      key: 'feedType',
                      label: 'Feed Type',
                      render: (value) => (
                        <div className={styles.feedTypeCell}>
                          <span className={styles.feedTypeDot} style={{ background: getFeedColor(value) }} />
                          {value}
                        </div>
                      ),
                    },
                    {
                      key: 'siteType',
                      label: 'Site Type',
                      render: (value) => <span className={styles.siteTypeLink}>{value}</span>,
                    },
                    {
                      key: 'startPeriod',
                      label: 'Start Period',
                      render: (value) => <span className={styles.dateCell}>{formatDate(value)}</span>,
                    },
                    {
                      key: 'endPeriod',
                      label: 'End Period',
                      render: (value) => <span className={styles.dateCell}>{formatDate(value)}</span>,
                    },
                    {
                      key: 'qty',
                      label: 'Quantity Produced',
                      render: (value) => <span className={styles.numCell}>{f(value)}</span>,
                    },
                    { key: 'unit', label: 'Unit' },
                    {
                      key: 'totalCost',
                      label: 'Total Cost (₦)',
                      render: (value) => <span className={styles.boldNumCell}>{formatCurrency(value)}</span>,
                    },
                    {
                      key: 'costPerKg',
                      label: 'Cost per Kg (₦)',
                      render: (value) => <span className={styles.numCell}>{formatCurrency(value)}</span>,
                    },
                    { key: 'producedBy', label: 'Produced By' },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (value) => {
                        const s = STATUS_STYLES[value] || {};
                        return (
                          <span className={styles.statusPill} style={{ background: s.bg, color: s.color }}>
                            {statusDisplay(value)}
                          </span>
                        );
                      },
                    },
                  ]}
                  data={tableData}
                  loading={loading}
                  error={fetchError || ''}
                  emptyMessage={
                    data.length === 0
                      ? 'No production batches found. Create a new batch to get started.'
                      : 'No batches match the current filters.'
                  }
                  actions={(row) => (
                    <PortalDropdown
                      btnClass={feedStyles.threeDotBtn}
                      menuStyle={{
                        background: '#fff',
                        color: '#374151',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        borderRadius: 8,
                        padding: '4px 0',
                      }}
                      items={getActionItems(row)}
                    />
                  )}
                />
              </div>

              {/* ── Table Footer ── */}
              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>
                  {loading
                    ? 'Loading...'
                    : data.length === 0
                      ? 'No batches found'
                      : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalFiltered)} of ${totalFiltered} batch${totalFiltered !== 1 ? 'es' : ''}`
                  }
                </span>
                <div className={styles.pagination} style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', paddingTop: 12, paddingBottom: 12 }}>
                  <button
                    className={styles.pageArrow}
                    disabled={page <= 1 || totalFiltered === 0}
                    onClick={() => goToPage(page - 1)}
                  >
                    <FiChevronLeft size={15} />
                  </button>

                  {getPageNumbers().map(p => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    className={styles.pageArrow}
                    disabled={page >= totalPages || totalFiltered === 0}
                    onClick={() => goToPage(page + 1)}
                  >
                    <FiChevronRight size={15} />
                  </button>

                  <select
                    className={styles.perPageDropdown}
                    value={pageSize}
                    onChange={() => {}}
                    disabled
                  >
                    <option value={10}>10 / page</option>
                  </select>
                </div>
              </div>
            </div>

          </main>
        </section>
      </div>
    </section>
  );
}

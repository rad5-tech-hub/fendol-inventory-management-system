import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  IoCalendarOutline, IoClose, IoArrowUp, IoArrowDown,
} from 'react-icons/io5';
import {
  FiChevronLeft, FiChevronRight, FiArrowLeft,
} from 'react-icons/fi';
import { GiCube } from 'react-icons/gi';
import { BsInfoCircle, BsCurrencyDollar } from 'react-icons/bs';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import DataTable from "../../shared/data-table/DataTable";
import Api, { ApiV2 } from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './feed-ledger.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_PILL_COLORS = {
  'in stock': { bg: '#DCFCE7', color: '#15803D' },
  'out of stock': { bg: '#FEE2E2', color: '#DC2626' },
  'low stock': { bg: '#FEF3C7', color: '#B45309' },
};

const STAGE_PILL_COLORS = {
  'Feed topped up': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Feed used': { bg: '#F5F3FF', color: '#7C3AED' },
};

export default function FeedLedger() {
  const { feedName } = useParams();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const [showSidebar, setShowSidebar] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [serverSummary, setServerSummary] = useState(null);
  const [feedDetails, setFeedDetails] = useState(null);
  const [feedMeta, setFeedMeta] = useState(null);
  const [siteTypes, setSiteTypes] = useState([]);
  const [ponds, setPonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterApplied, setFilterApplied] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const displayName = feedDetails?.feedName || feedMeta?.feedName || 'Feed';

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    const fetchHistory = async (startDate, endDate) => {
      try {
        setLoading(true);
        const siteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '');
        const params = { siteId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const [histRes, siteRes, feedsRes, pondsRes] = await Promise.all([
          Api.get('/feeds-histories', { params }),
          ApiV2.get('/v2/site-types'),
          Api.get('/feeds', { params: { siteId } }).catch(() => null),
          Api.get(`/fish-stages?siteId=${isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '')}`).catch(() => null),
        ]);

        if (histRes.data?.success) {
          setHistoryData(histRes.data.data || []);
          setServerSummary(histRes.data.summary || null);
          setFetchError(null);
          if (histRes.data.data?.length > 0 && histRes.data.data[0].feed) {
            setFeedDetails(histRes.data.data[0].feed);
          }
        } else {
          const msg = histRes.data?.response_message || 'Failed to load feed history.';
          setFetchError(msg);
          toast.error(msg, { className: 'dark-toast', autoClose: 8000 });
        }

        if (siteRes.data?.data) {
          setSiteTypes(siteRes.data.data);
        }

        if (feedsRes?.data?.data) {
          const feeds = Array.isArray(feedsRes.data.data) ? feedsRes.data.data : [];
          const match = feeds.find((f) => f.id === feedName);
          if (match) setFeedMeta(match);
        }

        if (pondsRes?.data?.data) {
          setPonds(Array.isArray(pondsRes.data.data) ? pondsRes.data.data : []);
        }
      } catch (err) {
        const status = err?.response?.status;
        const serverMsg = err?.response?.data?.response_message || err?.response?.data?.message;
        const networkMsg = !err.response ? 'Network error — please check your internet connection.' : null;

        let finalMsg;
        if (networkMsg) {
          finalMsg = networkMsg;
        } else if (status === 500) {
          const isDbError = serverMsg?.toLowerCase().includes('unknown column') || serverMsg?.toLowerCase().includes('sequelize');
          if (isDbError) {
            finalMsg = 'A database configuration issue was detected. Please contact support and reference "feed-history column error".';
          } else {
            finalMsg = serverMsg || 'Server error — please try again later or contact support.';
          }
        } else if (status === 404) {
          finalMsg = 'Feed history not found. The feed may have been removed.';
        } else if (status === 403) {
          finalMsg = 'Access denied. You do not have permission to view this feed history.';
        } else if (status === 422 || status === 400) {
          finalMsg = serverMsg || 'Invalid request. Please try again.';
        } else {
          finalMsg = serverMsg || 'An unexpected error occurred while loading feed history.';
        }

        setFetchError(finalMsg);
        toast.error(finalMsg, { className: 'dark-toast', autoClose: 8000 });
        console.error('[FeedLedger] Fetch failed:', {
          endpoint: '/feeds-histories',
          status,
          statusText: err?.response?.statusText,
          responseData: err?.response?.data,
          networkMessage: err?.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory('', '');
  }, [feedName]);

  const filteredHistory = useMemo(() => {
    return historyData;
  }, [historyData]);

  const pageCount = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedData = filteredHistory.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleApplyFilter = async () => {
    setFilterApplied(true);
    setCurrentPage(0);
    try {
      setLoading(true);
      const siteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '');
      const params = { siteId };
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      const histRes = await Api.get('/feeds-histories', { params });
      if (histRes.data?.success) {
        setHistoryData(histRes.data.data || []);
        setServerSummary(histRes.data.summary || null);
        setFetchError(null);
      } else {
        const msg = histRes.data?.response_message || 'Failed to load feed history.';
        setFetchError(msg);
        toast.error(msg, { className: 'dark-toast', autoClose: 8000 });
      }
    } catch (err) {
      const msg = err?.response?.data?.response_message || err?.response?.data?.message || 'Error fetching filtered history.';
      setFetchError(msg);
      toast.error(msg, { className: 'dark-toast', autoClose: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterApplied(false);
    setCurrentPage(0);
  };

  const sum = (arr, key) => arr.reduce((s, h) => s + Number(h[key] || 0), 0);

  const stats = useMemo(() => {
    const hasFilter = filterStartDate || filterEndDate;
    const src = hasFilter ? filteredHistory : historyData;

    if (!src.length && !serverSummary) return null;

    const totalQtyAdded = hasFilter ? sum(src, 'originalQuantity') : (Number(serverSummary?.totalQuantityAdded) || sum(src, 'originalQuantity'));
    const totalQtyUsed = hasFilter ? sum(src, 'quantityUsed') : (Number(serverSummary?.totalQuantityUsed) || sum(src, 'quantityUsed'));
    const totalQtySold = hasFilter ? sum(src, 'quantitySold') : (Number(serverSummary?.totalQuantitySold) || sum(src, 'quantitySold'));
    const totalRemaining = src.length ? sum(src, 'remainingFeed') : 0;
    const costOfQtyUsed = hasFilter ? sum(src, 'cost') : (Number(serverSummary?.costOfQuantityUsed) || sum(src, 'cost'));
    const costOfQtyAdded = hasFilter
      ? src.filter(h => h.stage === 'Feed topped up').reduce((s, h) => s + Number(h.cost), 0)
      : (Number(serverSummary?.costOfQuantityAdded) || src.filter(h => h.stage === 'Feed topped up').reduce((s, h) => s + Number(h.cost), 0));

    return { totalQtyAdded, totalQtyUsed, totalQtySold, totalRemaining, costOfQtyUsed, costOfQtyAdded };
  }, [filteredHistory, historyData, serverSummary, filterStartDate, filterEndDate]);

  return (
    <section className={`${feedStyles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>

            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Inventory</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Feed Ledger</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Transaction History</span>
            </div>

            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>{displayName}</h1>
                <p className={styles.pageSubtitle}>Transaction history for this feed.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                  <FiArrowLeft size={14} />
                  Back to Feed Ledger
                </button>
              </div>
            </div>

            {fetchError && !historyData.length && (
              <div className={styles.errorBanner}>
                <div className={styles.errorBannerContent}>
                  <BsInfoCircle size={18} className={styles.errorBannerIcon} />
                  <div className={styles.errorBannerText}>
                    <span className={styles.errorBannerTitle}>Unable to load feed ledger</span>
                    <span className={styles.errorBannerMsg}>{fetchError}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.statRow}>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#EFF6FF' }}>
                  <IoArrowUp size={18} color="#2563EB" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Qty Added</span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalQtyAdded) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#FEF3C7' }}>
                  <IoArrowDown size={18} color="#D97706" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Qty Used</span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalQtyUsed) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#F3E8FF' }}>
                  <IoArrowUp size={18} color="#9333EA" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Qty Sold</span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalQtySold) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                  <GiCube size={18} color="#2563EB" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>
                    Qty Remaining
                    <BsInfoCircle size={12} className={styles.infoIcon} />
                  </span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalRemaining) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#FEE2E2' }}>
                  <BsCurrencyDollar size={18} color="#DC2626" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Cost of Qty Used</span>
                  <span className={styles.statNumber}>{stats ? formatCurrency(stats.costOfQtyUsed) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#D1FAE5' }}>
                  <BsCurrencyDollar size={18} color="#059669" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Cost of Qty Added</span>
                  <span className={styles.statNumber}>{stats ? formatCurrency(stats.costOfQtyAdded) : '--'}</span>
                </div>
              </div>
            </div>

            {/* ── Date Filter ── */}
            <div className={styles.filterRow}>
              <div className={styles.filterLeft}>
                <div className={styles.filterField}>
                  <span className={styles.filterCaption}>From</span>
                  <div className={styles.filterControl}>
                    <IoCalendarOutline size={15} className={styles.ctrlIcon} />
                    <input
                      type="date"
                      className={styles.filterDateInput}
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                    {filterStartDate && (
                      <IoClose size={15} className={styles.ctrlClear} onClick={() => setFilterStartDate('')} />
                    )}
                  </div>
                </div>
                <div className={styles.filterField}>
                  <span className={styles.filterCaption}>To</span>
                  <div className={styles.filterControl}>
                    <IoCalendarOutline size={15} className={styles.ctrlIcon} />
                    <input
                      type="date"
                      className={styles.filterDateInput}
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                    {filterEndDate && (
                      <IoClose size={15} className={styles.ctrlClear} onClick={() => setFilterEndDate('')} />
                    )}
                  </div>
                </div>
                {(filterStartDate || filterEndDate) && (
                  <button className={styles.filterClearBtn} onClick={handleClearFilter}>
                    <IoClose size={14} />
                    Clear filters
                  </button>
                )}
                <button
                  className={styles.applyBtn}
                  onClick={handleApplyFilter}
                  disabled={!filterStartDate && !filterEndDate}
                >
                  Apply
                </button>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <DataTable
                  className={styles.table}
                  columns={[
                    {
                      key: 'createdAt',
                      label: 'Date',
                      render: (value) => {
                        const date = new Date(value);
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div className={styles.dateCell}>
                            <span className={styles.dateTop}>{dateStr}</span>
                            <span className={styles.dateBottom}>{timeStr}</span>
                          </div>
                        );
                      },
                    },
                    {
                      key: 'stage',
                      label: 'Stage',
                      render: (value) => {
                        const pill = STAGE_PILL_COLORS[value] || { bg: '#F3F4F6', color: '#374151' };
                        return (
                          <span className={styles.txPill} style={{ background: pill.bg, color: pill.color }}>
                            {value || '--'}
                          </span>
                        );
                      },
                    },
                    {
                      key: 'pondId',
                      label: 'Pond',
                      render: (value, row) => {
                        if (row?.stage === 'Feed used' && value) {
                          const pond = ponds.find(p => p.id === value);
                          const pondName = pond?.title || pond?.name || null;
                          return pondName ? (
                            <span className={styles.txPill} style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                              {pondName}
                            </span>
                          ) : '--';
                        }
                        return '--';
                      },
                    },
                    { key: 'originalQuantity', label: 'Original Qty', render: (value) => <span>{Number(value) > 0 ? f(value) : '--'}</span> },
                    { key: 'quantityUsed', label: 'Qty Used', render: (value) => <span>{Number(value) > 0 ? f(value) : '--'}</span> },
                    { key: 'noOfBagAdded', label: 'Bags Added', render: (value) => <span>{value != null ? f(value) : '--'}</span> },
                    { key: 'quantitySold', label: 'Qty Sold', render: (value) => <span>{Number(value) > 0 ? f(value) : '--'}</span> },
                    { key: 'cost', label: 'Cost (₦)', render: (value) => <span>{Number(value) > 0 ? formatCurrency(value) : '--'}</span> },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (value) => {
                        const pillStyle = STATUS_PILL_COLORS[value] || { bg: '#F3F4F6', color: '#374151' };
                        return (
                          <span className={styles.txPill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                            {value}
                          </span>
                        );
                      },
                    },
                    { key: 'remainingFeed', label: 'Qty Remaining', render: (value) => <span style={{ fontWeight: 700 }}>{f(value)}</span> },
                  ]}
                  data={paginatedData}
                  loading={loading}
                  emptyMessage={filterApplied ? "No records for this date range." : "No records found."}
                />
              </div>

              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>Showing {paginatedData.length} of {filteredHistory.length} transactions</span>
                <ReactPaginate
                  previousLabel={<FiChevronLeft size={15} />}
                  nextLabel={<FiChevronRight size={15} />}
                  breakLabel="..."
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageChange}
                  containerClassName={styles.pagination}
                  pageLinkClassName={styles.pageBtn}
                  activeLinkClassName={styles.pageBtnActive}
                  previousLinkClassName={styles.pageArrow}
                  nextLinkClassName={styles.pageArrow}
                  disabledLinkClassName={styles.pageArrowDisabled}
                  renderOnZeroPageCount={null}
                />
              </div>
            </div>

          </main>
        </section>
      </div>
    </section>
  );
}

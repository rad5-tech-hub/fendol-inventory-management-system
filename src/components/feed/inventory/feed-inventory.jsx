import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoChevronDown,
} from 'react-icons/io5';
import {
  FiDownload, FiFilter, FiSearch, FiRefreshCw, FiPlus,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { GiChipsBag, GiCycle } from 'react-icons/gi';
import { BsEye, BsArrowUpCircle, BsArrowDownCircle } from 'react-icons/bs';
import { FaExclamationTriangle } from 'react-icons/fa';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import feedStyles from '../feed.module.scss';
import styles from './feed-inventory.module.scss';
import AddFeedModal from '../view-all/AddFeedModal';
import Api from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_STYLES = {
  'in stock': { bg: '#DCFCE7', color: '#15803D' },
  'In Stock': { bg: '#DCFCE7', color: '#15803D' },
  'low stock': { bg: '#FEF3C7', color: '#B45309' },
  'Low Stock': { bg: '#FEF3C7', color: '#B45309' },
  'out of stock': { bg: '#FEE2E2', color: '#DC2626' },
  'Out of Stock': { bg: '#FEE2E2', color: '#DC2626' },
};

const pillColors = [
  { bg: '#FEE2E2', color: '#8B1A1A' },
  { bg: '#FFEDD5', color: '#C2410C' },
  { bg: '#DCFCE7', color: '#15803D' },
  { bg: '#DBEAFE', color: '#1D4ED8' },
  { bg: '#EDE9FE', color: '#6D28D9' },
  { bg: '#FCE7F3', color: '#9D174D' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#E0E7FF', color: '#3730A3' },
  { bg: '#F5F5F5', color: '#525252' },
];

const nameIconColors = [
  '#16A34A', '#F97316', '#2563EB', '#7C3AED', '#0D9488',
  '#EAB308', '#DC2626', '#8B5CF6', '#EC4899', '#14B8A6',
];

export default function FeedInventory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [feedRows, setFeedRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const fetchFeeds = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await Api.get('/feeds?siteId=all');
      const data = res.data?.data;
      const responseMeta = res.data?.meta;
      if (Array.isArray(data)) {
        setFeedRows(data);
        setMeta(responseMeta || null);
      } else {
        throw new Error('Invalid response format: expected an array of feeds.');
      }
    } catch (err) {
      if (!err.response) {
        setFetchError('Network error. Please check your internet connection and try again.');
      } else if (err.response.status === 500) {
        setFetchError('Server error. Please try again later or contact support.');
      } else {
        setFetchError(
          err.response?.data?.response_message ||
          err.response?.data?.message ||
          'Failed to load feeds. Please try again.'
        );
      }
      setFeedRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const getActionItems = (row) => [
    {
      label: <><BsEye size={14} style={{ marginRight: 10 }} /> View Details</>,
      onClick: () => navigate(`/feed/inventory/ledger/${encodeURIComponent(row.id)}`),
    },
    { divider: true },
    {
      label: <><BsArrowUpCircle size={14} style={{ marginRight: 10, color: '#16A34A' }} /> Restock Feed</>,
      onClick: () => {
        toast.info('Restock feature is not yet available.', { className: 'dark-toast' });
      },
    },
    {
      label: <><BsArrowDownCircle size={14} style={{ marginRight: 10, color: '#F97316' }} /> Use Feed</>,
      onClick: () => {
        toast.info('Use feed feature is not yet available.', { className: 'dark-toast' });
      },
    },
  ];

  const totalQuantity = meta?.totalQuantity ?? feedRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const feedTypeCount = meta?.feedTypeCount ?? feedRows.length;

  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
  };

  const currentProducts = feedRows.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const pageCount = Math.ceil(feedRows.length / itemsPerPage);

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
            <ToastContainer />

            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Inventory</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Feed Inventory</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Feed Inventory</h1>
                <p className={styles.pageSubtitle}>View and manage finished feed stock from both production and purchases.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.exportBtn} onClick={() => setShowAddFeedModal(true)}>
                  <FiPlus size={14} />
                  Add Feed
                </button>
                <button className={styles.secBtn}>
                  <FiDownload size={14} />
                  Stock In (Purchase)
                </button>
              </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <GiChipsBag size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Feed Types</p>
                    <div className={styles.statNumber}>{feedTypeCount}</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>All feed types</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiCycle size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Stock Available</p>
                    <div className={styles.statNumber}>{f(totalQuantity)} <span className={styles.statUnit}>kg</span></div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Across all feed types</p>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by feed name or type..."
                />
              </div>
              <button className={styles.filterDropdown}>
                All Feed Types <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Sites <IoChevronDown size={11} />
              </button>
              <button className={styles.filterBtn}>
                <FiFilter size={13} />
                Filter
              </button>
              <button className={styles.resetBtn} onClick={fetchFeeds}>
                <FiRefreshCw size={13} />
                Refresh
              </button>
            </div>

            {/* ── Loading State ── */}
            {loading && (
              <div className={styles.tableCard}>
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted" style={{ fontSize: '14px' }}>Loading feed inventory...</p>
                </div>
              </div>
            )}

            {/* ── Error State ── */}
            {!loading && fetchError && (
              <div className={styles.tableCard}>
                <div className="text-center py-5 px-3">
                  <FaExclamationTriangle size={32} color="#DC2626" />
                  <p className="mt-2" style={{ fontSize: '14px', color: '#DC2626', fontWeight: 500 }}>{fetchError}</p>
                  <button
                    className="btn btn-outline-dark btn-sm mt-2"
                    onClick={fetchFeeds}
                  >
                    <FiRefreshCw size={13} style={{ marginRight: 6 }} />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* ── Empty State ── */}
            {!loading && !fetchError && feedRows.length === 0 && (
              <div className={styles.tableCard}>
                <div className="text-center py-5">
                  <GiChipsBag size={40} color="#9CA3AF" />
                  <p className="mt-2 text-muted" style={{ fontSize: '14px' }}>No feeds found. Add a new feed to get started.</p>
                </div>
              </div>
            )}

            {/* ── Feed Stock Overview Table ── */}
            {!loading && !fetchError && feedRows.length > 0 && (
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.cardTitle}>Feed Stock Overview</h3>
                  <span className={styles.tableBadge}>{feedTypeCount} Feed Types</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Feed Name</th>
                        <th>Feed Type</th>
                        <th>Unit</th>
                        <th style={{ textAlign: 'right' }}>Total Stock (Kg)</th>
                        <th style={{ textAlign: 'right' }}>Average Cost (&#8358;/Kg)</th>
                        <th style={{ textAlign: 'right' }}>Total Value (&#8358;)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((row, i) => {
                        const quantity = Number(row.quantity) || 0;
                        const unitPrice = Number(row.unitPrice) || 0;
                        const totalValue = quantity * unitPrice;
                        const pillStyle = pillColors[i % pillColors.length];
                        const iconColor = nameIconColors[i % nameIconColors.length];
                        const statusKey = row.status?.toLowerCase()?.replace(/\s+/g, ' ');
                        const matchedStatus = Object.keys(STATUS_STYLES).find(
                          (k) => k.toLowerCase().replace(/\s+/g, ' ') === statusKey
                        );
                        const statusStyle = matchedStatus ? STATUS_STYLES[matchedStatus] : { bg: '#F3F4F6', color: '#374151' };
                        return (
                          <tr key={row.id || i}>
                            <td>
                              <div className={styles.feedNameCell}>
                                <span className={styles.feedNameIcon} style={{ background: iconColor }} />
                                {row.feedName}
                              </div>
                            </td>
                            <td>
                              <span className={styles.typePill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                                {row.feedType}
                              </span>
                            </td>
                            <td>{row.unit}</td>
                            <td className={styles.numCell}>{f(quantity)}</td>
                            <td className={styles.numCell}>{formatCurrency(unitPrice)}</td>
                            <td className={styles.boldNumCell}>{formatCurrency(totalValue)}</td>
                            <td>
                              <span
                                className={styles.statusPill}
                                style={{ background: statusStyle.bg, color: statusStyle.color }}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td>
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Table Footer ── */}
                <div className={styles.tableFooter}>
                  <span className={styles.footerInfo}>
                    Showing {currentProducts.length > 0 ? currentPage * itemsPerPage + 1 : 0} to{' '}
                    {Math.min((currentPage + 1) * itemsPerPage, feedRows.length)} of {feedRows.length} feed types
                  </span>
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageArrow}
                      onClick={() => handlePageChange({ selected: currentPage - 1 })}
                      disabled={currentPage === 0}
                      style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
                    >
                      <FiChevronLeft size={15} />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => (
                      <button
                        key={i}
                        className={`${styles.pageBtn} ${currentPage === i ? styles.pageBtnActive : ''}`}
                        onClick={() => handlePageChange({ selected: i })}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className={styles.pageArrow}
                      onClick={() => handlePageChange({ selected: currentPage + 1 })}
                      disabled={currentPage >= pageCount - 1}
                      style={{ opacity: currentPage >= pageCount - 1 ? 0.4 : 1 }}
                    >
                      <FiChevronRight size={15} />
                    </button>
                    <button className={styles.perPageDropdown}>
                      {itemsPerPage} / page <IoChevronDown size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </section>
      </div>
      <AddFeedModal
        show={showAddFeedModal}
        onClose={() => setShowAddFeedModal(false)}
        onSuccess={fetchFeeds}
      />
    </section>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  IoChevronDown,
} from 'react-icons/io5';
import {
  FiDownload, FiFilter, FiSearch, FiRefreshCw, FiPlus,
  FiChevronLeft, FiChevronRight, FiEdit2,
} from 'react-icons/fi';
import { GiChipsBag, GiCycle } from 'react-icons/gi';
import { BsEye, BsArrowUpCircle, BsArrowDownCircle } from 'react-icons/bs';
import { FaExclamationTriangle } from 'react-icons/fa';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import DataTable from "../../shared/data-table/DataTable";
import feedStyles from '../feed.module.scss';
import styles from './feed-inventory.module.scss';
import AddFeedModal from '../view-all/AddFeedModal';
import TopUpFeedModal from './TopUpFeedModal';
import UseFeedModal from './UseFeedModal';
import Api, { ApiV2 } from '../../shared/api/apiLink';
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
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [editFeed, setEditFeed] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpFeed, setTopUpFeed] = useState(null);
  const [showUseFeedModal, setShowUseFeedModal] = useState(false);
  const [useFeedItem, setUseFeedItem] = useState(null);
  const [feedRows, setFeedRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedType, setSelectedFeedType] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [siteTypes, setSiteTypes] = useState([]);
  const [showFeedTypeFilter, setShowFeedTypeFilter] = useState(false);
  const [showSiteFilter, setShowSiteFilter] = useState(false);
  const feedTypeFilterRef = useRef(null);
  const siteFilterRef = useRef(null);

  const currentSiteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '');

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const fetchFeeds = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await Api.get(`/feeds?siteId=${currentSiteId}`);
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
  }, [currentSiteId]);

  useEffect(() => {
    const fetchSiteTypes = async () => {
      try {
        const res = await ApiV2.get('/v2/site-types');
        if (res.data?.data) {
          setSiteTypes(res.data.data);
        }
      } catch {
        // silently fail
      }
    };
    fetchSiteTypes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (feedTypeFilterRef.current && !feedTypeFilterRef.current.contains(e.target)) {
        setShowFeedTypeFilter(false);
      }
      if (siteFilterRef.current && !siteFilterRef.current.contains(e.target)) {
        setShowSiteFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActionItems = (row) => [
    {
      label: <><BsEye size={14} style={{ marginRight: 10 }} /> View Details</>,
      onClick: () => navigate(`/feed/inventory/ledger/${encodeURIComponent(row.id)}`),
    },
    {
      label: <><FiEdit2 size={14} style={{ marginRight: 10 }} /> Edit</>,
      onClick: () => { setEditFeed(row); setShowAddFeedModal(true); },
    },
    { divider: true },
    {
      label: <><BsArrowUpCircle size={14} style={{ marginRight: 10, color: '#16A34A' }} /> Restock Feed</>,
      onClick: () => { setTopUpFeed(row); setShowTopUpModal(true); },
    },
    {
      label: <><BsArrowDownCircle size={14} style={{ marginRight: 10, color: '#F97316' }} /> Use Feed</>,
      onClick: () => { setUseFeedItem(row); setShowUseFeedModal(true); },
    },
  ];

  const feedTypeOptions = [...new Set(feedRows.map((r) => r.feedType).filter(Boolean))];

  const filteredRows = feedRows.filter((r) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const nameMatch = (r.feedName || '').toLowerCase().includes(query);
      const typeMatch = (r.feedType || '').toLowerCase().includes(query);
      if (!nameMatch && !typeMatch) return false;
    }
    if (selectedFeedType && r.feedType !== selectedFeedType) return false;
    if (selectedSiteId && r.siteTypeId !== selectedSiteId) return false;
    return true;
  });

  const totalQuantity = meta?.totalQuantity ?? feedRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const feedTypeCount = meta?.feedTypeCount ?? feedRows.length;
  const filteredQuantity = filteredRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const filteredTypeCount = [...new Set(filteredRows.map((r) => r.feedType).filter(Boolean))].length;

  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFeedType('');
    setSelectedSiteId('');
    setCurrentPage(0);
  };

  const currentProducts = filteredRows.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const pageCount = Math.ceil(filteredRows.length / itemsPerPage);

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
                <button className={styles.exportBtn} onClick={() => { setEditFeed(null); setShowAddFeedModal(true); }}>
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
                    <p className={styles.statLabel}>Feed Types</p>
                    <div className={styles.statNumber}>
                      {searchQuery || selectedFeedType || selectedSiteId ? filteredTypeCount : feedTypeCount}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>
                  {searchQuery || selectedFeedType || selectedSiteId ? 'Filtered count' : 'All feed types'}
                </p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiCycle size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Stock Available</p>
                    <div className={styles.statNumber}>
                      {f(searchQuery || selectedFeedType || selectedSiteId ? filteredQuantity : totalQuantity)}
                      <span className={styles.statUnit}> kg</span>
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>
                  {searchQuery || selectedFeedType || selectedSiteId ? 'Filtered total' : 'Across all feed types'}
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
                  placeholder="Search by feed name or type..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#9CA3AF', cursor: 'pointer', lineHeight: 1 }}
                    type="button"
                  >
                    <FiRefreshCw size={12} />
                  </button>
                )}
              </div>

              <div ref={feedTypeFilterRef} className="position-relative">
                <button
                  className={styles.filterDropdown}
                  onClick={() => { setShowFeedTypeFilter(!showFeedTypeFilter); setShowSiteFilter(false); }}
                  type="button"
                >
                  {selectedFeedType || 'All Feed Types'} <IoChevronDown size={11} />
                </button>
                {showFeedTypeFilter && (
                  <div
                    className="position-absolute bg-white shadow-sm"
                    style={{
                      zIndex: 1050,
                      borderRadius: '10px',
                      marginTop: '6px',
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                      minWidth: 200,
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      <div
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: !selectedFeedType ? 600 : 400,
                          color: !selectedFeedType ? '#512728' : '#2E3135',
                          backgroundColor: !selectedFeedType ? '#fdf5f5' : 'transparent',
                          borderBottom: feedTypeOptions.length > 0 ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => { setSelectedFeedType(''); setShowFeedTypeFilter(false); setCurrentPage(0); }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFCFF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        All Feed Types
                      </div>
                      {feedTypeOptions.map((t) => (
                        <div
                          key={t}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: selectedFeedType === t ? 600 : 400,
                            color: selectedFeedType === t ? '#512728' : '#2E3135',
                            backgroundColor: selectedFeedType === t ? '#fdf5f5' : 'transparent',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onClick={() => { setSelectedFeedType(t); setShowFeedTypeFilter(false); setCurrentPage(0); }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFCFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div ref={siteFilterRef} className="position-relative">
                <button
                  className={styles.filterDropdown}
                  onClick={() => { setShowSiteFilter(!showSiteFilter); setShowFeedTypeFilter(false); }}
                  type="button"
                >
                  {selectedSiteId ? (siteTypes.find((s) => s.id === selectedSiteId)?.name || selectedSiteId) : 'All Sites'} <IoChevronDown size={11} />
                </button>
                {showSiteFilter && (
                  <div
                    className="position-absolute bg-white shadow-sm"
                    style={{
                      zIndex: 1050,
                      borderRadius: '10px',
                      marginTop: '6px',
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                      minWidth: 200,
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      <div
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: !selectedSiteId ? 600 : 400,
                          color: !selectedSiteId ? '#512728' : '#2E3135',
                          backgroundColor: !selectedSiteId ? '#fdf5f5' : 'transparent',
                          borderBottom: siteTypes.length > 0 ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => { setSelectedSiteId(''); setShowSiteFilter(false); setCurrentPage(0); }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFCFF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        All Sites
                      </div>
                      {siteTypes.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: selectedSiteId === s.id ? 600 : 400,
                            color: selectedSiteId === s.id ? '#512728' : '#2E3135',
                            backgroundColor: selectedSiteId === s.id ? '#fdf5f5' : 'transparent',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onClick={() => { setSelectedSiteId(s.id); setShowSiteFilter(false); setCurrentPage(0); }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFCFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className={styles.resetBtn} onClick={resetFilters} type="button">
                <FiRefreshCw size={13} />
                Reset
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
                  <span className={styles.tableBadge}>
                    {filteredTypeCount}
                    {searchQuery || selectedFeedType || selectedSiteId ? ` / ${feedTypeCount}` : ''} Feed Types
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <DataTable
                    className={styles.table}
                    columns={[
                      {
                        key: 'feedName',
                        label: 'Feed Name',
                        render: (value, row, i) => {
                          const iconColor = nameIconColors[i % nameIconColors.length];
                          return (
                            <div className={styles.feedNameCell}>
                              <span className={styles.feedNameIcon} style={{ background: iconColor }} />
                              {value}
                            </div>
                          );
                        },
                      },
                      {
                        key: 'feedType',
                        label: 'Feed Type',
                        render: (value, row, i) => {
                          const pillStyle = pillColors[i % pillColors.length];
                          return (
                            <span className={styles.typePill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                              {value}
                            </span>
                          );
                        },
                      },
                      { key: 'unit', label: 'Unit' },
                      {
                        key: 'quantity',
                        label: 'Total Stock (Kg)',
                        align: 'right',
                        render: (value) => <span className={styles.numCell}>{f(Number(value) || 0)}</span>,
                      },
                      {
                        key: 'unitPrice',
                        label: 'Average Cost (₦/Kg)',
                        align: 'right',
                        render: (value) => <span className={styles.numCell}>{formatCurrency(Number(value) || 0)}</span>,
                      },
                      {
                        key: 'totalValue',
                        label: 'Total Value (₦)',
                        align: 'right',
                        render: (_, row) => {
                          const quantity = Number(row.quantity) || 0;
                          const unitPrice = Number(row.unitPrice) || 0;
                          return <span className={styles.boldNumCell}>{formatCurrency(quantity * unitPrice)}</span>;
                        },
                      },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (value) => {
                          const statusKey = value?.toLowerCase()?.replace(/\s+/g, ' ');
                          const matchedStatus = Object.keys(STATUS_STYLES).find(
                            (k) => k.toLowerCase().replace(/\s+/g, ' ') === statusKey
                          );
                          const statusStyle = matchedStatus ? STATUS_STYLES[matchedStatus] : { bg: '#F3F4F6', color: '#374151' };
                          return (
                            <span className={styles.statusPill} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                              {value}
                            </span>
                          );
                        },
                      },
                    ]}
                    data={currentProducts}
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
                    Showing {currentProducts.length > 0 ? currentPage * itemsPerPage + 1 : 0} to{' '}
                    {Math.min((currentPage + 1) * itemsPerPage, filteredRows.length)} of {filteredRows.length}
                    {searchQuery || selectedFeedType || selectedSiteId ? ` (filtered from ${feedRows.length})` : ''} feed types
                  </span>
                  <div className={styles.pagination} style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', paddingTop: 12, paddingBottom: 12 }}>
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
        editData={editFeed}
        onClose={() => { setShowAddFeedModal(false); setEditFeed(null); }}
        onSuccess={fetchFeeds}
      />
      <TopUpFeedModal
        show={showTopUpModal}
        feed={topUpFeed}
        onClose={() => { setShowTopUpModal(false); setTopUpFeed(null); }}
        onSuccess={(success, msg) => {
          if (success) {
            toast.success(msg, { className: 'dark-toast' });
            fetchFeeds();
          } else {
            toast.error(msg, { className: 'dark-toast' });
          }
          setShowTopUpModal(false);
          setTopUpFeed(null);
        }}
      />
      <UseFeedModal
        show={showUseFeedModal}
        feed={useFeedItem}
        onClose={() => { setShowUseFeedModal(false); setUseFeedItem(null); }}
        onSuccess={(success, msg) => {
          if (success) {
            toast.success(msg, { className: 'dark-toast' });
            fetchFeeds();
          } else {
            toast.error(msg, { className: 'dark-toast' });
          }
          setShowUseFeedModal(false);
          setUseFeedItem(null);
        }}
      />
    </section>
  );
}

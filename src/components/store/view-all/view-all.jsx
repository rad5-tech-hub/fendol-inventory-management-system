import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import {
  FiChevronLeft, FiChevronRight, FiSearch, FiRefreshCw, FiPlus,
} from 'react-icons/fi';
import { FaExclamationTriangle } from 'react-icons/fa';
import { GiCardboardBox } from 'react-icons/gi';
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import DataTable from "../../shared/data-table/DataTable";
import AddStockModal from './AddStockModal';
import RestockStoreModal from './RestockStoreModal';
import UseStoreModal from './UseStoreModal';
import EditStoreModal from './EditStoreModal';
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import feedStyles from '../../feed/feed.module.scss';
import styles from './store-view-all.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_STYLES = {
  'in stock': { bg: '#DCFCE7', color: '#15803D' },
  'low stock': { bg: '#FEF3C7', color: '#B45309' },
  'out of stock': { bg: '#FEE2E2', color: '#DC2626' },
};

const nameIconColors = [
  '#16A34A', '#F97316', '#2563EB', '#7C3AED', '#0D9488',
  '#EAB308', '#DC2626', '#8B5CF6', '#EC4899', '#14B8A6',
];

export default function UpdateStoreInventory() {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const [showSidebar, setShowSidebar] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [useProduct, setUseProduct] = useState(null);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const fetchProducts = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await Api.get('/stores');
      const data = res.data?.data;
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (!err.response) {
        setFetchError('Network error. Please check your internet connection and try again.');
      } else {
        setFetchError(
          err.response?.data?.response_message ||
          err.response?.data?.message ||
          'Failed to load store items. Please try again.'
        );
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredRows = products.filter((r) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const nameMatch = (r.name || '').toLowerCase().includes(query);
      const unitMatch = (r.unit || '').toLowerCase().includes(query);
      if (!nameMatch && !unitMatch) return false;
    }
    return true;
  });

  const totalQuantity = products.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const filteredQuantity = filteredRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const resetFilters = () => {
    setSearchQuery('');
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
              <span className={styles.breadcrumbActive}>Store Inventory</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Store Inventory</h1>
                <p className={styles.pageSubtitle}>View and manage store stock items.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.exportBtn} onClick={() => { setEditProduct(null); setShowAddModal(true); }}>
                  <FiPlus size={14} />
                  Add Store
                </button>
              </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <GiCardboardBox size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Store Items</p>
                    <div className={styles.statNumber}>
                      {searchQuery ? filteredRows.length : products.length}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>
                  {searchQuery ? 'Filtered count' : 'All store items'}
                </p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiCardboardBox size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Stock Quantity</p>
                    <div className={styles.statNumber}>
                      {f(searchQuery ? filteredQuantity : totalQuantity)}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>
                  {searchQuery ? 'Filtered total' : 'Across all items'}
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
                  placeholder="Search by name or unit..."
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
                  <p className="mt-2 text-muted" style={{ fontSize: '14px' }}>Loading store inventory...</p>
                </div>
              </div>
            )}

            {/* ── Error State ── */}
            {!loading && fetchError && (
              <div className={styles.tableCard}>
                <div className="text-center py-5 px-3">
                  <FaExclamationTriangle size={32} color="#DC2626" />
                  <p className="mt-2" style={{ fontSize: '14px', color: '#DC2626', fontWeight: 500 }}>{fetchError}</p>
                  <button className="btn btn-outline-dark btn-sm mt-2" onClick={fetchProducts}>
                    <FiRefreshCw size={13} style={{ marginRight: 6 }} />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* ── Empty State ── */}
            {!loading && !fetchError && products.length === 0 && (
              <div className={styles.tableCard}>
                <div className="text-center py-5">
                  <GiCardboardBox size={40} color="#9CA3AF" />
                  <p className="mt-2 text-muted" style={{ fontSize: '14px' }}>No store items found. Add a new stock item to get started.</p>
                </div>
              </div>
            )}

            {/* ── Store Stock Table ── */}
            {!loading && !fetchError && products.length > 0 && (
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.cardTitle}>Store Stock Overview</h3>
                  <span className={styles.tableBadge}>
                    {searchQuery ? `${filteredRows.length} / ${products.length}` : products.length} Items
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <DataTable
                    className={styles.table}
                    columns={[
                      {
                        key: 'name',
                        label: 'Name',
                        render: (value, row, i) => {
                          const iconColor = nameIconColors[i % nameIconColors.length];
                          return (
                            <div className={styles.nameCell}>
                              <span className={styles.nameIcon} style={{ background: iconColor }} />
                              {value}
                            </div>
                          );
                        },
                      },
                      { key: 'unit', label: 'Unit' },
                      {
                        key: 'quantity',
                        label: 'Quantity',
                        align: 'right',
                        render: (value) => <span className={styles.numCell}>{value != null ? f(value) : '—'}</span>,
                      },
                      {
                        key: 'threshold',
                        label: 'Threshold',
                        align: 'right',
                        render: (value) => <span className={styles.numCell}>{value != null ? f(value) : '—'}</span>,
                      },
                      {
                        key: 'weightPerItem',
                        label: 'Weight/Item',
                        align: 'right',
                        render: (value) => <span className={styles.numCell}>{value != null ? f(value) : '—'}</span>,
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
                        items={[
                          { label: 'Edit', onClick: () => { setEditProduct(row); setShowAddModal(true); } },
                          { divider: true },
                          { label: 'Restock', onClick: () => { setRestockProduct(row); setShowRestockModal(true); } },
                          { label: 'Use', onClick: () => { setUseProduct(row); setShowUseModal(true); } },
                        ]}
                      />
                    )}
                  />
                </div>

                {/* ── Table Footer ── */}
                <div className={styles.tableFooter}>
                  <span className={styles.footerInfo}>
                    Showing {currentProducts.length > 0 ? currentPage * itemsPerPage + 1 : 0} to{' '}
                    {Math.min((currentPage + 1) * itemsPerPage, filteredRows.length)} of {filteredRows.length}
                    {searchQuery ? ` (filtered from ${products.length})` : ''} items
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
                  </div>
                </div>
              </div>
            )}

          </main>
        </section>
      </div>

      <AddStockModal
        show={showAddModal}
        onClose={() => { setShowAddModal(false); setEditProduct(null); }}
        onSuccess={fetchProducts}
        isSuperAdmin={isSuperAdmin}
      />

      {showRestockModal && (
        <RestockStoreModal
          show={showRestockModal}
          store={restockProduct}
          onClose={() => { setShowRestockModal(false); setRestockProduct(null); }}
          onSuccess={(success, msg) => {
            if (success) {
              toast.success(msg, { className: 'dark-toast', autoClose: 3000 });
              fetchProducts();
            } else {
              toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
            }
            setShowRestockModal(false);
            setRestockProduct(null);
          }}
        />
      )}

      {showUseModal && (
        <UseStoreModal
          show={showUseModal}
          store={useProduct}
          onClose={() => { setShowUseModal(false); setUseProduct(null); }}
          onSuccess={(success, msg) => {
            if (success) {
              toast.success(msg, { className: 'dark-toast', autoClose: 3000 });
              fetchProducts();
            } else {
              toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
            }
            setShowUseModal(false);
            setUseProduct(null);
          }}
        />
      )}
    </section>
  );
}

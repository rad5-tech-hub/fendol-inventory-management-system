import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { IoArrowBackOutline, IoArrowUp, IoArrowDown, IoCalendarOutline, IoClose } from 'react-icons/io5';
import { GiCardboardBox, GiCube } from 'react-icons/gi';
import { BsCurrencyDollar, BsInfoCircle } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import DataTable from '../../shared/data-table/DataTable';
import Api from '../../shared/api/apiLink';
import extractError from '../../shared/utils/extractError';
import feedStyles from '../../feed/feed.module.scss';
import styles from './store-item-detail.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const formatCurrency = (n) =>
  '\u20A6' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_STYLES = {
  'in stock': { bg: '#DCFCE7', color: '#15803D' },
  'low stock': { bg: '#FEF3C7', color: '#B45309' },
  'out of stock': { bg: '#FEE2E2', color: '#DC2626' },
};

export default function StoreItemDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [histories, setHistories] = useState([]);
  const [storeName, setStoreName] = useState('');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await Api.get(`/stores-histories?storeId=${storeId}`);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setHistories(res.data.data);
          setSummary(res.data.summary || null);
          if (res.data.data.length > 0 && res.data.data[0].store) {
            setStoreName(res.data.data[0].store.name || '');
          }
        } else {
          throw new Error(res.data?.response_message || 'Failed to load store item details.');
        }
      } catch (err) {
        const msg = extractError(err, 'Failed to load store item details.');
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (storeId) fetchData();
  }, [storeId]);

  const computedStats = useMemo(() => {
    const totalQtyAdded = histories.reduce((sum, h) => sum + (Number(h.quantityAdded) || 0), 0);
    const totalQtyUsed = histories.reduce((sum, h) => sum + (Number(h.quantityUsed) || 0), 0);
    const totalCost = histories.reduce((sum, h) => sum + (Number(h.cost) || 0), 0);
    const totalPrice = histories.reduce((sum, h) => sum + (Number(h.price) || 0), 0);
    const remainingStock = histories.length > 0 ? Number(histories[0].remainingStock) || 0 : 0;
    return {
      totalQuantityAdded: summary?.totalQuantityAdded ?? totalQtyAdded,
      totalQuantityUsed: summary?.totalQuantityUsed ?? totalQtyUsed,
      totalCost: summary?.totalCost ?? totalCost,
      totalPrice: summary?.totalPrice ?? totalPrice,
      remainingStock: summary?.remainingStock ?? remainingStock,
    };
  }, [histories, summary]);

  const filteredHistories = useMemo(() => {
    if (!appliedStartDate && !appliedEndDate) return histories;
    return histories.filter((item) => {
      const d = new Date(item.createdAt);
      if (appliedStartDate && d < new Date(appliedStartDate)) return false;
      if (appliedEndDate) {
        const to = new Date(appliedEndDate);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [histories, appliedStartDate, appliedEndDate]);

  const handleApplyFilter = () => {
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
  };

  const handleClearFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const getStatusStyle = (status) => {
    const statusKey = status?.toLowerCase()?.replace(/\s+/g, ' ');
    const matchedStatus = Object.keys(STATUS_STYLES).find(
      (k) => k.toLowerCase().replace(/\s+/g, ' ') === statusKey
    );
    return matchedStatus ? STATUS_STYLES[matchedStatus] : { bg: '#F3F4F6', color: '#374151' };
  };

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

            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Inventory</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Store Inventory</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Transaction History</span>
            </div>

            {/* Header */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>{storeName || 'Store Item'}</h1>
                <p className={styles.pageSubtitle}>Transaction history for this item.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.backBtn} onClick={() => navigate('/store/view-all')}>
                  <IoArrowBackOutline size={14} />
                  Back to Store Inventory
                </button>
              </div>
            </div>

            {/* Loading / Error */}
            {loading && (
              <div className={styles.tableCard}>
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted" style={{ fontSize: '14px' }}>Loading item details...</p>
                </div>
              </div>
            )}

            {!loading && error && (
              <div className={styles.tableCard}>
                <div className="text-center py-5 px-3">
                  <p className="mt-2" style={{ fontSize: '14px', color: '#DC2626', fontWeight: 500 }}>{error}</p>
                  <button className="btn btn-outline-dark btn-sm mt-2" onClick={() => navigate('/store/view-all')}>
                    Back to Store Inventory
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            {!loading && !error && (
              <>
                {/* Stat Cards */}
                <div className={styles.statRow}>
                  <div className={styles.statItem}>
                    <div className={styles.statIconCircle} style={{ background: '#EFF6FF' }}>
                      <IoArrowUp size={18} color="#2563EB" />
                    </div>
                    <div className={styles.statBody}>
                      <span className={styles.statLabel}>Total Qty Added</span>
                      <span className={styles.statNumber}>{f(computedStats.totalQuantityAdded)}</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIconCircle} style={{ background: '#FEF3C7' }}>
                      <IoArrowDown size={18} color="#D97706" />
                    </div>
                    <div className={styles.statBody}>
                      <span className={styles.statLabel}>Total Qty Used</span>
                      <span className={styles.statNumber}>{f(computedStats.totalQuantityUsed)}</span>
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
                      <span className={styles.statNumber}>{f(computedStats.remainingStock)}</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIconCircle} style={{ background: '#FEE2E2' }}>
                      <BsCurrencyDollar size={18} color="#DC2626" />
                    </div>
                    <div className={styles.statBody}>
                      <span className={styles.statLabel}>Cost of Qty Used</span>
                      <span className={styles.statNumber}>{formatCurrency(computedStats.totalCost)}</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIconCircle} style={{ background: '#D1FAE5' }}>
                      <BsCurrencyDollar size={18} color="#059669" />
                    </div>
                    <div className={styles.statBody}>
                      <span className={styles.statLabel}>Cost of Qty Added</span>
                      <span className={styles.statNumber}>{formatCurrency(computedStats.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Date Filter */}
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

                {/* History Table */}
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
                            return (
                              <span className={styles.txPill} style={{ background: '#F3F4F6', color: '#374151' }}>
                                {value || '--'}
                              </span>
                            );
                          },
                        },
                        {
                          key: 'pond',
                          label: 'Pond',
                          render: (value) => {
                            return value?.title ? (
                              <span className={styles.txPill} style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                                {value.title}
                              </span>
                            ) : '--';
                          },
                        },
                        { key: 'originalQuantity', label: 'Original Qty', render: (value) => <span>{Number(value) > 0 ? f(value) : '--'}</span> },
                        { key: 'quantityUsed', label: 'Qty Used', render: (value) => <span>{Number(value) > 0 ? f(value) : '--'}</span> },
                        { key: 'quantityAdded', label: 'Qty Added', render: (value) => <span>{Number(value) > 0 ? f(value) : '--'}</span> },
                        { key: 'cost', label: 'Cost (\u20A6)', render: (value) => <span>{Number(value) > 0 ? formatCurrency(value) : '--'}</span> },
                        { key: 'price', label: 'Price (\u20A6)', render: (value) => <span>{Number(value) > 0 ? formatCurrency(value) : '--'}</span> },
                        {
                          key: 'status',
                          label: 'Status',
                          render: (value) => {
                            const s = getStatusStyle(value);
                            return (
                              <span className={styles.statusPill} style={{ background: s.bg, color: s.color }}>
                                {value}
                              </span>
                            );
                          },
                        },
                        {
                          key: 'remainingStock',
                          label: 'Qty Remaining',
                          render: (value) => <span style={{ fontWeight: 700 }}>{value != null ? f(value) : '--'}</span>,
                        },
                      ]}
                      data={filteredHistories}
                    />
                  </div>
                  <div className={styles.tableFooter}>
                    <span className={styles.footerInfo}>
                      Showing {filteredHistories.length} of {histories.length} transactions
                    </span>
                  </div>
                </div>
              </>
            )}

          </main>
        </section>
      </div>
    </section>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiPlus, FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEdit2, FiAlertTriangle } from 'react-icons/fi';
import { BsEye, BsBoxSeam } from 'react-icons/bs';
import { IoChevronDown } from 'react-icons/io5';
import { GiGreenPower, GiMoneyStack } from 'react-icons/gi';
import { FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import { ApiV2 } from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './raw-material-inventory.module.scss';
import AddRawMaterialModal from './AddRawMaterialModal';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_CONFIG = {
  'in stock': { label: 'In Stock', className: 'statusInStock' },
  'low stock': { label: 'Low Stock', className: 'statusLowStock' },
  'out of stock': { label: 'Out of Stock', className: 'statusOutOfStock' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function RawMaterialInventory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const res = await ApiV2.get('/v2/raw-material');
      if (res.data?.success && res.data?.data) {
        setMaterials(res.data.data);
        setMeta(res.data.meta || null);
      } else {
        throw new Error(res.data?.response_message || 'Unexpected response format');
      }
    } catch (error) {
      const errMsg = !error.response
        ? 'Network error. Please check your internet connection and try again.'
        : error.response?.status >= 500
          ? 'Server error. Please try again later.'
          : error.response?.data?.response_message
            || error.response?.data?.message
            || 'Failed to load raw materials.';

      setFetchError(errMsg);
      toast.error(errMsg, { autoClose: 6000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCreated = useCallback((success, message) => {
    if (success) {
      setShowAddModal(false);
      toast.success(message, { autoClose: 4000 });
      fetchMaterials();
    } else {
      toast.error(message, { autoClose: 6000 });
    }
  }, [fetchMaterials]);

  const getActionItems = (material) => [
    {
      label: <><BsEye size={14} style={{ marginRight: 10 }} /> View Details</>,
      onClick: () => navigate(`/feed/raw-materials/${encodeURIComponent(material.name)}`),
    },
    {
      label: <><FiEdit2 size={14} style={{ marginRight: 10 }} /> Edit</>,
      onClick: () => {},
    },
  ];

  const stockValue = materials.reduce((sum, m) => sum + (Number(m.quantity) * Number(m.unitCost)), 0);
  const lowStockCount = materials.filter((m) => {
    if (m.status === 'out of stock') return true;
    if (m.status === 'low stock') return true;
    return Number(m.quantity) <= Number(m.threshold);
  }).length;

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

            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Raw Material Inventory</h1>
                <p className={styles.pageSubtitle}>Track and manage raw materials used for feed production.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.exportBtn} disabled>
                  <FiDownload size={14} />
                  Export
                </button>
                <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                  <FiPlus size={16} />
                  Add Raw Material
                </button>
              </div>
            </div>

            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiGreenPower size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Raw Materials</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : f(meta?.totalRawMaterial ?? materials.length)}
                      <span className={styles.statUnit}> Items</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <BsBoxSeam size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Quantity in Stock</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : f(meta?.totalQuantity ?? materials.reduce((s, m) => s + Number(m.quantity), 0))}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Across all materials</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                    <GiMoneyStack size={20} color="#F97316" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Stock Value</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : formatCurrency(stockValue)}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Based on average cost</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                    <FaExclamationTriangle size={20} color="#7C3AED" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Low Stock Alerts</p>
                    <div className={styles.statNumber}>
                      {loading ? '--' : lowStockCount}
                    </div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Materials</p>
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input type="text" className={styles.searchInput} placeholder="Search by material name..." />
              </div>
              <button className={styles.filterDropdown}>
                All Categories <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Status <IoChevronDown size={11} />
              </button>
              <button className={styles.filterActionBtn}>
                <FiFilter size={13} />
                Filter
              </button>
              <button className={styles.resetBtn} onClick={() => fetchMaterials()}>
                <FiRefreshCw size={13} />
                Refresh
              </button>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Category</th>
                      <th>Unit</th>
                      <th>Quantity in Stock</th>
                      <th>Unit Cost (₦)</th>
                      <th>Stock Value (₦)</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px 12px', color: '#9CA3AF' }}>
                          Loading raw materials...
                        </td>
                      </tr>
                    ) : fetchError ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '32px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <FiAlertTriangle size={24} color="#DC2626" />
                            <span style={{ color: '#6B7280', fontSize: 14 }}>{fetchError}</span>
                            <button
                              onClick={fetchMaterials}
                              style={{
                                padding: '8px 20px',
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                background: '#fff',
                                color: '#374151',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              Try Again
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : materials.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px 12px', color: '#9CA3AF' }}>
                          No raw materials found. Click "Add Raw Material" to create one.
                        </td>
                      </tr>
                    ) : (
                      materials.map((m) => {
                        const qty = Number(m.quantity);
                        const cost = Number(m.unitCost);
                        const total = qty * cost;
                        const statusCfg = STATUS_CONFIG[m.status] || { label: m.status, className: 'statusInStock' };

                        return (
                          <tr key={m.id}>
                            <td>
                              <div className={styles.materialNameCell}>
                                <span className={styles.materialName}>{m.name}</span>
                              </div>
                            </td>
                            <td className={styles.bodySecondary}>{m.category}</td>
                            <td>{m.unit}</td>
                            <td>{f(qty)}</td>
                            <td>{formatCurrency(cost)}</td>
                            <td className={styles.stockValueCell}>{formatCurrency(total)}</td>
                            <td>
                              <span className={`${styles.statusPill} ${styles[statusCfg.className]}`}>
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className={styles.bodySecondary}>{formatDate(m.updatedAt)}</td>
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
                                items={getActionItems(m)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>
                  {loading
                    ? 'Loading...'
                    : `Showing ${materials.length} of ${meta?.totalRawMaterial ?? materials.length} material${materials.length !== 1 ? 's' : ''}`
                  }
                </span>
                <div className={styles.pagination}>
                  <button className={styles.pageArrow} disabled>
                    <FiChevronLeft size={15} />
                  </button>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                  <button className={styles.pageArrow} disabled>
                    <FiChevronRight size={15} />
                  </button>
                  <button className={styles.perPageDropdown}>
                    20 / page <IoChevronDown size={11} />
                  </button>
                </div>
              </div>
            </div>

          </main>
        </section>
      </div>

      <AddRawMaterialModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleCreated}
      />
    </section>
  );
}

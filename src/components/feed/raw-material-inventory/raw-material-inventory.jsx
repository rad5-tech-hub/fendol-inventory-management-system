import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEdit2, FiAlertTriangle, FiPackage, FiX } from 'react-icons/fi';
import { BsEye, BsBoxSeam } from 'react-icons/bs';
import { IoChevronDown } from 'react-icons/io5';
import { GiGreenPower, GiMoneyStack } from 'react-icons/gi';
import { FaExclamationTriangle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import DataTable from "../../shared/data-table/DataTable";
import { ApiV2 } from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './raw-material-inventory.module.scss';
import AddRawMaterialModal from './AddRawMaterialModal';
import RestockRawMaterialModal from './RestockRawMaterialModal';
import RawMaterialDetailSidebar from './RawMaterialDetailSidebar';

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
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');

  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockMaterial, setRestockMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [detailMaterial, setDetailMaterial] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const params = {};
      const rawSid = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]);
      if (rawSid) params.siteId = rawSid;

      const res = await ApiV2.get('/v2/raw-material', { params });
      if (res.data?.success && res.data?.data) {
        const normalized = res.data.data.map((m) => ({
          ...m,
          quantity: m.quantityInStock !== undefined ? m.quantityInStock : m.quantity,
        }));
        setMaterials(normalized);
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
  }, [activeSite?.id, isSuperAdmin, user?.siteId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCreated = useCallback((success, message) => {
    if (success) {
      setShowAddModal(false);
      toast.success(message, { autoClose: 4000 });
      setSearchQuery('');
      setCategoryFilter('');
      setStatusFilter('');
      fetchMaterials();
    } else {
      toast.error(message, { autoClose: 6000 });
    }
  }, [fetchMaterials]);

  const handleRestocked = useCallback((success, message) => {
    if (success) {
      setShowRestockModal(false);
      setRestockMaterial(null);
      toast.success(message, { autoClose: 4000 });
      fetchMaterials();
    } else {
      toast.error(message, { autoClose: 6000 });
    }
  }, [fetchMaterials]);

  const getActionItems = (material) => [
    {
      label: <><BsEye size={14} style={{ marginRight: 10 }} /> View Details</>,
      onClick: () => setDetailMaterial(material),
    },
    {
      label: <><FiPackage size={14} style={{ marginRight: 10 }} /> Restock</>,
      onClick: () => { setRestockMaterial(material); setShowRestockModal(true); },
    },
    {
      label: <><FiEdit2 size={14} style={{ marginRight: 10 }} /> Edit</>,
      onClick: () => { setEditMaterial(material); setShowAddModal(true); },
    },
  ];

  const categories = [...new Set(materials.map((m) => m.category).filter(Boolean))].sort();

  const filteredMaterials = materials.filter((m) => {
    if (searchQuery.trim() && !m.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    if (categoryFilter && m.category !== categoryFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  const stockValue = materials.reduce((sum, m) => sum + (Number(m.quantity) * Number(m.unitCost)), 0);
  const lowStockCount = materials.filter((m) => {
    if (m.status === 'out of stock') return true;
    if (m.status === 'low stock') return true;
    return Number(m.quantity) <= Number(m.threshold);
  }).length;

  const hasActiveFilters = searchQuery || categoryFilter || statusFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  const renderDropdown = (type, label, options) => {
    const isOpen = openDropdown === type;
    const value = type === 'category' ? categoryFilter : statusFilter;
    return (
      <div style={{ position: 'relative' }}>
        <button
          className={`${styles.filterDropdown} ${value ? styles.filterDropdownActive : ''}`}
          onClick={() => setOpenDropdown(isOpen ? null : type)}
        >
          {value || label} <IoChevronDown size={11} />
        </button>
        {isOpen && (
          <div className={styles.filterDropdownMenu}>
            <button
              className={`${styles.filterDropdownOption} ${!value ? styles.filterDropdownOptionActive : ''}`}
              onClick={() => { setOpenDropdown(null); type === 'category' ? setCategoryFilter('') : setStatusFilter(''); }}
            >
              {`All ${type === 'category' ? 'Categories' : 'Status'}`}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                className={`${styles.filterDropdownOption} ${value === opt ? styles.filterDropdownOptionActive : ''}`}
                onClick={() => { setOpenDropdown(null); type === 'category' ? setCategoryFilter(opt) : setStatusFilter(opt); }}
              >
                {opt === 'in stock' ? 'In Stock' : opt === 'low stock' ? 'Low Stock' : opt === 'out of stock' ? 'Out of Stock' : opt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

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
                <button className={styles.addBtn} onClick={() => { setEditMaterial(null); setShowAddModal(true); }}>
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

            <div className={styles.filterBar} ref={filterRef}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by material name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                    <FiX size={14} />
                  </button>
                )}
              </div>
              {renderDropdown('category', 'All Categories', categories)}
              {renderDropdown('status', 'All Status', Object.keys(STATUS_CONFIG))}
              <button className={styles.filterActionBtn} onClick={() => {}}>
                <FiFilter size={13} />
                Filter
              </button>
              {hasActiveFilters ? (
                <button className={styles.clearBtn} onClick={clearFilters}>
                  <FiX size={13} />
                  Clear
                </button>
              ) : (
                <button className={styles.resetBtn} onClick={() => fetchMaterials()}>
                  <FiRefreshCw size={13} />
                  Refresh
                </button>
              )}
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <DataTable
                  className={styles.table}
                  columns={[
                    {
                      key: 'name',
                      label: 'Material Name',
                      render: (value) => (
                        <div className={styles.materialNameCell}>
                          <span className={styles.materialName}>{value}</span>
                        </div>
                      ),
                    },
                    { key: 'category', label: 'Category', render: (value) => <span className={styles.bodySecondary}>{value}</span> },
                    { key: 'unit', label: 'Unit' },
                    { key: 'quantity', label: 'Quantity in Stock', render: (value) => f(Number(value)) },
                    { key: 'unitCost', label: 'Unit Cost (₦)', render: (value) => formatCurrency(Number(value)) },
                    {
                      key: 'stockValue',
                      label: 'Stock Value (₦)',
                      render: (_, row) => {
                        const qty = Number(row.quantity);
                        const cost = Number(row.unitCost);
                        return <span className={styles.stockValueCell}>{formatCurrency(qty * cost)}</span>;
                      },
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (value) => {
                        const statusCfg = STATUS_CONFIG[value] || { label: value, className: 'statusInStock' };
                        return <span className={`${styles.statusPill} ${styles[statusCfg.className]}`}>{statusCfg.label}</span>;
                      },
                    },
                    { key: 'updatedAt', label: 'Last Updated', render: (value) => <span className={styles.bodySecondary}>{formatDate(value)}</span> },
                  ]}
                  data={filteredMaterials}
                  loading={loading}
                  error={fetchError || ''}
                  emptyMessage='No raw materials found. Click "Add Raw Material" to create one.'
                  actions={(m) => (
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
                  )}
                />
              </div>

              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>
                  {loading
                    ? 'Loading...'
                    : hasActiveFilters
                      ? `Showing ${filteredMaterials.length} of ${materials.length} material${materials.length !== 1 ? 's' : ''}`
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

      <ToastContainer />

      <AddRawMaterialModal
        show={showAddModal}
        editData={editMaterial}
        onClose={() => { setShowAddModal(false); setEditMaterial(null); }}
        onSuccess={handleCreated}
      />

      <RestockRawMaterialModal
        show={showRestockModal}
        material={restockMaterial}
        onClose={() => { setShowRestockModal(false); setRestockMaterial(null); }}
        onSuccess={handleRestocked}
      />

      <RawMaterialDetailSidebar
        material={detailMaterial}
        onClose={() => setDetailMaterial(null)}
      />
    </section>
  );
}

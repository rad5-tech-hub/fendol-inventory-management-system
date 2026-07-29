import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product.module.scss';
import { BsPlusLg, BsBarChartFill, BsChevronDown, BsSearch, BsX } from "react-icons/bs";
import { ApiV2 } from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button } from 'react-bootstrap';
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasPermission } from '../../shared/permissions/permissions';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import CustomDropdown from '../../shared/custom-dropdown/CustomDropdown';
import DataTable from '../../shared/data-table/DataTable';
import Pagination from "../../shared/pagination/Pagination";

const ProductTable = ({ rows, avatarColors, onEditClick, onDeleteClick, isSuperAdmin }) => (
  <DataTable
    columns={[
      { key: 'productName', label: 'Product Name', render: (v) => <span style={{ fontWeight: 600, color: '#2E3135' }}>{v || '—'}</span> },
      { key: 'category', label: 'Category', render: (v) => v?.name || '—' },
      { key: 'creator', label: 'Created By', render: (v, row, idx) => (
        v?.fullName ? (
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: avatarColors[idx % avatarColors.length], display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                fontWeight: 700, color: '#ffffff', flexShrink: 0,
              }}
            >
              {(() => {
                const parts = v.fullName.trim().split(' ');
                return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
              })()}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#2E3135' }}>{v.fullName}</span>
          </div>
        ) : '—'
      )},
      { key: 'createdAt', label: 'Date Created', render: (v) => (
        <span style={{ color: '#8C949B', whiteSpace: 'nowrap' }}>
          {new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )},
    ]}
    data={rows}
    actions={(product) => {
      const items = [
        { label: 'Edit', onClick: () => onEditClick(product) },
      ];
      if (isSuperAdmin) {
        items.push({ label: 'Delete', onClick: () => onDeleteClick(product), style: { color: '#ff6b6b' } });
      }
      return (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center' }}>
          <PortalDropdown
            btnClass={styles.threeDotBtn}
            menuStyle={{ minWidth: 160 }}
            items={items}
          />
        </div>
      );
    }}
  />
);

export default function ViewAllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 45;
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const [siteTypes, setSiteTypes] = useState([]);
  const [selectedSiteTypeFilter, setSelectedSiteTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await ApiV2.get('/api/v1/products');
        const data = response.data.data;
        setProducts(data);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const userTypes = useSelector((state) => state.user?.userTypes || []);

  const canAssignSite = hasPermission(userTypes, 'products', 'assign-site');

  const siteTypeMap = Object.fromEntries(siteTypes.map(st => [st.id, st.name]));

  const resolveSiteTypeName = (product) => siteTypeMap[product.siteType] || 'Unassigned';

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (p.productName || '').toLowerCase().includes(q)
      || (p.category?.name || '').toLowerCase().includes(q);
  });

  const productsForSiteType = canAssignSite && viewMode === 'by-site-type' && selectedSiteTypeFilter
    ? filteredProducts.filter(p => resolveSiteTypeName(p) === selectedSiteTypeFilter)
    : filteredProducts;

  const groupedBySiteType = canAssignSite && viewMode === 'by-site-type'
    ? (selectedSiteTypeFilter
        ? { [selectedSiteTypeFilter]: productsForSiteType }
        : filteredProducts.reduce((acc, product) => {
            const name = resolveSiteTypeName(product);
            if (!acc[name]) acc[name] = [];
            acc[name].push(product);
            return acc;
          }, {}))
    : {};

  const siteTypeNames = Object.keys(groupedBySiteType).sort();

  useEffect(() => {
    if (viewMode === 'by-site-type') {
      const names = new Set(filteredProducts.map(p => resolveSiteTypeName(p)));
      setCollapsedSites(names);
    }
  }, [viewMode, filteredProducts, siteTypes]);

  const handleEditClick = (product) => {
    navigate('/products/create-products', { state: { editProduct: product } });
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    const loadingToast = toast.loading("Deleting Product...", {
      className: 'dark-toast'
    });
    try {
      await ApiV2.delete(`/api/v1/product/${productToDelete.id}`);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
      toast.update(loadingToast, {
        render: "Product deleted successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.response_message || "Error deleting product. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
  };

  const currentProducts = filteredProducts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const toggleSiteCollapse = (siteName) => {
    setCollapsedSites(prev => {
      const next = new Set(prev);
      if (next.has(siteName)) {
        next.delete(siteName);
      } else {
        next.add(siteName);
      }
      return next;
    });
  };

  const formatDateShort = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const SITE_ICON_COLORS = ['#F5A623', '#8B4513', '#4A90D9', '#2E7D32', '#7B1FA2'];
  const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA'];

  const getInitials = (fullName = '') => {
    const parts = fullName.trim().split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  };

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
            <ToastContainer />

            {/* ── Page header ── */}
            <div className={styles.pageHeader}>
              <div>
                <h2 className={styles.pageTitle}>Product Assignments</h2>
                <p className={styles.pageSubtitle}>
                  Manage and track inventory allocation across all aquaculture sites.
                </p>
              </div>
              {canAssignSite && (
                <button
                  className={styles.assignBtn}
                  onClick={() => navigate('/products/create-products')}
                >
                  <BsPlusLg /> Create Products
                </button>
              )}
            </div>

            {/* ── Controls Bar ── */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              {/* Search */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', background: '#ffffff',
                  border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0 14px',
                  gap: '8px', minWidth: '280px', maxWidth: '400px', flex: '1 1 auto',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#512728'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(81,39,40,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <BsSearch style={{ fontSize: '14px', color: '#8C949B', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                  style={{
                    border: 'none', outline: 'none', fontSize: '13px', color: '#2E3135',
                    background: 'transparent', width: '100%', padding: '9px 0',
                  }}
                />
                {searchQuery && (
                  <span
                    style={{ fontSize: '14px', color: '#8C949B', cursor: 'pointer', lineHeight: 1, padding: '2px' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <BsX />
                  </span>
                )}
              </div>

              {/* Admin view-mode toggle */}
              {canAssignSite && (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className={styles.filterBar} style={{ marginBottom: 0 }}>
                    <button
                      className={viewMode === 'all' ? styles.filterBtnActive : styles.filterBtnOutline}
                      onClick={() => setViewMode('all')}
                    >
                      All Products
                    </button>
                    <button
                      className={viewMode === 'by-site-type' ? styles.filterBtnActive : styles.filterBtnOutline}
                      onClick={() => { setViewMode('by-site-type'); setSelectedSiteTypeFilter(''); }}
                    >
                      By Site Type
                    </button>
                  </div>
                  {canAssignSite && viewMode === 'by-site-type' && (
                    <CustomDropdown
                      options={[
                        { value: '', label: 'All Site Types' },
                        ...siteTypes.map(st => ({ value: st.name, label: st.name })),
                      ]}
                      value={selectedSiteTypeFilter}
                      onChange={(val) => setSelectedSiteTypeFilter(val)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* ── Loading ── */}
            {loading && <SkeletonTable cols={4} rows={5} />}

            {/* ── Error ── */}
            {error && <ErrorState message={error} />}

            {/* ── Empty ── */}
            {!loading && !error && filteredProducts.length === 0 && (
              <EmptyState
                title={searchQuery ? 'No matches found' : 'No products available'}
                description={searchQuery ? 'Try adjusting your search query.' : 'Create new products to get started.'}
              />
            )}

            {/* ── SUPER ADMIN: By Site Type (collapsible cards) ── */}
            {!loading && !error && filteredProducts.length > 0 && canAssignSite && viewMode === 'by-site-type' && (
              <>
                {siteTypeNames.length === 0 && selectedSiteTypeFilter && (
                  <EmptyState title={`No products found for "${selectedSiteTypeFilter}"`} />
                )}
                {siteTypeNames.map((stName, stIdx) => (
                  <div key={stName} className={styles.siteCard}>
                    <div
                      className={styles.siteCardHeader}
                      onClick={() => toggleSiteCollapse(stName)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.siteCardHeaderLeft}>
                        <div
                          className={styles.siteIcon}
                          style={{ background: SITE_ICON_COLORS[stIdx % SITE_ICON_COLORS.length] }}
                        >
                          <BsBarChartFill />
                        </div>
                        <h5 className={styles.siteName}>{stName}</h5>
                      </div>
                      <div className={styles.siteCardHeaderRight}>
                        <span className={styles.assignmentsBadge}>
                          {groupedBySiteType[stName].length}&nbsp;
                          {groupedBySiteType[stName].length === 1 ? 'Assignment' : 'Assignments'}
                        </span>
                        <span
                          className={`${styles.collapseChevron} ${collapsedSites.has(stName) ? styles.collapseChevronClosed : ''}`}
                        >
                          <BsChevronDown />
                        </span>
                      </div>
                    </div>
                    {!collapsedSites.has(stName) && (
                      <>
                        <hr className={styles.siteCardDivider} />
                        <ProductTable
                          rows={groupedBySiteType[stName]}
                          avatarColors={AVATAR_COLORS}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          isSuperAdmin={canAssignSite}
                        />
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── SUPER ADMIN: All Products flat ── */}
            {!loading && !error && filteredProducts.length > 0 && canAssignSite && viewMode === 'all' && (
              <ProductTable
                rows={currentProducts}
                avatarColors={AVATAR_COLORS}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                isSuperAdmin={canAssignSite}
              />
            )}

            {/* ── NON-SUPER-ADMIN: flat list, no site headers ── */}
            {!loading && !error && filteredProducts.length > 0 && !canAssignSite && (
              <ProductTable
                rows={currentProducts}
                avatarColors={AVATAR_COLORS}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                isSuperAdmin={canAssignSite}
              />
            )}
            </div>
            {!loading && !error && filteredProducts.length > 0 && ((canAssignSite && viewMode === 'all') || !canAssignSite) && (
              <Pagination
                currentPage={currentPage}
                pageCount={Math.ceil(filteredProducts.length / itemsPerPage)}
                totalItems={filteredProducts.length}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
                itemName="products"
              />
            )}
          </main>

          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-semibold">Delete Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Are you sure you want to delete <strong>{productToDelete?.productName}</strong>?</p>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>This action cannot be undone.</p>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button
                variant="secondary"
                className="shadow-none"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="shadow-none"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Modal.Footer>
          </Modal>
        </section>
      </div>
    </section>
  );
}

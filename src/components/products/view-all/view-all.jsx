import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product.module.scss';
import { BsPlusLg, BsBarChartFill, BsChevronDown } from "react-icons/bs";
import Api, { ApiV2 } from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Alert, Modal, Form, Button } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasPermission } from '../../shared/permissions/permissions';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import CustomDropdown from '../../shared/custom-dropdown/CustomDropdown';
import DataTable from '../../shared/data-table/DataTable';

const ProductTable = ({ rows, avatarColors, onEditClick, onDeleteClick }) => (
  <DataTable
    columns={[
      { key: 'productName', label: 'Product Name' },
      { key: 'category', label: 'Category', render: (v) => v?.name || '—' },
      { key: 'creator', label: 'Created By', render: (v, row) => (
        v?.fullName ? (
          <div className={styles.createdByCell}>
            <div className={styles.createdByAvatar} style={{ background: avatarColors[rows.indexOf(row) % avatarColors.length] }}>
              {(() => {
                const parts = v.fullName.trim().split(' ');
                return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
              })()}
            </div>
            <span>{v.fullName}</span>
          </div>
        ) : '—'
      )},
      { key: 'createdAt', label: 'Date Created', render: (v) => {
        const date = new Date(v);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }},
    ]}
    data={rows}
    actions={(product) => (
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center' }}>
        <PortalDropdown
          btnClass={styles.threeDotBtn}
          menuStyle={{ minWidth: 160 }}
          items={[
            { label: 'Edit', onClick: () => onEditClick(product) },
            { divider: true },
            { label: 'Delete', onClick: () => onDeleteClick(product.id), style: { color: '#dc3545', fontWeight: 600 } },
          ]}
        />
      </div>
    )}
  />
);

export default function ViewAllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const [siteTypes, setSiteTypes] = useState([]);
  const [selectedSiteTypeFilter, setSelectedSiteTypeFilter] = useState('');
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

  const productsForSiteType = canAssignSite && viewMode === 'by-site-type' && selectedSiteTypeFilter
    ? products.filter(p => resolveSiteTypeName(p) === selectedSiteTypeFilter)
    : products;

  const groupedBySiteType = canAssignSite && viewMode === 'by-site-type'
    ? (selectedSiteTypeFilter
        ? { [selectedSiteTypeFilter]: productsForSiteType }
        : products.reduce((acc, product) => {
            const name = resolveSiteTypeName(product);
            if (!acc[name]) acc[name] = [];
            acc[name].push(product);
            return acc;
          }, {}))
    : {};

  const siteTypeNames = Object.keys(groupedBySiteType).sort();

  useEffect(() => {
    if (viewMode === 'by-site-type') {
      const names = new Set(products.map(p => resolveSiteTypeName(p)));
      setCollapsedSites(names);
    }
  }, [viewMode, products, siteTypes]);

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDeleteClick = async (productId) => {
    try {
      await Api.delete(`/products/${productId}`);
      setProducts(products.filter(product => product.id !== productId));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    setLoadingEdit(true)
    const loadingToast = toast.loading("Editing Product...", {
      className: 'dark-toast'
    });
    try {
      if (selectedProduct && selectedProduct.id) {
        await Api.put(`/product/${selectedProduct.id}`, selectedProduct);
        setProducts(products.map(product => product.id === selectedProduct.id ? selectedProduct : product));
        setShowModal(false);

        toast.update(loadingToast, {
          render: "Product Edited successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      }
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Error adding fish. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
    } finally {
      setLoadingEdit(false);
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

  const currentProducts = products.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
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
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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

            {/* ── Admin view-mode toggle ── */}
            {canAssignSite && (
              <div className={styles.filterBar}>
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
            )}

            {/* ── Site type dropdown (only in by-site-type mode) ── */}
            {canAssignSite && viewMode === 'by-site-type' && (
              <div className={styles.filterBar}>
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Site Types' },
                    ...siteTypes.map(st => ({ value: st.name, label: st.name })),
                  ]}
                  value={selectedSiteTypeFilter}
                  onChange={(val) => setSelectedSiteTypeFilter(val)}
                />
              </div>
            )}

            {/* ── Loading ── */}
            {loading && <SkeletonTable cols={4} rows={5} />}

            {/* ── Error ── */}
            {error && (
              <Alert variant="danger" className="text-center">{error}</Alert>
            )}

            {/* ── Empty ── */}
            {!loading && !error && products.length === 0 && (
              <Alert variant="info">No products available.</Alert>
            )}

            {/* ── SUPER ADMIN: By Site Type (collapsible cards) ── */}
            {!loading && !error && products.length > 0 && canAssignSite && viewMode === 'by-site-type' && (
              <>
                {siteTypeNames.length === 0 && selectedSiteTypeFilter && (
                  <Alert variant="info">No products found for "{selectedSiteTypeFilter}".</Alert>
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
                        />
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── SUPER ADMIN: All Products flat ── */}
            {!loading && !error && products.length > 0 && canAssignSite && viewMode === 'all' && (
              <ProductTable
                rows={currentProducts}
                avatarColors={AVATAR_COLORS}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
              />
            )}

            {/* ── NON-SUPER-ADMIN: flat list, no site headers ── */}
            {!loading && !error && products.length > 0 && !canAssignSite && (
              <ProductTable
                rows={currentProducts}
                avatarColors={AVATAR_COLORS}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
              />
            )}
            </div>
            {!loading && !error && products.length > 0 && ((canAssignSite && viewMode === 'all') || !canAssignSite) && (
              <div className="d-flex justify-content-center mt-4" style={{ paddingTop: 12, paddingBottom: 12, background: '#fff' }}>
                <ReactPaginate
                  previousLabel={"< "}
                  nextLabel={" >"}
                  breakLabel={"..."}
                  pageCount={Math.ceil(products.length / itemsPerPage)}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageChange}
                  containerClassName={"pagination"}
                  pageClassName={"page-item"}
                  pageLinkClassName={"page-link"}
                  previousClassName={"page-item"}
                  previousLinkClassName={"page-link"}
                  nextClassName={"page-item"}
                  nextLinkClassName={"page-link"}
                  breakClassName={"page-item"}
                  breakLinkClassName={"page-link"}
                  activeClassName={"active"}
                />
              </div>
            )}
          </main>

          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton className="border-0 ">
              <Modal.Title className="fw-semibold">Edit Product</Modal.Title>
            </Modal.Header>
            <Modal.Body className="mt-5">
              {selectedProduct && (
                <Form>
                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Product Name</Form.Label>
                    <div className="col-8">
                      <Form.Control
                        type="text"
                        name="productName"
                        value={selectedProduct.productName}
                        onChange={handleInputChange}
                        className="py-2 shadow-none border-secondary-subtle border-1"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Base Weight</Form.Label>
                    <div className="col-8">
                      <Form.Control
                        type="text"
                        name="productWeight"
                        value={selectedProduct.productWeight}
                        onChange={handleInputChange}
                        className="py-2 shadow-none border-secondary-subtle border-1"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Unit</Form.Label>
                    <div className="col-8">
                      <CustomDropdown
                        options={[
                          { value: 'KG', label: 'Kilogram' },
                          { value: 'G', label: 'Gram' },
                        ]}
                        value={selectedProduct.unit}
                        onChange={(val) => handleInputChange({ target: { name: 'unit', value: val } })}
                        placeholder="Select Unit"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Base Price (₦)</Form.Label>
                    <div className="col-8">
                      <Form.Control
                        type="number"
                        name="basePrice"
                        value={selectedProduct.basePrice}
                        onChange={handleInputChange}
                        className="py-2 shadow-none border-secondary-subtle border-1"
                      />
                    </div>
                  </Form.Group>
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button
                className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                onClick={handleSaveClick}
                disabled={loadingEdit}
              >
                Save
              </Button>
            </Modal.Footer>
          </Modal>
        </section>
      </div>
    </section>
  );
}

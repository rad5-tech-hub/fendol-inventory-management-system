import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product.module.scss';
import { BsThreeDotsVertical, BsPlusLg, BsBarChartFill, BsChevronDown } from "react-icons/bs";
import Api, { ApiV2 } from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Spinner, Alert, Modal, Form, Button } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from 'react-router-dom';

const DropdownMenu = ({ show, onClickOutside, onEditClick, onDeleteClick }) => {
  if (!show) return null;

  return (
    <div className={styles.dropdownMenu} onClick={onClickOutside}>
      <ul className={styles.menuList}>
        <li className={styles.menuItem} onClick={onEditClick}>Edit</li>
        <li className={styles.menuItem} onClick={onDeleteClick}>Delete</li>
      </ul>
    </div>
  );
};

const ProductTable = ({ rows, avatarColors }) => (
  <table className={styles.productTable}>
    <thead>
      <tr>
        <th>Product Name</th>
        <th>Site</th>
        <th>Created By</th>
        <th>Date Created</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((product, idx) => (
        <tr key={product.id}>
          <td className={styles.productNameCell}>{product.productName}</td>
          <td>{product.site?.name || '—'}</td>
          <td>
            {product.creator?.fullName ? (
              <div className={styles.createdByCell}>
                <div
                  className={styles.createdByAvatar}
                  style={{ background: avatarColors[idx % avatarColors.length] }}
                >
                  {(() => {
                    const parts = product.creator.fullName.trim().split(' ');
                    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
                  })()}
                </div>
                <span>{product.creator.fullName}</span>
              </div>
            ) : '—'}
          </td>
          <td>
            {(() => {
              const date = new Date(product.createdAt);
              return date.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
            })()}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default function ViewAllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [viewMode, setViewMode] = useState('by-site');
  const [selectedSite, setSelectedSite] = useState(null);
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await ApiV2.get('/api/v1/products');
        setProducts(response.data.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === 'super_admin';

  const groupedBySite = isSuperAdmin && viewMode === 'by-site'
    ? products.reduce((acc, product) => {
        const siteName = product.site?.name || 'Unassigned';
        if (!acc[siteName]) acc[siteName] = [];
        acc[siteName].push(product);
        return acc;
      }, {})
    : {};

  const siteNames = Object.keys(groupedBySite).sort();

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
    const loadingToast = toast.loading("Editing Product...",{
      className: 'dark-toast'});
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
        render: error.response?.data?.message ||  "Error adding fish. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
    });
    }finally{
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

  const handleDropdownToggle = (productId) => {
    setActiveDropdown(activeDropdown === productId ? null : productId);
  };

  const handleClickOutside = () => setActiveDropdown(null);

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

  const SITE_ICON_COLORS   = ['#F5A623', '#8B4513', '#4A90D9', '#2E7D32', '#7B1FA2'];
  const AVATAR_COLORS      = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA'];

  const getInitials = (fullName = '') => {
    const parts = fullName.trim().split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  };

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
            <main className={styles.create_form}>
              <ToastContainer />

              {/* ── Page header ── */}
              <div className={styles.pageHeader}>
                <div>
                  <h2 className={styles.pageTitle}>Product Assignments</h2>
                  <p className={styles.pageSubtitle}>
                    Manage and track inventory allocation across all aquaculture sites.
                  </p>
                </div>
                {isSuperAdmin && (
                  <button
                    className={styles.assignBtn}
                    onClick={() => navigate('/products/create')}
                  >
                    <BsPlusLg /> Assign Product
                  </button>
                )}
              </div>

              {/* ── Admin view-mode toggle ── */}
              {isSuperAdmin && (
                <div className={styles.filterBar}>
                  <button
                    className={viewMode === 'all' ? styles.filterBtnActive : styles.filterBtnOutline}
                    onClick={() => setViewMode('all')}
                  >
                    All Products
                  </button>
                  <button
                    className={viewMode === 'by-site' ? styles.filterBtnActive : styles.filterBtnOutline}
                    onClick={() => setViewMode('by-site')}
                  >
                    By Site
                  </button>
                </div>
              )}

              {/* ── Loading ── */}
              {loading && (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <Alert variant="danger" className="text-center">{error}</Alert>
              )}

              {/* ── Empty ── */}
              {!loading && !error && products.length === 0 && (
                <Alert variant="info">No products available.</Alert>
              )}

              {/* ── SUPER ADMIN: By Site ── */}
              {!loading && !error && products.length > 0 && isSuperAdmin && viewMode === 'by-site' && (
                <>
                  {siteNames.map((siteName, siteIdx) => (
                    <div key={siteName} className={styles.siteCard}>
                      <div className={styles.siteCardHeader}>
                        <div className={styles.siteCardHeaderLeft}>
                          <div
                            className={styles.siteIcon}
                            style={{ background: SITE_ICON_COLORS[siteIdx % SITE_ICON_COLORS.length] }}
                          >
                            <BsBarChartFill />
                          </div>
                          <h5 className={styles.siteName}>{siteName}</h5>
                        </div>
                        <div className={styles.siteCardHeaderRight}>
                          <span className={styles.assignmentsBadge}>
                            {groupedBySite[siteName].length}&nbsp;
                            {groupedBySite[siteName].length === 1 ? 'Assignment' : 'Assignments'}
                          </span>
                          <span
                            className={`${styles.collapseChevron} ${collapsedSites.has(siteName) ? styles.collapseChevronClosed : ''}`}
                            onClick={() => toggleSiteCollapse(siteName)}
                            title={collapsedSites.has(siteName) ? 'Expand' : 'Collapse'}
                          >
                            <BsChevronDown />
                          </span>
                        </div>
                      </div>
                      {!collapsedSites.has(siteName) && (
                        <>
                          <hr className={styles.siteCardDivider} />
                          <ProductTable
                            rows={groupedBySite[siteName]}
                            avatarColors={AVATAR_COLORS}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* ── SUPER ADMIN: All Products flat ── */}
              {!loading && !error && products.length > 0 && isSuperAdmin && viewMode === 'all' && (
                <>
                  <ProductTable rows={currentProducts} avatarColors={AVATAR_COLORS} />
                  <div className="d-flex justify-content-center mt-4">
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
                      activeClassName={"dark"}
                    />
                  </div>
                </>
              )}

              {/* ── NON-SUPER-ADMIN: flat list, no site headers ── */}
              {!loading && !error && products.length > 0 && !isSuperAdmin && (
                <>
                  <ProductTable rows={currentProducts} avatarColors={AVATAR_COLORS} />
                  <div className="d-flex justify-content-center mt-4">
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
                      activeClassName={"dark"}
                    />
                  </div>
                </>
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
                      <Form.Select
                        name="unit"
                        value={selectedProduct.unit}
                        onChange={handleInputChange}
                        className="py-2 shadow-none border-secondary-subtle border-1"
                      >
                        <option value="" disabled>Select Unit</option>
                        <option value="KG">Kilogram</option>
                        <option value="G">Gram</option>
                      </Form.Select>
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

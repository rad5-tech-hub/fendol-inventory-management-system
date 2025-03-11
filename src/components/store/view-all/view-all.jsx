import React, { useState, useEffect, useRef } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../store.module.scss';
import { BsThreeDotsVertical } from "react-icons/bs";
import Api from "../../shared/api/apiLink";
import { Spinner, Alert, Modal, Form, Button } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DropdownMenu = ({ show, onClickOutside, onAddClick, onRemoveClick, onEditClick, position }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideEvent = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClickOutside();
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClickOutsideEvent);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideEvent);
    };
  }, [show, onClickOutside]);

  if (!show) return null;

  return (
    <div
      ref={dropdownRef}
      className={styles.dropdownMenu}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-100%, 0)', // Position left of the icon
        zIndex: 5, // Ensure it’s below the three-dot icon
      }}
    >
      <ul className={styles.menuList}>
        <li className={`mx-2 mt-2 rounded ${styles.menuItem}`} onClick={onAddClick}>Top Up Store</li>
        <li className={`mx-2 rounded ${styles.menuItem}`} onClick={onRemoveClick}>Remove</li>
        <li className={`mx-2 mb-2 rounded ${styles.menuItem}`} onClick={onEditClick}>Edit</li>
      </ul>
    </div>
  );
};

export default function UpdateStoreInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [stages, setStages] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [quantityUsed, setQuantityUsed] = useState(null);
  const [price, setPrice] = useState(null);
  const [stage, setStage] = useState('');
  const [threshold, setThreshold] = useState(null);
  const [unit, setUnit] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [pondSearch, setPondSearch] = useState('');
  const [showPondDropdown, setShowPondDropdown] = useState(false);

  const formatWithCommas = (value) => {
    if (value === null || value === '') return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fetchData = async () => {
    try {
      const response = await Api.get('/stores');
      setProducts(response.data.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = async () => {
    const feedName = selectedProduct?.name;
    const id = selectedProduct?.id;
    setDisabled(true);

    const loadingToast = toast.loading("Processing your request...", { className: 'dark-toast' });

    try {
      let response;
      if (modalType === 'add') {
        response = await Api.post(`/store?name=${feedName}`, { quantity, price });
        toast.update(loadingToast, { render: "Store topped up successfully!", type: "success", isLoading: false, autoClose: 3000, className: 'dark-toast' });
      } else if (modalType === 'remove') {
        response = await Api.put(`/update-store/${id}`, { stage, quantityUsed });
        toast.update(loadingToast, { render: "Store removed successfully!", type: "success", isLoading: false, autoClose: 3000, className: 'dark-toast' });
      } else if (modalType === 'edit') {
        response = await Api.put(`/edit-store-threshold/${id}`, { threshold, unit });
        toast.update(loadingToast, { render: "Store edited successfully!", type: "success", isLoading: false, autoClose: 3000, className: 'dark-toast' });
      }

      setQuantity(null);
      setQuantityUsed(null);
      setPrice(null);
      setStage('');
      setThreshold(null);
      setUnit('');
      setPondSearch('');
      fetchData();
      setShowModal(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error processing the request. Please try again.";
      toast.update(loadingToast, { render: errorMessage, type: "error", isLoading: false, autoClose: 6000, className: 'dark-toast' });
    } finally {
      setDisabled(false);
    }
  };

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await Api.get('/fish-stages');
        if (Array.isArray(response.data.data)) {
          const filteredStages = response.data.data.filter(pond => pond.quantity >= 1);
          setStages(filteredStages);
        } else {
          throw new Error('Expected an array of stages');
        }
      } catch (err) {
        console.log(err.response?.data?.message || 'Failed to fetch stages.');
      }
    };

    fetchStages();
    fetchData();
  }, []);

  const handleAddClick = (product) => {
    setSelectedProduct(product);
    setModalType('add');
    setShowModal(true);
  };

  const handleRemoveClick = (product) => {
    setSelectedProduct(product);
    setModalType('remove');
    setShowModal(true);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setModalType('edit');
    setShowModal(true);
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDropdownToggle = (productId, event) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY, // Position below the icon
      left: rect.left + window.scrollX, // Align with the left of the icon
    });
    setActiveDropdown(activeDropdown === productId ? null : productId);
  };

  const handleClickOutside = () => setActiveDropdown(null);

  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
  };

  const handlePondSearchChange = (e) => {
    setPondSearch(e.target.value);
    setShowPondDropdown(true);
  };

  const handlePondSelect = (pond) => {
    setStage(pond.title);
    setPondSearch(pond.title);
    setShowPondDropdown(false);
  };

  const filteredPonds = stages.filter(stage =>
    stage.title.toLowerCase().includes(pondSearch.toLowerCase())
  );

  const currentProducts = products.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <h4 className="mt-3 mb-5">View All</h4>
            <ToastContainer />

            {loading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}

            {error && (
              <Alert variant="danger" className="text-center">{error}</Alert>
            )}

            {!loading && !error && products.length === 0 && (
              <Alert variant="info">No store available.</Alert>
            )}

            {!loading && !error && (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.styled_table}>
                    <thead>
                      <tr className="fw-semibold">
                        <th>DATE CREATED</th>
                        <th>NAME</th>
                        <th>UNIT</th>
                        <th>QUANTITY</th>
                        <th>THRESHOLD VALUE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{formatDate(product.createdAt)}</td>
                          <td>{product.name}</td>
                          <td>{product.unit}</td>
                          <td>{product.quantity}</td>
                          <td>{product.threshold}</td>
                          <td className="d-flex justify-content-between align-items-center position-relative">
                            <span className={
                              product.status === 'in stock'
                                ? 'text-success text-uppercase fw-semibold'
                                : product.status === 'out of stock'
                                ? 'text-danger text-uppercase fw-semibold'
                                : product.status === 'low stock'
                                ? 'text-warning text-uppercase fw-semibold'
                                : ''
                            }>
                              {product.status}
                            </span>
                            <div className="position-relative">
                              <span
                                style={{
                                  display: "inline-block",
                                  textAlign: "center",
                                  backgroundColor: "#f8f9fa",
                                  padding: "0.5rem",
                                  borderRadius: "50%",
                                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-5px)";
                                  e.currentTarget.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
                                }}
                              >
                                <BsThreeDotsVertical
                                  className="cursor-pointer"
                                  style={{ cursor: "pointer", zIndex: 10 }}
                                  onClick={(e) => handleDropdownToggle(product.id, e)}
                                />
                              </span>
                              <DropdownMenu
                                show={activeDropdown === product.id}
                                onClickOutside={handleClickOutside}
                                onAddClick={() => handleAddClick(product)}
                                onRemoveClick={() => handleRemoveClick(product)}
                                onEditClick={() => handleEditClick(product)}
                                position={dropdownPosition}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
                    activeClassName={"dark active-light"}
                  />
                </div>
              </>
            )}
          </main>
        </section>

        <Modal show={showModal} onHide={() => setShowModal(false)} className="rounded-0">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-semibold mx-2">
              {modalType === 'add' ? 'Top Up Store' : modalType === 'remove' ? 'Remove' : 'Edit'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="mt-5 mx-2">
            <Form.Group className="mb-3 row">
              <Form.Label className="col-4 fw-semibold">Name</Form.Label>
              <div className="col-8">
                <Form.Control
                  type="text"
                  readOnly
                  defaultValue={selectedProduct?.name}
                  className={`py-2 shadow-none border-1 ${styles.inputs}`}
                />
              </div>
            </Form.Group>

            {modalType === 'add' && (
              <>
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Quantity {`(${selectedProduct?.unit})`}</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="number"
                      required
                      value={quantity ?? ''}
                      onChange={(e) => setQuantity(Number(e.target.value) || null)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                      placeholder="Enter Quantity"
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Price Bought (₦)</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="text"
                      required
                      value={price !== null ? formatWithCommas(price) : ''}
                      onChange={(e) => setPrice(e.target.value.replace(/,/g, '') || null)}
                      placeholder="Price Bought"
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                    />
                  </div>
                </Form.Group>
              </>
            )}

            {modalType === 'remove' && (
              <>
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Pond To</Form.Label>
                  <div className="col-8" style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Search Pond..."
                      value={pondSearch}
                      onChange={handlePondSearchChange}
                      onFocus={() => setShowPondDropdown(true)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                      autoComplete="off"
                    />
                    {showPondDropdown && (
                      <div className={styles.suggestions_box} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {filteredPonds.length > 0 ? (
                            filteredPonds.map((pond, index) => (
                              <li
                                key={index}
                                onClick={() => handlePondSelect(pond)}
                                style={{ cursor: 'pointer', padding: '8px' }}
                                className={styles.menuItem}
                              >
                                {pond.title || 'No Data Yet'}
                              </li>
                            ))
                          ) : (
                            <li style={{ padding: '8px' }}>No ponds found</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </Form.Group>
                <Form.Group className="mb-4 row">
                  <Form.Label className="col-4 fw-semibold">Quantity {`(${selectedProduct?.unit})`}</Form.Label>
                  <div className="col-8 d-flex align-items-center">
                    <Form.Control
                      type="number"
                      value={quantityUsed ?? ''}
                      onChange={(e) => setQuantityUsed(Number(e.target.value) || null)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                      placeholder="Enter Quantity"
                    />
                  </div>
                </Form.Group>
              </>
            )}

            {modalType === 'edit' && (
              <>
                <Form.Group className="mb-3 row fw-semibold">
                  <Form.Label className="col-4">Threshold Value</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="number"
                      placeholder="Threshold Value"
                      required
                      value={threshold ?? ''}
                      onChange={(e) => setThreshold(Number(e.target.value) || null)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Unit</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="text"
                      readOnly
                      defaultValue={selectedProduct?.unit}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                    />
                  </div>
                </Form.Group>
              </>
            )}
          </Modal.Body>

          <Modal.Footer className="mt-5 mb-3 border-0" style={{ height: '200px' }}>
            <Button
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
              onClick={handleSaveClick}
              disabled={disabled}
            >
              {modalType === 'add' ? 'Add' : modalType === 'remove' ? 'Remove' : 'Edit'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </section>
  );
}
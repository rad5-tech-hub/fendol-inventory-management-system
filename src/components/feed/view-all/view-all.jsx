import React, { useState, useEffect, useRef } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../feed.module.scss';
import { BsThreeDotsVertical } from "react-icons/bs";
import Api from "../../shared/api/apiLink";
import { Spinner, Alert, Modal, Form, Button } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationTriangle } from "react-icons/fa";

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
      }}
    >
      <ul className={styles.menuList}>
        <li className={`mx-2 mt-2 rounded ${styles.menuItem}`} onClick={onAddClick}>Top Up Feed</li>
        <li className={`mx-2 rounded ${styles.menuItem}`} onClick={onRemoveClick}>Remove Feed</li>
        <li className={`mx-2 mb-2 rounded ${styles.menuItem}`} onClick={onEditClick}>Edit Feed</li>
      </ul>
    </div>
  );
};

export default function UpdateFeedInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [stages, setStages] = useState([]);
  const [quantityUsed, setQuantityUsed] = useState(null);
  const [noOfBag, setNoOfBag] = useState(null);
  const [feedPrice, setFeedPrice] = useState(null);
  const [weightPerBag, setWeightPerBag] = useState(null);
  const [stage, setStage] = useState('');
  const [threshold, setThreshold] = useState(null);
  const [unit, setUnit] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [pondSearch, setPondSearch] = useState(''); // Added for search
  const [showPondDropdown, setShowPondDropdown] = useState(false); // Added for search

  const formatWithCommas = (number) => {
    if (number === null || number === '') return '';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleSaveClick = async () => {
    const feedName = selectedProduct?.feedName;
    const feedType = selectedProduct?.feedType;
    const id = selectedProduct?.id;
    setDisabled(true);

    const loadingToast = toast.loading("Processing your request...", {
      className: 'dark-toast'
    });

    try {
      let response;
      if (modalType === 'add') {
        response = await Api.post(`/add`, {
          noOfBag,
          feedPrice,
          feedId: id
        });
        toast.update(loadingToast, {
          render: "Feed added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      } else if (modalType === 'remove') {
        response = await Api.put(`/update/${id}`, {
          stage,
          quantityUsed
        });
        toast.update(loadingToast, {
          render: "Feed removed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      } else if (modalType === 'edit') {
        response = await Api.put(`/edit-threshold/${id}`, {
          threshold,
          weightPerBag
        });
        toast.update(loadingToast, {
          render: "Feed edited successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      }
      setQuantityUsed(null);
      setNoOfBag(null);
      setFeedPrice(null);
      setStage('');
      setThreshold(null);
      setUnit('');
      setWeightPerBag(null);
      setPondSearch(''); // Reset search
      fetchData();
      setShowModal(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error processing the request. Please try again.";
      toast.update(loadingToast, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 6000,
        className: 'dark-toast'
      });
    } finally {
      setDisabled(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await Api.get('/feeds');
      setProducts(response.data.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
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
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5 my-5">
                  <FaExclamationTriangle size={30} /> <span>{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <Alert variant="info">No products available.</Alert>
            )}

            {!loading && !error && (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.styled_table}>
                    <thead>
                      <tr className="fw-semibold">
                        <th>DATE CREATED</th>
                        <th>FEED NAME</th>
                        <th>UNIT</th>
                        <th>QUANTITY</th>
                        <th>FEED TYPE</th>
                        <th>THRESHOLD VALUE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{formatDate(product.createdAt)}</td>
                          <td>{product.feedName}</td>
                          <td>{product.unit}</td>
                          <td>{product.quantity}</td>
                          <td>{product.feedType}</td>
                          <td>{product.threshold}</td>
                          <td className="d-flex justify-content-between position-relative">
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
                            <div>
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
                                  style={{ cursor: "pointer" }}
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
                    activeClassName={"dark"}
                  />
                </div>
              </>
            )}
          </main>
        </section>

        <Modal show={showModal} onHide={() => setShowModal(false)} className="rounded-0">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-semibold">
              {modalType === 'add' ? 'Top Up Feed' : modalType === 'remove' ? 'Remove Feed' : 'Edit Feed'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="mt-5">
            <Form.Group className="mb-3 row">
              <Form.Label className="col-4">Feed Name</Form.Label>
              <div className="col-8">
                <Form.Control
                  type="text"
                  readOnly
                  defaultValue={selectedProduct?.feedName}
                  className={`py-2 shadow-none border-1 ${styles.inputs}`}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3 row">
              <Form.Label className="col-4">Feed Type</Form.Label>
              <div className="col-8">
                <Form.Control
                  type="text"
                  readOnly
                  defaultValue={selectedProduct?.feedType}
                  className={`py-2 shadow-none border-1 ${styles.inputs}`}
                />
              </div>
            </Form.Group>

            {modalType === 'add' && (
              <>
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4">No. of Bags</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="number"
                      required
                      value={noOfBag ?? ''}
                      onChange={(e) => setNoOfBag(Number(e.target.value) || null)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                      placeholder="Enter number of bags"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4">Weight In kg</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="number"
                      readOnly
                      value={noOfBag * selectedProduct?.weightPerBag || 0}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                      placeholder="Show Quantity (kg)"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4">Price Bought (₦)</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="text"
                      required
                      value={feedPrice !== null ? formatWithCommas(feedPrice) : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        setFeedPrice(value);
                      }}
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
                  <Form.Label className="col-4">Pond To</Form.Label>
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
                  <Form.Label className="col-4">Quantity (KG)</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="number"
                      value={quantityUsed ?? ''}
                      onChange={(e) => setQuantityUsed(Number(e.target.value) || null)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                      placeholder="Quantity"
                      min={'0'}
                    />
                  </div>
                </Form.Group>
              </>
            )}

            {modalType === 'edit' && (
              <>
                <Form.Group className="mb-3 row">
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
                  <Form.Label className="col-4">Unit</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="text"
                      readOnly
                      defaultValue={selectedProduct?.unit}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4">Weight Per Bag (KG)</Form.Label>
                  <div className="col-8">
                    <Form.Control
                      type="number"
                      required
                      placeholder="Edit Weight Per Bag"
                      defaultValue={selectedProduct?.weightPerBag}
                      value={weightPerBag ?? ''}
                      onChange={(e) => setWeightPerBag(Number(e.target.value) || null)}
                      className={`py-2 shadow-none border-1 ${styles.inputs}`}
                    />
                  </div>
                </Form.Group>
              </>
            )}
          </Modal.Body>

          <Modal.Footer className="mt-5 mb-3 border-0">
            <Button
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
              onClick={handleSaveClick}
              disabled={disabled}
            >
              {modalType === 'add' ? 'Top Up Feed' : modalType === 'remove' ? 'Remove Feed' : 'Edit Feed'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </section>
  );
}
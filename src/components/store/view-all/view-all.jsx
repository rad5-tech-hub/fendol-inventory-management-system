import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../store.module.scss';
import Api, { ApiV2 } from "../../shared/api/apiLink";
import { Alert, Modal, Form, Button, Spinner } from 'react-bootstrap';
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";

export default function UpdateStoreInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [stages, setStages] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [quantityUsed, setQuantityUsed] = useState(null);
  const [price, setPrice] = useState(null);
  const [stage, setStage] = useState('');
  const [threshold, setThreshold] = useState(null);
  const [unit, setUnit] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [addLoader, setAddLoader] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [pondSearch, setPondSearch] = useState('');
  const [showPondDropdown, setShowPondDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStock, setNewStock] = useState({ name: '', unit: '', threshold: '', siteId: '' });
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);

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

  const fetchSites = async () => {
    setSitesLoading(true);
    try {
      const res = await ApiV2.get('/v2/all-site');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setSites(data);
    } catch {
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  };

  const handleAddNewStock = async (e) => {
    e.preventDefault();
    setAddLoader(true);
    const loadingToast = toast.loading("Adding stock...", { className: 'dark-toast' });
    try {
      await Api.post('/create-store', newStock);
      toast.update(loadingToast, { render: "Stock added successfully!", type: "success", isLoading: false, autoClose: 3000, className: 'dark-toast' });
      setNewStock({ name: '', unit: '', threshold: '', siteId: '' });
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      toast.update(loadingToast, { render: error.response?.data?.message || "Error adding stock. Please try again.", type: "error", isLoading: false, autoClose: 3000, className: 'dark-toast' });
    } finally {
      setAddLoader(false);
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
        const response = await Api.get('/fish-stages?siteId=all');
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
    fetchSites();
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
            <div className="d-flex justify-content-between align-items-center mt-3 mb-5">
              <h4 className="m-0">View All</h4>
              <button className={`fw-semibold ${styles.addStoreBtn}`} onClick={() => setShowAddModal(true)}>Add store</button>
            </div>
            <ToastContainer />

            {loading && <SkeletonTable cols={6} rows={5} />}

            {error && (
              <Alert variant="danger" className="text-center">{error}</Alert>
            )}

            {!loading && !error && products.length === 0 && (
              <Alert variant="info">No store available.</Alert>
            )}

            {!loading && !error && (
              <>
                <DataTable
                  columns={[
                    { key: 'createdAt', label: 'DATE CREATED', render: (value) => formatDate(value) },
                    { key: 'name', label: 'NAME' },
                    { key: 'unit', label: 'UNIT' },
                    { key: 'quantity', label: 'QUANTITY', render: (value) => value != null ? Number(value).toLocaleString() : '—' },
                    { key: 'threshold', label: 'THRESHOLD VALUE', render: (value) => value != null ? Number(value).toLocaleString() : '—' },
                    { key: 'status', label: 'STATUS', render: (value) => (
                      <span className={
                        value === 'in stock'
                          ? 'text-success text-uppercase fw-semibold'
                          : value === 'out of stock'
                          ? 'text-danger text-uppercase fw-semibold'
                          : value === 'low stock'
                          ? 'text-warning text-uppercase fw-semibold'
                          : ''
                      }>
                        {value}
                      </span>
                    )},
                  ]}
                  data={currentProducts}
                  actions={(row) => (
                    <PortalDropdown btnClass={styles.threeDotBtn} items={[
                      { label: 'Restock Store', onClick: () => handleAddClick(row) },
                      { label: 'Use', onClick: () => handleRemoveClick(row) },
                      { divider: true },
                      { label: 'Edit', onClick: () => handleEditClick(row) },
                    ]} />
                  )}
                />

<div className="d-flex justify-content-center mt-4" style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', paddingTop: 12, paddingBottom: 12 }}>
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
              </>
            )}
          </main>
        </section>

        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-semibold fs-5">Add New Stock</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddNewStock}>
            <Modal.Body className="pt-0">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Name</Form.Label>
                <Form.Control
                  placeholder="Enter stock name"
                  type="text"
                  required
                  value={newStock.name}
                  onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Unit</Form.Label>
                <CustomDropdown
                  required
                  value={newStock.unit}
                  onChange={(value) => setNewStock({ ...newStock, unit: value })}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  placeholder="Select Unit"
                  options={[
                    { value: 'kg', label: 'Kg' },
                    { value: 'liters', label: 'Liters' },
                    { value: 'pieces', label: 'Pieces' },
                  ]}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Threshold Value</Form.Label>
                <Form.Control
                  placeholder="Enter threshold value"
                  type="number"
                  required
                  min="0"
                  value={newStock.threshold}
                  onChange={(e) => setNewStock({ ...newStock, threshold: e.target.value === '' ? '' : Number(e.target.value) })}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Site</Form.Label>
                <CustomDropdown
                  required
                  value={newStock.siteId}
                  onChange={(value) => setNewStock({ ...newStock, siteId: value })}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  disabled={sitesLoading}
                  loading={sitesLoading}
                  placeholder="Select Site"
                  options={sites.map(site => ({ value: site.id, label: site.name }))}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <button type="button" className="btn btn-secondary shadow-none fw-semibold" onClick={() => setShowAddModal(false)} disabled={addLoader}>Cancel</button>
              <button type="submit" className="btn fw-semibold text-white border-0 shadow-none" style={{ backgroundColor: '#512728' }} disabled={addLoader}>
                {addLoader ? <><Spinner size="sm" animation="border" className="me-2" />Adding...</> : 'Add'}
              </button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showModal} onHide={() => setShowModal(false)} className="rounded-0">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-semibold mx-2">
              {modalType === 'add' ? 'Restock Store' : modalType === 'remove' ? 'Use' : 'Edit'}
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
              {modalType === 'add' ? 'Restock' : modalType === 'remove' ? 'Remove' : 'Edit'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </section>
  );
}


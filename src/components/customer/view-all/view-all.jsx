import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsExclamationTriangleFill } from "react-icons/bs";
import Api from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaArrowRight, FaEdit } from "react-icons/fa";
import { Alert, Modal, Button, Form, OverlayTrigger, Tooltip, Tabs, Tab } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa6";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import { useConfirm } from '../../shared/confirm-modal';

export default function ViewAll() {
  const navigate = useNavigate();
  const [allCustomers, setAllCustomers] = useState([]); // State for all customers
  const [filteredAllCustomers, setFilteredAllCustomers] = useState([]); // Filtered state for all customers
  const [debtors, setDebtors] = useState([]); // State for debtors
  const [loadingAll, setLoadingAll] = useState(true); // Loading state for All Customers
  const [loadingDebtors, setLoadingDebtors] = useState(false); // Loading state for Debtors
  const [errorAll, setErrorAll] = useState(''); // Error state for All Customers
  const [errorDebtors, setErrorDebtors] = useState(''); // Error state for Debtors
  const [currentPageAll, setCurrentPageAll] = useState(0); // Pagination for All Customers
  const [currentPageDebtors, setCurrentPageDebtors] = useState(0); // Pagination for Debtors
  const [customersPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm();

  // Fetch all customers
  const fetchAllCustomers = async () => {
    try {
      setLoadingAll(true);
      setErrorAll('');
      const response = await Api.get('/customers');
      if (Array.isArray(response.data.data)) {
        setAllCustomers(response.data.data);
        setFilteredAllCustomers(response.data.data);
      } else {
        throw new Error("Expected an array of customers");
      }
    } catch (err) {
      setErrorAll('Failed to fetch all customers. Please try again.');
      console.error(err);
    } finally {
      setLoadingAll(false);
    }
  };

  // Fetch debtors only
  const fetchDebtors = async () => {
    try {
      setLoadingDebtors(true);
      setErrorDebtors('');
      const response = await Api.get('/customers-owing');
      if (Array.isArray(response.data.data)) {
        setDebtors(response.data.data);
      } else {
        throw new Error("Expected an array of debtors");
      }
    } catch (err) {
      setErrorDebtors('Failed to fetch debtors. Please try again.');
      console.error(err);
    } finally {
      setLoadingDebtors(false);
    }
  };

  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const handleTabSelect = (key) => {
    setActiveTab(key);
    setCurrentPageAll(0); // Reset pagination for All Customers
    setCurrentPageDebtors(0); // Reset pagination for Debtors
    setSelectedCategory('');
    if (key === 'debtors') {
      fetchDebtors();
    } else {
      fetchAllCustomers();
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setCurrentPageAll(0);
    applyCategoryFilter(value);
  };

  const applyCategoryFilter = (category) => {
    if (category === '') {
      setFilteredAllCustomers(allCustomers);
    } else {
      setFilteredAllCustomers(allCustomers.filter(customer => customer.category === category));
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer({
      ...selectedCustomer,
      [name]: value,
    });
  };

  const handleSave = async () => {
    setLoadingEdit(true);
    const loadingToast = toast.loading("Saving Customer...");
    try {
      await Api.put(`/customer/${selectedCustomer.id}`, selectedCustomer);
      toast.update(loadingToast, {
        render: "Customer saved successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
      fetchAllCustomers(); // Refresh All Customers
      fetchDebtors(); // Refresh Debtors in case the edited customer affects debtor status
      setShowModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast.update(loadingToast, {
        render: "Failed to save customer. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 6000
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

  // Pagination for All Customers
  const indexOfFirstCustomerAll = currentPageAll * customersPerPage;
  const currentCustomersAll = filteredAllCustomers.slice(indexOfFirstCustomerAll, indexOfFirstCustomerAll + customersPerPage);

  // Pagination for Debtors
  const indexOfFirstDebtor = currentPageDebtors * customersPerPage;
  const currentDebtors = debtors.slice(indexOfFirstDebtor, indexOfFirstDebtor + customersPerPage);

  const handlePageClickAll = (data) => {
    setCurrentPageAll(data.selected);
  };

  const handlePageClickDebtors = (data) => {
    setCurrentPageDebtors(data.selected);
  };

  const handleNavigate = (customerId) => {
    navigate(`/customer/personal-ledger/?id=${customerId}`);
  };

  const handleSearch = (e) => {
    const searchQuery = e.target.value.toLowerCase();
    setFilteredAllCustomers(
      allCustomers.filter((customer) =>
        customer.fullName.toLowerCase().includes(searchQuery)
      )
    );
    setCurrentPageAll(0);
  };

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

        <section className={`${styles.content}`}>
          <main className={styles.create_form}>
            <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
              <h4>{activeTab === 'all' ? 'All Customers' : 'Debtors'}</h4>
              {activeTab === 'all' && (
                <div className="d-flex gap-2">
                  <Form.Select
                    onChange={handleCategoryChange}
                    value={selectedCategory}
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                    aria-label="Filter by Category"
                  >
                    <option value="">All Categories</option>
                    <option value="Marketer">Marketer</option>
                    <option value="Customer">Customer</option>
                  </Form.Select>
                </div>
              )}
            </div>

            {activeTab === 'all' && (
              <div className="text-end mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search for customer..."
                  onChange={handleSearch}
                  className={`py-2 bg-light-subtle w-50 shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                  style={{ width: '50%', marginLeft: 'auto' }}
                />
              </div>
            )}

            <Tabs
              activeKey={activeTab}
              onSelect={handleTabSelect}
              id="customer-tabs"
              className="mb-3"
              style={{ border: 'none' }}
            >
              <Tab eventKey="all" title="All Customers" />
              <Tab eventKey="debtors" title="Debtors" />
            </Tabs>

            <style jsx>{`
              .nav-tabs .nav-link {
                color: #333;
                border: none;
              }
              .nav-tabs .nav-link.active {
                color: #B06426;
                border: none;
                background-color: transparent;
                font-weight: bold;
                text-decoration: underline;
              }
            `}</style>

            {/* All Customers Tab */}
            {activeTab === 'all' && (
              <>
                {loadingAll && <SkeletonTable cols={5} rows={5} />}

                {errorAll && !loadingAll && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-50 py-5">
                      <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{errorAll}</span>
                    </Alert>
                  </div>
                )}

                {!loadingAll && !errorAll && filteredAllCustomers.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-50 py-5">
                      <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">No available Customer!</span>
                    </Alert>
                  </div>
                )}

                {!loadingAll && !errorAll && filteredAllCustomers.length > 0 && (
                  <div className='table-responsive'>
                    <table className={`table ${styles.styled_tables}`}>
                      <thead className={styles.theaders}>
                        <tr>
                          <th>DATE</th>
                          <th>NAME</th>
                          <th>PHONE</th>
                          <th>CATEGORY</th>
                          <th>ADDRESS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCustomersAll.map((customer) => (
                          <OverlayTrigger
                            key={customer.id}
                            placement="bottom"
                            overlay={<Tooltip id={`tooltip-${customer.id}`}>Click on {customer.fullName} to View the Ledger</Tooltip>}
                          >
                            <tr
                              className="text-start"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleNavigate(customer.id)}
                            >
                              <td>{formatDate(customer.createdAt)}</td>
                              <td>{customer.fullName}</td>
                              <td>{customer.phone}</td>
                              <td>{customer.category}</td>
                              <td className="d-flex justify-content-between align-items-center">
                                <span>{customer.address}</span>
                                <div className="d-flex gap-2">
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(customer);
                                    }}
                                  >
                                    <FaEdit style={{ cursor: "pointer", color: "#512728" }} />
                                  </span>
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
                                    onClick={async (e) => {
                                      e.stopPropagation();

                                      const ok = await confirm({ message: "Are you sure you want to delete this customer?", title: "Confirm Delete", variant: "danger" });
                                      if (!ok) return;

                                      const loadingToast = toast.loading("Deleting Customer...");
                                      try {
                                        await Api.delete(`/delete-customer/${customer.id}`);
                                        toast.update(loadingToast, {
                                          render: "Customer deleted successfully!",
                                          type: "success",
                                          isLoading: false,
                                          autoClose: 3000,
                                        });
                                        fetchAllCustomers();
                                        fetchDebtors(); // Refresh Debtors in case the deleted customer was a debtor
                                      } catch (error) {
                                        console.error("Error deleting customer:", error);
                                        toast.update(loadingToast, {
                                          render: "Failed to delete customer. Please try again.",
                                          type: "error",
                                          isLoading: false,
                                          autoClose: 6000,
                                        });
                                      }
                                    }}
                                  >
                                    <FaTrash style={{ cursor: "pointer", color: "red" }} />
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </OverlayTrigger>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-center mt-3">
                      <ReactPaginate
                        previousLabel={<FaArrowLeft />}
                        nextLabel={<FaArrowRight />}
                        breakLabel="..."
                        pageCount={Math.ceil(filteredAllCustomers.length / customersPerPage)}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handlePageClickAll}
                        containerClassName={"pagination"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        previousClassName={"page-item"}
                        previousLinkClassName={"page-link"}
                        nextClassName={"page-item"}
                        nextLinkClassName={"page-link"}
                        breakClassName={"page-item"}
                        breakLinkClassName={"page-link"}
                        activeClassName={"active-light"}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Debtors Tab */}
            {activeTab === 'debtors' && (
              <>
                {loadingDebtors && <SkeletonTable cols={3} rows={5} />}

                {errorDebtors && !loadingDebtors && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-50 py-5">
                      <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{errorDebtors}</span>
                    </Alert>
                  </div>
                )}

                {!loadingDebtors && !errorDebtors && debtors.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-50 py-5">
                      <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">No available Debtors!</span>
                    </Alert>
                  </div>
                )}

                {!loadingDebtors && !errorDebtors && debtors.length > 0 && (
                  <div className='table-responsive'>
                    <table className={`table ${styles.styled_tables}`}>
                      <thead className={styles.theaders}>
                        <tr>
                          <th>DATE AND TIME</th>
                          <th>FULL NAME</th>
                          <th>DEBT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDebtors.map((debtor) => (
                          <tr key={debtor.id} className="text-start">
                            <td>{formatDate(debtor.customerCreatedAt)}</td>
                            <td>{debtor.fullName}</td>
                            <td>{debtor.lastLedgerBalance ? `₦${new Intl.NumberFormat().format(debtor.lastLedgerBalance)}` : '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-center mt-3">
                      <ReactPaginate
                        previousLabel={<FaArrowLeft />}
                        nextLabel={<FaArrowRight />}
                        breakLabel="..."
                        pageCount={Math.ceil(debtors.length / customersPerPage)}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handlePageClickDebtors}
                        containerClassName={"pagination"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        previousClassName={"page-item"}
                        previousLinkClassName={"page-link"}
                        nextClassName={"page-item"}
                        nextLinkClassName={"page-link"}
                        breakClassName={"page-item"}
                        breakLinkClassName={"page-link"}
                        activeClassName={"active-light"}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </section>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Edit Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0 pt-5">
          {selectedCustomer && (
            <Form>
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Full Name</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={selectedCustomer.fullName}
                    onChange={handleInputChange}
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Phone</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={selectedCustomer.phone}
                    required
                    onChange={handleInputChange}
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Address</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="text"
                    name="address"
                    value={selectedCustomer.address}
                    onChange={handleInputChange}
                    required
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Category</Form.Label>
                <div className="col-8">
                  <Form.Select
                    name="category"
                    value={selectedCustomer.category}
                    required
                    onChange={handleInputChange}
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  >
                    <option value="">Select Category</option>
                    <option value="Marketer">Marketer</option>
                    <option value="Customer">Customer</option>
                  </Form.Select>
                </div>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-end mt-5">
          <Button
            variant="dark"
            className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
            onClick={handleSave}
            disabled={loadingEdit}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      <ConfirmDialog />
      <ToastContainer />
    </section>
  );
}
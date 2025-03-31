import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsExclamationTriangleFill } from "react-icons/bs";
import Api from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaArrowRight, FaEdit } from "react-icons/fa"; // Added FaEdit for edit icon
import { Spinner, Alert, Modal, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa6";

export default function ViewAll() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [customersPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state

  const fetchData = async () => {
    try {
      const response = await Api.get('/customers');
      if (Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
        setFilteredCustomers(response.data.data);
      } else {
        throw new Error("Expected an array of customers");
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
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
      fetchData();
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
    }
    finally {
      setLoadingEdit(false);}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);

    if (category === '') {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers(customers.filter(customer => customer.category === category));
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

  const indexOfFirstCustomer = currentPage * customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfFirstCustomer + customersPerPage);

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleNavigate = (customerId) => {
    navigate(`/customer/personal-ledger/?id=${customerId}`);
  };

  const handleSearch = (e) => {
    const searchQuery = e.target.value.toLowerCase();
    setFilteredCustomers(
      customers.filter((customer) =>
        customer.fullName.toLowerCase().includes(searchQuery)
      )
    );
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
              <div>
                <h4>All Customers</h4>                
              </div>

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
                <Form.Select
                  onChange={handleCategoryChange}
                  value={selectedCategory}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                  aria-label="Filter by Category"
                >
                  <option value="">Sort for Debtors</option>
                  <option value="Marketer">Debtors</option>
                  <option value="">All Customers</option>
                </Form.Select>
              </div>
            </div>
            <div className="text-end mb-3">
              <Form.Control
                type="text"
                placeholder="Search for customer..."
                onChange={handleSearch}
                className={`py-2 bg-light-subtle w-50 shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                style={{ width: '50%', marginLeft: 'auto' }}
              />
            </div>

            {loading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}

            {error && (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredCustomers.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">No available Customer!</span>
                </Alert>
              </div>
            )}

            {!loading && !error && (
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
                    {currentCustomers.map((customer) => (
                      <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-view-all">Click on {customer.fullName} to View the Ledger.</Tooltip>}>
                        <tr 
                          key={customer.id} 
                          className="text-start" 
                          style={{ cursor: 'pointer' }} // Indicate clickable row
                          onClick={() => handleNavigate(customer.id)} // Navigate to ledger on row click
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
                                  e.stopPropagation(); // Prevent row click from triggering
                                  handleEdit(customer); // Trigger edit modal
                                }}
                              >
                                <FaEdit
                                  style={{ cursor: "pointer", color: "#512728" }} // Edit icon with custom color
                                />
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

                                  const confirmDelete = window.confirm("Are you sure you want to delete this customer?");
                                  if (!confirmDelete) return;

                                  const loadingToast = toast.loading("Deleting Customer...");
                                  try {
                                    const response = await Api.delete(`/delete-customer/${customer.id}`);

                                    if (!response.ok) {
                                      throw new Error("Failed to delete customer");
                                    }

                                    toast.update(loadingToast, {
                                      render: "Customer deleted successfully!",
                                      type: "success",
                                      isLoading: false,
                                      autoClose: 3000,
                                    });

                                    fetchData(); // Refresh table data
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
                    pageCount={Math.ceil(filteredCustomers.length / customersPerPage)}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
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
      <ToastContainer />
    </section>
  );
}
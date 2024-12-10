import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsExclamationTriangleFill } from "react-icons/bs";
import Api from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsThreeDotsVertical } from "react-icons/bs"; // Dropdown icon
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Spinner, Alert, Modal, Button, Form} from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from "react-router-dom";

const DropdownMenu = ({ show, onClickOutside, onEditClick, onNavigate,  onRemoveClick}) => {
  if (!show) return null;

  return (
    <div className={styles.dropdownMenu} onClick={onClickOutside}>
      <ul className={styles.menuList}>
        <li className={` mx-2 mt-2 rounded ${styles.menuItem}`} onClick={onEditClick}>Edit </li>
        <li className={` mx-2 mb-2 rounded ${styles.menuItem}`} onClick={onNavigate}>View Ledger  </li>       
      </ul>
    </div>
  );
};

export default function ViewAll() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [customersPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // State to track active dropdown


  const fetchData = async () => {
    try {
      const response = await Api.get('/customers');
      console.log('API Response:', response);

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
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const indexOfFirstCustomer = currentPage * customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfFirstCustomer + customersPerPage);

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  // Handle Remove click
  const handleNavigate = (customer) => {
    console.log(customer)
    navigate(`/customer/personal-ledger/?id=${customer}`)
  };
  

  // Handle dropdown toggle
  const handleDropdownToggle = (customerId) => {
    setActiveDropdown(activeDropdown === customerId ? null : customerId); // Toggle active dropdown
  };

  const handleClickOutside = () => setActiveDropdown(null);
  return (
    <section className={`d-none d-lg-block ${styles.body}`}>
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar className={styles.sidebarItem} />
        </div>

        <section className={`${styles.content}`}>
          <main className={styles.create_form}>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mt-3 mb-5">All Customers</h4>
              <div className="d-flex gap-2">
                <Form.Select
                  onChange={handleCategoryChange}
                  value={selectedCategory}
                  className="w-auto mb-3"
                  aria-label="Filter by Category"
                >
                  <option value="">All Categories</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Customer">Customer</option>
                </Form.Select>
              </div>
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
              <div>
                <table className={styles.styled_tables}>
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
                    {currentCustomers.map((customer, index) => (
                      <tr key={index} className="text-start">
                        <td>{formatDate(customer.createdAt)}</td>
                        <td>{customer.fullName}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.category}</td>
                        <td className="d-flex justify-content-between"><span>{customer.address}</span>
                          <div className="position-relative">
                            <BsThreeDotsVertical
                              className="me-3 cursor-pointer"
                              style={{cursor: "pointer"}}
                              onClick={() => handleDropdownToggle(customer.id)}
                            />
                            <DropdownMenu 
                              show={activeDropdown === customer.id}                              
                              onClickOutside={handleClickOutside} 
                              onEditClick={() => handleEdit(customer)}
                              onNavigate={() => handleNavigate(customer.id)}                     
                            />
                          </div>
                        </td>
                      </tr>
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
                      type='text'
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
          <Button variant="dark"  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer />
    </section>
  );
}

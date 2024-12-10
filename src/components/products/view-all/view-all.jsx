import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product.module.scss'; // Use your product styles
import { BsThreeDotsVertical } from "react-icons/bs"; // Dropdown icon
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Spinner, Alert, Modal, Form, Button } from 'react-bootstrap'; // Import Bootstrap Spinner and Alert
import ReactPaginate from 'react-paginate'; // Import React Paginate

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

export default function ViewAllProducts() {
  const [products, setProducts] = useState([]); // State for products
  const [loading, setLoading] = useState(true); // Loader state
  const [error, setError] = useState(''); // Error state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const itemsPerPage = 10; // Define how many items per page
  const [activeDropdown, setActiveDropdown] = useState(null); // State to track active dropdown

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Api.get('/products'); 
        setProducts(response.data.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again.'); // Set error message if API call fails
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };

    fetchData(); // Call the function to fetch data
  }, []);

  // Handle Edit click
  const handleEditClick = (product) => {
    setSelectedProduct(product); // Set selected product for modal
    setShowModal(true); // Open modal
  };
  
  // Handle Delete click
  const handleDeleteClick = async (productId) => {
    try {
      await Api.delete(`/products/${productId}`); // Adjust endpoint for delete
      setProducts(products.filter(product => product.id !== productId));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Handle Input Change in Modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedProduct(prev => ({ ...prev, [name]: value }));
  };

  // Handle Save click in Modal
  const handleSaveClick = async () => {
    const loadingToast = toast.loading("Editing Product...",{
      className: 'dark-toast'});
    try {
      if (selectedProduct && selectedProduct.id) {
        await Api.put(`/product/${selectedProduct.id}`, selectedProduct); // Adjust endpoint for update
        setProducts(products.map(product => product.id === selectedProduct.id ? selectedProduct : product));
        setShowModal(false); // Close modal after saving

        // After a successful API call
        toast.update(loadingToast, {
          render: "Product Edited successfully!",
          type: "success", // Use string for type
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      }
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message ||  "Error adding fish. Please try again.",
        type: "error", // Use string for type
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
    });
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (productId) => {
    setActiveDropdown(activeDropdown === productId ? null : productId); // Toggle active dropdown
  };
  
  // Handle click outside dropdown
  const handleClickOutside = () => setActiveDropdown(null);

  // Handle page change for pagination
  const handlePageChange = (data) => {
    setCurrentPage(data.selected); // Update current page
  };

  // Calculate current products to display based on current page
  const currentProducts = products.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <section className={`d-none d-lg-block ${styles.body}`}>
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <SideBar className={styles.sidebarItem} />
        </div>        

        {/* Content */}
        <section className={`${styles.content}`}>
          <main className={styles.create_form}>
            <h4 className="mt-3 mb-5">All Products</h4>
            <ToastContainer/>            
            {/* Loader */}
            {loading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            {!loading && !error && products.length === 0 && (
              <Alert variant="info">
                No products available.
              </Alert>
            )}

            {/* Products Table */}
            {!loading && !error && (
              <>
                <table className={styles.styled_table}>
                  <thead>
                    <tr>
                      <th>DATE CREATED</th>
                      <th>PRODUCT NAME</th>
                      <th>PRODUCT WEIGHT</th>
                      <th>UNIT</th>
                      <th>BASE PRICE (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{formatDate(product.createdAt)}</td>
                        <td>{product.productName}</td>
                        <td>{product.productWeight}</td>
                        <td>{product.unit}</td>
                        <td className="d-flex justify-content-between">
                          <span>{product.basePrice}</span>
                          <div>
                            <BsThreeDotsVertical
                              className="me-3 cursor-pointer"
                              onClick={() => handleDropdownToggle(product.id)}
                            />
                            <DropdownMenu 
                              show={activeDropdown === product.id} 
                              onClickOutside={handleClickOutside} 
                              onEditClick={() => handleEditClick(product)} 
                              onDeleteClick={() => handleDeleteClick(product.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
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
         {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="border-0 ">
          <Modal.Title className="fw-semibold">Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body className="mt-5">
          {selectedProduct && (
            <Form>
              {/* Product Name */}
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

              {/* Product Weight */}
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Product Weight</Form.Label>
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

              {/* Unit */}
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Unit</Form.Label>
                <div className="col-8">
                  <Form.Select
                    name="unit"
                    value={selectedProduct.unit}
                    onChange={handleInputChange}
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">kg</option>
                  </Form.Select>
                </div>
              </Form.Group>

              {/* Base Price */}
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
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </section>
  );
}

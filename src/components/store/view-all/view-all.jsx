import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../store.module.scss'; // Use your product styles
import { BsThreeDotsVertical } from "react-icons/bs"; // Dropdown icon
import Api from "../../shared/api/apiLink";
import { Spinner, Alert, Modal, Form, Button } from 'react-bootstrap'; // Import Bootstrap Spinner and Alert
import ReactPaginate from 'react-paginate'; // Import React Paginate
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DropdownMenu = ({ show, onClickOutside, onAddClick, onRemoveClick, onEditClick }) => {
  if (!show) return null;

  return (
    <div className={styles.dropdownMenu} onClick={onClickOutside}>
      <ul className={styles.menuList}>
        <li className={` mx-2 mt-2 rounded ${styles.menuItem}`} onClick={onAddClick}>Top Up Store </li>
        <li className={` mx-2 rounded ${styles.menuItem}`} onClick={onRemoveClick}>Remove </li>
        <li className={` mx-2 mb-2 rounded ${styles.menuItem}`} onClick={onEditClick}>Edit</li>
      </ul>
    </div>
  );
};

export default function UpdateStoreInventory() {
  const [products, setProducts] = useState([]); // State for products
  const [loading, setLoading] = useState(true); // Loader state
  const [error, setError] = useState(''); // Error state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // Track modal type
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const itemsPerPage = 5; // Define how many items per page
  const [activeDropdown, setActiveDropdown] = useState(null); // State to track active dropdown
  const [stages, setStages] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [quantityUsed, setQuantityUsed] = useState(null);
  const [price, setPrice] = useState(null);
  const [stage, setStage] = useState('');
  const [threshold, setThreshold] = useState(null);
  const [unit, setUnit] = useState('');
  const [disabled, setDisabled] = useState(false); // Add disabled state

  const formatWithCommas = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fetchData = async () => {
    try {
      const response = await Api.get('/stores'); 
      setProducts(response.data.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.'); // Set error message if API call fails
    } finally {
      setLoading(false); // Stop loading once data is fetched
    }
  };

  // Handle Save click in Modal
  const handleSaveClick = async () => {
    const feedName = selectedProduct?.name;
    const id = selectedProduct?.id;
    setDisabled(true); // Disable button during API call

    const loadingToast = toast.loading("Processing your request...", {
      className: 'dark-toast'
    });

    try {
      let response;
      if (modalType === 'add') {
        // Add feed logic
        response = await Api.post(`/store?name=${feedName}`, {
          quantity,
          price
        });
        toast.update(loadingToast, {
          render: "Feed added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      } else if (modalType === 'remove') {
        // Remove feed logic
        response = await Api.put(`/update-store/${id}`, {
          stage, quantityUsed
        });
        toast.update(loadingToast, {
          render: "Feed removed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      } else if (modalType === 'edit') {
        // Edit feed logic
        response = await Api.put(`/edit-store-threshold/${id}`, {
          threshold,
          unit,
        });
        toast.update(loadingToast, {
          render: "Feed edited successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      }

      // Reset state after successful save
      setQuantity(null);
      setQuantityUsed(null);
      setPrice(null);
      setStage('');
      setThreshold(null);
      setUnit('');
      fetchData();
      setShowModal(false); // Close the modal
    } catch (error) {
      console.error('Error processing the request:', error.response?.data?.message || error.message);
      
      const errorMessage = error.response?.data?.message || "Error processing the request. Please try again.";

      toast.update(loadingToast, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 6000,
        className: 'dark-toast'
      });
    } finally {
      setDisabled(false); // Re-enable button after API call
    }
  };

  const isDisabled = !quantity || !price || disabled; // Adjust disabled logic


  // Fetch data from API
  useEffect(() => {
    const fetchStages = async () => {
      try {
          const response = await Api.get('/fish-stages'); // Replace with your API URL
          console.log(response.data);
          
          if (Array.isArray(response.data.data)) {
              // Filter out "washing", "smoking", and "drying"
              const filteredStages = response.data.data
              setStages(filteredStages); // Set the filtered stages to state
          } else {
              throw new Error('Expected an array of stages');
          }
      } catch (err) {
          console.log(err.response?.data?.message || 'Failed to fetch data. Please try again.');
      } finally {
          console.log('Fetch stages success');
      }
  };

  fetchStages();

    fetchData(); // Call the function to fetch data
  }, []);

  // Handle Add click
  const handleAddClick = (product) => {
    setSelectedProduct(product);
    setModalType('add'); // Set modal type for Add
    setShowModal(true); // Show modal
  };

  // Handle Remove click
  const handleRemoveClick = (product) => {
    setSelectedProduct(product);
    setModalType('remove'); // Set modal type for Remove
    setShowModal(true); // Show modal
  };

  // Handle Edit click
  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setModalType('edit'); // Set modal type for Edit
    setShowModal(true); // Show modal
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
            <h4 className="mt-3 mb-5">View All</h4>
            
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
                No store available.
              </Alert>
            )}

            {/* Products Table */}
            {!loading && !error && (
              <>
                <table className={styles.styled_table}>
                  <thead>
                    <tr className="fw-semibold">
                      <th>DATE CREATED</th>
                      <th> NAME</th>                     
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
                        <td className="d-flex justify-content-between ">
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
                            <BsThreeDotsVertical
                              className="me-3 cursor-pointer"
                              style={{cursor: "pointer"}}
                              onClick={() => handleDropdownToggle(product.id)}
                            />
                            <DropdownMenu 
                              show={activeDropdown === product.id} 
                              onClickOutside={handleClickOutside} 
                              onAddClick={() => handleAddClick(product)}
                              onRemoveClick={() => handleRemoveClick(product)}
                              onEditClick={() => handleEditClick(product)} 
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
                    activeClassName={"dark active-light"}
                  />
                </div>
              </>
            )}
          </main>        
        </section>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} className="rounded-0 ">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-semibold mx-2">
              {modalType === 'add' ? 'Top Up Store' : modalType === 'remove' ? 'Remove' : 'Edit'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="mt-5 mx-2">
            {/* Feed Name */}
            <Form.Group className="mb-3 row">
              <Form.Label className="col-4 fw-semibold">Name</Form.Label>
              <div className="col-8">
                <Form.Control 
                  type="text" 
                  readOnly 
                  defaultValue={selectedProduct?.name} 
                  className={`py-2 shadow-none  border-1 ${styles.inputs}`} 
                />
              </div>
            </Form.Group>

            {/* Add Feed (Quantity and Price Bought) */}
            {modalType === 'add' && (
              <>
                {/* Quantity */}
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Quantity {`(${selectedProduct?.unit})`}</Form.Label>
                  <div className="col-8">
                    <Form.Control 
                      type="number" 
                      required 
                      value={quantity ?? ''} // Shows empty string if quantity is null
                      onChange={(e) => setQuantity(Number(e.target.value) || null)} 
                      className={`py-2 shadow-none  border-1 ${styles.inputs}`} 
                      placeholder="Enter Quantity" 
                    />
                  </div>
                </Form.Group>
                
                {/* Price Bought */}
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Price Bought(₦)</Form.Label>
                  <div className="col-8">
                    <Form.Control 
                      type="text" // Change to text to allow commas
                      required 
                      value={price !== null ? formatWithCommas(price) : ''} // Format price with commas
                      onChange={(e) => {
                        // Remove commas before setting the price in the state
                        const value = e.target.value.replace(/,/g, "");
                        setPrice(value ? Number(value) : null);
                      }} 
                      placeholder="Price Bought" 
                      className={`py-2 shadow-none  border-1 ${styles.inputs}`} 
                    />
                  </div>
                </Form.Group>

              </>
            )}

            {/* Remove Feed (Stage and Quantity) */}
            {modalType === 'remove' && (
              <>
                {/* Product Stage */}
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Pond To</Form.Label>
                <div className="col-8">
                  <Form.Select
                    name="stage"
                    required
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className={`py-2 shadow-none border-1 ${styles.inputs}`}
                  >
                    <option value="" disabled>Choose Pond</option>
                    {!stages ? (
                      <option>Please wait...</option>
                    ) : stages.length < 1 ? (
                      <option>No data available</option>
                    ) : (
                      stages
                        .filter(stage => !['damage', 'loss', 'damages'].includes(stage.title.toLowerCase())) // Correct filter logic to exclude specific titles
                        .map((stage, index) => (
                          <option value={stage.title} key={index}>{stage.title}</option>
                        ))
                    )}
                  </Form.Select>
                </div>
              </Form.Group>

                {/* Quantity */}
                <Form.Group className="mb-4 row">
                  <Form.Label className="col-4 fw-semibold">Quantity {`(${selectedProduct?.unit})`}</Form.Label>
                  <div className="col-8 d-flex align-items-center">
                    <Form.Control 
                      type="number" 
                      value={quantityUsed ?? ''} // Shows empty string if quantityUsed is null
                      onChange={(e) => setQuantityUsed(Number(e.target.value) || null)} 
                      className={`py-2 shadow-none  border-1 ${styles.inputs}`} 
                      placeholder="Enter Quantity" 
                    />
                  </div>
                </Form.Group>
              </>
            )}

            {/* Edit Feed (Threshold Value and Unit) */}
            {modalType === 'edit' && (
              <>
                {/* Threshold Value */}
                <Form.Group className="mb-3 row fw-semibold">
                  <Form.Label className="col-4">Threshold Value</Form.Label>
                  <div className="col-8">
                    <Form.Control 
                      type="number" 
                      placeholder="Threshold Value" 
                      required 
                      value={threshold ?? ''} // Shows empty string if quantityUsed is null
                      onChange={(e) => setThreshold(Number(e.target.value) || null)} 
                      className={`py-2 shadow-none  border-1 ${styles.inputs}`} 
                    />
                  </div>
                </Form.Group>

                {/* Unit */}
                <Form.Group className="mb-3 row">
                  <Form.Label className="col-4 fw-semibold">Unit</Form.Label>
                  <div className="col-8">
                    <Form.Control 
                      type="text" 
                      readOnly 
                      defaultValue={selectedProduct?.unit} 
                      className={`py-2 shadow-none  border-1 ${styles.inputs}`} 
                    />
                  </div>
                </Form.Group>
              </>
            )}
          </Modal.Body>

          <Modal.Footer className="mt-5 mb-3 border-0" style={{height: '200px'}}>
            <Button className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} onClick={handleSaveClick}>
              {modalType === 'add' ? 'Add' : modalType === 'remove' ? 'Remove' : 'Edit'}
            </Button>
            <ToastContainer /> {/* Include ToastContainer for notifications */}
          </Modal.Footer>
        </Modal>
      </div>
    </section>
  );
}

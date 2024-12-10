import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../showcase.module.scss';
import { Spinner, Alert, Form, Modal, Button } from 'react-bootstrap'; 
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPaginate from 'react-paginate'; 
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ViewBrokenHistory() {
  const [brokenQuantity, setBrokenQuantity] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); 
  const [pageCount, setPageCount] = useState(0); 
  const [loadingStages, setLoadingStages] = useState(true); 
  const [loadingTable, setLoadingTable] = useState(true); 
  const [errorStages, setErrorStages] = useState('');
  const [convert, setConvert] = useState('');
  const [errorTable, setErrorTable] = useState('');
  const [selectedBroken, setSelectedBroken] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 10;

  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage.selected);
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Function to fetch table data
  const fetchTableData = async () => {
    setLoadingTable(true);
    try {
      const response = await Api.get('/show-glass/broken');
      if (response.data && response.data.data) {
        setTableData(response.data.data); // Wrap in array if it's a single object
        setPageCount(Math.ceil(1 / itemsPerPage)); // Adjust pagination for a single item
      } else {
        throw new Error('Expected an object with the data property');
      }
    } catch (error) {
      console.error(error);
      setErrorTable("Error fetching fish stages data.");
    } finally {
      setLoadingTable(false);
    }
  };
  
  // Function to fetch broken quantity data
  const fetchQuantityData = async () => {
    setLoadingStages(true);
    try {
      const response = await Api.get('/show-glass/total-broken');   
      setBrokenQuantity(response.data.data.totalBrokenQuantity);
    } catch (error) {
      console.error(error);
      setErrorStages("Error fetching broken quantity data.");
    } finally {
      setLoadingStages(false);
    }
  };

  const handleConvert = (convert) => {
    setSelectedBroken(convert);
    setShowModal(true);
  };
  
  useEffect(() => {
    fetchQuantityData();
    fetchTableData();
  }, []);

  // Convert the quantity of broken
  const handleSave = async () => {
    const userConfirmed = window.confirm("Are you sure you want to convert this to KG?");
    if (!userConfirmed) return; // Exit if user cancels

    const loadingToast = toast.loading("Converting to KG...");
    const formData = {
      updatedAt: selectedBroken.updatedAt,
      brokenQuantityInKg: convert,
    };

    try {
      await Api.post(`/convert-broken-to-kg`, formData);
      toast.update(loadingToast, {
        render: "Converted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchTableData();
      setShowModal(false);
      setSelectedBroken(null);
    } catch (error) {
      console.error("Failed to convert:", error);
      toast.update(loadingToast, {
        render: "Failed to convert. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 6000,
      });
    }
  };


  const paginatedData = tableData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  
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
            <h4 className="mt-3 mb-5">View Broken Fish History</h4>

            <div className={`d-flex mb-5`}>
              {loadingStages ? (
                <div className="text-start w-25 shadow py-5 px-3">                
                    <span className="text-muted">Loading...</span>                
                </div>
              ) : errorStages ? (
                <div className="w-100">
                  <Alert variant="danger" className="text-center py-5">
                    <FaExclamationTriangle size={40} />
                    <span className="fw-semibold">{errorStages}</span>
                  </Alert>
                </div>
              ) : brokenQuantity ? (
                <div className="w-50 ">
                      <div className="w-50 px-3 shadow">
                      <p className="text-end text-muted fw-semibold" style={{fontSize:'12px'}}>In Stock</p>
                      <p className="text-start text-muted fw-semibold" style={{fontSize:'14px'}}>Total Quantity</p>
                      <div className="d-flex pb-3">
                          <h1>{brokenQuantity}</h1>
                          <p className="mt-3 fw-semibold" style={{fontSize:'12px'}}>Kg</p>
                      </div>
                    </div>
                </div>
              ) : null}
            </div>

            {loadingTable ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : errorTable ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">{errorTable}</span>
                </Alert>
              </div>
            ) : (
              <div>
                <table className={styles.styled_table}>
                  <thead className={`rounded-2 ${styles.theader}`}>
                    <tr>
                      <th>DATE CREATED</th>
                      <th>FISH BATCH</th> 
                      <th>QUANTITY</th>
                      <th>QUANTITY IN KG</th> 
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((data, index) => (
                        <tr key={index}>
                          <td>{formatDate(data.updatedAt)}</td>
                          <td>{data.batch_no}</td>
                          <td>{data.brokenFishQuantity}</td>
                          <td className='d-flex justify-content-between align-items-center'> <span>{data.brokenQuantityInKg || '0'}</span> {data.brokenQuantityInKg === 0 && <button className={`border-0 btn-dark text-light rounded-4 py-1 px-3 ${styles.submit}`} onClick={() => handleConvert(data)}>Convert to kg</button>}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="d-flex justify-content-center mt-4">
                <ReactPaginate
                    previousLabel={"<"}
                    nextLabel={">"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(tableData.length / itemsPerPage)} // Use tableData instead of ledgerData
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageChange}
                    containerClassName={"pagination justify-content-center"}
                    pageClassName={"page-item"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    previousLinkClassName={"page-link"}
                    nextClassName={"page-item"}
                    nextLinkClassName={"page-link"}
                    breakClassName={"page-item disabled"}
                    breakLinkClassName={"page-link"}
                    activeClassName={"active-light"}
                />
                </div>
              </div>
            )}
          </main>
        </section>
        <ToastContainer/>
        <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Convert to KG</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0 pt-5">
          {selectedBroken && (
            <Form>
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">  Quantity</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="number"
                    name="phone"
                    value={selectedBroken.brokenFishQuantity}
                    readOnly              
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Quantity in (KG)</Form.Label>
                <div className="col-8">                    
                    <Form.Control
                      type='number'
                      placeholder="Enter quantity converted"
                      value={convert}
                      onChange={(e)=>{setConvert(e.target.value)}}
                      required                  
                      className="py-2 shadow-none border-secondary-subtle border-1"
                    />                      
                </div>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-end mt-5">
          <Button variant="dark"  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} onClick={handleSave}>
            Convert
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </section>
  );
}

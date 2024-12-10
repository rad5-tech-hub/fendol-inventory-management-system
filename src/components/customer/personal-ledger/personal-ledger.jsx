import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";  // Import useLocation
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss'; 
import { BsExclamationTriangleFill } from "react-icons/bs";
import { Spinner, Alert } from 'react-bootstrap';
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { ToastContainer } from 'react-toastify';

const PersonalLedger = () => {
  // Get the query parameters from the URL using useLocation
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');  // Extract the 'id' from query params

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchLedgerData = async () => {
        try {
          // Fetch ledger data using the id from the URL
          const response = await Api.get(`/customer/${id}`);
          
          if (Array.isArray(response.data.data)) {
            setLedgerData(response.data.data);
      
            // Access the fullName from the first item in the array
            if (response.data.data.length > 0) {
              setFullName(response.data.data[0].fullName)
              setCategory(response.data.data[0].category)              
            } else {
              console.log("No data available");
            }
          } else {
            throw new Error('Expected an array of ledger data');
          }
        } catch (err) {
          console.error('Error fetching data:', err);
          setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
        } finally {
          setLoading(false);
        }
    };      

    // Only fetch data if 'id' is available
    if (id) {
      fetchLedgerData();
    }
  }, [id]);  // Adding 'id' to dependency array to refetch when it changes

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB');
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const displayedLedgerData = ledgerData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (displayedLedgerData.length > 0) {
      setBalance(displayedLedgerData[0].balanceWithRollover);
    }
  }, [displayedLedgerData]);

  return (
    <section className={`d-none d-lg-block ${styles.body}`}>
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar className={styles.sidebarItem} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form}>
            <div className="mt-3 mb-5">
              <h4 >{fullName  ?.replace(/_/g, ' ') // Replace underscores with spaces
                                    .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word
                                }</h4>
              <p className="fw-light">Category: {category}</p>
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

            {!loading && !error && ledgerData.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-5">
                  No available Ledger!
                </Alert>
              </div>
            )}

            {!loading && !error && displayedLedgerData.length > 0 && (
              < div className="table-responsive">
                <table className={styles.styled_tables}>
                  <thead className={`rounded-2 ${styles.theaders}`}>
                    <tr>
                      <th>DATE</th>
                      <th>NAME</th>
                      <th>CATEGORY</th>
                      <th>PRODUCT</th>
                      <th>QUANTITY</th>
                      <th>PAYMENT</th>
                      <th style={{ color: 'green' }}>CREDIT(₦)</th>
                      <th style={{ color: 'red' }}>DEBIT(₦)</th>
                      <th>BALANCE(₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLedgerData.map((record, index) => (
                      <tr key={index} className="text-start">
                        <td>{formatDate(record.date)}</td>                       
                        <td>{record.fullName}</td>
                        <td>{record.category}</td>
                        <td>{record.productName}</td>
                        <td>{record.quantity}</td>
                        <td>{record.paymentType}</td>
                        <td style={{ color: 'green' }}>{record.credit || '-'}</td>
                        <td style={{ color: 'red' }}>{record.debit || '-'}</td>
                        <td>{record.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"<"}
                    nextLabel={">"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(ledgerData.length / itemsPerPage)}
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
                    activeClassName={"active-light"}
                  />
                </div>
              </div>
            )}
          </main>
          <ToastContainer />
        </section>
      </div>
    </section>
  );
};

export default PersonalLedger;

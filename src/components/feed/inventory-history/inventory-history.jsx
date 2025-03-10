import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../feed.module.scss';
import { Spinner, Alert } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPaginate from 'react-paginate';
import Api from '../../shared/api/apiLink';

export default function InventoryHistory() {
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false); // Added for sidebar toggle

  useEffect(() => {
    const fetchInventoryHistory = async () => {
      try {
        const response = await Api.get('/feeds-histories');
        setInventoryHistory(response.data.data);
        setFilteredData(response.data.data);
      } catch (error) {
        setError("Error fetching inventory history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventoryHistory();
  }, []);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event) => {
    const date = event.target.value;
    setSelectedDate(date);

    if (date) {
      const filtered = inventoryHistory.filter((history) => {
        const createdDate = new Date(history.createdAt);
        const formattedDate = createdDate.toISOString().split('T')[0];
        return formattedDate === date;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(inventoryHistory);
    }
  };

  const offset = currentPage * itemsPerPage;
  const paginatedData = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
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
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 align-items-md-center">
              <h4 className="mb-4">Feed Inventory History</h4>
              <div className="mb-4 d-flex gap-2 align-items-center">
                <span className="fw-semibold fs-6">Filter</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className={`form-control ${styles.dateInput}`}
                  placeholder="Filter By Date"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : error ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-75 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">No data available.</span>
                </Alert>
              </div>
            ) : (
              <>
                {/* Table for Desktop */}
                <div className={`d-none d-lg-block ${styles.tableWrapper}`}>
                  <table className={styles.styled_table}>
                    <thead>
                      <tr>
                        <th>DATE CREATED</th>
                        <th>FEED NAME</th>
                        <th>FEED TYPE</th>
                        <th>POND</th>
                        <th>QUANTITY ADDED (KG)</th>
                        <th>QUANTITY USED (KG)</th>
                        <th>QUANTITY REMAINING (KG)</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((history, index) => {
                        const formattedDate = formatDate(history.createdAt);
                        return (
                          <tr key={index}>
                            <td>{formattedDate}</td>
                            <td>{history.feedDetails.feedName}</td>
                            <td>{history.feedDetails.feedType}</td>
                            <td>{history.stage || '-'}</td>
                            <td>{history.stage === null ? history.feedDetails.originalQuantity : '-'}</td>
                            <td>{history.quantityUsed}</td>
                            <td>{history.remainingFeed}</td>
                            <td className="text-uppercase fw-semibold">
                              <span className={
                                history.status === 'in stock'
                                  ? 'text-success'
                                  : history.status === 'out of stock'
                                  ? 'text-danger'
                                  : history.status === 'low stock'
                                  ? 'text-warning'
                                  : ''
                              }>
                                {history.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Card Layout for Tablet and Below */}
                <div className={`d-lg-none ${styles.cardContainer}`}>
                  {paginatedData.map((history, index) => {
                    const formattedDate = formatDate(history.createdAt);
                    return (
                      <div key={index} className={`${styles.card} mb-3 p-3 border rounded`}>
                        <div className="d-flex flex-column">
                          <div className="mb-2">
                            <strong>Date Created:</strong> {formattedDate}
                          </div>
                          <div className="mb-2">
                            <strong>Feed Name:</strong> {history.feedDetails.feedName}
                          </div>
                          <div className="mb-2">
                            <strong>Feed Type:</strong> {history.feedDetails.feedType}
                          </div>
                          <div className="mb-2">
                            <strong>Pond:</strong> {history.stage || '-'}
                          </div>
                          <div className="mb-2">
                            <strong>Qty Added (KG):</strong> {history.stage === null ? history.feedDetails.originalQuantity : '-'}
                          </div>
                          <div className="mb-2">
                            <strong>Qty Used (KG):</strong> {history.quantityUsed}
                          </div>
                          <div className="mb-2">
                            <strong>Qty Remaining (KG):</strong> {history.remainingFeed}
                          </div>
                          <div>
                            <strong>Status:</strong>{' '}
                            <span className={`text-uppercase fw-semibold ${
                              history.status === 'in stock'
                                ? 'text-success'
                                : history.status === 'out of stock'
                                ? 'text-danger'
                                : history.status === 'low stock'
                                ? 'text-warning'
                                : ''
                            }`}>
                              {history.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"<"}
                    nextLabel={">"}
                    breakLabel={"..."}
                    pageCount={pageCount}
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
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
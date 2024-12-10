import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../process.module.scss';
import { Spinner, Alert } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import Api from '../../shared/api/apiLink';

export default function ViewSummary() {
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Current page
  const [itemsPerPage] = useState(10); // Items per page
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchMoveFishHistory = async () => {
      try {
        const response = await Api.get('/get-all-harvest-histories');
        setMoveFishHistory(response.data.data); // Assuming the response contains an array of history data
        setFilteredData(response.data.data); // Set the initial filtered data to all data
      } catch (error) {
        setError("Error fetching move fish history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMoveFishHistory();
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
      const filtered = moveFishHistory.filter((history) => {
        const createdDate = new Date(history.createdAt);
        const formattedDate = createdDate.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format
        return formattedDate === date; // Filter by the selected date
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(moveFishHistory); // Reset if no date is selected
    }
  };

  // Calculate pagination data
  const offset = currentPage * itemsPerPage;
  const paginatedData = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  return (
    <section className={`d-none d-lg-block ${styles.body}`} >
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
            <div className="d-flex justify-content-between mt-3 ">
              <h4 className="mb-4">Process History</h4>
              
              {/* Date Picker for filtering */}
              <div className="mb-4 d-flex gap-2">              
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : error ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">No data available.</span>
                </Alert>
              </div>
            ) : (
              <>
                <table className={styles.styled_table}> 
                  <thead>
                    <tr>
                      <th>DATE CREATED</th>
                      <th>FISH BATCH</th>
                      <th>QUANTITY BEFORE</th>
                      <th>QUANTITY AFTER <br /> (W,S,D)</th>
                      <th>REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((history, index) => {
                      const formattedDate = formatDate(history.createdAt);
                      return (
                        <tr key={index}>
                          <td>{formattedDate}</td>
                          <td>{history.batch_no || '-'}</td>
                          <td>{history.quantityBefore}</td>
                          <td>{`${history.wholeQuantity},${history.brokenQuantity},${history.damageLoss}`}</td>
                          <td>{history.remarks ? history.remarks.slice(0, 40) + (history.remarks.length > 40 ? '...' : '') : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"<"}
                    nextLabel={">"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(filteredData.length / itemsPerPage)}
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

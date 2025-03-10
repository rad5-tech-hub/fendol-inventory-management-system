import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../process.module.scss';
import { Spinner, Alert, OverlayTrigger, Popover } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import Api from '../../shared/api/apiLink';

export default function ViewSummary() {
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false); // Added for sidebar toggl

  useEffect(() => {
    const fetchMoveFishHistory = async () => {
      try {
        const response = await Api.get('/latest-completed');
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        setMoveFishHistory(data);
        setFilteredData(data);
      } catch (error) {
        setError("Error fetching move fish history. Please try again.");
        setFilteredData([]);
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

  const renderPopover = (remark) => (
    <Popover id="popover-basic">
      <Popover.Header as="h5">Full Remark</Popover.Header>
      <Popover.Body>{remark}</Popover.Body>
    </Popover>
  );

  const handleDateChange = (event) => {
    const date = event.target.value;
    setSelectedDate(date);

    if (date) {
      const filtered = moveFishHistory.filter((history) => {
        const createdDate = new Date(history.date);
        const formattedDate = createdDate.toISOString().split('T')[0];
        return formattedDate === date;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(moveFishHistory);
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
          <div className={styles.sidebar}>
              <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
          </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 align-items-md-center">
              <h4 className="mb-4">Process History</h4>
              <div className="mb-4 d-flex justify-content-md-end">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className={`form-control ${styles.dateInput}`}
                  placeholder="Filter By Date"
                />
              </div>
            </div>

            {/* Loading, Error, and Empty States */}
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
                {/* Table for Desktop, Cards for Tablet and Below */}
                <div className={`${styles.tableWrapper} table-responsive`}>
                  <table className={styles.styled_table}>
                    <thead>
                      <tr>
                        <th>DATE CREATED</th>
                        <th>QUANTITY BEFORE</th>
                        <th>QUANTITY AFTER <br /> (W,B,D)</th>
                        <th>REMARK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(paginatedData) && paginatedData.map((history, index) => {
                        const formattedDate = formatDate(history.createdAt);
                        return (
                          <tr key={index}>
                            <td>{formattedDate}</td>
                            <td>{history.totalQuantity}</td>
                            <td>{`${history.wholeFishQuantity},${history.brokenFishQuantity},${history.totalDamageLoss}`}</td>
                            <OverlayTrigger
                              trigger={['hover', 'focus']}
                              placement="bottom"
                              overlay={renderPopover(history.remark)}
                            >
                              <td
                                style={{ cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}
                                className="text-end"
                              >
                                {history.remark ? (history.remark.length > 50 ? `${history.remark.substring(0, 50)}...` : history.remark) : "No remarks"}
                              </td>
                            </OverlayTrigger>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
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

import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../finance.module.scss";
import { BsExclamationTriangleFill } from "react-icons/bs";
import { Spinner, Alert } from "react-bootstrap";
import Api from "../../shared/api/apiLink";
import ReactPaginate from "react-paginate";

const FinanceLedger = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const itemsPerPage = 10;
  const [balance, setBalance] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchLedgerData = async () => {
      try {
        const response = await Api.get("/ledger");
        if (Array.isArray(response.data.data)) {
          setLedgerData(response.data.data);
        } else {
          throw new Error("Expected an array of ledger data");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerData();
  }, []);

  // Format date function
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Handle date change for filtering
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setCurrentPage(0); // Reset to first page when filtering
  };

  // Filter ledger data based on selected date
  const filteredLedgerData = selectedDate
    ? ledgerData.filter((record) => formatDate(record.date) === selectedDate)
    : ledgerData;

  // Pagination logic
  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedLedgerData = filteredLedgerData.slice(startIndex, endIndex);

  useEffect(() => {
    if (displayedLedgerData.length > 0) {
      setBalance(displayedLedgerData[0].balanceWithRollover);
    }
  }, [displayedLedgerData]);

  // Sidebar toggle handlers
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        {/* Content */}
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 mb-5 align-items-md-center">
              <h4 className="mb-3 mb-md-0">Finance Ledger</h4>
              <div className="d-flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                />
              </div>
            </div>

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
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75 py-5">
                  <BsExclamationTriangleFill size={40} />{" "}
                  <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && displayedLedgerData.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-75 py-5">
                  No available data
                </Alert>
              </div>
            )}

            {/* Ledger Table */}
            {!loading && !error && displayedLedgerData.length > 0 && (
              <>
                <table className={`${styles.styled_table} ${styles.table_responsive}`}>
                  <thead className={`rounded-2 ${styles.theader}`}>
                    <tr>
                      <th>DATE</th>
                      <th>PRODUCT</th>
                      <th className="pt-3">DESCRIPTION</th>
                      <th style={{ color: "green" }} className="pt-3">
                        CREDIT(₦)
                      </th>
                      <th style={{ color: "red" }} className="pt-3">
                        DEBIT(₦)
                      </th>
                      <th>BALANCE(₦)</th>
                    </tr>
                  </thead>
                  <tbody style={{ cursor: "pointer" }}>
                    {displayedLedgerData.map((record, index) => (
                      <tr key={index}>
                        <td>{formatDate(record.date)}</td>
                        <td
                          title={record.productName}
                          style={{
                            cursor: record.productName && record.productName.length > 40 ? "pointer" : "normal",
                          }}
                        >
                          {record.productName
                            ? record.productName.slice(0, 40) + (record.productName.length > 40 ? "..." : "")
                            : "-"}
                        </td>
                        <td
                          title={record.description}
                          style={{
                            cursor: record.description && record.description.length > 40 ? "pointer" : "normal",
                          }}
                        >
                          {record.description
                            ? record.description.slice(0, 40) + (record.description.length > 40 ? "..." : "")
                            : ""}
                        </td>
                        <td style={{ color: "green" }}>
                          {record.credit ? `₦${new Intl.NumberFormat().format(record.credit)}` : "-"}
                        </td>
                        <td style={{ color: "red" }}>
                          {record.debit ? `₦${new Intl.NumberFormat().format(record.debit)}` : "-"}
                        </td>
                        <td>{`₦${new Intl.NumberFormat().format(record.balance)}`}</td>
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
                    pageCount={Math.ceil(filteredLedgerData.length / itemsPerPage)}
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
      </div>
    </section>
  );
};

export default FinanceLedger;
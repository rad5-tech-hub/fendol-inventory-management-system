import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../finance.module.scss";
import { BsExclamationTriangleFill } from "react-icons/bs";
import { Alert } from "react-bootstrap";
import Api from "../../shared/api/apiLink";
import ReactPaginate from "react-paginate";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import DataTable from "../../shared/data-table/DataTable";

const FinanceLedger = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const itemsPerPage = 45;
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
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
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
            {loading && <SkeletonTable cols={6} rows={5} />}

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
                <DataTable
                  className={`${styles.styled_table} ${styles.table_responsive}`}
                  columns={[
                    { key: 'date', label: 'DATE', render: (val) => formatDate(val) },
                    { key: 'productName', label: 'PRODUCT', render: (val) => (
                      <span title={val} style={{ cursor: val && val.length > 40 ? "pointer" : "normal" }}>
                        {val ? val.slice(0, 40) + (val.length > 40 ? "..." : "") : "-"}
                      </span>
                    )},
                    { key: 'description', label: 'DESCRIPTION', render: (val) => (
                      <span title={val} style={{ cursor: val && val.length > 40 ? "pointer" : "normal" }}>
                        {val ? val.slice(0, 40) + (val.length > 40 ? "..." : "") : ""}
                      </span>
                    )},
                    { key: 'credit', label: 'CREDIT(₦)', render: (val) => <span style={{ color: "green" }}>{val ? `₦${new Intl.NumberFormat().format(val)}` : "-"}</span> },
                    { key: 'debit', label: 'DEBIT(₦)', render: (val) => <span style={{ color: "red" }}>{val ? `₦${new Intl.NumberFormat().format(val)}` : "-"}</span> },
                    { key: 'balance', label: 'BALANCE(₦)', render: (val) => `₦${new Intl.NumberFormat().format(val)}` },
                  ]}
                  data={displayedLedgerData}
                />

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
                    activeClassName={"active"}
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
import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../finance.module.scss";
import Api from "../../shared/api/apiLink";
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import DataTable from "../../shared/data-table/DataTable";
import Pagination from "../../shared/pagination/Pagination";

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

  const formatDateInput = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filter ledger data based on selected date
  const filteredLedgerData = selectedDate
    ? ledgerData.filter((record) => formatDateInput(record.date) === selectedDate)
    : ledgerData;

  const handleResetFilters = () => {
    setSelectedDate('');
    setCurrentPage(0);
  };

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
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        {/* Content */}
        <section className={`${styles.content} flex-grow-1`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 mb-4 align-items-md-center gap-3">
              <div>
                <h4 className="mb-1" style={{ fontSize: 22, fontWeight: 700, color: '#2E3135' }}>Finance Ledger</h4>
                <p style={{ margin: 0, color: '#8C949B', fontSize: 13 }}>View and filter all financial records.</p>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                  style={{ width: 'auto', minWidth: 160, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, padding: '8px 12px' }}
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      padding: '8px 14px', background: '#ffffff', color: '#6B7280',
                      border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Loader */}
            {loading && <SkeletonTable cols={6} rows={5} />}

            {/* Error Message */}
            {error && <ErrorState message={error} />}

            {!loading && !error && filteredLedgerData.length === 0 && (
              <EmptyState
                title={selectedDate ? 'No matches found' : 'No available data'}
                description={selectedDate ? 'Try adjusting the selected date.' : 'No finance ledger records are available.'}
              />
            )}

            {/* Ledger Table */}
            {!loading && !error && filteredLedgerData.length > 0 && (
              <DataTable
                className={`${styles.styled_table} ${styles.table_responsive}`}
                columns={[
                  { key: 'date', label: 'DATE', render: (val) => formatDate(val) },
                  { key: 'productName', label: 'PRODUCT', render: (val) => (
                    <span title={val || ""} style={{ cursor: 'pointer', display: 'inline-block', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                      {val || "-"}
                    </span>
                  )},
                  { key: 'credit', label: 'CREDIT(₦)', render: (val) => Number(val) ? <span style={{ color: "green" }}>{`₦${new Intl.NumberFormat().format(val)}`}</span> : '' },
                  { key: 'debit', label: 'DEBIT(₦)', render: (val) => Number(val) ? <span style={{ color: "red" }}>{`₦${new Intl.NumberFormat().format(val)}`}</span> : '' },
                  { key: 'balance', label: 'BALANCE(₦)', render: (val) => Number(val) ? `₦${new Intl.NumberFormat().format(val)}` : '' },
                ]}
                data={displayedLedgerData}
              />
            )}
            </div>
            {/* Pagination */}
            {!loading && !error && filteredLedgerData.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageCount={Math.ceil(filteredLedgerData.length / itemsPerPage)}
                totalItems={filteredLedgerData.length}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
                itemName="records"
              />
            )}
          </main>
        </section>
      </div>
    </section>
  );
};

export default FinanceLedger;
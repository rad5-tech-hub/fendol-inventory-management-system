import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../store.module.scss';
import { Alert } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPaginate from 'react-paginate';
import Api from '../../shared/api/apiLink';
import DataTable from "../../shared/data-table/DataTable";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";

export default function InventoryHistory() {
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false); // Added for sidebar toggle

  useEffect(() => {
    const fetchInventoryHistory = async () => {
      try {
        const response = await Api.get('/stores-histories');
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
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
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
            <div className="d-flex justify-content-between mt-3">
              <h4 className="mb-4">Store Inventory History</h4>
              <div className="mb-4 d-flex gap-2">
                <span className="fw-semibold fs-6 mt-1">Filter</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonTable rows={5} cols={7} />
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
                <DataTable
                  columns={[
                    { key: 'createdAt', label: 'DATE CREATED', render: (value) => formatDate(value) },
                    { key: 'storeName', label: 'NAME', render: (_, row) => row.storeDetails?.name },
                    { key: 'stage', label: 'POND', render: (value) => value || '-' },
                    { key: 'quantityAdded', label: 'QUANTITY ADDED (KG)', render: (_, row) => row.stage === null ? row.storeDetails.originalQuantity : '-' },
                    { key: 'quantityUsed', label: 'QUANTITY USED (KG)', render: (value) => value || '-' },
                    { key: 'remainingStock', label: 'QUANTITY REMAINING (KG)' },
                    { key: 'status', label: 'STATUS', render: (value) => (
                      <span className={`text-uppercase fw-semibold ${
                        value === 'in stock' 
                          ? 'text-success' 
                          : value === 'out of stock' 
                          ? 'text-danger' 
                          : value === 'low stock' 
                          ? 'text-warning' 
                          : ''
                      }`}>
                        {value}
                      </span>
                    )},
                  ]}
                  data={paginatedData}
                />
                <div className="d-flex justify-content-center mt-4" style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', paddingTop: 12, paddingBottom: 12 }}>
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
}
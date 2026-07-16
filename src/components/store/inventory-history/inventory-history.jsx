import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../store.module.scss';
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import ReactPaginate from 'react-paginate';
import Api from '../../shared/api/apiLink';
import DataTable from "../../shared/data-table/DataTable";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";

export default function InventoryHistory() {
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const resolvedSiteId = isSuperAdmin ? (activeSite?.id || '') : (user?.siteId || '');

  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const fetchInventoryHistory = async () => {
      try {
        const params = {};
        if (resolvedSiteId) params.siteId = resolvedSiteId;
        const response = await Api.get('/stores-histories', { params });
        setInventoryHistory(response.data.data);
        setFilteredData(response.data.data);
      } catch (error) {
        setError("Error fetching inventory history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventoryHistory();
  }, [resolvedSiteId]);

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
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
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
              <ErrorState message={error} />
            ) : filteredData.length === 0 ? (
              <EmptyState title="No data available" />
            ) : (
              <>
                <DataTable
                  columns={[
                    { key: 'createdAt', label: 'DATE CREATED', render: (value) => formatDate(value) },
                    { key: 'storeId', label: 'STORE', render: (value) => value ? value.slice(0, 8) + '…' : '-' },
                    { key: 'stage', label: 'POND', render: (value) => value || '-' },
                    { key: 'originalQuantity', label: 'ORIGINAL QUANTITY (KG)' },
                    { key: 'quantityUsed', label: 'QUANTITY USED (KG)', render: (value) => value || '-' },
                    { key: 'remainingStock', label: 'REMAINING (KG)' },
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

              </>
            )}
            </div>
            {!loading && !error && filteredData.length > 0 && (
              <div className="d-flex justify-content-center mt-4" style={{ paddingTop: 12, paddingBottom: 12, background: '#fff' }}>
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
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
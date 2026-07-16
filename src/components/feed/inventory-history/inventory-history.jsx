import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { IoCalendarOutline, IoClose } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight, FiArrowLeft } from "react-icons/fi";
import { BsInfoCircle } from "react-icons/bs";
import { FaExclamationTriangle } from "react-icons/fa";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import DataTable from "../../shared/data-table/DataTable";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import ReactPaginate from "react-paginate";
import Api from "../../shared/api/apiLink";
import feedStyles from "../feed.module.scss";
import styles from "./inventory-history.module.scss";
import { useNavigate } from "react-router-dom";

const f = (n) => new Intl.NumberFormat().format(n);

const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return { dateStr, timeStr };
};

export default function InventoryHistory() {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes("super_admin");
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const itemsPerPage = 45;

  useEffect(() => {
    const fetchInventoryHistory = async () => {
      try {
        setLoading(true);
        const siteId = isSuperAdmin ? (activeSite?.id || "all") : (user?.siteId || user?.userSites?.[0]?.id || "");
        const params = {};
        if (siteId) params.siteId = siteId;
        const response = await Api.get("/feeds-histories", { params });
        if (response.data?.success) {
          setInventoryHistory(response.data.data || []);
          setFilteredData(response.data.data || []);
        } else {
          setError(response.data?.response_message || "Failed to load inventory history.");
        }
      } catch (err) {
        const serverMsg = err?.response?.data?.response_message || err?.response?.data?.message;
        const networkMsg = !err.response ? "Network error \u2014 please check your internet connection." : null;
        setError(serverMsg || networkMsg || "Error fetching inventory history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventoryHistory();
  }, [activeSite, isSuperAdmin, user]);

  const handleDateChange = (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    setCurrentPage(0);

    if (date) {
      const filtered = inventoryHistory.filter((history) => {
        const createdDate = new Date(history.createdAt);
        const formattedDate = createdDate.toISOString().split("T")[0];
        return formattedDate === date;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(inventoryHistory);
    }
  };

  const clearFilter = () => {
    setSelectedDate("");
    setFilteredData(inventoryHistory);
    setCurrentPage(0);
  };

  const offset = currentPage * itemsPerPage;
  const paginatedData = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const columns = [
    {
      key: "createdAt",
      label: "Date",
      render: (value) => {
        const { dateStr, timeStr } = formatDate(value);
        return (
          <div className={styles.dateCell}>
            <span className={styles.dateTop}>{dateStr}</span>
            <span className={styles.dateBottom}>{timeStr}</span>
          </div>
        );
      },
    },
    { key: "feedName", label: "Feed Name", render: (value, row) => row?.feed?.feedName || "--" },
    { key: "feedType", label: "Feed Type", render: (value, row) => row?.feed?.feedType || "--" },
    {
      key: "originalQuantity",
      label: "Qty Added",
      render: (value) => <span className={styles.numCell}>{Number(value) > 0 ? f(value) : "--"}</span>,
    },
    {
      key: "quantityUsed",
      label: "Qty Used",
      render: (value) => <span className={styles.numCell}>{Number(value) > 0 ? f(value) : "--"}</span>,
    },
    {
      key: "quantitySold",
      label: "Qty Sold",
      render: (value) => <span className={styles.numCell}>{Number(value) > 0 ? f(value) : "--"}</span>,
    },
  ];

  return (
    <section className={`${feedStyles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? "d-block" : "d-none"}`}>
          <SideBar className={feedStyles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', height: '100%', padding: '15px' }}>
            <main className={styles.pageWrapper}>
              <div className={styles.breadcrumb}>
                <span className={styles.breadcrumbItem}>Feed Management</span>
                <span className={styles.breadcrumbSep}>&gt;</span>
                <span className={styles.breadcrumbActive}>Inventory History</span>
              </div>

              <div className={styles.headerRow}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.pageTitle}>Feed Inventory History</h1>
                  <p className={styles.pageSubtitle}>Track all feed additions, usage, and sales.</p>
                </div>
                <div className={styles.headerRight}>
                  <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    <FiArrowLeft size={14} />
                    Back
                  </button>
                </div>
              </div>

              <div className={styles.filterRow}>
                <div className={styles.filterLeft}>
                  <div className={styles.filterField}>
                    <span className={styles.filterCaption}>Filter by Date</span>
                    <div className={styles.filterControl}>
                      <IoCalendarOutline size={15} className={styles.ctrlIcon} />
                      <input
                        type="date"
                        className={styles.filterDateInput}
                        value={selectedDate}
                        onChange={handleDateChange}
                      />
                      {selectedDate && (
                        <IoClose size={15} className={styles.ctrlClear} onClick={clearFilter} />
                      )}
                    </div>
                  </div>
                  {selectedDate && (
                    <button className={styles.filterClearBtn} onClick={clearFilter}>
                      <IoClose size={14} />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "20px 0" }}>
                  <SkeletonTable rows={5} cols={6} />
                </div>
              ) : error ? (
                <div className={styles.errorBanner}>
                  <div className={styles.errorBannerContent}>
                    <FaExclamationTriangle size={18} className={styles.errorBannerIcon} />
                    <div className={styles.errorBannerText}>
                      <span className={styles.errorBannerTitle}>Unable to load inventory history</span>
                      <span className={styles.errorBannerMsg}>{error}</span>
                    </div>
                  </div>
                </div>
              ) : filteredData.length === 0 ? (
                <div className={styles.emptyState}>
                  <BsInfoCircle size={36} className={styles.emptyStateIcon} />
                  <span className={styles.emptyStateText}>
                    {selectedDate ? "No records for this date" : "No inventory history available"}
                  </span>
                  <span className={styles.emptyStateSub}>
                    {selectedDate ? "Try selecting a different date." : "Feed transactions will appear here once recorded."}
                  </span>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <div className={`d-none d-lg-block ${styles.tableWrapper}`}>
                    <DataTable
                      className={styles.table}
                      columns={columns}
                      data={paginatedData}
                    />
                  </div>

                  <div className={`d-lg-none ${styles.cardContainer}`}>
                    {paginatedData.map((history, index) => {
                      const { dateStr, timeStr } = formatDate(history.createdAt);
                      return (
                        <div key={history.id || index} className={styles.historyCard}>
                          <div className={styles.cardHeader}>
                            <span className={styles.cardDate}>{dateStr}</span>
                            <span className={styles.cardSite}>{timeStr}</span>
                          </div>
                          <div className={styles.cardDivider} />
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Feed Name</span>
                            <span className={styles.cardValue}>{history.feed?.feedName || "--"}</span>
                          </div>
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Feed Type</span>
                            <span className={styles.cardValue}>{history.feed?.feedType || "--"}</span>
                          </div>
                          <div className={styles.cardDivider} />
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Qty Added</span>
                            <span className={styles.cardValue}>{Number(history.originalQuantity) > 0 ? f(history.originalQuantity) : "--"}</span>
                          </div>
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Qty Used</span>
                            <span className={styles.cardValue}>{Number(history.quantityUsed) > 0 ? f(history.quantityUsed) : "--"}</span>
                          </div>
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Qty Sold</span>
                            <span className={styles.cardValue}>{Number(history.quantitySold) > 0 ? f(history.quantitySold) : "--"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </main>
          </div>

          {!loading && !error && pageCount > 1 && (
            <div className={styles.tableFooter}>
              <span className={styles.footerInfo}>
                Showing {offset + 1} to {Math.min(offset + itemsPerPage, filteredData.length)} of {filteredData.length} records
              </span>
              <div className={styles.pagination} style={{ paddingTop: 12, paddingBottom: 12 }}>
                <ReactPaginate
                  previousLabel={<FiChevronLeft size={15} />}
                  nextLabel={<FiChevronRight size={15} />}
                  breakLabel="..."
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageClick}
                  containerClassName="pagination"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  previousClassName="page-item"
                  previousLinkClassName="page-link"
                  nextClassName="page-item"
                  nextLinkClassName="page-link"
                  breakClassName="page-item"
                  breakLinkClassName="page-link"
                  activeClassName="active"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

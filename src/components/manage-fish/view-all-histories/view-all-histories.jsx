import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../product-stages.module.scss";
import { Form } from "react-bootstrap";
import DataTable from "../../shared/data-table/DataTable";
import { SkeletonTable, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import ReactPaginate from "react-paginate";
import Api from "../../shared/api/apiLink";
import styled from "styled-components";
import { useSelector } from "react-redux";

const NavTab = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .tab {
    padding: 0.5rem 1rem;
    cursor: pointer;
    text-decoration: none;
    color: #512728;
    border-bottom: 3px solid transparent;
    font-weight: 500;
    transition: all 0.3s ease-in-out;

    &.active {
      color: #b06426;
      border-bottom: 3px solid #b06426;
    }

    @media (max-width: 991px) { // Tablet
      padding: 0.4rem 0.8rem;
      font-size: 14px;
    }
  }
`;

export default function ViewAllHistory() {
  const [activeTab, setActiveTab] = useState("#add-histories");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const activeSite = useSelector((store) => store.activeSite);

  // Separate pagination state for each tab
  const [pagination, setPagination] = useState({
    "#add-histories": { currentPage: 0, totalPages: 0 },
    "#move-fish": { currentPage: 0, totalPages: 0 },
    "#harvest-fish": { currentPage: 0, totalPages: 0 },
    "#damage-fish": { currentPage: 0, totalPages: 0 },
  });

  // Tab configuration
  const tabConfig = {
    "#add-histories": {
      label: "Added Fish",
      endpoint: "fishes",
      headers: ["Date", "Pond", "Quantity", "Fish Type"],
      dataKeys: ["createdAt", "stageTitle", "quantity", "speciesName"],
    },
    "#move-fish": {
      label: "Moved Fish",
      endpoint: "fish-movements",
      headers: ["Date", "Pond From", "Pond To", "Quantity", "Remark"],
      dataKeys: ["createdAt", "sourcePond", "destinationPond", "actual_quantity", "remarks"],
    },
    "#harvest-fish": {
      label: "Harvested Fish",
      endpoint: "harvested-fish",
      headers: ["Date", "Pond From", "Quantity", "Remark"],
      dataKeys: ["createdAt", "pondName", "actual_quantity", "remarks"],
    },
    "#damage-fish": {
      label: "Damaged Fish",
      endpoint: "damaged-fish",
      headers: ["Date", "Pond From", "Quantity", "Remark"],
      dataKeys: ["createdAt", "sourcePond", "quantity", "remarks"],
    },
  };

  // Fetch data based on selected tab and handle pagination
  const fetchData = async (endpoint, currentPage) => {
    setLoading(true);
    setError("");
    try {
      const response = await Api.get(endpoint);
      const { data } = response.data;

      const responseData = activeTab === "#harvest-fish" ? response.data.harvested : data;

      const ITEMS_PER_PAGE = 10;
      const offset = currentPage * ITEMS_PER_PAGE;
      const paginatedData = responseData.slice(offset, offset + ITEMS_PER_PAGE);

      setData(responseData);
      setFilteredData(paginatedData);
      setPagination((prev) => ({
        ...prev,
        [activeTab]: {
          currentPage,
          totalPages: Math.ceil(responseData.length / ITEMS_PER_PAGE),
        },
      }));
    } catch (err) {
      setError("Error fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentConfig = tabConfig[activeTab];
    if (currentConfig) {
      fetchData(currentConfig.endpoint, pagination[activeTab].currentPage);
    }
  }, [activeTab, pagination[activeTab].currentPage]);

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

  const truncateRemark = (text) => {
    if (typeof text !== 'string') return '-';
    return text.length > 40 ? `${text.substring(0, 40)}....` : text;
  };

  const getItemSite = (item) => {
    return item.siteId || item.site || item.sourcePond?.site || item.pondName?.site || '';
  };

  const filterData = () => {
    if (!data.length) return;

    let filtered = data;

    if (selectedDate) {
      const formattedSelectedDate = new Date(selectedDate).toISOString().split('T')[0];
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        return itemDate === formattedSelectedDate;
      });
    }

    if (activeSite) {
      filtered = filtered.filter((item) => {
        if (activeSite.id) {
          const itemSiteId = item.siteId || item.sourcePond?.siteId || item.pondName?.siteId || '';
          return String(itemSiteId).toLowerCase() === String(activeSite.id).toLowerCase();
        }
        return String(getItemSite(item)).toLowerCase() === String(activeSite.name).toLowerCase();
      });
    }

    setFilteredData(filtered);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  useEffect(() => {
    filterData();
  }, [siteFilter, selectedDate, data]);

  const renderTable = () => {
    const currentConfig = tabConfig[activeTab];
    if (!currentConfig) return null;

    const columns = currentConfig.headers.map((header, index) => {
      const key = currentConfig.dataKeys[index];
      let render;
      if (key === "createdAt") {
        render = (value) => formatDate(value);
      } else if (key === "destinationPond") {
        render = (value, row) => row.destinationPond?.title || value || "-";
      } else if (key === "sourcePond") {
        render = (value, row) => row.sourcePond?.title || value || "-";
      } else if (key === "FishStage") {
        render = (value, row) => row.FishStage?.title || value || "-";
      } else if (key === "remarks") {
        render = (value) => truncateRemark(value);
      }
      return { key, label: header, render };
    });

    return (
      <DataTable
        columns={columns}
        data={filteredData}
        emptyMessage="No available history data."
      />
    );
  };

  // Sidebar toggle handlers
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
            <h4 className="mt-3 mb-5">View All Histories</h4>
            <div className="d-flex justify-content-between flex-column flex-md-row align-items-md-center mb-3">
              <NavTab>
                {Object.entries(tabConfig).map(([key, { label }]) => (
                  <a
                    key={key}
                    href={key}
                    className={`tab ${activeTab === key ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(key);
                      setPagination((prev) => ({
                        ...prev,
                        [key]: { currentPage: 0, totalPages: 0 },
                      }));
                    }}
                  >
                    {label}
                  </a>
                ))}
              </NavTab>
              <div className="mt-3 mt-md-0 d-flex gap-3 align-items-center">
                <Form.Control
                  type="date"
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonFilterBar />
                <SkeletonTable rows={6} cols={7} />
              </div>
            ) : error ? (
              <ErrorState message={error} />
            ) : (
              renderTable()
            )}

            </div>
            {filteredData.length > 0 && pagination[activeTab].totalPages > 1 && (
              <div className="mt-4" style={{ paddingTop: 12, paddingBottom: 12, background: '#fff' }}>
                <ReactPaginate
                  previousLabel={"<"}
                  nextLabel={">"}
                  breakLabel={"..."}
                  pageCount={pagination[activeTab].totalPages}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={({ selected }) => {
                    setPagination((prev) => ({
                      ...prev,
                      [activeTab]: {
                        ...prev[activeTab],
                        currentPage: selected,
                      },
                    }));
                  }}
                  containerClassName="pagination justify-content-center"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  activeClassName="active"
                />
              </div>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
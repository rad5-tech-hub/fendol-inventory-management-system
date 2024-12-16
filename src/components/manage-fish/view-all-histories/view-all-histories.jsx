import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../product-stages.module.scss";
import { Spinner, Alert, Form } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import Api from "../../shared/api/apiLink";
import styled from "styled-components"; // For custom navigation styles

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
  }`

export default function ViewAllHistory() {
  const [activeTab, setActiveTab] = useState("#add-histories");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // State for selected date

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
      headers: ["Date", "Pond", "Quantity", "Fish Type", "Fish Batch"],
      dataKeys: ["createdAt", "stageTitle", "quantity", "speciesName", "batch_no"],
    },
    "#move-fish": {
      label: "Moved Fish",
      endpoint: "fish-movements",
      headers: ["Date", "Pond From", "Fish Batch", "Pond To", "Quantity", "Remark"],
      dataKeys: ["createdAt", "sourcePond", "batch_no", "destinationPond", "actual_quantity", "remarks"],
    },
    "#harvest-fish": {
      label: "Harvested Fish",
      endpoint: "harvested-fish",
      headers: ["Date", "Pond From", "Quantity", "Fish Batch", "Remark"],
      dataKeys: ["createdAt", "FishStage", "quantity", "batch_no", "remarks"],
    },
    "#damage-fish": {
      label: "Damaged Fish",
      endpoint: "damaged-fish",
      headers: ["Date", "Pond From", "Quantity", "Fish Batch", "Remark"],
      dataKeys: ["createdAt", "sourcePond", "quantity", "batch_no", "remarks"],
    },
  };

  // Fetch data based on selected tab and handle pagination
  const fetchData = async (endpoint, currentPage) => {
    setLoading(true);
    setError("");
    try {
      const response = await Api.get(endpoint);
      const { data } = response.data;

      // If it's the "harvest-fish" tab, use 'harvested' instead of 'data'
      const responseData = activeTab === "#harvest-fish" ? response.data.harvested : data;

      // Perform local pagination
      const ITEMS_PER_PAGE = 10;
      const offset = currentPage * ITEMS_PER_PAGE;
      const paginatedData = responseData.slice(offset, offset + ITEMS_PER_PAGE);

      setData(responseData); // Save all data for filtering purposes
      setFilteredData(paginatedData); // Set initial filtered data based on pagination
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
      // Fetch the data based on the selected tab and pagination
      fetchData(currentConfig.endpoint, pagination[activeTab].currentPage);
    }
  }, [activeTab, pagination[activeTab].currentPage]);  // Add currentPage for each tab to the dependency array
  
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", { timeZone: 'UTC' }); // Format the date to UTC
  };
  
  const handleDateChange = (e) => {
    const selected = e.target.value;
    setSelectedDate(selected);
    if (selected === "") {
      // Reset to original data if no date is selected
      setFilteredData(data.slice(pagination[activeTab].currentPage * 10, (pagination[activeTab].currentPage + 1) * 10));
    } else {
      const formattedSelectedDate = new Date(selected).toISOString().split('T')[0];
      const filtered = data.filter((item) => {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        return itemDate === formattedSelectedDate;
      });
      setFilteredData(filtered);
    }
  };

  const renderTable = () => {
    const currentConfig = tabConfig[activeTab];
    if (!currentConfig) return null;

    return (
      <table className={styles.styled_table}>
        <thead>
          <tr>
            {currentConfig.headers.map((header, index) => (
              <th key={index} className="text-uppercase">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={currentConfig.headers.length} className="text-center border-none">
                <Alert variant="info" className="py-5">No available history data.</Alert>
              </td>
            </tr>
          ) : (
            filteredData.map((item, index) => (
              <tr key={index}>
                {currentConfig.dataKeys.map((key, idx) => (
                  <td key={idx}>
                    {key === "createdAt"
                      ? formatDate(item[key])
                      : key === "destinationPond" && item.destinationPond?.title
                      ? item.destinationPond.title
                      : key === "sourcePond" && item.sourcePond?.title
                      ? item.sourcePond.title
                      : key === "FishStage" && item.FishStage?.title
                      ? item.FishStage.title
                      : item[key] !== null && item[key] !== undefined
                      ? item[key]
                      : "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };



  return (
    <section className={`d-none d-lg-block ${styles.body}`}>
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
            <h4 className="mt-3 mb-5">View All Histories</h4>

            {/* Custom Nav Tabs */}
            <div className="d-flex justify-content-between">
              <div>
                <NavTab>
                  {Object.entries(tabConfig).map(([key, { label }]) => (
                    <a
                      key={key}
                      href={key}
                      className={`tab ${activeTab === key ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab(key);
                        setPagination((prev) => ({
                          ...prev,
                          [key]: { currentPage: 0, totalPages: 0 },
                        })); // Reset pagination when switching tabs
                      }}
                    >
                      {label}
                    </a>
                  ))}
                </NavTab>
              </div>
              <div>
                <Form.Control
                  type="date"
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  value={selectedDate}
                  onChange={handleDateChange} // Handle date change to filter
                />
              </div>
            </div>

            {/* Table or Error/Loader */}
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : error ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="ms-2">{error}</span>
                </Alert>
              </div>
            ) : (
              renderTable()
            )}

            {/* Pagination Controls */}
            {filteredData.length > 0 && pagination[activeTab].totalPages > 1 && (
              <div className="mt-4">
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

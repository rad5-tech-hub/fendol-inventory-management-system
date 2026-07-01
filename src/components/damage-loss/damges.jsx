import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate"; // Import React Paginate
import SideBar from "../shared/sidebar/sidebar";
import Header from "../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './damge.module.scss';
import { BsThreeDotsVertical } from "react-icons/bs";
import { Alert } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import Api from '../shared/api/apiLink';
import { SkeletonTable } from "../shared/skeleton/Skeleton";
import DataTable from "../shared/data-table/DataTable";

export default function DamageLoss() {
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Current page
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const itemsPerPage = 45; // Number of items per page

  useEffect(() => {
    const fetchMoveFishHistory = async () => {
      try {
        const response = await Api.get('/damage-loss');
        setMoveFishHistory(response.data.data); // Assuming the response contains an array of history data
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
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  // Calculate Paginated Data
  const offset = currentPage * itemsPerPage;
  const currentItems = moveFishHistory.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(moveFishHistory.length / itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const columns = [
    { key: 'createdAt', label: 'DATE CREATED', render: (value) => formatDate(value) },
    { key: 'process_from', label: 'POND FROM', render: (value, row) => row.process_from === null ? row.stageTitle_from : '-' },
    { key: 'stageId_from', label: 'PROCESS FROM', render: (value, row) => row.stageId_from === null ? row.stageTitle_from : '-' },
    { key: 'quantity', label: 'QUANTITY' },
    {
      key: 'description', label: 'REMARK',
      render: (value, row) => {
        const displayText = row.stageId_from === null
          ? (value || '').replace('Damage or loss recorded during movement from stage', '').trim()
          : value;
        return (
          <span title={value && value.length > 40 ? value : undefined}>
            {displayText}
          </span>
        );
      },
    },
  ];

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        {/* Sidebar */}
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        {/* Content */}
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <h4 className="mt-3 mb-5">Damage/Loss</h4>

            {/* Table */}
            {loading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonTable rows={5} cols={5} />
              </div>
            ) : error ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} /><span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            ) : moveFishHistory.length === 0 ? (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} /><span className="fw-semibold">No available Damage or loss.</span>
                </Alert>
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={currentItems}
                  emptyMessage="No available Damage or loss."
                  className={styles.styled_table}
                />
                {/* Pagination */}
                <ReactPaginate
                  previousLabel={"<"}
                  nextLabel={">"}
                  pageCount={pageCount}
                  onPageChange={handlePageClick}
                  containerClassName={"pagination justify-content-center mt-4"}
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
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
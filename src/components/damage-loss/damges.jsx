import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate"; // Import React Paginate
import SideBar from "../shared/sidebar/sidebar";
import Header from "../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './damge.module.scss';
import { BsThreeDotsVertical } from "react-icons/bs";
import axios from 'axios';
import { Spinner, Alert } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import Api from '../shared/api/apiLink';

export default function DamageLoss() {
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Current page
  const itemsPerPage = 10; // Number of items per page

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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate Paginated Data
  const offset = currentPage * itemsPerPage;
  const currentItems = moveFishHistory.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(moveFishHistory.length / itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
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
            <h4 className="mt-3 mb-5">Damage/Loss</h4>
            
            {/* Table */}
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
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
                <table className={styles.styled_table}>
                  <thead>
                    <tr>
                      <th>DATE CREATED</th>
                      <th>POND FROM</th>
                      <th>PROCESS FROM</th>
                      <th>QUANTITY</th>
                      <th>REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((history, index) => {
                      const formattedDate = formatDate(history.createdAt);
                      return (
                        <tr key={index}>
                          <td>{formattedDate}</td>
                          <td>{history.process_from === null ? history.stageTitle_from : '-'}</td>
                          <td>{history.stageId_from === null ? history.stageTitle_from : '-'}</td>
                          <td>{history.quantity}</td>
                          <td>
                            {history.stageId_from === null
                              ? history.description.replace(
                                  'Damage or loss recorded during movement from stage',
                                  ''
                                ).trim()
                              : history.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                  activeClassName={"active-light"}
                />
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

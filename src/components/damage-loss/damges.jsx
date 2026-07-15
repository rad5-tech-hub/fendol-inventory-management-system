import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate"; // Import React Paginate
import { useSelector } from 'react-redux';
import SideBar from "../shared/sidebar/sidebar";
import Header from "../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './damge.module.scss';
import { BsThreeDotsVertical } from "react-icons/bs";
import ErrorState from "../shared/error-state/ErrorState";
import EmptyState from "../shared/empty-state/EmptyState";
import Api from '../shared/api/apiLink';
import { SkeletonTable } from "../shared/skeleton/Skeleton";

export default function DamageLoss() {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = user?.userTypes || [];
  const isSuperAdmin = userTypes.includes('super_admin');
  const [moveFishHistory, setMoveFishHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Current page
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const itemsPerPage = 10; // Number of items per page

  useEffect(() => {
    const fetchMoveFishHistory = async () => {
      try {
        const siteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || 'all');
        const response = await Api.get(`/damaged-fish?siteId=${siteId}`);
        setMoveFishHistory(response.data.data); // Assuming the response contains an array of history data
      } catch (error) {
        setError("Error fetching move fish history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMoveFishHistory();
  }, [activeSite?.id, isSuperAdmin, user?.siteId]);

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

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        {/* Content */}
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 className="mt-3 mb-5">Damage/Loss</h4>

              {/* Table */}
              {loading ? (
                <div style={{ padding: "20px 0" }}>
                  <SkeletonTable rows={5} cols={5} />
                </div>
              ) : error ? (
                <ErrorState message={error} />
              ) : moveFishHistory.length === 0 ? (
                <EmptyState title="No available Damage or loss" />
              ) : (
                <div className={styles.tableWrapper}>
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
                            <td
                              title={history.description}
                              style={{
                                cursor:
                                  history.description && history.description.length > 40
                                    ? "pointer"
                                    : "normal",
                              }}
                            >
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
                </div>
              )}
            </div>
            {!loading && !error && moveFishHistory.length > 0 && (
              <div style={{ padding: '12px 0', borderTop: '1px solid #e5e7eb', background: '#f8f9fa' }}>
              <ReactPaginate
                previousLabel={"<"}
                nextLabel={">"}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={"pagination justify-content-center mb-0"}
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
              </div>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../site-management.module.scss';
import { BsExclamationTriangleFill } from "react-icons/bs";
import { Spinner, Alert } from 'react-bootstrap';
import { ApiV2 } from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const typeBadgeStyle = (type) => {
  const map = {
    Hatchery:  { background: '#E3F2FD', color: '#1565C0' },
    Nursery:   { background: '#E8F5E9', color: '#2E7D32' },
    'Grow-out':{ background: '#FFF3E0', color: '#E65100' },
  };
  return map[type] || { background: '#F5F5F5', color: '#2E3135' };
};

const ViewAllSites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchSites = async () => {
    try {
      const response = await ApiV2.get('/v2/all-site');
      if (Array.isArray(response.data.data)) {
        setSites(response.data.data);
      } else {
        throw new Error('Expected an array of sites');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleEdit = (site) => {
    navigate('/site-management/create', { state: { editData: site } });
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const filteredSites = sites.filter(site =>
    (site.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const displayedSites = filteredSites.slice(startIndex, endIndex);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
              <div className="mb-3 mb-md-0">
                <h4 className="mt-3 mb-2">View Sites</h4>
                <div className="d-flex gap-2">
                  <button
                    className={styles.toggleBtnOutline}
                    onClick={() => navigate('/site-management/create')}
                  >
                    Create
                  </button>
                  <button
                    className={styles.toggleBtnActive}
                    disabled
                  >
                    View
                  </button>
                </div>
              </div>
              <div className="w-50 w-md-25">
                <input
                  type="text"
                  className="form-control shadow-none border-secondary"
                  placeholder="Search by Site Name...."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </div>
            </div>

            {loading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}

            {error && (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredSites.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-75 py-5">
                  No sites found.
                </Alert>
              </div>
            )}

            {!loading && !error && displayedSites.length > 0 && (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className={`${styles.styled_table} ${styles.viewSitesTable}`}>
                    <thead>
                      <tr>
                        <th>SITE NAME</th>
                        <th>TYPE</th>
                        <th>ADDRESS</th>
                        <th>MANAGER</th>
                        <th>CONTACT</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSites.map((site) => (
                        <tr key={site.id}>
                          <td>{site.name}</td>
                          <td>
                            <span
                              style={{
                                ...typeBadgeStyle(site.description),
                                padding: '2px 10px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                display: 'inline-block',
                              }}
                            >
                              {site.description}
                            </span>
                          </td>
                          <td>{site.location}</td>
                          <td>
                            {site.manager ? (
                              site.manager
                            ) : (
                              <span style={{ color: '#8C949B', fontStyle: 'italic' }}>Not assigned</span>
                            )}
                          </td>
                          <td>
                            {site.contact ? (
                              site.contact
                            ) : (
                              <span style={{ color: '#8C949B', fontStyle: 'italic' }}>No contact</span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{ color: '#F57C00', cursor: 'pointer', fontWeight: 500 }}
                              onClick={() => handleEdit(site)}
                            >
                              Edit
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"< "}
                    nextLabel={" >"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(filteredSites.length / itemsPerPage)}
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
                    activeClassName={"active-light"}
                  />
                </div>
              </>
            )}
          </main>
        </section>
      </div>
      <ToastContainer />
    </section>
  );
};

export default ViewAllSites;

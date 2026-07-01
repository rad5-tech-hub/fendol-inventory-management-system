import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../site-management.module.scss';
import { BsExclamationTriangleFill } from "react-icons/bs";
import { Alert, Modal } from 'react-bootstrap';
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import { ApiV2 } from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import DataTable from "../../shared/data-table/DataTable";

const typeBadgeStyle = (type) => {
  const map = {
    Hatchery:  { background: '#E3F2FD', color: '#1565C0' },
    Nursery:   { background: '#E8F5E9', color: '#2E7D32' },
    'Grow Out':{ background: '#FFF3E0', color: '#E65100' },
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
  const [selectedSite, setSelectedSite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 45;
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

  const handleRowClick = (site) => {
    setSelectedSite(site);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSite(null);
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

            {loading && <SkeletonTable cols={6} rows={5} />}

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
                <DataTable
                  columns={[
                    { key: 'name', label: 'SITE NAME' },
                    { key: 'type', label: 'TYPE', render: (_, row) => (
                      <span
                        style={{
                          ...typeBadgeStyle(row.type?.name || row.description),
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          display: 'inline-block',
                        }}
                      >
                        {row.type?.name || row.description}
                      </span>
                    )},
                    { key: 'location', label: 'ADDRESS' },
                    { key: 'managers', label: 'MANAGERS', render: (_, row) => (
                      row.userSites?.length > 0 ? (
                        <span>{row.userSites.length} {row.userSites.length === 1 ? 'Admin' : 'Admins'}</span>
                      ) : (
                        <span style={{ color: '#8C949B', fontStyle: 'italic' }}>Not assigned</span>
                      )
                    )},
                    { key: 'contact', label: 'CONTACT', render: (_, row) => (
                      row.userSites?.[0]?.Admin?.email || (
                        <span style={{ color: '#8C949B', fontStyle: 'italic' }}>No contact</span>
                      )
                    )},
                  ]}
                  data={displayedSites}
                  onRowClick={handleRowClick}
                  actions={(site) => (
                    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center' }}>
                      <PortalDropdown
                        btnClass={styles.threeDotBtn}
                        stopPropagation
                        items={[
                          { label: 'Edit', onClick: () => handleEdit(site) },
                        ]}
                      />
                    </div>
                  )}
                />

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
                    activeClassName={"active"}
                  />
                </div>
              </>
            )}
          </main>
        </section>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">{selectedSite?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {selectedSite && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <small className="text-muted d-block">Site Name</small>
                  <span className="fw-medium">{selectedSite.name}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Location</small>
                  <span className="fw-medium">{selectedSite.location || '—'}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Type</small>
                  <span className="fw-medium">{selectedSite.type?.name || selectedSite.description || '—'}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Date Created</small>
                  <span className="fw-medium">
                    {(() => {
                      const d = new Date(selectedSite.createdAt);
                      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    })()}
                  </span>
                </div>
              </div>

              <h6 className="fw-semibold mb-3">Assigned Admins</h6>
              {selectedSite.userSites?.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {selectedSite.userSites.map((us) => (
                    <div key={us.id} className="d-flex align-items-center gap-3 p-2 rounded" style={{ backgroundColor: '#F8F9FA' }}>
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle text-white fw-semibold"
                        style={{ width: '36px', height: '36px', backgroundColor: '#512728', fontSize: '14px', flexShrink: 0 }}
                      >
                        {us.Admin?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="fw-medium" style={{ fontSize: '14px' }}>{us.Admin?.fullName}</div>
                        <small className="text-muted">{us.Admin?.email}</small>
                        {us.Admin?.roles?.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {us.Admin.roles.map((role) => (
                              <span
                                key={role.id}
                                style={{
                                  backgroundColor: '#EDE0E0',
                                  color: '#512728',
                                  padding: '1px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.72rem',
                                  fontWeight: 500,
                                }}
                              >
                                {role.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted fst-italic mb-0">No admins assigned to this site.</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <div className="d-flex justify-content-end gap-2 w-100">
            <button className={styles.toggleBtnOutline} onClick={handleCloseModal}>Close</button>
            <button
              className={`border-0 text-white shadow py-2 px-4 fs-6 fw-semibold ${styles.submit}`}
              style={{ borderRadius: '50px', fontSize: '14px' }}
              onClick={() => {
                handleCloseModal();
                navigate('/site-management/create', { state: { editData: selectedSite } });
              }}
            >
              Edit Site
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </section>
  );
};

export default ViewAllSites;

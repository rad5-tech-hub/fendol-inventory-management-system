import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../admin-styles.module.scss';
import { BsExclamationTriangleFill} from "react-icons/bs";
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Spinner, Alert, Form } from 'react-bootstrap';
import { FaTrashAlt, FaUserPlus, FaFilter, FaEdit } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const avatarColors = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47'];

const getInitials = (name) => {
  const parts = (name || '').split(' ');
  return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
};

const formatRole = (role) => {
  return (role || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  const d  = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yr = date.getFullYear();
  const h  = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${mo}/${yr} ${h}:${mi}`;
};

export default function ViewAll() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [adminsPerPage] = useState(10);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filterSite, setFilterSite] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await Api.get('/admins');
      console.log('API Response:', response);
      if (Array.isArray(response.data.data)) {
        setAdmins(response.data.data);
      } else {
        throw new Error("Expected an array of admins");
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setUserRole(sessionStorage.getItem('role'));
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'super_admin') return;
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        setSites(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Failed to fetch sites:', err.response?.data || err.message);
      }
    };
    fetchSites();
  }, []);

  const handleDelete = async (adminId) => {
    const loadingToast = toast.loading("Deleting Admin...", { className: 'dark-toast' });
    if (window.confirm("Are you sure you want to delete this Admin?")) {
      try {
        await Api.delete(`/delete-admin/${adminId}`);
        toast.update(loadingToast, {
          render: "Admin deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
        fetchData();
      } catch (error) {
        toast.update(loadingToast, {
          render: "Failed to delete Admin. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      }
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const filteredAdmins = filterSite
    ? admins.filter(admin => admin.UserSites?.some(us => us.siteId === filterSite))
    : admins;

  const offset = currentPage * adminsPerPage;
  const displayAdmins = filteredAdmins.slice(offset, offset + adminsPerPage);

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

        <section className={`${styles.content}`}>
          <main>
            <ToastContainer />

            <div className={styles.pageHeader}>
              <h4 className={styles.pageTitle}>All Admins</h4>
              <div className={styles.headerActions}>
                <button type="button" className={styles.navBtnActive} onClick={() => navigate('/admin/add-new-admin')}>
                  <FaUserPlus style={{ marginRight: '6px' }} /> Create New Admin
                </button>
              </div>
            </div>

            {userRole === 'super_admin' && (
              <div className={styles.filterBar}>
                <Form.Select
                  className={styles.siteSelect}
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                >
                  <option value="">All Sites</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </Form.Select>
                <button type="button" className={styles.filterBtn}>
                  <FaFilter /> Filter
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : error ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            ) : admins.length === 0 ? (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">No available data</span>
                </Alert>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Full Name</th>
                        <th>E-mail Address</th>
                        <th>Role</th>
                        <th>Assigned Site</th>
                        <th>Date Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAdmins.map((admin, index) => (
                        <tr key={admin.id}>
                          <td>
                            <div className={styles.nameCell}>
                              <div
                                className={styles.avatar}
                                style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                              >
                                {getInitials(admin.fullName).toUpperCase()}
                              </div>
                              {admin.fullName}
                            </div>
                          </td>
                          <td>{admin.email}</td>
                          <td>{formatRole(admin.roleRef?.name || admin.role)}</td>
                          <td>{admin.UserSites?.length ? admin.UserSites.map(us => us.Site?.name).filter(Boolean).join(', ') : '-'}</td>
                          <td>{formatDate(admin.createdAt)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <FaEdit
                                style={{ cursor: 'pointer', color: '#512728' }}
                                title="Edit Admin"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/admin/add-new-admin', {
                                      state: {
                                        isEdit: true,
                                        adminData: {
                                          id: admin.id,
                                          fullName: admin.fullName,
                                          email: admin.email,
                                          role: admin.role,
                                          roleId: admin.roleRef?.id || admin.roleId || '',
                                          UserSites: admin.UserSites || [],
                                        }
                                      }
                                    });
                                  }}
                              />
                              <FaTrashAlt
                                style={{ cursor: 'pointer', color: '#dc3545' }}
                                title="Delete Admin"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(admin.id);
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.tableFooter}>
                  <small className="text-muted">
                    Showing {offset + 1} to {Math.min(offset + adminsPerPage, filteredAdmins.length)} of {filteredAdmins.length} admins
                  </small>
                  <ReactPaginate
                    previousLabel={"← Previous"}
                    nextLabel={"Next →"}
                    breakLabel="..."
                    pageCount={Math.ceil(filteredAdmins.length / adminsPerPage)}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={2}
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
                    activeClassName={"active-light"}
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

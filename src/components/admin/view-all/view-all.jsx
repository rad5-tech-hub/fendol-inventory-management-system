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
import { Spinner, Alert, Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash, FaTrashAlt, FaUserPlus, FaFilter, FaEdit } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const avatarColors = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47'];

const getInitials = (name) => {
  const parts = (name || '').split(' ');
  return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
};

const formatRole = (role) => {
  return (role || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

export default function ViewAll() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [adminsPerPage] = useState(10);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filterSite, setFilterSite] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [roles, setRoles] = useState([]);
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
    if (!showModal) return;
    const fetchRoles = async () => {
      try {
        const res = await ApiV2.get('/v2/roles');
        setRoles(Array.isArray(res.data?.roles) ? res.data.roles : []);
      } catch (err) {
        console.error('Failed to fetch roles:', err.response?.data || err.message);
      }
    };
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        setSites(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Failed to fetch sites:', err.response?.data || err.message);
      }
    };
    fetchRoles();
    fetchSites();
  }, [showModal]);

  const handleEdit = (admin) => {
    setSelectedAdmin({
      ...admin,
      roleId: admin.roleRef?.id || admin.roleId || '',
      siteIds: admin.UserSites?.map(us => us.siteId) || [],
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedAdmin({
      ...selectedAdmin,
      [name]: value,
    });
  };

  const handleSiteToggle = (siteId) => {
    setSelectedAdmin(prev => ({
      ...prev,
      siteIds: prev.siteIds?.includes(siteId)
        ? prev.siteIds.filter(id => id !== siteId)
        : [...(prev.siteIds || []), siteId]
    }));
  };

  const handleSave = async () => {
    setLoadingEdit(true);
    const loadingToast = toast.loading("Saving Admin...", { className: 'dark-toast' });
    try {
      const payload = {
        fullName: selectedAdmin.fullName,
        email: selectedAdmin.email,
      };
      if (selectedAdmin.password) payload.password = selectedAdmin.password;
      if (userRole === 'super_admin') {
        if (selectedAdmin.roleId) payload.roleId = selectedAdmin.roleId;
        payload.siteIds = selectedAdmin.siteIds || [];
      }
      await ApiV2.patch(`/api/v1/edit-admin/${selectedAdmin.id}`, payload);
      toast.update(loadingToast, {
        render: "Admin updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Failed to save admin. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 6000,
        className: 'dark-toast'
      });
    }
    finally {
      setLoadingEdit(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
    ? admins.filter(admin => admin.UserSites?.some(us => (us.Site?.name || '').toLowerCase() === filterSite.toLowerCase()))
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

            <div className={styles.filterBar}>
              <Form.Select
                className={styles.siteSelect}
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
              >
                <option value="">All Sites</option>
              </Form.Select>
              <button type="button" className={styles.filterBtn}>
                <FaFilter /> Filter
              </button>
            </div>

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
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAdmins.map((admin, index) => (
                        <tr key={admin.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(admin)}>
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
                          <td>
                            <span className={admin.deletedAt === null ? styles.statusActive : styles.statusInactive}>
                              {admin.deletedAt === null ? 'Active' : 'Inactive'}
                            </span>
                          </td>
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
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-semibold">Edit Admin</Modal.Title>
            </Modal.Header>
            <Modal.Body className="border-0 pt-5">
              {selectedAdmin && (
                <Form>
                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Full Name</Form.Label>
                    <div className="col-8">
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={selectedAdmin.fullName}
                        onChange={handleInputChange}
                        className="py-2 shadow-none border-secondary-subtle border-1"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Email</Form.Label>
                    <div className="col-8">
                      <Form.Control
                        type="email"
                        name="email"
                        value={selectedAdmin.email}
                        onChange={handleInputChange}
                        className="py-2 shadow-none border-secondary-subtle border-1"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3 row">
                    <Form.Label className="col-4 fw-semibold">Password</Form.Label>
                    <div className="col-8">
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter new password"
                          onChange={handleInputChange}
                          className={`py-2 shadow-none border-secondary-subtle border-1 border-end-0 ${styles.fadedPlaceholder}`}
                        />
                        <InputGroup.Text
                          onClick={togglePasswordVisibility}
                          className="bg-light-subtle shadow-none border-secondary-subtle border-1 border-start-0"
                          style={{ cursor: "pointer" }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </InputGroup.Text>
                      </InputGroup>
                    </div>
                  </Form.Group>

                  {userRole === 'super_admin' && (
                    <Form.Group className="mb-3 row">
                      <Form.Label className="col-4 fw-semibold">Permission Level</Form.Label>
                      <div className="col-8">
                        <Form.Select
                          name="roleId"
                          value={selectedAdmin.roleId || ''}
                          onChange={handleInputChange}
                          className="py-2 shadow-none border-secondary-subtle border-1"
                        >
                          <option value="" disabled>Select Role</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </Form.Group>
                  )}
                  {userRole === 'super_admin' && (
                    <Form.Group className="mb-3 row">
                      <Form.Label className="col-4 fw-semibold">Assign Sites</Form.Label>
                      <div className="col-8">
                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px 12px' }}>
                          {sites.length === 0 && <small className="text-muted">No sites available</small>}
                          {sites.map((site) => (
                            <Form.Check
                              key={site.id}
                              type="checkbox"
                              id={`modal-site-${site.id}`}
                              label={site.name}
                              checked={selectedAdmin.siteIds?.includes(site.id)}
                              onChange={() => handleSiteToggle(site.id)}
                              className="mb-1"
                            />
                          ))}
                        </div>
                      </div>
                    </Form.Group>
                  )}
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 mt-5" style={{ height: '200px' }}>
              <Button variant="dark" disabled={loadingEdit} className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`} onClick={handleSave}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>
        </section>
      </div>
    </section>
  );
}

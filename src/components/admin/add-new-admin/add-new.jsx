import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../admin-styles.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import { FaUserPlus } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { useNavigate, useLocation } from 'react-router-dom';

const AddNew = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const editState = location.state || {};
  const isEdit = editState.isEdit === true;
  const adminToEdit = editState.adminData || null;
  const [loader, setLoader] = useState(false);
  const [formData, setFormData] = useState({
    fullName: adminToEdit?.fullName || '',
    email: adminToEdit?.email || '',
    siteIds: [],
    roleId: adminToEdit?.roleId || ''
  });
  const [editId] = useState(adminToEdit?.id || null);
  const [roles, setRoles] = useState([]);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await ApiV2.get('/v2/roles');
        setRoles(Array.isArray(res.data?.roles) ? res.data.roles : []);
      } catch (err) {
        console.error('Failed to fetch roles:', err.response?.data || err.message);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSiteToggle = (siteId) => {
    setFormData(prev => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId)
        ? prev.siteIds.filter(id => id !== siteId)
        : [...prev.siteIds, siteId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const loadingToast = toast.loading(
      isEdit ? "Updating Admin..." : "Creating New Admin..",
      { className: 'dark-toast' }
    );
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        siteIds: formData.siteIds,
        roleId: formData.roleId
      };
      const response = isEdit
        ? await ApiV2.patch(`/api/v1/edit-admin/${editId}`, payload)
        : await ApiV2.post('/api/v1/admin', payload);
      const { message } = response.data || {};

      if (!isEdit) {
        setFormData({ fullName: '', email: '', siteIds: [], roleId: '' });
      }

      toast.update(loadingToast, {
        render: message || (isEdit ? "Admin updated successfully!" : "Created Admin successfully!"),
        type: "success",
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast'
      });

      setTimeout(() => {
        navigate('/admin/view-all');
      }, 4500);
    } catch (error) {
      console.error("Error creating admin:", error);
      const errorMessage = error.response?.data?.message || (isEdit ? "Error updating admin. Please try again." : "Error creating admin. Please try again.");
      toast.update(loadingToast, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 6000,
        className: 'dark-toast'
      });
    } finally {
      setLoader(false);
    }
  };

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
            <Form onSubmit={handleSubmit}>
              <div className={styles.pageHeader}>
                <div>
                  <h4 className={styles.pageTitle}>{isEdit ? 'Edit Admin' : 'Create Admin'}</h4>
                  <p className={styles.pageSubtitle}>{isEdit ? 'Update the details for this administrator.' : 'Provision a new administrator with specific site permissions and roles.'}</p>
                </div>
                <div className={styles.headerActions}>
                  <button type="button" className={styles.navBtnActive}>{isEdit ? 'Edit Admin' : 'Create New'}</button>
                  <button type="button" className={styles.navBtnOutline} onClick={() => navigate('/admin/view-all')}>View All Admins</button>
                </div>
              </div>

              <Row xxl={2} xl={2} lg={2} md={1} sm={1} xs={1}>
                <Col className="mb-4">
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span>Identity Details</span>
                      <FaUserPlus className={styles.cardHeaderIcon} />
                    </div>
                    <hr className={styles.cardDivider} />
                    <Row>
                      <Col sm={6} className="mb-3">
                        <Form.Label className="fw-semibold">Full Name</Form.Label>
                        <Form.Control
                          placeholder="e.g. John Doe"
                          className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </Col>
                      <Col sm={6} className="mb-3">
                        <Form.Label className="fw-semibold">E-mail Address</Form.Label>
                        <Form.Control
                          placeholder="john.doe@fendol.com"
                          className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col className="mb-4">
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span>Access Control</span>
                    </div>
                    <hr className={styles.cardDivider} />
                    <Form.Label className="fw-semibold">Permission Level</Form.Label>
                    <Form.Select
                      className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </Form.Select>

                    <Form.Label className="fw-semibold mt-4">Assign Sites</Form.Label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px 12px' }}>
                      {sites.length === 0 && <small className="text-muted">No sites available</small>}
                      {sites.map((site) => (
                        <Form.Check
                          key={site.id}
                          type="checkbox"
                          id={`site-${site.id}`}
                          label={site.name}
                          checked={formData.siteIds.includes(site.id)}
                          onChange={() => handleSiteToggle(site.id)}
                          className="mb-1"
                        />
                      ))}
                    </div>

                    <div className={styles.securityNote}>
                      <div className={styles.securityNoteTitle}>Security Note</div>
                      <p className={styles.securityNoteText}>Creating a new admin grants access to sensitive farm data. Ensure the user has completed necessary security training.</p>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => navigate('/admin/view-all')}>Cancel</button>
                <Button
                  className={`border-0 btn-dark shadow py-2 px-5 fw-semibold ${styles.submit}`}
                  disabled={loader}
                  type="submit"
                >
                  {loader ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Admin' : 'Create Admin')}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
    </section>
  );
};

export default AddNew;

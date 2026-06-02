import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Modal, Alert } from 'react-bootstrap';
import styles from '../admin-styles.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import { FaUserPlus, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const createdEmailRef = React.useRef('');

  // Error and field validation states
  const [fieldErrors, setFieldErrors] = useState({});
  const [dataLoadingErrors, setDataLoadingErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: adminToEdit?.fullName || '',
    email: adminToEdit?.email || '',
    siteIds: [],
    roleIds: adminToEdit?.roleIds || (adminToEdit?.roleId ? [adminToEdit.roleId] : [])
  });
  const [editId] = useState(adminToEdit?.id || null);
  const [roles, setRoles] = useState([]);
  const [sites, setSites] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const res = await ApiV2.get('/v2/roles');

        if (!res.data) {
          throw new Error('Invalid response format from server');
        }

        const rolesData = Array.isArray(res.data?.roles) ? res.data.roles : [];
        if (rolesData.length === 0) {
          setDataLoadingErrors(prev => ({
            ...prev,
            roles: 'No roles available. Please contact administrator.'
          }));
          toast.warning(
            '⚠️ No roles available in the system. Please contact your administrator.',
            {
              className: 'dark-toast',
              autoClose: 5000,
              icon: <FaExclamationTriangle />
            }
          );
        } else {
          setDataLoadingErrors(prev => ({ ...prev, roles: null }));
        }

        setRoles(rolesData);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load roles';
        setDataLoadingErrors(prev => ({
          ...prev,
          roles: `Error loading roles: ${errorMsg}`
        }));

        toast.error(
          `❌ Failed to load roles: ${errorMsg}`,
          {
            className: 'dark-toast',
            autoClose: 6000,
            icon: <FaExclamationTriangle />
          }
        );
        console.error('Failed to fetch roles:', err);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setSitesLoading(true);
        const res = await ApiV2.get('/v2/all-site');

        if (!res.data) {
          throw new Error('Invalid response format from server');
        }

        const sitesData = Array.isArray(res.data?.data) ? res.data.data : [];
        if (sitesData.length === 0) {
          setDataLoadingErrors(prev => ({
            ...prev,
            sites: 'No sites available. Please create at least one site first.'
          }));
          toast.warning(
            '⚠️ No sites available in the system. Please create a site first.',
            {
              className: 'dark-toast',
              autoClose: 5000,
              icon: <FaInfoCircle />
            }
          );
        } else {
          setDataLoadingErrors(prev => ({ ...prev, sites: null }));
        }

        setSites(sitesData);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load sites';
        setDataLoadingErrors(prev => ({
          ...prev,
          sites: `Error loading sites: ${errorMsg}`
        }));

        toast.error(
          `❌ Failed to load sites: ${errorMsg}`,
          {
            className: 'dark-toast',
            autoClose: 6000,
            icon: <FaExclamationTriangle />
          }
        );
        console.error('Failed to fetch sites:', err);
      } finally {
        setSitesLoading(false);
      }
    };
    fetchSites();
  }, []);

  // Validation helper functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email address is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., name@example.com)';
    }
    if (email.length > 100) {
      return 'Email address must not exceed 100 characters';
    }
    return null;
  };

  const validateFullName = (fullName) => {
    if (!fullName.trim()) {
      return 'Full name is required';
    }
    if (fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    if (fullName.length > 100) {
      return 'Full name must not exceed 100 characters';
    }
    if (!/^[a-zA-Z\s\-\']+$/.test(fullName)) {
      return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};

    // Validate full name
    const nameError = validateFullName(formData.fullName);
    if (nameError) errors.fullName = nameError;

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    // Validate roles
    if (formData.roleIds.length === 0) {
      errors.roles = 'Please select at least one role';
    }

    // Validate sites (not required but warn)
    if (formData.siteIds.length === 0 && sites.length > 0) {
      errors.sitesWarning = 'No sites assigned. Admin will not have access to any site data.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    if (name === 'fullName') {
      const error = validateFullName(value);
      setFieldErrors(prev => ({
        ...prev,
        fullName: error || undefined
      }));
    } else if (name === 'email') {
      const error = validateEmail(value);
      setFieldErrors(prev => ({
        ...prev,
        email: error || undefined
      }));
    }
  };

  const handleSiteToggle = (siteId) => {
    setFormData(prev => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId)
        ? prev.siteIds.filter(id => id !== siteId)
        : [...prev.siteIds, siteId]
    }));
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Perform comprehensive validation
    if (!validateForm()) {
      // Show first error found to user
      const firstError = Object.values(fieldErrors).find(err => err && !err.includes('Warning'));
      if (firstError) {
        toast.error(`⚠️ ${firstError}`, {
          className: 'dark-toast',
          autoClose: 5000,
          icon: <FaExclamationTriangle />
        });
      }
      return;
    }

    setLoader(true);

    const loadingToast = toast.loading(
      isEdit ? "⏳ Updating Admin..." : "⏳ Creating New Admin...",
      { className: 'dark-toast' }
    );

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        siteIds: formData.siteIds,
        roleIds: formData.roleIds
      };

      // Validate payload before sending
      if (!payload.fullName || !payload.email) {
        throw new Error('Form data is incomplete. Please check all required fields.');
      }

      const response = isEdit
        ? await ApiV2.patch(`/api/v1/edit-admin/${editId}`, payload)
        : await ApiV2.post('/api/v1/admin', payload);

      const { message, data } = response.data || {};

      if (!isEdit) {
        createdEmailRef.current = formData.email;
        setFormData({ fullName: '', email: '', siteIds: [], roleIds: [] });
        setFieldErrors({});
      }

      toast.update(loadingToast, {
        render: `✅ ${message || (isEdit ? "Admin updated successfully!" : "Admin created successfully!")}`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast',
        icon: <FaCheckCircle />
      });

      if (!isEdit) {
        setShowSuccessModal(true);
      } else {
        setTimeout(() => {
          navigate('/admin/view-all');
        }, 4500);
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorDetails = '';

      // Handle different error types
      if (error.response) {
        const status = error.response.status;
        const serverError = error.response.data;

        switch (status) {
          case 400:
            // Bad Request - validation error from server
            errorMessage = serverError?.message || 'Invalid form data. Please check all fields and try again.';
            errorDetails = serverError?.details || serverError?.errors || '';
            break;
          case 409:
            // Conflict - usually email already exists
            if (serverError?.message?.toLowerCase().includes('email')) {
              errorMessage = '📧 This email address is already registered in the system.';
              errorDetails = 'Please use a different email address.';
            } else {
              errorMessage = serverError?.message || 'This admin already exists in the system.';
            }
            break;
          case 401:
            // Unauthorized
            errorMessage = '🔐 Your session has expired. Please log in again.';
            setTimeout(() => navigate('/'), 3000);
            break;
          case 403:
            // Forbidden
            errorMessage = '🚫 You do not have permission to perform this action.';
            errorDetails = 'Contact your administrator if you believe this is a mistake.';
            break;
          case 404:
            // Not Found
            errorMessage = '❌ The requested resource was not found.';
            errorDetails = isEdit ? 'The admin you are trying to edit no longer exists.' : 'A required resource (role or site) was not found.';
            break;
          case 422:
            // Unprocessable Entity
            errorMessage = '⚠️ Unable to process your request. Please check the data and try again.';
            errorDetails = serverError?.message || serverError?.errors || '';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = '🔧 Server error. Please try again later.';
            errorDetails = 'Our team has been notified. If the problem persists, please contact support.';
            break;
          default:
            errorMessage = serverError?.message || (isEdit ? "Error updating admin. Please try again." : "Error creating admin. Please try again.");
            break;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = '🌐 Network error. Please check your connection.';
        errorDetails = 'Unable to reach the server. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error("Error creating/updating admin:", error);

      // Update toast with detailed error
      toast.update(loadingToast, {
        render: (
          <div>
            <strong>{errorMessage}</strong>
            {errorDetails && <div style={{ fontSize: '0.85em', marginTop: '8px', opacity: 0.9 }}>{errorDetails}</div>}
          </div>
        ),
        type: "error",
        isLoading: false,
        autoClose: 8000,
        className: 'dark-toast',
        icon: <FaExclamationTriangle />
      });

      // Show detailed validation errors if available
      if (typeof errorDetails === 'object') {
        Object.entries(errorDetails).forEach(([field, message]) => {
          console.error(`${field}: ${message}`);
        });
      }
    } finally {
      setLoader(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/admin/view-all');
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
                        <Form.Label className="fw-semibold">
                          Full Name <span style={{ color: 'red' }}>*</span>
                        </Form.Label>
                        <Form.Control
                          placeholder="e.g. John Doe"
                          className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder} ${fieldErrors.fullName ? 'is-invalid' : ''}`}
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          disabled={loader}
                          isInvalid={!!fieldErrors.fullName}
                        />
                        {fieldErrors.fullName && (
                          <Form.Control.Feedback type="invalid" style={{ display: 'block', marginTop: '4px' }}>
                            <FaExclamationTriangle style={{ marginRight: '4px' }} />
                            {fieldErrors.fullName}
                          </Form.Control.Feedback>
                        )}
                        {!fieldErrors.fullName && formData.fullName && (
                          <small style={{ color: '#28a745', display: 'block', marginTop: '4px' }}>
                            ✓ Name looks good
                          </small>
                        )}
                      </Col>
                      <Col sm={6} className="mb-3">
                        <Form.Label className="fw-semibold">
                          E-mail Address <span style={{ color: 'red' }}>*</span>
                        </Form.Label>
                        <Form.Control
                          placeholder="john.doe@fendol.com"
                          className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} ${styles.fadedPlaceholder} ${fieldErrors.email ? 'is-invalid' : ''}`}
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled={loader}
                          isInvalid={!!fieldErrors.email}
                        />
                        {fieldErrors.email && (
                          <Form.Control.Feedback type="invalid" style={{ display: 'block', marginTop: '4px' }}>
                            <FaExclamationTriangle style={{ marginRight: '4px' }} />
                            {fieldErrors.email}
                          </Form.Control.Feedback>
                        )}
                        {!fieldErrors.email && formData.email && (
                          <small style={{ color: '#28a745', display: 'block', marginTop: '4px' }}>
                            ✓ Email is valid
                          </small>
                        )}
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

                    {/* Data Loading Errors */}
                    {dataLoadingErrors.roles && (
                      <Alert variant="danger" className="d-flex align-items-center mb-3" style={{ gap: '10px' }}>
                        <FaExclamationTriangle />
                        <div>
                          <strong>Roles Error:</strong>
                          <div style={{ fontSize: '0.9em' }}>{dataLoadingErrors.roles}</div>
                        </div>
                      </Alert>
                    )}

                    <Form.Label className="fw-semibold">
                      Permission Level <span style={{ color: 'red' }}>*</span>
                    </Form.Label>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: fieldErrors.roles ? '2px solid #dc3545' : '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      backgroundColor: rolesLoading ? '#f5f5f5' : 'white'
                    }}>
                      {rolesLoading && (
                        <small className="text-muted">
                          ⏳ Loading roles...
                        </small>
                      )}
                      {!rolesLoading && roles.length === 0 && (
                        <small className="text-danger">
                          ❌ No roles available. {dataLoadingErrors.roles ? 'Please refresh the page.' : 'Contact administrator.'}
                        </small>
                      )}
                      {!rolesLoading && roles.length > 0 && roles.map((r) => (
                        <Form.Check
                          key={r.id}
                          type="checkbox"
                          id={`role-${r.id}`}
                          label={r.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          checked={formData.roleIds.includes(r.id)}
                          onChange={() => {
                            handleRoleToggle(r.id);
                            setFieldErrors(prev => ({ ...prev, roles: undefined }));
                          }}
                          className="mb-1"
                          disabled={loader}
                        />
                      ))}
                    </div>
                    {fieldErrors.roles && (
                      <small style={{ color: '#dc3545', display: 'block', marginTop: '6px' }}>
                        <FaExclamationTriangle style={{ marginRight: '4px' }} />
                        {fieldErrors.roles}
                      </small>
                    )}

                    {/* Sites Section */}
                    {dataLoadingErrors.sites && (
                      <Alert variant="warning" className="d-flex align-items-center mt-4 mb-3" style={{ gap: '10px' }}>
                        <FaInfoCircle />
                        <div>
                          <strong>Sites Error:</strong>
                          <div style={{ fontSize: '0.9em' }}>{dataLoadingErrors.sites}</div>
                        </div>
                      </Alert>
                    )}

                    <Form.Label className="fw-semibold mt-4">
                      Assign Sites {!isEdit && <span style={{ color: '#ffc107' }}>(Optional)</span>}
                    </Form.Label>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      backgroundColor: sitesLoading ? '#f5f5f5' : 'white'
                    }}>
                      {sitesLoading && (
                        <small className="text-muted">
                          ⏳ Loading sites...
                        </small>
                      )}
                      {!sitesLoading && sites.length === 0 && (
                        <small className="text-warning">
                          ⚠️ No sites available. {dataLoadingErrors.sites ? 'Please create a site first.' : 'Contact administrator.'}
                        </small>
                      )}
                      {!sitesLoading && sites.length > 0 && sites.map((site) => (
                        <Form.Check
                          key={site.id}
                          type="checkbox"
                          id={`site-${site.id}`}
                          label={site.name}
                          checked={formData.siteIds.includes(site.id)}
                          onChange={() => {
                            handleSiteToggle(site.id);
                            setFieldErrors(prev => ({ ...prev, sitesWarning: undefined }));
                          }}
                          className="mb-1"
                          disabled={loader}
                        />
                      ))}
                    </div>
                    {fieldErrors.sitesWarning && (
                      <small style={{ color: '#ffc107', display: 'block', marginTop: '6px' }}>
                        <FaInfoCircle style={{ marginRight: '4px' }} />
                        {fieldErrors.sitesWarning}
                      </small>
                    )}

                    <div className={styles.securityNote}>
                      <div className={styles.securityNoteTitle}>🔒 Security Note</div>
                      <p className={styles.securityNoteText}>Creating a new admin grants access to sensitive farm data. Ensure the user has completed necessary security training. The temporary password expires after first login.</p>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className={styles.formFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => navigate('/admin/view-all')}
                  disabled={loader}
                >
                  Cancel
                </button>
                <Button
                  className={`border-0 btn-dark shadow py-2 px-5 fw-semibold ${styles.submit}`}
                  disabled={loader || rolesLoading || sitesLoading || roles.length === 0}
                  type="submit"
                  title={roles.length === 0 ? "Waiting for roles to load..." : ""}
                >
                  {loader ? (isEdit ? '⏳ Updating...' : '⏳ Creating...') : (isEdit ? '✏️ Update Admin' : '➕ Create Admin')}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>

      <Modal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        centered
        backdrop={true}
      >
        <Modal.Header className={styles.successModalHeader}>
          <Modal.Title className={styles.successModalTitle}>
            ✅ Account Created Successfully
          </Modal.Title>
          <button
            className={styles.successModalClose}
            onClick={handleSuccessModalClose}
            aria-label="Close"
          >
            ✕
          </button>
        </Modal.Header>

        <Modal.Body className={styles.successModalBody}>
          <div className={styles.successModalIcon}>
            ✉️
          </div>

          <h5 className={styles.successModalHeading}>
            Check Your Email
          </h5>

          <p className={styles.successModalText}>
            The admin account has been created successfully.
          </p>
          <p className={styles.successModalText}>
            A temporary password has been sent to{' '}
            <span className={styles.successModalEmail}>
              {createdEmailRef.current || 'the registered email address'}
            </span>
            . The new admin should check their inbox and log in using
            that password.
          </p>

          <div className={styles.successModalNote}>
            <strong>📋 What Happens Next:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>New admin receives login credentials email</li>
              <li>First login requires password change</li>
              <li>Admin gains access to assigned sites and roles</li>
              <li>Account is immediately active</li>
            </ul>
          </div>
        </Modal.Body>

        <Modal.Footer className={styles.successModalFooter}>
          <button
            className={styles.successModalBtn}
            onClick={handleSuccessModalClose}
          >
            Got it, View Admins
          </button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default AddNew;

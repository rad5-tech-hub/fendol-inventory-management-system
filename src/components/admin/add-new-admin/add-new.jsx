import React, { useState } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import styles from '../admin-styles.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUserPlus, FaMapMarkerAlt } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';

const AddNew = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: ""
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const loadingToast = toast.loading("Creating New Admin..", { className: 'dark-toast' });
    try {
      const response = await Api.post('/admin', formData);
      const { message } = response.data;

      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: ""
      });

      toast.update(loadingToast, {
        render: message || "Created Admin successfully!",
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
      const errorMessage = error.response?.data?.message || "Error creating admin. Please try again.";
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
                  <h4 className={styles.pageTitle}>Create Admin</h4>
                  <p className={styles.pageSubtitle}>Provision a new administrator with specific site permissions and roles.</p>
                </div>
                <div className={styles.headerActions}>
                  <button type="button" className={styles.navBtnActive}>Create New</button>
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
                    <Form.Label className="fw-semibold">Temporary Password</Form.Label>
                    <InputGroup className="mb-2">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        className={`py-2 bg-light-subtle shadow-none border-1 border-end-0 ${styles.inputs} ${styles.fadedPlaceholder}`}
                        placeholder="Enter Password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength={7}
                        maxLength={10}
                        required
                      />
                      <InputGroup.Text
                        onClick={togglePasswordVisibility}
                        className={`py-2 bg-light-subtle shadow-none border-1 border-start-0 ${styles.inputs}`}
                        style={{ cursor: "pointer" }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </InputGroup.Text>
                    </InputGroup>
                    <small className="text-muted">The user will be prompted to change this upon first login.</small>
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
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="sales_manager">Sales Manager</option>
                    </Form.Select>

                    <Form.Label className="fw-semibold mt-4">Assign Site</Form.Label>
                    <div className={styles.siteField}>
                      <div className={styles.siteFieldLeft}>
                        <FaMapMarkerAlt />
                        <span>Search farm site...</span>
                      </div>
                      <IoChevronDown />
                    </div>
                    <div className={styles.sitePill}>
                      Main Hatchery <span style={{ cursor: "pointer", marginLeft: "4px" }}>&times;</span>
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
                  {loader ? 'Creating...' : 'Create Admin'}
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

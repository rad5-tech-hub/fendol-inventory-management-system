import React, { useState, useEffect, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Dropdown, ButtonGroup, Button, Navbar, Modal, Spinner, InputGroup } from "react-bootstrap";
import { FiDownload } from "react-icons/fi";
import { FaBars, FaEye, FaEyeSlash, FaChevronDown, FaMapMarkerAlt, FaGlobeAmericas, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Logo from "../../../assests/logo.png";
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { setActiveSite } from '../reduxForProtectingRoute/actions/authActions';
import styles from "./header.module.scss";

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // State for notification dropdown
  const [notifications, setNotifications] = useState([]); // State for fetched notifications
  const [loading, setLoading] = useState(false); // Loading state for fetch
  const notificationRef = useRef(null); // Ref to handle click outside
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const dispatch = useDispatch();
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = userTypes.includes('super_admin');

  const [siteOptions, setSiteOptions] = useState([]);
  const [siteLoading, setSiteLoading] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const siteDropdownRef = useRef(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    const fetchSites = async () => {
      setSiteLoading(true);
      try {
        const res = await ApiV2.get('/v2/all-site');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setSiteOptions(data);
      } catch {
        if (!cancelled) setSiteOptions([]);
      } finally {
        if (!cancelled) setSiteLoading(false);
      }
    };
    fetchSites();
    return () => { cancelled = true; };
  }, [isSuperAdmin]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(e.target)) {
        setShowSiteDropdown(false);
      }
    };
    if (showSiteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSiteDropdown]);

  const handleSiteSelect = useCallback((site) => {
    dispatch(setActiveSite(site));
    setShowSiteDropdown(false);
  }, [dispatch]);

  const token = sessionStorage.getItem('authToken');
  let userName = '';
  try {
    const decoded = jwtDecode(token);
    const primaryRole = sessionStorage.getItem('primaryRole');
    userName = decoded?.name || decoded?.fullName || decoded?.email || (primaryRole ? primaryRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '') || 'User';
  } catch {
    const primaryRole = sessionStorage.getItem('primaryRole');
    userName = primaryRole ? primaryRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'User';
  }
  const userInitial = userName.charAt(0).toUpperCase();

  // Handle PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log("beforeinstallprompt event fired");
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Fetch notifications when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await Api.get('/notifications'); // Adjust endpoint as needed
        if (Array.isArray(response.data.data)) {
          setNotifications(response.data.data);
        } else {
          console.error("Expected an array of notifications");
          setNotifications([]);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  // Format timestamp (e.g., "2023-10-15T12:00:00Z" to "15/10/2023 12:00")
  const formatDateTime = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('Please fill in both password fields.', { className: 'dark-toast' });
      return;
    }
    setChangePwLoading(true);
    const loadingToast = toast.loading('Changing password...', { className: 'dark-toast' });
    try {
      await ApiV2.patch('/api/v1/admin/change-password', {
        oldPassword,
        newPassword,
      });
      toast.dismiss(loadingToast);
      toast.success('Password changed successfully!', { className: 'dark-toast', autoClose: 3000 });
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const msg = err.response?.data?.response_message || err.response?.data?.message || 'Failed to change password.';
      toast.update(loadingToast, {
        render: msg,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast',
      });
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <header>
      <div className={`shadow-sm sticky-top py-1 ${styles.header}`}>
        <Row className="align-items-center g-0 px-3">
          {/* Logo Section */}
          <Col xs={6} lg={8} className={`d-flex align-items-center text-start ${styles.brand}`}>
            <Navbar.Toggle
              aria-controls="offcanvasSidebar"
              className={`ms-3 d-md-block d-lg-none ${styles.hamburger}`}
              onClick={toggleSidebar}
            >
              <FaBars size={25} />
            </Navbar.Toggle>
            <img src={Logo} alt="logo" />
          </Col>

          {/* Icons Section */}
          <Col xs={6} lg={4} className="d-flex align-items-center justify-content-end pe-lg-4 position-relative">
            {/* Notification Icon with Dropdown and Badge */}
            <div ref={notificationRef} className="position-relative">
              <span className={`me-3 ${styles.icons}`} style={{ cursor: 'pointer', fontSize: '22px' }} onClick={toggleNotifications}>🔔</span>
              {notifications.length >= 1 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    backgroundColor: "#dc3545", // Red background for badge
                    color: "#fff", // White text
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {notifications.length}
                </span>
              )}
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%", // Position below the icon
                    right: 0, // Align to the right of the icon
                    width: "400px", // Fixed width
                    maxHeight: `${window.innerHeight / 2}px`, // Half of screen height
                    overflowY: "auto", // Scroll if content exceeds max height
                    backgroundColor: "#fff", // White background
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow
                    borderRadius: "8px", // Rounded corners
                    zIndex: 1000, // Ensure it layers over other content
                    padding: "1rem", // Inner padding
                  }}
                >
                  <h5 className="fw-semibold mb-3">Notifications</h5>
                  {loading ? (
                    <p className="text-muted">Loading notifications...</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-muted">No new notifications</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          style={{
                            padding: "0.5rem 0",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{notification.message}</span>
                          <small className="text-muted">
                            {formatDateTime(notification.createdAt)}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div ref={siteDropdownRef} className={`d-flex align-items-center position-relative me-2 ${styles.siteSelectorWrapper}`}>
                <button
                  className={styles.sitePill}
                  onClick={() => setShowSiteDropdown((prev) => !prev)}
                >
                  <span className={styles.sitePillIcon}>
                    {activeSite ? <FaMapMarkerAlt /> : <FaGlobeAmericas />}
                  </span>
                  <span className={styles.sitePillText}>
                    {activeSite ? <>{activeSite.name} {activeSite.type && <span className={styles.sitePillType}>— {activeSite.type}</span>}</> : "All Sites"}
                  </span>
                  <FaChevronDown
                    size={10}
                    className={`${styles.sitePillChevron} ${showSiteDropdown ? styles.chevronOpen : ""}`}
                  />
                </button>
                {showSiteDropdown && (
                  <div className={styles.siteDropdown}>
                    <div className={styles.siteDropdownHeader}>Select a site</div>
                    <button
                      className={`${styles.siteDropdownItem} ${!activeSite ? styles.siteDropdownItemActive : ""}`}
                      onClick={() => handleSiteSelect(null)}
                    >
                      <FaGlobeAmericas className={styles.siteDropdownIcon} />
                      <span className={styles.siteDropdownLabel}>All Sites</span>
                      {!activeSite && <FaCheck className={styles.siteDropdownCheck} />}
                    </button>
                    <div className={styles.siteDropdownDivider} />
                    {siteLoading ? (
                      <div className={styles.siteDropdownLoading}>Loading...</div>
                    ) : siteOptions.length === 0 ? (
                      <div className={styles.siteDropdownEmpty}>No sites available</div>
                    ) : (
                      siteOptions.map((site) => (
                        <button
                          key={site.id}
                          className={`${styles.siteDropdownItem} ${activeSite?.id === site.id ? styles.siteDropdownItemActive : ""}`}
                          onClick={() => handleSiteSelect({ id: site.id, name: site.name, type: site.type?.name })}
                        >
                          <FaMapMarkerAlt className={styles.siteDropdownIcon} />
                          <div className={styles.siteDropdownInfo}>
                            <span className={styles.siteDropdownLabel}>{site.name}</span>
                            {site.type?.name && (
                              <span className={styles.siteDropdownSub}>
                                {site.location ? `${site.location} — ${site.type.name}` : site.type.name}
                              </span>
                            )}
                          </div>
                          {activeSite?.id === site.id && <FaCheck className={styles.siteDropdownCheck} />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Download App Button */}
            {isInstallable && (
              <Button
                variant="outline-dark"
                onClick={handleInstallClick}
                className="me-3 d-flex align-items-center"
              >
                <FiDownload className="me-1" size={20} />
                <span className="d-none d-lg-inline">Download App</span>
              </Button>
            )}

            {/* User Dropdown */}
            <Dropdown as={ButtonGroup}>
              <Dropdown.Toggle className="bg-transparent text-dark border-0 d-flex align-items-center gap-2" id="dropdown-basic">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                  style={{ width: '32px', height: '32px', backgroundColor: '#512728', fontSize: '14px', flexShrink: 0 }}
                >
                  {userInitial}
                </div>
                <span className="d-none d-lg-inline fw-semibold">
                  {sessionStorage
                    .getItem("role")
                    ?.replace(/_/g, " ") // Replace underscores with spaces
                    .replace(/\b\w/g, (char) => char.toUpperCase())} {/* Capitalize first letters */}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="border border-secondary bg-light-subtle">
                <Dropdown.Item
                  className="fw-semibold"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  className="fw-semibold"
                  onClick={() => {
                    sessionStorage.clear();
                    navigate("/");
                  }}
                >
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      </div>
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold fs-5">Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>Old Password</label>
            <InputGroup>
              <input
                type={showOldPassword ? 'text' : 'password'}
                className="form-control shadow-none"
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <InputGroup.Text
                style={{ cursor: 'pointer', backgroundColor: '#fff' }}
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <FaEyeSlash /> : <FaEye />}
              </InputGroup.Text>
            </InputGroup>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>New Password</label>
            <InputGroup>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-control shadow-none"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <InputGroup.Text
                style={{ cursor: 'pointer', backgroundColor: '#fff' }}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </InputGroup.Text>
            </InputGroup>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <button
            className="btn btn-secondary shadow-none fw-semibold"
            onClick={() => setShowPasswordModal(false)}
            disabled={changePwLoading}
          >
            Cancel
          </button>
          <button
            className="btn fw-semibold text-white border-0 shadow-none"
            style={{ backgroundColor: '#512728' }}
            onClick={handleChangePassword}
            disabled={changePwLoading}
          >
            {changePwLoading ? <><Spinner size="sm" animation="border" className="me-2" />Changing password...</> : 'Change Password'}
          </button>
        </Modal.Footer>
      </Modal>
    </header>
  );
}
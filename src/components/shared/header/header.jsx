import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Dropdown, ButtonGroup, Button, Navbar } from "react-bootstrap";
import { IoMdNotifications } from "react-icons/io";
import { FaRegUserCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaBars } from "react-icons/fa"; // Hamburger icon
import { useNavigate } from "react-router-dom";
import Logo from "../../../assests/logo.png";
import Api from '../../shared/api/apiLink'; // Import your API utility
import styles from "./header.module.scss";

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // State for notification dropdown
  const [notifications, setNotifications] = useState([]); // State for fetched notifications
  const [loading, setLoading] = useState(false); // Loading state for fetch
  const notificationRef = useRef(null); // Ref to handle click outside

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
              <IoMdNotifications
                size={25}
                className={`me-3 ${styles.icons}`}
                style={{ cursor: "pointer" }}
                onClick={toggleNotifications}
              />
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
              <Dropdown.Toggle className="bg-transparent text-dark border-0" id="dropdown-basic">
                <FaRegUserCircle size={32} className={`me-1 ${styles.icons}`} />
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
    </header>
  );
}
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Nav, Card, Collapse, Tooltip, OverlayTrigger, Offcanvas } from "react-bootstrap";
import { FaChevronRight, FaChevronDown, FaMapMarkerAlt, FaCircle, FaHouseUser, FaExchangeAlt } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { BsShopWindow } from "react-icons/bs";
import { LuClipboardCheck, LuClipboardPenLine } from "react-icons/lu";

import { GiCannedFish, GiCirclingFish, GiFriedFish, GiChipsBag, GiDamagedHouse } from "react-icons/gi";
import { TbFishOff } from "react-icons/tb";
import { RiStoreFill } from "react-icons/ri";
import { MdOutlinePointOfSale, MdOutlineBarChart } from "react-icons/md";
import styles from "./siderbar.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermission } from "../permissions/permissions";

export default function SideBar({ show, handleClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState({});
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const user = useSelector((store) => store.user);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/admin")) {
      setOpen((prev) => ({ ...prev, admin: true }));
    } else if (path.includes("/ponds")) {
      setOpen((prev) => ({ ...prev, ponds: true }));
    } else if (path.includes("/manage-fish")) {
      setOpen((prev) => ({ ...prev, manage_fish: true }));
    } else if (path.includes("/customer")) {
      setOpen((prev) => ({ ...prev, customer: true }));
    } else if (path.includes("/fish-processes")) {
      setOpen((prev) => ({ ...prev, fish_processes: true }));
    } else if (path.includes("/products")) {
      setOpen((prev) => ({ ...prev, products: true }));
    } else if (path.includes("/showcase")) {
      setOpen((prev) => ({ ...prev, showcase: true }));
    } else if (path.includes("/site-management")) {
      setOpen((prev) => ({ ...prev, site_management: true }));
    } else if (path.includes("/feed")) {
      setOpen((prev) => ({ ...prev, feed: true }));
    } else if (path.includes("/store")) {
      setOpen((prev) => ({ ...prev, store: true }));
    } else if (path.includes("/finance")) {
      setOpen((prev) => ({ ...prev, finance: true }));
    } else if (path.includes("/report")) {
      setOpen((prev) => ({ ...prev, report: true }));
    } else if (path.includes("/batch-dashboard")) {
      setOpen((prev) => ({ ...prev, batch_dashboard: true }));
    } else if (path.includes("/hatchery")) {
      setOpen((prev) => ({ ...prev, hatch_batches: true }));
      if (path.includes('/hatchery/broodstock')) {
        setOpen((prev) => ({ ...prev, broodstock: true }));
      } else if (path.includes('/hatchery/fry-production')) {
        setOpen((prev) => ({ ...prev, fry_production: true }));
      } else if (path.includes('/hatchery/transfers')) {
        setOpen((prev) => ({ ...prev, transfers: true }));
      }
    } else if (path.includes("/notification")) {
      setOpen((prev) => ({ ...prev, notification: true }));
    }
  }, [location.pathname]);

  const handleToggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sidebarContent = (
    <div className={styles.sidebarInner}>

      {/* Logo Header */}
      <div className={styles.logoHeader}>
        <GiCirclingFish size={34} color="#CC6E1A" />
        <div>
          <div className={styles.logoTitle}>FENDOL V2</div>
          <div className={styles.logoSubtitle}>Fish Farm Management</div>
        </div>
      </div>

      {/* --- DASHBOARD (outside Nav to avoid div-inside-ul HTML invalidation) --- */}
      {hasPermission(userTypes, 'dashboard') && (
        <Card className={styles.card}>
          <Card.Header
            onClick={() => navigate("/dashboard")}
            className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader} ${location.pathname === "/dashboard" ? styles.dashboardLinkActive : ""}`}
            style={{ cursor: "pointer" }}
          >
            <span className={`${styles.title}`}>
              <IoGridOutline size={25} className="me-1" /> Dashboard
            </span>
          </Card.Header>
        </Card>
      )}

      <Nav className={`flex-column ${styles.navs}`}>

        {/* --- ALL EXISTING NAV GROUPS --- */}
        <div className={`mb-4 ${styles.navigationDropdown}`}>
          {/* Admin navigations */}
          {hasPermission(userTypes, 'admin') && (
            <>
              <span className={styles.sectionLabel}>ADMINISTRATION</span>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("admin")}
                  aria-controls="admin-collapse-text"
                  aria-expanded={open.admin}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <LuClipboardCheck size={25} className="me-1" /> Admin
                  </span>
                  <span>{open.admin ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.admin} style={{ transitionDuration: "0s" }}>
                  <div id="admin-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      {hasPermission(userTypes, 'admin') && (
                        <Nav.Item className="mb-3">
                          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-add-new">Add a new admin</Tooltip>}>
                            <div
                              onClick={() => navigate("/admin/add-new-admin")}
                              className={`${location.pathname === "/admin/add-new-admin" ? styles.activeLink : styles.nonactiveLink}`}
                              style={{ cursor: "pointer" }}
                            >
                              <FaCircle size={10} className="me-2" /> Add New
                            </div>
                          </OverlayTrigger>
                        </Nav.Item>
                      )}
                      <Nav.Item className="my-3">
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-view-all">View all admins</Tooltip>}>
                          <div
                            onClick={() => navigate("/admin/view-all")}
                            className={`${location.pathname === "/admin/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> View All
                          </div>
                        </OverlayTrigger>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Customer navigation */}
          {hasPermission(userTypes, 'customer') && (
            <>
              <span className={styles.sectionLabel}>CUSTOMERS</span>
              <Card className={styles.card}>
                <Card.Header
                  style={{ cursor: "pointer" }}
                  onClick={() => handleToggle("customer")}
                  aria-controls="customer-collapse-text"
                  aria-expanded={open.customer}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <LuClipboardPenLine size={25} className="me-1" /> Customer
                  </span>
                  <span>{open.customer ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.customer} style={{ transitionDuration: "0s" }}>
                  <div id="customer-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/customer/add")}
                          className={`${location.pathname === "/customer/add" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Add Customer
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/customer/view-all")}
                          className={`${location.pathname === "/customer/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Pond navigation */}
          {hasPermission(userTypes, 'ponds') && (
            <>
              <span className={styles.sectionLabel}>FISH OPERATIONS</span>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("ponds")}
                  aria-controls="ponds-collapse-text"
                  aria-expanded={open.ponds}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`${styles.title}`}>
                    <GiCannedFish size={25} className="me-1" /> Ponds
                  </span>
                  <span>{open.ponds ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.ponds} style={{ transitionDuration: "0s" }}>
                  <div id="ponds-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/ponds/create")}
                          className={`${location.pathname === "/ponds/create" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Create Pond
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/ponds/view-all-ponds")}
                          className={`${location.pathname === "/ponds/view-all-ponds" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All Ponds
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
              {/* Batch Dashboard navigation */}
              {hasPermission(userTypes, 'batch-dashboard') && (
                <Card className={styles.card}>
                  <Card.Header
                    onClick={() => handleToggle("batch_dashboard")}
                    aria-controls="batch_dashboard-collapse-text"
                    aria-expanded={open.batch_dashboard}
                    style={{ cursor: "pointer" }}
                    className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  >
                    <span className={`${styles.title}`}>
                      <MdOutlineBarChart size={25} className="me-1" /> Batch Dashboard
                    </span>
                    <span>{open.batch_dashboard ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                  </Card.Header>
                  <Collapse in={open.batch_dashboard} style={{ transitionDuration: "0s" }}>
                    <div id="batch_dashboard-collapse-text" className="px-2">
                      <Card.Body className={styles.navigationLinks}>
                        <Nav.Item className="mb-3">
                          <div
                            onClick={() => navigate("/batch-dashboard")}
                            className={`${location.pathname === "/batch-dashboard" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Dashboard Home
                          </div>
                        </Nav.Item>
                        <Nav.Item className="my-3">
                          <div
                            onClick={() => navigate("/batch-dashboard/summary/1")}
                            className={`${location.pathname.startsWith("/batch-dashboard/summary") ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Batch Summary
                          </div>
                        </Nav.Item>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              )}
            </>
          )}

          {/* Manage Fish navigation */}
          {hasPermission(userTypes, 'manage-fish') && (
            <>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("manage_fish")}
                  aria-controls="manage_fish-collapse-text"
                  aria-expanded={open.manage_fish}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`${styles.title}`}>
                    <GiCirclingFish size={25} className="me-1" /> Manage Fish
                  </span>
                  <span>{open.manage_fish ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.manage_fish} style={{ transitionDuration: "0s" }}>
                  <div id="manage_fish-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/manage-fish/create-fish-type")}
                          className={`${location.pathname === "/manage-fish/create-fish-type" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Manage Fish Type
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/manage-fish/add-fish")}
                          className={`${location.pathname === "/manage-fish/add-fish" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Add Fish
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/manage-fish/move-fish")}
                          className={`${location.pathname === "/manage-fish/move-fish" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Move Fish
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/manage-fish/harvest-fish")}
                          className={`${location.pathname === "/manage-fish/harvest-fish" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Harvest Fish
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/manage-fish/damage-fish")}
                          className={`${location.pathname === "/manage-fish/damage-fish" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Damage Fish
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3" title="View All Histories">
                        <div
                          onClick={() => navigate("/manage-fish/view-all-histories")}
                          className={`${location.pathname === "/manage-fish/view-all-histories" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All Histories
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Hatchery navigation — restricted to super_admin or farm_manager with a Hatchery site assignment */}
          {(() => {
            const hasHatcheryPermission = hasPermission(userTypes, 'hatchery');
            const isSuperAdmin = userTypes.includes('super_admin');
            const sites = user?.userSites || [];
            const hasHatcherySite = sites.some(s =>
              (typeof s === 'string' ? s : (s.name || s.siteName || ''))
                .toLowerCase() === 'hatchery'
            );
            return hasHatcheryPermission && (isSuperAdmin || hasHatcherySite);
          })() && (
            <>
              <span className={styles.sectionLabel}>HATCHERY</span>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => navigate("/hatchery/dashboard")}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader} ${location.pathname === "/hatchery/dashboard" ? styles.dashboardLinkActive : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`${styles.title}`}>
                    <FaHouseUser size={25} className="me-1" /> Hatchery Dashboard
                  </span>
                </Card.Header>
              </Card>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("hatch_batches")}
                  aria-controls="hatch_batches-collapse-text"
                  aria-expanded={open.hatch_batches}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <GiCirclingFish size={25} className="me-1" /> Hatch Batches
                  </span>
                  <span>{open.hatch_batches ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.hatch_batches} style={{ transitionDuration: "0s" }}>
                  <div id="hatch_batches-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/hatchery/hatch-batches/create")}
                          className={`${location.pathname === "/hatchery/hatch-batches/create" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Create Hatch Batch
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/hatchery/hatch-batches/view-all")}
                          className={`${location.pathname === "/hatchery/hatch-batches/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All Batches
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>

              {/* Broodstock Management card */}
              {hasPermission(userTypes, 'hatchery') && (
                <Card className={styles.card}>
                  <Card.Header
                    onClick={() => handleToggle("broodstock")}
                    aria-controls="broodstock-collapse-text"
                    aria-expanded={open.broodstock}
                    style={{ cursor: "pointer" }}
                    className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  >
                    <span className={`${styles.title}`}>
                      <GiCirclingFish size={25} className="me-1" /> Broodstock Management
                    </span>
                    <span>{open.broodstock ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                  </Card.Header>
                  <Collapse in={open.broodstock} style={{ transitionDuration: "0s" }}>
                    <div id="broodstock-collapse-text" className="px-2">
                      <Card.Body className={styles.navigationLinks}>
                        <Nav.Item className="mb-3">
                          <div
                            onClick={() => navigate("/hatchery/broodstock/male")}
                            className={`${location.pathname === "/hatchery/broodstock/male" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Male Broodstock
                          </div>
                        </Nav.Item>
                        <Nav.Item className="my-3">
                          <div
                            onClick={() => navigate("/hatchery/broodstock/female")}
                            className={`${location.pathname === "/hatchery/broodstock/female" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Female Broodstock
                          </div>
                        </Nav.Item>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              )}

              {/* Fry Production card */}
              {hasPermission(userTypes, 'hatchery') && (
                <Card className={styles.card}>
                  <Card.Header
                    onClick={() => handleToggle("fry_production")}
                    aria-controls="fry_production-collapse-text"
                    aria-expanded={open.fry_production}
                    style={{ cursor: "pointer" }}
                    className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  >
                    <span className={`${styles.title}`}>
                      <GiCirclingFish size={25} className="me-1" /> Fry Production
                    </span>
                    <span>{open.fry_production ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                  </Card.Header>
                  <Collapse in={open.fry_production} style={{ transitionDuration: "0s" }}>
                    <div id="fry_production-collapse-text" className="px-2">
                      <Card.Body className={styles.navigationLinks}>
                        <Nav.Item className="mb-3">
                          <div
                            onClick={() => navigate("/hatchery/fry-production/daily-records")}
                            className={`${location.pathname === "/hatchery/fry-production/daily-records" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Daily Records
                          </div>
                        </Nav.Item>
                        <Nav.Item className="my-3">
                          <div
                            onClick={() => navigate("/hatchery/fry-production/mortality-records")}
                            className={`${location.pathname === "/hatchery/fry-production/mortality-records" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Mortality Records
                          </div>
                        </Nav.Item>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              )}

              {/* Transfers card */}
              {hasPermission(userTypes, 'hatchery') && (
                <Card className={styles.card}>
                  <Card.Header
                    onClick={() => handleToggle("transfers")}
                    aria-controls="transfers-collapse-text"
                    aria-expanded={open.transfers}
                    style={{ cursor: "pointer" }}
                    className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  >
                    <span className={`${styles.title}`}>
                      <FaExchangeAlt size={25} className="me-1" /> Transfers
                    </span>
                    <span>{open.transfers ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                  </Card.Header>
                  <Collapse in={open.transfers} style={{ transitionDuration: "0s" }}>
                    <div id="transfers-collapse-text" className="px-2">
                      <Card.Body className={styles.navigationLinks}>
                        <Nav.Item className="mb-3">
                          <div
                            onClick={() => navigate("/hatchery/transfers/transfer-to-nursery")}
                            className={`${location.pathname === "/hatchery/transfers/transfer-to-nursery" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Transfer to Nursery
                          </div>
                        </Nav.Item>
                        <Nav.Item className="my-3">
                          <div
                            onClick={() => navigate("/hatchery/transfers/transfer-history")}
                            className={`${location.pathname === "/hatchery/transfers/transfer-history" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Transfer History
                          </div>
                        </Nav.Item>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              )}
            </>
          )}

          {/* Fish Processing navigation */}
          {hasPermission(userTypes, 'fish-processes') && (
            <>
              <span className={styles.sectionLabel}>PROCESSING</span>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("fish_processes")}
                  aria-controls="fish_processes-collapse-text"
                  aria-expanded={open.fish_processes}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <TbFishOff size={25} className="me-1" /> Fish Processing
                  </span>
                  <span>{open.fish_processes ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.fish_processes} style={{ transitionDuration: "0s" }}>
                  <div id="fish_processes-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/fish-processes/process-fish")}
                          className={`${location.pathname === "/fish-processes/process-fish" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Process Fish
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3" title="Process History">
                        <div
                          onClick={() => navigate("/fish-processes/view-summary")}
                          className={`${location.pathname === "/fish-processes/view-summary" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Process History
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Products navigation */}
          {hasPermission(userTypes, 'products') && (
            <>
              <span className={styles.sectionLabel}>INVENTORY</span>
              <Card className={styles.card}>
                <Card.Header
                  style={{ cursor: "pointer" }}
                  onClick={() => handleToggle("products")}
                  aria-controls="products-collapse-text"
                  aria-expanded={open.products}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <GiFriedFish size={25} className="me-1" /> Products
                  </span>
                  <span>{open.products ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.products} style={{ transitionDuration: "0s" }}>
                  <div id="products-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/products/create-products")}
                          className={`${location.pathname === "/products/create-products" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Create Products
                        </div>
                      </Nav.Item>
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/products/view-all")}
                          className={`${location.pathname === "/products/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Showcase navigation */}
          {hasPermission(userTypes, 'showcase') && (
            <>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("showcase")}
                  aria-controls="showcase-collapse-text"
                  aria-expanded={open.showcase}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <BsShopWindow size={25} className="me-1" /> Showcase
                  </span>
                  <span>{open.showcase ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.showcase} style={{ transitionDuration: "0s" }}>
                  <div id="showcase-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/showcase/broken-showcase")}
                          className={`${location.pathname === "/showcase/broken-showcase" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Broken Showcase
                        </div>
                      </Nav.Item>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/showcase/whole-showcase")}
                          className={`${location.pathname === "/showcase/whole-showcase" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Whole Showcase
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Site Management navigation */}
          {hasPermission(userTypes, 'site-management') && (
            <>
              <span className={styles.sectionLabel}>SITE MANAGEMENT</span>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("site_management")}
                  aria-controls="site_management-collapse-text"
                  aria-expanded={open.site_management}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <FaMapMarkerAlt size={25} className="me-1" /> Site Management
                  </span>
                  <span>{open.site_management ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.site_management} style={{ transitionDuration: "0s" }}>
                  <div id="site_management-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      {hasPermission(userTypes, 'site-management') && (
                        <Nav.Item className="mb-3">
                          <div
                            onClick={() => navigate("/site-management/create")}
                            className={`${location.pathname === "/site-management/create" ? styles.activeLink : styles.nonactiveLink}`}
                            style={{ cursor: "pointer" }}
                          >
                            <FaCircle size={10} className="me-2" /> Create Site
                          </div>
                        </Nav.Item>
                      )}
                      <Nav.Item className="my-3">
                        <div
                          onClick={() => navigate("/site-management/view-all")}
                          className={`${location.pathname === "/site-management/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Feed navigation */}
          {hasPermission(userTypes, 'feed') && (
            <>
              <span className={styles.sectionLabel}>FEED MANAGEMENT</span>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("feed")}
                  aria-controls="feed-collapse-text"
                  aria-expanded={open.feed}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <GiChipsBag size={25} className="me-1" /> Feed
                  </span>
                  <span>{open.feed ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.feed} style={{ transitionDuration: "0s" }}>
                  <div id="feed-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/feed/add-new")}
                          className={`${location.pathname === "/feed/add-new" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Add New
                        </div>
                      </Nav.Item>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/feed/view-all")}
                          className={`${location.pathname === "/feed/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All
                        </div>
                      </Nav.Item>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/feed/inventory-history")}
                          className={`${location.pathname === "/feed/inventory-history" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Inventory History
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Store navigation */}
          {hasPermission(userTypes, 'store') && (
            <>
              <Card className={styles.card}>
                <Card.Header
                  onClick={() => handleToggle("store")}
                  aria-controls="store-collapse-text"
                  aria-expanded={open.store}
                  style={{ cursor: "pointer" }}
                  className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                >
                  <span className={`${styles.title}`}>
                    <RiStoreFill size={25} className="me-1" /> Store
                  </span>
                  <span>{open.store ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                </Card.Header>
                <Collapse in={open.store} style={{ transitionDuration: "0s" }}>
                  <div id="store-collapse-text" className="px-2">
                    <Card.Body className={styles.navigationLinks}>
                      <Nav.Item className="mb-3" title="Create Feed">
                        <div
                          onClick={() => navigate("/store/add-new")}
                          className={`${location.pathname === "/store/add-new" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Add New
                        </div>
                      </Nav.Item>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/store/view-all")}
                          className={`${location.pathname === "/store/view-all" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> View All
                        </div>
                      </Nav.Item>
                      <Nav.Item className="mb-3">
                        <div
                          onClick={() => navigate("/store/inventory-history")}
                          className={`${location.pathname === "/store/inventory-history" ? styles.activeLink : styles.nonactiveLink}`}
                          style={{ cursor: "pointer" }}
                        >
                          <FaCircle size={10} className="me-2" /> Inventory History
                        </div>
                      </Nav.Item>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </>
          )}

          {/* Finance navigation */}
          {(hasPermission(userTypes, 'finance:add-sales') ||
            hasPermission(userTypes, 'finance:add-expenses') ||
            hasPermission(userTypes, 'finance:ledger') ||
            hasPermission(userTypes, 'finance:cash-drawer')) && (
            <>
              <span className={styles.sectionLabel}>FINANCE</span>
              {(hasPermission(userTypes, 'finance:add-sales') || hasPermission(userTypes, 'finance:add-expenses') || hasPermission(userTypes, 'finance:ledger') || hasPermission(userTypes, 'finance:cash-drawer')) ? (
                <Card className={styles.card}>
                  <Card.Header
                    style={{ cursor: "pointer" }}
                    onClick={() => handleToggle("finance")}
                    aria-controls="finance-collapse-text"
                    aria-expanded={open.finance}
                    className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
                  >
                    <span className={`${styles.title}`}>
                      <MdOutlinePointOfSale size={25} className="me-1" /> Finance
                    </span>
                    <span>{open.finance ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
                  </Card.Header>
                  <Collapse in={open.finance} style={{ transitionDuration: "0s" }}>
                    <div id="finance-collapse-text" className="px-2">
                      <Card.Body className={styles.navigationLinks}>
                        {hasPermission(userTypes, 'finance:add-sales') && (
                          <Nav.Item className="mb-3" title="Make A Sale">
                            <div
                              onClick={() => navigate("/finance/add-sales")}
                              className={`${location.pathname === "/finance/add-sales" ? styles.activeLink : styles.nonactiveLink}`}
                              style={{ cursor: "pointer" }}
                            >
                              <FaCircle size={10} className="me-2" /> Add Sales
                            </div>
                          </Nav.Item>
                        )}
                        {hasPermission(userTypes, 'finance:add-expenses') && (
                          <Nav.Item className="mb-3" title="Add Expenses">
                            <div
                              onClick={() => navigate("/finance/add-expenses")}
                              className={`${location.pathname === "/finance/add-expenses" ? styles.activeLink : styles.nonactiveLink}`}
                              style={{ cursor: "pointer" }}
                            >
                              <FaCircle size={10} className="me-2" /> Add Expenses
                            </div>
                          </Nav.Item>
                        )}
                        {hasPermission(userTypes, 'finance:ledger') && (
                          <Nav.Item className="mb-3" title="Financial Ledger">
                            <div
                              onClick={() => navigate("/finance/ledger")}
                              className={`${location.pathname === "/finance/ledger" ? styles.activeLink : styles.nonactiveLink}`}
                              style={{ cursor: "pointer" }}
                            >
                              <FaCircle size={10} className="me-2" /> Finance Ledger
                            </div>
                          </Nav.Item>
                        )}
                        {hasPermission(userTypes, 'finance:cash-drawer') && (
                          <Nav.Item className="mb-3" title="Cash Drawer">
                            <div
                              onClick={() => navigate("/finance/cash-drawer")}
                              className={`${location.pathname === "/finance/cash-drawer" ? styles.activeLink : styles.nonactiveLink}`}
                              style={{ cursor: "pointer" }}
                            >
                              <FaCircle size={10} className="me-2" /> Cash Drawer
                            </div>
                          </Nav.Item>
                        )}
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              ) : null}
            </>
          )}

          {hasPermission(userTypes, 'damage-loss') && (
            <>
              <span className={styles.sectionLabel}>RECORDS</span>
              <Nav.Item className={`mt-3 ${location.pathname === "/damage-loss" ? "mx-2" : ""}`}>
                <Nav.Link
                  onClick={() => navigate("/damage-loss")}
                  className={`${location.pathname === "/damage-loss" ? styles.activeLink : styles.nonactiveLink}`}
                >
                  <GiDamagedHouse size={25} className="me-1 text-light" /> <span className={styles.title}>Damage/Loss</span>
                </Nav.Link>
              </Nav.Item>
            </>
          )}
        </div>
      </Nav>

      {/* User Footer */}
      {user && (
        <div className={styles.userFooter}>
          <div className={styles.userAvatar}>
            {(user.username || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow-1">
            <div className={styles.userName}>{user.username || "Admin User"}</div>
            <div className={styles.userRole}>{user.role || "User"}</div>
          </div>
          <FaChevronDown size={13} color="#9A8070" />
        </div>
      )}

    </div>
  );

  return (
    <aside>
      {/* Desktop Sidebar */}
      <section className={`position-fixed d-none d-lg-block ${styles.sidebar}`}>
        {sidebarContent}
      </section>

      {/* Tablet Offcanvas Sidebar */}
      <Offcanvas show={show} onHide={handleClose} className={`d-md-block d-lg-none ${styles.offcan}`} id="offcanvasSidebar">
        <Offcanvas.Header closeButton className={`text-light sticky-top shadow ${styles.offcan}`}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className={styles.offcan} >{sidebarContent}</Offcanvas.Body>
      </Offcanvas>
    </aside>
  );
}
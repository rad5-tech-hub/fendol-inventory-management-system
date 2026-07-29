import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import { Nav, Card, Collapse, Tooltip, OverlayTrigger, Offcanvas } from "react-bootstrap";

const computeOpenFromPath = (path) => {
  const open = {};
  if (path.includes("/site-management")) open.site_management = true;
  if (path.includes("/admin")) open.users_and_roles = true;
  if (path.includes("/hatchery")) {
    open.hatchery = true;
    if (path.includes('/hatchery/hatch-batches')) open.hatch_batches = true;
    if (path.includes('/hatchery/broodstock')) open.broodstock = true;
    
  }
  if (path.includes("/ponds")) open.pond_management = true;
  if (path.includes("/manage-fish")) open.fish_activities = true;
  if (path.includes("/site-transfers")) open.site_transfers = true;
  if (path.includes("/fish-processes")) open.processing = true;
  if (path.includes("/feed")) {
    open.feed_management = true;
    if (path.includes('/feed/production')) open.feed_production = true;
    if (path.includes('/feed/inventory')) open.feed_inventory = true;
    if (path.includes('/feed/raw-materials')) open.raw_materials = true;
  }
  if (path.includes("/store")) open.store = true;
  if (path.includes("/products")) open.product = true;
  if (path.includes("/showcase")) open.showcase = true;
  if (path.includes("/finance")) {
    open.finance = true;
    open.sales = true;
    if (path.includes('/finance/supplier')) open.supplier = true;
    if (path.includes('/finance/staff')) open.staff = true;
  }
  if (path.includes("/customer")) open.customer = true;
  if (path.includes("/referral")) open.referral = true;
  if (path.includes("/mlm")) open.mlm = true;
  if (path.includes("/complaints")) open.complaints = true;
  return open;
};

const scrollActiveIntoView = (containerEl) => {
  if (!containerEl) return;
  const activeEl = containerEl.querySelector('[data-active="true"]');
  if (!activeEl) return;
  const cr = containerEl.getBoundingClientRect();
  const ar = activeEl.getBoundingClientRect();
  if (ar.top < cr.top || ar.bottom > cr.bottom) {
    activeEl.scrollIntoView({ block: 'center', behavior: 'auto' });
  }
};
import { FaChevronRight, FaChevronDown, FaMapMarkerAlt, FaCircle, FaHouseUser, FaExchangeAlt, FaUsers, FaTrophy, FaTree, FaHandHoldingUsd, FaUserTie, FaMoneyCheckAlt, FaClock, FaClipboardList, FaExclamationTriangle } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { BsShopWindow } from "react-icons/bs";
import { LuClipboardCheck, LuClipboardPenLine } from "react-icons/lu";
import { GiCannedFish, GiCirclingFish, GiFriedFish, GiChipsBag, GiDamagedHouse, GiPolarBear, GiFishingNet, GiFishing, GiDeadHead, GiFoodChain } from "react-icons/gi";
import { TbFishOff } from "react-icons/tb";
import { RiStoreFill, RiTeamFill } from "react-icons/ri";
import { MdOutlineBarChart, MdOutlineInventory2, MdOutlinePeople, MdAttachMoney, MdPersonAdd, MdPointOfSale } from "react-icons/md";
import { SiGoogleanalytics } from "react-icons/si";
import styles from "./siderbar.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermission } from "../permissions/permissions";

export default function SideBar({ show, handleClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => computeOpenFromPath(location.pathname));
  const sidebarRef = useRef(null);
  const expandedCallbackRef = useRef(null);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);

  useLayoutEffect(() => {
    const path = location.pathname;
    const updates = {};
    if (path.includes("/site-management")) updates.site_management = true;
    if (path.includes("/admin")) updates.users_and_roles = true;
    if (path.includes("/hatchery")) {
      updates.hatchery = true;
      if (path.includes('/hatchery/hatch-batches')) updates.hatch_batches = true;
      if (path.includes('/hatchery/broodstock')) updates.broodstock = true;
      
    }
    if (path.includes("/ponds")) updates.pond_management = true;
    if (path.includes("/manage-fish")) updates.fish_activities = true;
    if (path.includes("/site-transfers")) updates.site_transfers = true;
    if (path.includes("/fish-processes")) updates.processing = true;
    if (path.includes("/feed")) {
      updates.feed_management = true;
      if (path.includes('/feed/production')) updates.feed_production = true;
      if (path.includes('/feed/inventory')) updates.feed_inventory = true;
      if (path.includes('/feed/raw-materials')) updates.raw_materials = true;
    }
    if (path.includes("/store")) updates.store = true;
    if (path.includes("/products")) updates.product = true;
    if (path.includes("/showcase")) updates.showcase = true;
    if (path.includes("/finance")) {
      updates.finance = true;
      updates.sales = true;
      if (path.includes('/finance/supplier')) updates.supplier = true;
      if (path.includes('/finance/staff')) updates.staff = true;
    }
    if (path.includes("/customer")) updates.customer = true;
    if (path.includes("/referral")) updates.referral = true;
    if (path.includes("/mlm")) updates.mlm = true;
    if (path.includes("/complaints")) updates.complaints = true;

    const expandingKey = Object.keys(updates).find(k => updates[k] && !open[k]);

    setOpen((prev) => ({ ...prev, ...updates }));

    const scrollToActive = () => {
      const section = sidebarRef.current;
      if (!section) return;
      const navsEl = section.querySelector(`.${styles.navs}`);
      scrollActiveIntoView(navsEl);
    };

    if (expandingKey) {
      expandedCallbackRef.current = () => {
        expandedCallbackRef.current = null;
        scrollToActive();
      };
    } else {
      // No sections to expand — active element is already rendered
      scrollToActive();
    }
  }, [location.pathname]);

  useEffect(() => {
    const section = sidebarRef.current;
    if (!section) return;
    const navsEl = section.querySelector(`.${styles.navs}`);
    scrollActiveIntoView(navsEl);
  }, [location.pathname, userTypes, activeSite]);

  const handleToggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActiveRoute = (route) =>
    location.pathname === route || location.pathname.startsWith(route + "/") || location.pathname.startsWith(route + "?");

  const renderNavItem = (label, route, icon) => (
    <Nav.Item className="mb-3">
      <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tooltip-${label}`}>{label}</Tooltip>}>
        <div
          onClick={() => navigate(route)}
          className={`${isActiveRoute(route) ? styles.activeLink : styles.nonactiveLink}`}
          data-active={isActiveRoute(route) ? "true" : undefined}
          style={{ cursor: "pointer" }}
        >
          {icon || <FaCircle size={10} className="me-2" />} {label}
        </div>
      </OverlayTrigger>
    </Nav.Item>
  );

  const renderNavItemStartsWith = (label, route, icon) => (
    <Nav.Item className="mb-3">
      <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tooltip-${label}`}>{label}</Tooltip>}>
        <div
          onClick={() => navigate(route)}
          className={`${isActiveRoute(route) ? styles.activeLink : styles.nonactiveLink}`}
          data-active={isActiveRoute(route) ? "true" : undefined}
          style={{ cursor: "pointer" }}
        >
          {icon || <FaCircle size={10} className="me-2" />} {label}
        </div>
      </OverlayTrigger>
    </Nav.Item>
  );

  const renderCard = (sectionKey, title, icon, children) => (
    <Card className={styles.card}>
      <Card.Header
        onClick={() => handleToggle(sectionKey)}
        aria-controls={`${sectionKey}-collapse-text`}
        aria-expanded={open[sectionKey]}
        style={{ cursor: "pointer" }}
        className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader}`}
      >
        <span className={`${styles.title}`}>
          {icon} {title}
        </span>
        <span>{open[sectionKey] ? <FaChevronDown size={14} className="text-light" /> : <FaChevronRight size={14} className="text-light" />}</span>
      </Card.Header>
      <Collapse in={open[sectionKey]} style={{ transitionDuration: "0s" }} onEntered={() => expandedCallbackRef.current?.()}>
        <div id={`${sectionKey}-collapse-text`} className="px-2">
          <Card.Body className={styles.navigationLinks}>
            {children}
          </Card.Body>
        </div>
      </Collapse>
    </Card>
  );

  const renderDirectLink = (label, route, icon, extraClass = "") => (
    <Card className={styles.card}>
      <Card.Header
        onClick={() => navigate(route)}
        className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader} ${isActiveRoute(route) ? styles.dashboardLinkActive : ""} ${extraClass}`}
        data-active={isActiveRoute(route) ? "true" : undefined}
        style={{ cursor: "pointer" }}
      >
        <span className={`${styles.title}`}>
          {icon} {label}
        </span>
      </Card.Header>
    </Card>
  );

  const sidebarContent = (
    <div className={styles.sidebarInner}>
      {/* Dashboard */}
      {hasPermission(userTypes, 'dashboard') && (
        <Card className={styles.card}>
          <Card.Header
            onClick={() => navigate("/dashboard")}
            className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader} ${isActiveRoute("/dashboard") ? styles.dashboardLinkActive : ""}`}
            data-active={isActiveRoute("/dashboard") ? "true" : undefined}
            style={{ cursor: "pointer" }}
          >
            <span className={`${styles.title}`}>
              <IoGridOutline size={25} className="me-1" /> Dashboard
            </span>
          </Card.Header>
        </Card>
      )}

      <Nav className={`flex-column ${styles.navs}`}>
        <div className={`mb-4 ${styles.navigationDropdown}`}>
          {/* --- SITE MANAGEMENT --- */}
          {hasPermission(userTypes, 'site-management') && (
            <>
              <span className={styles.sectionLabel}>SITE MANAGEMENT</span>
              {renderCard("site_management", "Site Management", <FaMapMarkerAlt size={25} className="me-1" />,
                <>
                  {renderNavItem("View all sites", "/site-management/view-all")}
                  {renderNavItem("Create Sites", "/site-management/create")}
                  {renderNavItem("Site Performance", "/site-management/site-performance")}
                </>
              )}
            </>
          )}

          {/* --- USERS AND ROLES --- */}
          {hasPermission(userTypes, 'admin') && (
            <>
              <span className={styles.sectionLabel}>USERS AND ROLES</span>
              {renderCard("users_and_roles", "Users and Roles", <LuClipboardCheck size={25} className="me-1" />,
                <>
                  {renderNavItem("Create Users", "/admin/add-new-admin")}
                  {renderNavItem("View all users", "/admin/view-all")}
                </>
              )}
            </>
          )}

          {/* --- HATCHERY --- */}
          {(() => {
            const hasHatcheryPermission = hasPermission(userTypes, 'hatchery');
            const isSuperAdmin = userTypes.includes('super_admin');
            const sites = user?.userSites || [];
            const hasHatcherySite = sites.some(s =>
              (typeof s === 'string' ? s : (s.name || s.siteName || ''))
                .toLowerCase() === 'hatchery'
            );
            const isActiveSiteHatchery = !activeSite || activeSite.type?.toLowerCase() === 'hatchery';
            return hasHatcheryPermission && (isSuperAdmin || hasHatcherySite) && isActiveSiteHatchery;
          })() && (
            <>
              <span className={styles.sectionLabel}>HATCHERY</span>
              {renderCard("hatch_batches", "Hatch Batches", <GiCirclingFish size={25} className="me-1" />,
                <>
                  {renderNavItem("Hatchery Dashboard", "/hatchery/hatch-batches/view-all")}
                  {renderNavItem("Create Hatch Batch", "/hatchery/hatch-batches/create")}
                </>
              )}
              {hasPermission(userTypes, 'hatchery') && renderDirectLink("Broodstock Management", "/hatchery/broodstock", <GiCirclingFish size={25} className="me-1" />)}
              {/* Fry Production Records is covered by the Hatch dashboard */}
            </>
          )}

          {/* --- FISH OPERATIONS --- */}
          {(hasPermission(userTypes, 'ponds') || hasPermission(userTypes, 'batch-dashboard') || hasPermission(userTypes, 'manage-fish')) && (
            <>
              <span className={styles.sectionLabel}>FISH OPERATIONS</span>
              {hasPermission(userTypes, 'ponds') && renderCard("pond_management", "Pond Management", <GiCannedFish size={25} className="me-1" />,
                <>
                  {renderNavItem("View all ponds", "/ponds/view-all-ponds")}
                  {renderNavItem("Create ponds", "/ponds/create")}
                </>
              )}
              {hasPermission(userTypes, 'batch-dashboard') && renderDirectLink("Batch Dashboard", "/batch-dashboard", <MdOutlineBarChart size={25} className="me-1" />)}
              {hasPermission(userTypes, 'manage-fish') && renderCard("fish_activities", "Fish Activities", <GiCirclingFish size={25} className="me-1" />,
                <>
                  {renderNavItem(activeSite?.type?.toLowerCase() === 'hatchery' ? "Transfer to Nursery" : "Add Fish", "/manage-fish/add-fish")}
                  {renderNavItem("Move/Sort Fish", "/manage-fish/move-fish")}
                  {renderNavItem("Harvest", "/manage-fish/harvest-fish")}
                  {renderNavItem("Mortality", "/manage-fish/damage-fish")}
                </>
              )}
              {hasPermission(userTypes, 'manage-fish') && renderCard("site_transfers", "Site Transfers", <GiFishingNet size={25} className="me-1" />,
                <>
                  {renderNavItem("Incoming Transfers", "/manage-fish/site-transfers")}
                  {renderNavItem("Transfer", "/manage-fish/site-transfers/transfer")}
                  {renderNavItem("History", "/manage-fish/site-transfers/history")}
                </>
              )}
            </>
          )}

          {/* --- PROCESSING --- */}
          {hasPermission(userTypes, 'fish-processes') && (
            <>
              <span className={styles.sectionLabel}>PROCESSING</span>
              {renderCard("processing", "Processing", <TbFishOff size={25} className="me-1" />,
                <>
                  {renderNavItem("Create Process Batch", "/fish-processes/process-fish")}
                  {renderNavItem("Process records", "/fish-processes/view-summary")}
                </>
              )}
            </>
          )}

          {/* --- FEED MANAGEMENT --- */}
          {hasPermission(userTypes, 'feed') && (
            <>
              <span className={styles.sectionLabel}>FEED MANAGEMENT</span>
              {renderDirectLink("Dashboard", "/feed/dashboard", <IoGridOutline size={25} className="me-1" />)}
              {renderCard("raw_materials", "Raw Materials", <GiChipsBag size={25} className="me-1" />,
                <>
                  {renderNavItem("Raw Material Inventory", "/feed/raw-materials")}
                </>
              )}
              {renderCard("feed_production", "Feed production", <GiFoodChain size={25} className="me-1" />,
                <>
                  {renderNavItem("Create batch", "/feed/production/create")}
                  {renderNavItem("Production History", "/feed/production/history")}
                </>
              )}
              {renderCard("feed_inventory", "Feed Inventory", <GiChipsBag size={25} className="me-1" />,
                <>
                  {renderNavItem("View all", "/feed/inventory/overview")}
                  {renderNavItem("History", "/feed/inventory-history")}
                </>
              )}
            </>
          )}

          {/* --- INVENTORY --- */}
          {(hasPermission(userTypes, 'store') || hasPermission(userTypes, 'products') || hasPermission(userTypes, 'showcase')) && (
            <>
              <span className={styles.sectionLabel}>INVENTORY</span>
              {hasPermission(userTypes, 'store') && renderCard("store", "Store", <RiStoreFill size={25} className="me-1" />,
                <>
                  {renderNavItem("View all", "/store/view-all")}
                  {renderNavItem("History", "/store/inventory-history")}
                </>
              )}
              {hasPermission(userTypes, 'products') && renderCard("product", "Product", <GiFriedFish size={25} className="me-1" />,
                <>
                  {renderNavItem("Create", "/products/create-products")}
                  {renderNavItem("View", "/products/view-all")}
                </>
              )}
              {hasPermission(userTypes, 'showcase') && renderCard("showcase", "Showcase", <BsShopWindow size={25} className="me-1" />,
                <>
                  {renderNavItem("Whole Showcase", "/showcase/whole-showcase")}
                  {renderNavItem("Broken Showcase", "/showcase/broken-showcase")}
                </>
              )}
            </>
          )}

          {/* --- FINANCE --- */}
          {(hasPermission(userTypes, 'finance:add-sales') ||
            hasPermission(userTypes, 'finance:add-expenses') ||
            hasPermission(userTypes, 'finance:ledger') ||
            hasPermission(userTypes, 'finance:cash-drawer') ||
            hasPermission(userTypes, 'customer') ||
            hasPermission(userTypes, 'supplier') ||
            hasPermission(userTypes, 'staff')) && (
            <>
              <span className={styles.sectionLabel}>FINANCE</span>
              {(hasPermission(userTypes, 'finance:add-sales') || hasPermission(userTypes, 'finance:add-expenses') || hasPermission(userTypes, 'finance:ledger')) && (
                renderCard("sales", "Sales", <MdPointOfSale size={25} className="me-1" />,
                  <>
                    {hasPermission(userTypes, 'finance:add-sales') && renderNavItem("New Sales", "/finance/add-sales")}
                    {hasPermission(userTypes, 'finance:add-expenses') && renderNavItem("New Expenses", "/finance/add-expenses")}
                    {hasPermission(userTypes, 'finance:ledger') && renderNavItem("Finance Ledger", "/finance/ledger")}
                  </>
                )
              )}
              {hasPermission(userTypes, 'customer') && renderCard("customer", "Customer", <MdOutlinePeople size={25} className="me-1" />,
                <>
                  {renderNavItem("New Customer", "/customer/add")}
                  {renderNavItem("All Customer", "/customer/view-all")}
                </>
              )}
              {hasPermission(userTypes, 'supplier') && renderCard("supplier", "Supplier", <FaHandHoldingUsd size={25} className="me-1" />,
                <>
                  {renderNavItem("New Supplier", "/finance/supplier/new")}
                  {renderNavItem("All Supplier", "/finance/supplier/view-all")}
                </>
              )}
              {hasPermission(userTypes, 'finance:cash-drawer') && renderDirectLink("Cash Drawer", "/finance/cash-drawer", <MdAttachMoney size={25} className="me-1" />)}
              {hasPermission(userTypes, 'staff') && renderCard("staff", "Staff", <RiTeamFill size={25} className="me-1" />,
                <>
                  {renderNavItem("Staff Directory", "/finance/staff/directory")}
                  {renderNavItem("Attendance", "/finance/staff/attendance")}
                </>
              )}
            </>
          )}

          {/* --- REFERRAL SYSTEM --- */}
          {hasPermission(userTypes, 'referral') && (
            <>
              <span className={styles.sectionLabel}>REFERRAL SYSTEM</span>
              {renderCard("referral", "Referral System", <FaUsers size={25} className="me-1" />,
                <>
                  {renderNavItem("Dashboard", "/referral/dashboard")}
                  {renderNavItem("All Agents", "/referral/agents")}
                  {renderNavItem("Payout requests and Histories", "/referral/payouts")}
                </>
              )}
            </>
          )}

          {/* --- MLM --- */}
          {hasPermission(userTypes, 'mlm') && (
            <>
              <span className={styles.sectionLabel}>MLM</span>
              {renderCard("mlm", "MLM", <FaTree size={25} className="me-1" />,
                <>
                  {renderNavItem("Network Tree (Dashboard)", "/mlm/tree")}
                  {renderNavItem("Leaders, Downlines and commissions", "/mlm/leaders")}
                  {renderNavItem("Payout Requests", "/mlm/payouts")}
                  {renderNavItem("Earning report", "/mlm/earnings")}
                </>
              )}
            </>
          )}

          {/* --- COMPLAINTS --- */}
          {hasPermission(userTypes, 'complaints') && (
            <>
              <span className={styles.sectionLabel}>COMPLAINTS</span>
              {renderCard("complaints", "Complaints", <FaExclamationTriangle size={25} className="me-1" />,
                <>
                  {renderNavItem("Make a Complaint", "/complaints")}
                  {hasPermission(userTypes, 'complaints:view-all') && renderNavItem("All Complaints", "/complaints/all")}
                </>
              )}
            </>
          )}

          {/* --- DAMAGE / LOSS (kept as-is) --- */}
          {hasPermission(userTypes, 'damage-loss') && (
            <>
              <span className={styles.sectionLabel}>RECORDS</span>
              <Nav.Item className={`mt-3 ${isActiveRoute("/damage-loss") ? "mx-2" : ""}`}>
                <Nav.Link
                  onClick={() => navigate("/damage-loss")}
                  className={`${isActiveRoute("/damage-loss") ? styles.activeLink : styles.nonactiveLink}`}
                  data-active={isActiveRoute("/damage-loss") ? "true" : undefined}
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
            {(user.fullName || user.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow-1">
            <div className={styles.userName}>{user.fullName || user.name || "User"}</div>
            <div className={styles.userRole}>{(user.userTypes?.[0] || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || "User"}</div>
          </div>
          <FaChevronDown size={13} color="#9A8070" />
        </div>
      )}
    </div>
  );

  return (
    <aside>
      {/* Desktop Sidebar */}
      <section ref={sidebarRef} className={`position-fixed d-none d-lg-block ${styles.sidebar}`}>
        {sidebarContent}
      </section>

      {/* Tablet Offcanvas Sidebar */}
      <Offcanvas show={show} onHide={handleClose} className={`d-md-block d-lg-none ${styles.offcan}`} id="offcanvasSidebar">
        <Offcanvas.Header closeButton className={`text-light sticky-top shadow ${styles.offcan}`}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className={styles.offcan}>{sidebarContent}</Offcanvas.Body>
      </Offcanvas>
    </aside>
  );
}

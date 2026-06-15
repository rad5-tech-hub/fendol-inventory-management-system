import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

let sidebarScrollPos = 0;
import { Nav, Card, Collapse, Tooltip, OverlayTrigger, Offcanvas } from "react-bootstrap";
import { FaChevronRight, FaChevronDown, FaMapMarkerAlt, FaCircle, FaHouseUser, FaExchangeAlt, FaUsers, FaTrophy, FaTree, FaHandHoldingUsd, FaUserTie, FaMoneyCheckAlt, FaClock, FaClipboardList } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { BsShopWindow } from "react-icons/bs";
import { LuClipboardCheck, LuClipboardPenLine } from "react-icons/lu";
import { GiCannedFish, GiCirclingFish, GiFriedFish, GiChipsBag, GiDamagedHouse, GiPolarBear, GiFishingNet, GiFishing, GiDeadHead, GiFoodChain } from "react-icons/gi";
import { TbFishOff } from "react-icons/tb";
import { RiStoreFill, RiTeamFill } from "react-icons/ri";
import { MdOutlinePointOfSale, MdOutlineBarChart, MdOutlineInventory2, MdOutlinePeople, MdAttachMoney, MdPersonAdd, MdPointOfSale } from "react-icons/md";
import { SiGoogleanalytics } from "react-icons/si";
import styles from "./siderbar.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermission } from "../permissions/permissions";

export default function SideBar({ show, handleClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState({});
  const sidebarRef = useRef(null);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const user = useSelector((store) => store.user);

  useEffect(() => {
    const path = location.pathname;
    const updates = {};
    if (path.includes("/site-management")) updates.site_management = true;
    if (path.includes("/admin")) updates.users_and_roles = true;
    if (path.includes("/hatchery")) {
      updates.hatchery = true;
      if (path.includes('/hatchery/hatch-batches')) updates.hatch_batches = true;
      if (path.includes('/hatchery/broodstock')) updates.broodstock = true;
      if (path.includes('/hatchery/cost-analysis')) updates.cost_analysis = true;
    }
    if (path.includes("/ponds")) updates.pond_management = true;
    if (path.includes("/batch-dashboard")) updates.batch_dashboard = true;
    if (path.includes("/manage-fish")) updates.fish_activities = true;
    if (path.includes("/fish-processes")) updates.processing = true;
    if (path.includes("/feed")) {
      updates.feed_management = true;
      if (path.includes('/feed/production')) updates.feed_production = true;
      if (path.includes('/feed/inventory')) updates.feed_inventory = true;
    }
    if (path.includes("/store")) updates.store = true;
    if (path.includes("/products")) updates.product = true;
    if (path.includes("/showcase")) updates.showcase = true;
    if (path.includes("/finance")) {
      updates.finance = true;
      if (path.includes('/finance/supplier')) updates.supplier = true;
      if (path.includes('/finance/staff')) updates.staff = true;
    }
    if (path.includes("/customer")) updates.customer = true;
    if (path.includes("/referral")) updates.referral = true;
    if (path.includes("/mlm")) updates.mlm = true;
    setOpen((prev) => ({ ...prev, ...updates }));

    // Restore sidebar scroll on the .navs element after open state settles
    requestAnimationFrame(() => {
      const section = sidebarRef.current;
      if (!section) return;
      const navsEl = section.querySelector(`[class*="${styles.navs}"]`);
      if (navsEl) navsEl.scrollTop = sidebarScrollPos;
    });

    // Save scroll on cleanup (unmount/navigation away)
    return () => {
      const section = sidebarRef.current;
      if (!section) return;
      const navsEl = section.querySelector(`[class*="${styles.navs}"]`);
      if (navsEl) sidebarScrollPos = navsEl.scrollTop;
    };
  }, [location.pathname]);

  // Save sidebar scroll position on the actual scrollable element (.navs)
  useEffect(() => {
    const section = sidebarRef.current;
    if (!section) return;
    const navsEl = section.querySelector(`[class*="${styles.navs}"]`);
    if (!navsEl) return;
    const handleScroll = () => { sidebarScrollPos = navsEl.scrollTop; };
    navsEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => navsEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggle = (key) => {
    setOpen((prev) => {
      if (!prev[key]) {
        const only = {};
        only[key] = true;
        return only;
      }
      return { ...prev, [key]: false };
    });
  };

  const renderNavItem = (label, route, icon) => (
    <Nav.Item className="mb-3">
      <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tooltip-${label}`}>{label}</Tooltip>}>
        <div
          onClick={() => navigate(route)}
          className={`${location.pathname === route ? styles.activeLink : styles.nonactiveLink}`}
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
          className={`${location.pathname.startsWith(route) ? styles.activeLink : styles.nonactiveLink}`}
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
      <Collapse in={open[sectionKey]} style={{ transitionDuration: "0s" }}>
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
        className={`border-0 d-flex justify-content-between align-items-center ${styles.cardHeader} ${location.pathname === route ? styles.dashboardLinkActive : ""} ${extraClass}`}
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
            const activeSite = useSelector((store) => store.activeSite);
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
              {renderDirectLink("Dashboard", "/hatchery/dashboard", <FaHouseUser size={25} className="me-1" />)}
              {renderCard("hatch_batches", "Hatch Batches", <GiCirclingFish size={25} className="me-1" />,
                <>
                  {renderNavItem("Create Hatch Batch", "/hatchery/hatch-batches/create")}
                  {renderNavItem("View all Batch", "/hatchery/hatch-batches/view-all")}
                </>
              )}
              {hasPermission(userTypes, 'hatchery') && renderDirectLink("Broodstock Management", "/hatchery/broodstock", <GiCirclingFish size={25} className="me-1" />)}
              {hasPermission(userTypes, 'hatchery') && renderDirectLink("Fry Production Records", "/hatchery/fry-production/daily-records", <GiCirclingFish size={25} className="me-1" />)}
              {hasPermission(userTypes, 'hatchery') && renderCard("cost_analysis", "Cost Analysis", <MdOutlinePointOfSale size={25} className="me-1" />,
                <>
                  {renderNavItem("Expenses", "/hatchery/cost-analysis/expenses")}
                  {renderNavItem("Cost Reports", "/hatchery/cost-analysis/cost-reports")}
                </>
              )}
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
              {hasPermission(userTypes, 'batch-dashboard') && renderCard("batch_dashboard", "Batch Dashboard", <MdOutlineBarChart size={25} className="me-1" />,
                <>
                  {renderNavItem("Dashboard Home", "/batch-dashboard")}
                  {renderNavItemStartsWith("Batch Summary", "/batch-dashboard/summary")}
                </>
              )}
              {hasPermission(userTypes, 'manage-fish') && renderCard("fish_activities", "Fish Activities", <GiCirclingFish size={25} className="me-1" />,
                <>
                  {renderNavItem("Add Fish (Transfer to Nursery)", "/manage-fish/add-fish")}
                  {renderNavItem("Move/Sort Fish", "/manage-fish/move-fish")}
                  {renderNavItem("Sampling", "/manage-fish/sampling")}
                  {renderNavItem("Harvest", "/manage-fish/harvest-fish")}
                  {renderNavItem("Mortality", "/manage-fish/mortality")}
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
              {renderCard("raw_materials", "Raw Materials", <GiChipsBag size={25} className="me-1" />,
                <>
                  {renderNavItem("Add Materials", "/feed/add-new")}
                  {renderNavItem("View all", "/feed/view-all")}
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
                  {renderNavItem("View all", "/feed/inventory/view-all")}
                  {renderNavItem("Add", "/feed/inventory/add")}
                  {renderNavItem("Use", "/feed/inventory/use")}
                  {renderNavItem("Top up", "/feed/inventory/top-up")}
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
                  {renderNavItem("Customers Dashboard", "/customer/personal-ledger")}
                </>
              )}
              {hasPermission(userTypes, 'supplier') && renderCard("supplier", "Supplier", <FaHandHoldingUsd size={25} className="me-1" />,
                <>
                  {renderNavItem("New Supplier", "/finance/supplier/new")}
                  {renderNavItem("All Supplier", "/finance/supplier/view-all")}
                  {renderNavItem("Supplier Dashboard", "/finance/supplier/dashboard")}
                </>
              )}
              {hasPermission(userTypes, 'finance:cash-drawer') && renderDirectLink("Cash Drawer", "/finance/cash-drawer", <MdAttachMoney size={25} className="me-1" />)}
              {hasPermission(userTypes, 'staff') && renderCard("staff", "Staff", <RiTeamFill size={25} className="me-1" />,
                <>
                  {renderNavItem("Staff Directory", "/finance/staff/directory")}
                  {renderNavItem("Payroll", "/finance/staff/payroll")}
                  {renderNavItem("Attendance", "/finance/staff/attendance")}
                  {renderNavItem("Appraisals", "/finance/staff/appraisals")}
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

          {/* --- DAMAGE / LOSS (kept as-is) --- */}
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

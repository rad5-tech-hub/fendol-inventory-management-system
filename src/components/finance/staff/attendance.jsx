import React, { useState } from 'react';
import { IoCalendarOutline, IoChevronDown, IoClose } from 'react-icons/io5';
import {
  FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiEye, FiClock, FiLogIn, FiLogOut, FiFileText,
} from 'react-icons/fi';
import { BsCheckCircleFill, BsInfoCircle, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import financeStyles from '../finance.module.scss';
import styles from './attendance.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_STYLES = {
  Present: { bg: '#DCFCE7', color: '#15803D' },
  Late: { bg: '#FEF3C7', color: '#B45309' },
  Absent: { bg: '#FEE2E2', color: '#DC2626' },
  'Off Day': { bg: '#F3F4F6', color: '#6B7280' },
};

// TODO: replace with real API call
const staffList = [
  { id: 'EMP-0012', name: 'John Okafor', position: 'Pond Manager', status: 'Present', avatar: null },
  { id: 'EMP-0013', name: 'Mary Uche', position: 'Hatchery Technician', status: 'Late', avatar: null },
  { id: 'EMP-0014', name: 'Emeka Obi', position: 'Store Keeper', status: 'Present', avatar: null },
  { id: 'EMP-0015', name: 'Grace Nwosu', position: 'Accountant', status: 'Absent', avatar: null },
  { id: 'EMP-0016', name: 'Tunde Musa', position: 'Feeding Officer', status: 'Present', avatar: null },
  { id: 'EMP-0017', name: 'Chinedu Agwu', position: 'Maintenance Officer', status: 'Late', avatar: null },
  { id: 'EMP-0018', name: 'Blessing Essien', position: 'Quality Controller', status: 'Present', avatar: null },
  { id: 'EMP-0019', name: 'Ibrahim Yusuf', position: 'Pond Assistant', status: 'Present', avatar: null },
  { id: 'EMP-0020', name: 'Ifeyinwa David', position: 'Admin Officer', status: 'Late', avatar: null },
  { id: 'EMP-0021', name: 'Samuel Eze', position: 'Security Guard', status: 'Present', avatar: null },
];

// TODO: replace with real API call
const attendanceHistory = [
  { date: 'Sat, May 24', checkIn: '07:46 AM', checkOut: '05:12 PM', status: 'Present', fine: 0, notes: 'Worked on pond 3' },
  { date: 'Fri, May 23', checkIn: '08:15 AM', checkOut: '05:05 PM', status: 'Late', fine: 100, notes: 'Reached late due to transport' },
  { date: 'Thu, May 22', checkIn: '07:50 AM', checkOut: '05:00 PM', status: 'Present', fine: 0, notes: '\u2013' },
  { date: 'Wed, May 21', checkIn: '08:30 AM', checkOut: '05:10 PM', status: 'Late', fine: 100, notes: 'Traffic was heavy' },
  { date: 'Tue, May 20', checkIn: null, checkOut: null, status: 'Absent', fine: 200, notes: 'No show' },
  { date: 'Mon, May 19', checkIn: '07:45 AM', checkOut: '05:02 PM', status: 'Present', fine: 0, notes: '\u2013' },
  { date: 'Sun, May 18', checkIn: null, checkOut: null, status: 'Off Day', fine: 0, notes: 'Sunday' },
];

const getInitials = (name) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = ['#2563EB', '#F97316', '#16A34A', '#7C3AED', '#DC2626', '#0D9488', '#EAB308', '#0891B2'];

export default function StaffAttendance() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const handleViewProfile = (staff) => {
    setSelectedStaff(staff);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedStaff(null), 300);
  };

  const getActionItems = (staff) => [
    {
      label: <><BsCheckCircleFill size={14} style={{ marginRight: 10, color: '#15803D' }} /> Check In</>,
      onClick: () => {},
      style: { color: '#15803D' },
    },
    {
      label: <><FiLogIn size={14} style={{ marginRight: 10, color: '#B45309' }} /> Check Out</>,
      onClick: () => {},
      style: { color: '#B45309' },
    },
    {
      label: <><FiFileText size={14} style={{ marginRight: 10, color: '#2563EB' }} /> Permission Log</>,
      onClick: () => {},
      style: { color: '#2563EB' },
    },
    {
      label: <><FiEye size={14} style={{ marginRight: 10, color: '#6B7280' }} /> View Profile</>,
      onClick: () => handleViewProfile(staff),
      style: { color: '#374151' },
    },
  ];

  const detailStaff = selectedStaff;
  const detailStatusStyle = detailStaff ? STATUS_STYLES[detailStaff.status] || {} : {};

  // Pick an avatar color based on name
  const avatarColorIndex = detailStaff
    ? detailStaff.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
    : 0;

  return (
    <section className={`${financeStyles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2 flex-grow-1">
        <div className={`${financeStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${financeStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>

            {/* ── BREADCRUMB ── */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Finance</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Staff</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Attendance</span>
            </div>

            {/* ── Master-Detail Split Layout ── */}
            <div className={styles.splitLayout}>

              {/* ════ LEFT PANEL: Staff List ════ */}
              <div className={`${styles.leftPanel} ${showDetail ? styles.leftPanelCompressed : ''}`}>

                {/* ── Filter Bar (no card wrapper) ── */}
                <div className={styles.filterBar}>
                  <div className={styles.searchWrapper}>
                    <FiSearch size={15} className={styles.searchIcon} />
                    <input type="text" className={styles.searchInput} placeholder="Search staff by name or ID..." />
                  </div>
                  <button className={styles.filterDropdown}>
                    All Status <IoChevronDown size={11} />
                  </button>
                  <button className={styles.filterDropdown}>
                    <IoCalendarOutline size={13} />
                    May 24, 2025
                  </button>
                  <button className={styles.filterActionBtn}>
                    <FiFilter size={13} />
                    Filter
                  </button>
                  <button className={styles.resetBtn}>
                    <FiRefreshCw size={13} />
                    Reset
                  </button>
                </div>

                {/* ── Section Heading ── */}
                <div className={styles.sectionHeading}>All Staff Members (18)</div>

                {/* ── Staff Table ── */}
                <div className={styles.tableCard}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Staff Name</th>
                          <th>Staff ID</th>
                          <th>Position</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((staff, i) => {
                          const statusStyle = STATUS_STYLES[staff.status] || {};
                          const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                          return (
                            <tr key={staff.id}
                              className={selectedStaff?.id === staff.id ? styles.activeRow : ''}
                              onClick={() => handleViewProfile(staff)}
                            >
                              <td className={styles.rowNum}>{i + 1}</td>
                              <td>
                                <div className={styles.staffNameCell}>
                                  <span className={styles.avatarSmall} style={{ background: avatarBg }}>
                                    {getInitials(staff.name)}
                                  </span>
                                  {staff.name}
                                </div>
                              </td>
                              <td className={styles.staffIdCell}>{staff.id}</td>
                              <td>{staff.position}</td>
                              <td>
                                <span className={styles.statusPill} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                  {staff.status}
                                </span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <PortalDropdown
                                  btnClass={financeStyles.threeDotBtn}
                                  menuStyle={{
                                    background: '#fff',
                                    color: '#374151',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderRadius: 8,
                                    padding: '4px 0',
                                  }}
                                  items={getActionItems(staff)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Table Footer ── */}
                  <div className={styles.tableFooter}>
                    <span className={styles.footerInfo}>Showing 1 to 10 of 18 staff</span>
                    <div className={styles.pagination}>
                      <button className={styles.pageArrow}>
                        <FiChevronLeft size={15} />
                      </button>
                      <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                      <button className={styles.pageBtn}>2</button>
                      <button className={styles.pageArrow}>
                        <FiChevronRight size={15} />
                      </button>
                      <button className={styles.perPageDropdown}>
                        10 / page <IoChevronDown size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ════ RIGHT PANEL: Staff Detail (docked) ════ */}
              {showDetail && detailStaff && (
                <>
                  {/* Overlay for mobile */}
                  <div className={styles.detailOverlay} onClick={handleCloseDetail} />
                  <div className={styles.rightPanel}>
                    <div className={styles.detailHeader}>
                      <div className={styles.detailHeaderLeft}>
                        <span className={styles.avatarLarge} style={{ background: AVATAR_COLORS[avatarColorIndex] }}>
                          {getInitials(detailStaff.name)}
                        </span>
                        <div className={styles.detailNameGroup}>
                          <span className={styles.detailName}>{detailStaff.name}</span>
                          <span className={styles.detailRole}>{detailStaff.position}</span>
                        </div>
                        <span className={styles.statusPill} style={{ background: detailStatusStyle.bg, color: detailStatusStyle.color }}>
                          {detailStaff.status}
                        </span>
                      </div>
                      <button className={styles.closeBtn} onClick={handleCloseDetail}>
                        <IoClose size={20} />
                      </button>
                    </div>

                    {/* ── Info Grid ── */}
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCell}>
                        <span className={styles.infoLabel}>Staff ID</span>
                        <span className={styles.infoValue}>{detailStaff.id}</span>
                      </div>
                      <div className={styles.infoCell}>
                        <span className={styles.infoLabel}>Date Joined</span>
                        <span className={styles.infoValue}>Jan 15, 2024</span>
                      </div>
                      <div className={styles.infoCell}>
                        <span className={styles.infoLabel}>Email</span>
                        <span className={styles.infoValue}>john.okafor@fendol.com</span>
                      </div>
                      <div className={styles.infoCell}>
                        <span className={styles.infoLabel}>Site</span>
                        <span className={styles.infoValue}>The Hatchery Site</span>
                      </div>
                    </div>

                    {/* ── Today's Summary ── */}
                    <div className={styles.sectionLabel}>Today's Summary (May 24, 2025)</div>
                    <div className={styles.summaryRow}>
                      <div className={styles.summaryBox}>
                        <FiClock size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Status</span>
                        <span className={styles.summaryValue} style={{ color: '#15803D' }}>Present</span>
                      </div>
                      <div className={styles.summaryBox}>
                        <FiLogIn size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Check In</span>
                        <span className={styles.summaryValue} style={{ color: '#111827' }}>07:46 AM</span>
                      </div>
                      <div className={styles.summaryBox}>
                        <FiLogOut size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Check Out</span>
                        <span className={styles.summaryValue} style={{ color: '#B45309' }}>05:12 PM</span>
                      </div>
                      <div className={styles.summaryBox}>
                        <BsInfoCircle size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Work Time</span>
                        <span className={styles.summaryValue} style={{ color: '#2563EB' }}>9h 26m</span>
                      </div>
                    </div>

                    {/* ── Attendance History ── */}
                    <div className={styles.historyHeader}>
                      <span className={styles.sectionLabel}>Attendance History</span>
                      <div className={styles.weekNav}>
                        <IoCalendarOutline size={13} />
                        <span className={styles.weekRange}>May 18 - May 24, 2025</span>
                        <button className={styles.weekArrow}><BsChevronLeft size={12} /></button>
                        <button className={styles.weekArrow}><BsChevronRight size={12} /></button>
                      </div>
                    </div>

                    <div className={styles.historyTableWrapper}>
                      <table className={styles.historyTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Fine (&#8358;)</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.map((row, i) => {
                            const hs = STATUS_STYLES[row.status] || {};
                            const isLate = row.status === 'Late';
                            const totalFines = attendanceHistory.reduce((sum, r) => sum + r.fine, 0);
                            return (
                              <tr key={i}>
                                <td className={styles.dateCell}>{row.date}</td>
                                <td className={isLate ? styles.lateTimeCell : styles.timeCell}>
                                  {row.checkIn || '\u2013'}
                                </td>
                                <td className={isLate ? styles.lateTimeCell : styles.timeCell}>
                                  {row.checkOut || '\u2013'}
                                </td>
                                <td>
                                  <span className={styles.statusPillSmall} style={{ background: hs.bg, color: hs.color }}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className={styles.fineCell}>{f(row.fine)}</td>
                                <td className={styles.notesCell}>{row.notes}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Total Fines ── */}
                    <div className={styles.totalFinesRow}>
                      <span className={styles.totalFinesLabel}>Total Fines (This Week)</span>
                      <span className={styles.totalFinesValue}>
                        {'\u20A6'}{f(attendanceHistory.reduce((sum, r) => sum + r.fine, 0))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </main>
        </section>
      </div>
    </section>
  );
}

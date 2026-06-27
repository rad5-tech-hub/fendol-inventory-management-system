import React, { useState, useEffect, useCallback } from 'react';
import { IoCalendarOutline, IoChevronDown, IoClose, IoTimeOutline } from 'react-icons/io5';
import {
  FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiEye, FiClock, FiLogIn, FiLogOut, FiFileText, FiCheckCircle, FiX,
} from 'react-icons/fi';
import { BsCheckCircleFill, BsInfoCircle, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { FaUserCheck, FaRegCommentDots } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import { ApiV2 } from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import financeStyles from '../finance.module.scss';
import styles from './attendance.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_STYLES = {
  Present: { bg: '#DCFCE7', color: '#15803D' },
  Late: { bg: '#FEF3C7', color: '#B45309' },
  Absent: { bg: '#FEE2E2', color: '#DC2626' },
  'Off Day': { bg: '#F3F4F6', color: '#6B7280' },
};



const formatTime = (iso) => {
  if (!iso) return null;
  const [h, m] = iso.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const formatDateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const STATUS_API_MAP = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  'off-day': 'Off Day',
};

const getInitials = (name) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = ['#512728', '#6B3A3B', '#854D4E', '#9E6162', '#3D1E1F', '#7A4445', '#4F2A2B', '#8C5556'];

export default function StaffAttendance() {
  const user = useSelector((state) => state.user);
  const activeSite = useSelector((state) => state.activeSite);
  const userTypes = user?.userTypes || [];
  const userSiteId = user?.siteId || activeSite?.id || null;
  const isSuperAdmin = userTypes.includes('super_admin');

  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [search, setSearch] = useState('');

  const [attendanceModal, setAttendanceModal] = useState({ show: false, mode: 'checkin', staff: null, loading: false });
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  const [attendanceForm, setAttendanceForm] = useState({ date: todayStr, time: timeStr, comment: '' });

  const fetchAttendanceData = useCallback(async () => {
    try {
      const siteParam = isSuperAdmin ? 'all' : (userSiteId || 'all');
      const [staffRes, attRes] = await Promise.all([
        ApiV2.get('/api/v1/staff', { params: { siteId: siteParam } }),
        ApiV2.get('/v2/attendances', { params: { siteId: siteParam } }).catch((err) => {
          console.error('[Attendance] fetch attendances failed:', {
            siteParam,
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          return null;
        }),
      ]);

      const staffData = Array.isArray(staffRes.data?.data) ? staffRes.data.data : [];
      const attData = Array.isArray(attRes?.data?.data) ? attRes.data.data : [];

      if (!staffData.length) {
        console.warn('[Attendance] no staff data returned for siteParam:', siteParam);
      }

      // Merge latest attendance status into staff list
      const latestByStaff = {};
      for (const a of attData) {
        const prev = latestByStaff[a.staffId];
        if (!prev || new Date(a.date) > new Date(prev.date)) {
          latestByStaff[a.staffId] = a;
        }
      }

      setStaffList(staffData.map(s => ({
        id: s.id,
        name: s.name,
        position: s.role,
        status: STATUS_API_MAP[latestByStaff[s.id]?.status] || '\u2014',
        siteId: s.UserSites?.[0]?.Site?.id || null,
        avatar: null,
      })));

      setAttendanceRecords(attData);
    } catch (err) {
      console.error('[Attendance] fetch failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        stack: err.stack,
      });
    }
  }, [isSuperAdmin, userSiteId]);

  useEffect(() => {
    (async () => {
      await fetchAttendanceData();
      setLoadingStaff(false);
    })();
  }, [fetchAttendanceData]);

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

  const openModal = (mode, staff) => {
    const n = new Date();
    setAttendanceForm({ date: n.toISOString().split('T')[0], time: n.toTimeString().split(' ')[0], comment: '' });
    setAttendanceModal({ show: true, mode, staff, loading: false });
  };

  const closeModal = () => {
    if (attendanceModal.loading) return;
    setAttendanceModal({ show: false, mode: 'checkin', staff: null, loading: false });
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    const { staff, mode, loading } = attendanceModal;
    if (!staff || loading) return;
    setAttendanceModal(prev => ({ ...prev, loading: true }));
    try {
      let payload, endpoint, successMsg, errorMsg;
      if (mode === 'checkin') {
        payload = { staffId: staff.id, date: attendanceForm.date, checkIn: attendanceForm.time, comment: attendanceForm.comment.trim() || undefined };
        endpoint = '/v2/attendance/check-in';
        successMsg = 'Check-in recorded successfully!';
        errorMsg = 'Failed to check in.';
      } else if (mode === 'checkout') {
        payload = { staffId: staff.id, date: attendanceForm.date, checkOut: attendanceForm.time, comment: attendanceForm.comment.trim() || undefined };
        endpoint = '/v2/attendance/check-out';
        successMsg = 'Check-out recorded successfully!';
        errorMsg = 'Failed to check out.';
      } else {
        payload = { staffId: staff.id, date: attendanceForm.date, comment: attendanceForm.comment.trim() || undefined };
        endpoint = '/v2/attendance/mark-absent';
        successMsg = 'Staff marked as absent.';
        errorMsg = 'Failed to mark absent.';
      }
      const siteId = staff.siteId || userSiteId || 'all';
      await ApiV2.post(endpoint, payload, { params: { siteId } });
      toast.success(successMsg, { className: 'dark-toast' });
      closeModal();
      await fetchAttendanceData();
    } catch (err) {
      const msg = err.response?.data?.response_message || errorMsg;
      console.error(`[Attendance] ${endpoint} failed:`, {
        payload,
        siteId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      toast.error(msg, { className: 'dark-toast' });
    } finally {
      setAttendanceModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getActionItems = (staff) => [
    {
      label: <><BsCheckCircleFill size={14} style={{ marginRight: 10, color: '#15803D' }} /> Check In</>,
      onClick: () => openModal('checkin', staff),
      style: { color: '#15803D' },
    },
    {
      label: <><FiLogIn size={14} style={{ marginRight: 10, color: '#B45309' }} /> Check Out</>,
      onClick: () => openModal('checkout', staff),
      style: { color: '#B45309' },
    },
    {
      label: <><FiFileText size={14} style={{ marginRight: 10, color: '#2563EB' }} /> Permission Log</>,
      onClick: () => openModal('absent', staff),
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

  const renderSkeletonRows = (count = 8) => (
    <div className={styles.skeletonTable}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonCell} style={{ width: '6%' }}>
            <div className={styles.skeletonBar} style={{ width: '50%', height: 12 }} />
          </div>
          <div className={styles.skeletonCell} style={{ width: '30%' }}>
            <div className={styles.skeletonAvatarBar}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonBar} style={{ width: '55%', height: 12 }} />
            </div>
          </div>
          <div className={styles.skeletonCell} style={{ width: '20%' }}>
            <div className={styles.skeletonBar} style={{ width: '45%', height: 12 }} />
          </div>
          <div className={styles.skeletonCell} style={{ width: '24%' }}>
            <div className={styles.skeletonBar} style={{ width: '50%', height: 12 }} />
          </div>
          <div className={styles.skeletonCell} style={{ width: '12%' }}>
            <div className={styles.skeletonBar} style={{ width: '60%', height: 12 }} />
          </div>
          <div className={styles.skeletonCell} style={{ width: '8%' }}>
            <div className={styles.skeletonBar} style={{ width: '50%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );

  // Derive detail panel data from attendance records
  const detailAttendance = detailStaff
    ? attendanceRecords.filter(a => a.staffId === detailStaff.id)
    : [];

  const detailLatest = detailAttendance.length
    ? detailAttendance.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b)
    : null;

  const detailToday = detailLatest;
  const detailTodayStatus = detailToday ? STATUS_API_MAP[detailToday.status] || '\u2014' : '\u2014';
  const detailTodayCheckIn = detailToday ? formatTime(detailToday.checkIn) : '\u2014';
  const detailTodayCheckOut = detailToday ? formatTime(detailToday.checkOut) : '\u2014';

  const workTime = detailToday?.checkIn && detailToday?.checkOut
    ? (() => {
        const [ih, im] = detailToday.checkIn.split(':').map(Number);
        const [oh, om] = detailToday.checkOut.split(':').map(Number);
        const diff = (oh * 60 + om) - (ih * 60 + im);
        if (diff <= 0) return '\u2014';
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${m}m`;
      })()
    : '\u2014';

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

            <ToastContainer />
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
                    <input type="text" className={styles.searchInput} placeholder="Search staff by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <div className={styles.sectionHeading}>All Staff Members ({staffList.length})</div>

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
                        {loadingStaff ? (
                          <tr><td colSpan={6} style={{ padding: 0, border: 'none' }}>{renderSkeletonRows()}</td></tr>
                        ) : (() => {
                          const filtered = !search.trim()
                            ? staffList
                            : staffList.filter(s =>
                                s.name.toLowerCase().includes(search.toLowerCase()) ||
                                s.id.toLowerCase().includes(search.toLowerCase())
                              );
                          return filtered.length === 0
                            ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No staff found.</td></tr>
                            : filtered.map((staff, i) => {
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
                        });
                      })()}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Table Footer ── */}
                  <div className={styles.tableFooter}>
                    <span className={styles.footerInfo}>{staffList.length} staff members</span>
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
                        <span className={styles.infoLabel}>Position</span>
                        <span className={styles.infoValue}>{detailStaff.position}</span>
                      </div>
                      <div className={styles.infoCell}>
                        <span className={styles.infoLabel}>Total Records</span>
                        <span className={styles.infoValue}>{detailAttendance.length}</span>
                      </div>
                      <div className={styles.infoCell}>
                        <span className={styles.infoLabel}>Latest Status</span>
                        <span className={styles.infoValue} style={{ color: detailLatest ? (STATUS_STYLES[detailTodayStatus]?.color || '#111827') : '#9CA3AF' }}>
                          {detailTodayStatus}
                        </span>
                      </div>
                    </div>

                    {/* ── Today's Summary ── */}
                    <div className={styles.sectionLabel}>Latest Attendance {detailToday ? `(${formatDateLabel(detailToday.date)})` : ''}</div>
                    <div className={styles.summaryRow}>
                      <div className={styles.summaryBox}>
                        <FiClock size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Status</span>
                        <span className={styles.summaryValue} style={{ color: (STATUS_STYLES[detailTodayStatus]?.color || '#9CA3AF') }}>
                          {detailTodayStatus}
                        </span>
                      </div>
                      <div className={styles.summaryBox}>
                        <FiLogIn size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Check In</span>
                        <span className={styles.summaryValue} style={{ color: '#111827' }}>{detailTodayCheckIn}</span>
                      </div>
                      <div className={styles.summaryBox}>
                        <FiLogOut size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Check Out</span>
                        <span className={styles.summaryValue} style={{ color: '#B45309' }}>{detailTodayCheckOut}</span>
                      </div>
                      <div className={styles.summaryBox}>
                        <BsInfoCircle size={14} className={styles.summaryIcon} />
                        <span className={styles.summaryLabel}>Work Time</span>
                        <span className={styles.summaryValue} style={{ color: '#2563EB' }}>{workTime}</span>
                      </div>
                    </div>

                    {/* ── Attendance History ── */}
                    <div className={styles.historyHeader}>
                      <span className={styles.sectionLabel}>Attendance History</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{detailAttendance.length} records</span>
                    </div>

                    <div className={styles.historyTableWrapper}>
                      <table className={styles.historyTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailAttendance.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>No attendance records found.</td>
                            </tr>
                          )}
                          {detailAttendance.slice().reverse().map((row, i) => {
                            const s = STATUS_API_MAP[row.status] || '\u2014';
                            const hs = STATUS_STYLES[s] || {};
                            const isLate = row.status === 'late';
                            return (
                              <tr key={row.id || i}>
                                <td className={styles.dateCell}>{formatDateLabel(row.date)}</td>
                                <td className={isLate ? styles.lateTimeCell : styles.timeCell}>
                                  {formatTime(row.checkIn) || '\u2014'}
                                </td>
                                <td className={isLate ? styles.lateTimeCell : styles.timeCell}>
                                  {formatTime(row.checkOut) || '\u2014'}
                                </td>
                                <td>
                                  <span className={styles.statusPillSmall} style={{ background: hs.bg, color: hs.color }}>
                                    {s}
                                  </span>
                                </td>
                                <td className={styles.notesCell}>{row.comment || '\u2014'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

          </main>
        </section>
      </div>

      {/* ── Check-In / Check-Out Modal ── */}
      {attendanceModal.show && attendanceModal.staff && (
        <div className={styles.checkinOverlay} onClick={closeModal}>
          <div className={styles.checkinModal} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const mode = attendanceModal.mode;
              const isCheckin = mode === 'checkin';
              const isCheckout = mode === 'checkout';
              const isAbsent = mode === 'absent';

              let modalIcon, modalTitle, confirmLabel, loadingLabel, submitClass, iconClass, placeholder;
              if (isCheckin) {
                modalIcon = <FaUserCheck />;
                modalTitle = 'Staff Check-In';
                confirmLabel = 'Confirm Check-In';
                loadingLabel = 'Checking in...';
                submitClass = styles.checkinSubmitBtn;
                iconClass = styles.checkinModalIcon;
                placeholder = 'Add a note about this check-in...';
              } else if (isCheckout) {
                modalIcon = <FiLogOut size={20} />;
                modalTitle = 'Staff Check-Out';
                confirmLabel = 'Confirm Check-Out';
                loadingLabel = 'Checking out...';
                submitClass = styles.checkoutSubmitBtn;
                iconClass = styles.checkoutModalIcon;
                placeholder = 'Add a note about this check-out...';
              } else {
                modalIcon = <FiFileText size={20} />;
                modalTitle = 'Permission Log';
                confirmLabel = 'Mark as Absent';
                loadingLabel = 'Marking absent...';
                submitClass = styles.absentSubmitBtn;
                iconClass = styles.absentModalIcon;
                placeholder = 'e.g. sick leave, personal day, emergency...';
              }

              return (
                <>
                  <div className={styles.checkinModalHeader}>
                    <div className={styles.checkinModalTitleGroup}>
                      <span className={iconClass}>{modalIcon}</span>
                      <div>
                        <h4 className={styles.checkinModalTitle}>{modalTitle}</h4>
                        <p className={styles.checkinModalSubtitle}>{attendanceModal.staff.name} &middot; {attendanceModal.staff.position}</p>
                      </div>
                    </div>
                    <button className={styles.checkinCloseBtn} onClick={closeModal} disabled={attendanceModal.loading}>
                      <FiX size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAttendanceSubmit}>
                    <div className={styles.checkinModalBody}>
                      <div className={isAbsent ? styles.checkinField : styles.checkinDatetimeGrid}>
                        <div className={styles.checkinField}>
                          <label className={styles.checkinLabel}>
                            <IoCalendarOutline size={14} /> Date
                          </label>
                          <input
                            type="date"
                            className={styles.checkinInput}
                            value={attendanceForm.date}
                            onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                            disabled={attendanceModal.loading}
                          />
                        </div>
                        {!isAbsent && (
                          <div className={styles.checkinField}>
                            <label className={styles.checkinLabel}>
                              <IoTimeOutline size={14} /> {isCheckin ? 'Check-In Time' : 'Check-Out Time'}
                            </label>
                            <input
                              type="time"
                              className={styles.checkinInput}
                              value={attendanceForm.time}
                              onChange={(e) => setAttendanceForm({ ...attendanceForm, time: e.target.value })}
                              disabled={attendanceModal.loading}
                              step="1"
                            />
                          </div>
                        )}
                      </div>

                      <div className={styles.checkinField}>
                        <label className={styles.checkinLabel}>
                          <FaRegCommentDots size={14} /> {isAbsent ? 'Reason' : 'Comment'} <span className={styles.checkinOptional}>(optional)</span>
                        </label>
                        <textarea
                          className={styles.checkinTextarea}
                          placeholder={placeholder}
                          value={attendanceForm.comment}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, comment: e.target.value })}
                          disabled={attendanceModal.loading}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className={styles.checkinModalFooter}>
                      <button type="button" className={styles.checkinCancelBtn} onClick={closeModal} disabled={attendanceModal.loading}>
                        Cancel
                      </button>
                      <button type="submit" className={submitClass} disabled={attendanceModal.loading}>
                        {attendanceModal.loading ? (
                          <><span className={styles.checkinSpinner} /> {loadingLabel}</>
                        ) : (
                          <><FiCheckCircle size={16} /> {confirmLabel}</>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}

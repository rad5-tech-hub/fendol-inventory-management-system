import React, { useState, useEffect } from 'react';
import { Pagination, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { FaPlus, FaSearch, FaMapMarkerAlt, FaChevronDown, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { VscOrganization } from 'react-icons/vsc';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './staff-directory.module.scss';

const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA', '#F5A623', '#4A90D9', '#2E7D32'];
const SITE_ICON_COLORS = ['#F5A623', '#8B4513', '#4A90D9', '#2E7D32', '#7B1FA2', '#D32F2F', '#1976D2', '#388E3C'];

const getInitials = (name) => {
  const parts = (name || '').trim().split(' ');
  return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '').toUpperCase();
};

const formatDate = (isoDate) => {
  if (!isoDate) return '\u2014';
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${mo}/${yr}`;
};

export default function StaffDirectory() {
  const user = useSelector((state) => state.user);
  const userTypes = user?.userTypes || [];
  const userSiteId = user?.siteId || null;
  const isSuperAdmin = userTypes.includes('super_admin');

  const [showSidebar, setShowSidebar] = useState(false);
  const [staff, setStaff] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', siteId: '' });
  const [formErrors, setFormErrors] = useState({});

  const mockStaff = [
    { id: 'mock-1', name: 'Okeke John', role: 'Doxology', createdAt: '2026-06-27T15:08:24.000Z' },
    { id: 'mock-2', name: 'Amina Bello', role: 'Vet Technician', createdAt: '2026-06-26T10:15:00.000Z' },
    { id: 'mock-3', name: 'Chidi Okafor', role: 'Feed Manager', createdAt: '2026-06-25T14:00:00.000Z' },
    { id: 'mock-4', name: 'Funke Adeyemi', role: 'Hatchery Tech', createdAt: '2026-06-24T09:45:00.000Z' },
    { id: 'mock-5', name: 'Ibrahim Musa', role: 'Accountant', createdAt: '2026-06-23T11:20:00.000Z' },
    { id: 'mock-6', name: 'Ngozi Eze', role: 'Quality Control', createdAt: '2026-06-22T07:00:00.000Z' },
    { id: 'mock-7', name: 'Tunde Balogun', role: 'Maintenance', createdAt: '2026-06-21T16:30:00.000Z' },
    { id: 'mock-8', name: 'Sade Ogun', role: 'Sales Rep', createdAt: '2026-06-20T13:10:00.000Z' },
    { id: 'mock-9', name: 'Emeka Nwosu', role: 'Security Lead', createdAt: '2026-06-19T08:00:00.000Z' },
    { id: 'mock-10', name: 'Hauwa Mohammed', role: 'Admin Officer', createdAt: '2026-06-18T10:00:00.000Z' },
    { id: 'mock-11', name: 'Kelechi Okoro', role: 'Driver', createdAt: '2026-06-17T12:00:00.000Z' },
    { id: 'mock-12', name: 'Bisi Adegoke', role: 'Store Keeper', createdAt: '2026-06-16T09:30:00.000Z' },
    { id: 'mock-13', name: 'Yakubu Garba', role: 'Hatchery Assistant', createdAt: '2026-06-15T15:00:00.000Z' },
    { id: 'mock-14', name: 'Chioma Obi', role: 'Lab Technician', createdAt: '2026-06-14T11:00:00.000Z' },
    { id: 'mock-15', name: 'Rashid Idris', role: 'Pond Manager', createdAt: '2026-06-13T08:00:00.000Z' },
  ];

  const mockSites = [
    { id: 'site-1', name: 'Lagos Farm' },
    { id: 'site-2', name: 'Ibadan Farm' },
    { id: 'site-3', name: 'Port Harcourt Farm' },
  ];

  const [staffBySite, setStaffBySite] = useState({});
  const [siteLoading, setSiteLoading] = useState(false);

  const fetchAllStaff = async () => {
    try {
      setLoading(true);
      const siteParam = isSuperAdmin ? 'all' : (userSiteId || 'all');
      const res = await ApiV2.get('/api/v1/staff', { params: { siteId: siteParam } });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  };

  const fetchSites = async () => {
    try {
      const res = await ApiV2.get('/v2/all-site');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      return data.length ? data : mockSites;
    } catch {
      return mockSites;
    }
  };

  useEffect(() => {
    (async () => {
      const [staffData, siteData] = await Promise.all([
        fetchAllStaff(),
        isSuperAdmin ? fetchSites() : Promise.resolve([]),
      ]);
      setStaff(staffData.length ? staffData : mockStaff);
      setSites(siteData);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (viewMode !== 'by-site' || !isSuperAdmin || !sites.length) return;
    (async () => {
      setSiteLoading(true);
      const grouped = {};
      for (const site of sites) {
        try {
          const res = await ApiV2.get('/api/v1/staff', { params: { siteId: site.id } });
          const data = Array.isArray(res.data?.data) ? res.data.data : [];
          if (data.length) grouped[site.name] = data;
        } catch {
          // skip site on error
        }
      }
      if (!Object.keys(grouped).length) {
        grouped['All Staff'] = staff;
      }
      setStaffBySite(grouped);
      setCollapsedSites(new Set(Object.keys(grouped)));
      setSiteLoading(false);
    })();
  }, [viewMode, sites]);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const searched = search.trim()
    ? staff.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(search.toLowerCase())
      )
    : staff;

  const flatList = viewMode === 'all' || !isSuperAdmin ? searched : [];
  const pageCount = Math.ceil(flatList.length / itemsPerPage);
  const currentItems = flatList.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handlePageClick = (page) => setCurrentPage(page);
  const toggleSiteCollapse = (name) => {
    setCollapsedSites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const openModal = () => {
    setForm({ name: '', role: '', siteId: isSuperAdmin ? '' : userSiteId || '' });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (modalLoading) return;
    setShowModal(false);
    setForm({ name: '', role: '', siteId: '' });
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Staff name is required';
    if (!form.role.trim()) errs.role = 'Role is required';
    if (isSuperAdmin && !form.siteId) errs.siteId = 'Please select a site';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setModalLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        siteId: form.siteId || undefined,
      };
      await ApiV2.post('/api/v1/create-staff', payload);
      toast.success('Staff created successfully!', { className: 'dark-toast' });
      closeModal();
      const fresh = await fetchAllStaff();
      setStaff(fresh.length ? fresh : mockStaff);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create staff. Please try again.';
      toast.error(msg, { className: 'dark-toast' });
    } finally {
      setModalLoading(false);
    }
  };

  const renderTable = (rows) => (
    <table className={styles.staffTable}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Staff Name</th>
          <th>Role</th>
          <th>Site</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s, idx) => (
          <tr key={s.id || idx}>
            <td style={{ color: '#8C949B', fontSize: 13 }}>{formatDate(s.createdAt)}</td>
            <td>
              <div className={styles.nameCell}>
                <div
                  className={styles.avatar}
                  style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                >
                  {getInitials(s.name)}
                </div>
                <span>{s.name}</span>
              </div>
            </td>
            <td><span className={styles.rolePill}>{s.role}</span></td>
            <td>
              <span className={styles.sitePill}>
                <FaMapMarkerAlt size={10} />
                {s._siteName || '\u2014'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEmpty = (msg = 'No staff found.') => (
    <div className={styles.emptyState}>
      <VscOrganization size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
      <h5>{msg}</h5>
      <p>Create a new staff member to get started.</p>
    </div>
  );

  const renderLoading = () => (
    <div className={styles.emptyState}>
      <div className={styles.loadingSpinner} style={{ borderTopColor: '#512728', borderColor: '#E5E7EB', width: 32, height: 32, margin: '0 auto 12px' }} />
      <p style={{ color: '#8C949B' }}>Loading staff...</p>
    </div>
  );

  return (
    <section className={styles.body}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <div className={styles.page}>
            <ToastContainer />

            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <span>Finance</span>
              <span className={styles.separator}>&gt;</span>
              <span>Staff</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Staff Directory</span>
            </div>

            {/* Page header */}
            <div className={styles.pageHeader}>
              <div>
                <h2 className={styles.pageTitle}>Staff Directory</h2>
                <p className={styles.pageSubtitle}>
                  {isSuperAdmin
                    ? 'Manage all staff across sites.'
                    : 'View and manage your site staff.'}
                </p>
              </div>
              <div className={styles.headerActions}>
                <div className={styles.searchWrapper}>
                  <FaSearch className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    placeholder="Search staff..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                  />
                </div>
                <button className={styles.createBtn} onClick={openModal}>
                  <FaPlus /> Create Staff
                </button>
              </div>
            </div>

            {/* View toggle (super admin only) */}
            {isSuperAdmin && (
              <div className={styles.toggleBar}>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'all' ? styles.toggleBtnActive : ''}`}
                  onClick={() => { setViewMode('all'); setCurrentPage(0); }}
                >
                  All Staff
                </button>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'by-site' ? styles.toggleBtnActive : ''}`}
                  onClick={() => { setViewMode('by-site'); setCurrentPage(0); }}
                >
                  By Site
                </button>
              </div>
            )}

            {/* Content */}
            {loading ? (
              renderLoading()
            ) : staff.length === 0 ? (
              renderEmpty()
            ) : searched.length === 0 ? (
              renderEmpty('No staff match your search.')
            ) : isSuperAdmin && viewMode === 'by-site' ? (
              <>
                {siteLoading && (
                  <div className={styles.staffCountChip} style={{ color: '#8C949B' }}>
                    Loading staff by site...
                  </div>
                )}
                {!siteLoading && Object.keys(staffBySite).length === 0 && (
                  <Alert variant="info" className="text-center py-3">No staff found for the selected view.</Alert>
                )}
                {!siteLoading && Object.keys(staffBySite).map((siteName, si) => (
                  <div key={siteName} className={styles.siteCard}>
                    <div className={styles.siteCardHeader} onClick={() => toggleSiteCollapse(siteName)}>
                      <div className={styles.siteCardHeaderLeft}>
                        <div
                          className={styles.siteIcon}
                          style={{ background: SITE_ICON_COLORS[si % SITE_ICON_COLORS.length] }}
                        >
                          <FaMapMarkerAlt />
                        </div>
                        <h5 className={styles.siteName}>{siteName}</h5>
                      </div>
                      <div className={styles.siteCardHeaderRight}>
                        <span className={styles.staffCount}>
                          {staffBySite[siteName].length} {staffBySite[siteName].length === 1 ? 'staff' : 'staff'}
                        </span>
                        <span
                          className={`${styles.collapseChevron} ${collapsedSites.has(siteName) ? styles.collapseChevronClosed : ''}`}
                        >
                          <FaChevronDown />
                        </span>
                      </div>
                    </div>
                    {!collapsedSites.has(siteName) && (
                      <>
                        <hr className={styles.siteCardDivider} />
                        <div className={styles.siteCardBody}>
                          {renderTable(staffBySite[siteName])}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className={styles.staffCountChip}>
                  Showing {currentPage * itemsPerPage + 1}&ndash;{Math.min((currentPage + 1) * itemsPerPage, flatList.length)} of {flatList.length} staff
                </div>
                <div className={styles.tableWrapper}>
                  {renderTable(currentItems)}
                </div>
                <div className={styles.tableFooter}>
                  <span>Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, flatList.length)} of {flatList.length} staff</span>
                  <Pagination>
                    <Pagination.First onClick={() => setCurrentPage(0)} disabled={currentPage === 0} />
                    <Pagination.Prev onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} />
                    {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                      let pageNum;
                      if (pageCount <= 7) {
                        pageNum = i;
                      } else if (currentPage <= 3) {
                        pageNum = i;
                      } else if (currentPage >= pageCount - 4) {
                        pageNum = pageCount - 7 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => handlePageClick(pageNum)}
                        >
                          {pageNum + 1}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage === pageCount - 1} />
                    <Pagination.Last onClick={() => setCurrentPage(pageCount - 1)} disabled={currentPage === pageCount - 1} />
                  </Pagination>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Create Staff Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>Create Staff</h4>
              <button className={styles.modalCloseBtn} onClick={closeModal} disabled={modalLoading}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div>
                    <label className={styles.formLabel}>
                      Full Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      className={`${styles.formInput} ${formErrors.name ? styles.formInputError : ''}`}
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                      }}
                      disabled={modalLoading}
                    />
                    {formErrors.name && <div className={styles.fieldError}><FaExclamationCircle /> {formErrors.name}</div>}
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Role <span className={styles.required}>*</span>
                    </label>
                    <input
                      className={`${styles.formInput} ${formErrors.role ? styles.formInputError : ''}`}
                      placeholder="e.g. Doxology"
                      value={form.role}
                      onChange={(e) => {
                        setForm({ ...form, role: e.target.value });
                        if (formErrors.role) setFormErrors({ ...formErrors, role: undefined });
                      }}
                      disabled={modalLoading}
                    />
                    {formErrors.role && <div className={styles.fieldError}><FaExclamationCircle /> {formErrors.role}</div>}
                  </div>

                  {isSuperAdmin && (
                    <div className={styles.formGroupFull}>
                      <label className={styles.formLabel}>
                        Assign Site <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={`${styles.formSelect} ${formErrors.siteId ? styles.formInputError : ''}`}
                        value={form.siteId}
                        onChange={(e) => {
                          setForm({ ...form, siteId: e.target.value });
                          if (formErrors.siteId) setFormErrors({ ...formErrors, siteId: undefined });
                        }}
                        disabled={modalLoading || sites.length === 0}
                      >
                        <option value="">{sites.length === 0 ? 'No sites available' : 'Select a site'}</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                      </select>
                      {formErrors.siteId && <div className={styles.fieldError}><FaExclamationCircle /> {formErrors.siteId}</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={modalLoading}>
                  {modalLoading ? (
                    <><span className={styles.loadingSpinner} /> Creating...</>
                  ) : (
                    <><FaPlus /> Create Staff</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

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
    { id: 1, name: 'Okeke John', role: 'Doxology', createdAt: '2025-05-12T08:30:00Z', siteId: 'site-1', Site: { id: 'site-1', name: 'Lagos Farm' } },
    { id: 2, name: 'Amina Bello', role: 'Vet Technician', createdAt: '2025-05-10T10:15:00Z', siteId: 'site-2', Site: { id: 'site-2', name: 'Ibadan Farm' } },
    { id: 3, name: 'Chidi Okafor', role: 'Feed Manager', createdAt: '2025-05-08T14:00:00Z', siteId: 'site-1', Site: { id: 'site-1', name: 'Lagos Farm' } },
    { id: 4, name: 'Funke Adeyemi', role: 'Hatchery Tech', createdAt: '2025-05-06T09:45:00Z', siteId: 'site-3', Site: { id: 'site-3', name: 'Port Harcourt Farm' } },
    { id: 5, name: 'Ibrahim Musa', role: 'Accountant', createdAt: '2025-05-04T11:20:00Z', siteId: 'site-2', Site: { id: 'site-2', name: 'Ibadan Farm' } },
    { id: 6, name: 'Ngozi Eze', role: 'Quality Control', createdAt: '2025-04-28T07:00:00Z', siteId: 'site-1', Site: { id: 'site-1', name: 'Lagos Farm' } },
    { id: 7, name: 'Tunde Balogun', role: 'Maintenance', createdAt: '2025-04-25T16:30:00Z', siteId: 'site-3', Site: { id: 'site-3', name: 'Port Harcourt Farm' } },
    { id: 8, name: 'Sade Ogun', role: 'Sales Rep', createdAt: '2025-04-22T13:10:00Z', siteId: 'site-2', Site: { id: 'site-2', name: 'Ibadan Farm' } },
    { id: 9, name: 'Emeka Nwosu', role: 'Security Lead', createdAt: '2025-04-18T08:00:00Z', siteId: 'site-1', Site: { id: 'site-1', name: 'Lagos Farm' } },
    { id: 10, name: 'Hauwa Mohammed', role: 'Admin Officer', createdAt: '2025-04-15T10:00:00Z', siteId: 'site-3', Site: { id: 'site-3', name: 'Port Harcourt Farm' } },
    { id: 11, name: 'Kelechi Okoro', role: 'Driver', createdAt: '2025-04-12T12:00:00Z', siteId: 'site-2', Site: { id: 'site-2', name: 'Ibadan Farm' } },
    { id: 12, name: 'Bisi Adegoke', role: 'Store Keeper', createdAt: '2025-04-08T09:30:00Z', siteId: 'site-1', Site: { id: 'site-1', name: 'Lagos Farm' } },
    { id: 13, name: 'Yakubu Garba', role: 'Hatchery Assistant', createdAt: '2025-04-05T15:00:00Z', siteId: 'site-3', Site: { id: 'site-3', name: 'Port Harcourt Farm' } },
    { id: 14, name: 'Chioma Obi', role: 'Lab Technician', createdAt: '2025-04-01T11:00:00Z', siteId: 'site-2', Site: { id: 'site-2', name: 'Ibadan Farm' } },
    { id: 15, name: 'Rashid Idris', role: 'Pond Manager', createdAt: '2025-03-28T08:00:00Z', siteId: 'site-1', Site: { id: 'site-1', name: 'Lagos Farm' } },
  ];

  const mockSites = [
    { id: 'site-1', name: 'Lagos Farm' },
    { id: 'site-2', name: 'Ibadan Farm' },
    { id: 'site-3', name: 'Port Harcourt Farm' },
  ];

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/staff');
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setStaff(data.length ? data : mockStaff);
    } catch (err) {
      console.error('Failed to fetch staff, using demo data:', err);
      setStaff(mockStaff);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await ApiV2.get('/v2/all-site');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setSites(data.length ? data : mockSites);
    } catch {
      setSites(mockSites);
    }
  };

  useEffect(() => {
    fetchStaff();
    if (isSuperAdmin) fetchSites();
  }, []);

  useEffect(() => {
    if (viewMode === 'by-site') {
      const siteNames = new Set(staff.map(s => s.Site?.name || 'Unassigned'));
      setCollapsedSites(new Set());
    }
  }, [viewMode, staff]);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const filteredBySite = isSuperAdmin
    ? staff
    : staff.filter(s => (s.siteId === userSiteId) || (s.Site?.id === userSiteId));

  const searched = search.trim()
    ? filteredBySite.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(search.toLowerCase())
      )
    : filteredBySite;

  const groupedBySite = isSuperAdmin && viewMode === 'by-site'
    ? searched.reduce((acc, s) => {
        const siteName = s.Site?.name || 'Unassigned';
        if (!acc[siteName]) acc[siteName] = [];
        acc[siteName].push(s);
        return acc;
      }, {})
    : {};

  const siteNames = Object.keys(groupedBySite).sort();

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
      await Api.post('/staff', payload);
      toast.success('Staff created successfully!', { className: 'dark-toast' });
      closeModal();
      fetchStaff();
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
                {s.Site?.name || s.site?.name || '\u2014'}
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
                {siteNames.length === 0 && (
                  <Alert variant="info" className="text-center py-3">No staff found for the selected view.</Alert>
                )}
                {siteNames.map((siteName, si) => (
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
                          {groupedBySite[siteName].length} {groupedBySite[siteName].length === 1 ? 'staff' : 'staff'}
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
                          {renderTable(groupedBySite[siteName])}
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

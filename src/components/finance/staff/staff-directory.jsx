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
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
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

  const [staffBySite, setStaffBySite] = useState({});
  const [siteLoading, setSiteLoading] = useState(false);

  const mapStaffSite = (s) => ({
    ...s,
    _siteName: s.UserSites?.[0]?.Site?.name || null,
    _siteId: s.UserSites?.[0]?.Site?.id || null,
  });

  const fetchAllStaff = async () => {
    try {
      setLoading(true);
      const siteParam = isSuperAdmin ? 'all' : (userSiteId || 'all');
      const res = await ApiV2.get('/api/v1/staff', { params: { siteId: siteParam } });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      return data.map(mapStaffSite);
    } catch (err) {
      console.error('[StaffDirectory] fetchAllStaff failed:', {
        siteParam,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return [];
    }
  };

  const fetchSites = async () => {
    try {
      const res = await ApiV2.get('/v2/all-site');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      console.error('[StaffDirectory] fetchSites failed:', err.response?.data || err.message || err);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [staffData, siteData] = await Promise.all([
          fetchAllStaff(),
          isSuperAdmin ? fetchSites() : Promise.resolve([]),
        ]);
        setStaff(staffData);
        setSites(siteData);
      } catch (err) {
        console.error('[StaffDirectory] initial load failed:', err.response?.data || err.message || err);
      } finally {
        setLoading(false);
      }
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
          if (data.length) grouped[site.name] = data.map(mapStaffSite);
        } catch (err) {
          console.error(`[StaffDirectory] fetch staff for site ${site.name} (${site.id}) failed:`, err.response?.data || err.message || err);
        }
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
      setStaff(fresh);
    } catch (err) {
      const msg = err.response?.data?.response_message || err.response?.data?.message || 'Failed to create staff. Please try again.';
      console.error('[StaffDirectory] create staff failed:', {
        payload,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      toast.error(msg, { className: 'dark-toast' });
    } finally {
      setModalLoading(false);
    }
  };

  const renderTable = (rows) => (
    <DataTable
      className={styles.staffTable}
      columns={[
        { key: 'createdAt', label: 'Date', render: (val) => <span style={{ color: '#8C949B', fontSize: 13 }}>{formatDate(val)}</span> },
        { key: 'name', label: 'Staff Name', render: (val, row, idx) => (
          <div className={styles.nameCell}>
            <div className={styles.avatar} style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
              {getInitials(val)}
            </div>
            <span>{val}</span>
          </div>
        )},
        { key: 'role', label: 'Role', render: (val) => <span className={styles.rolePill}>{val}</span> },
        { key: '_siteName', label: 'Site', render: (val) => (
          <span className={styles.sitePill}>
            <FaMapMarkerAlt size={10} />
            {val || '\u2014'}
          </span>
        )},
      ]}
      data={rows}
    />
  );

  const renderEmpty = (msg = 'No staff found.') => (
    <div className={styles.emptyState}>
      <VscOrganization size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
      <h5>{msg}</h5>
      <p>Create a new staff member to get started.</p>
    </div>
  );

  const renderSkeletonRows = (count = 8) => (
    <div className={styles.skeletonTable}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonCell} style={{ width: '16%' }}>
            <div className={styles.skeletonBar} style={{ width: '70%', height: 12 }} />
          </div>
          <div className={styles.skeletonCell} style={{ width: '34%' }}>
            <div className={styles.skeletonAvatarBar}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonBar} style={{ width: '55%', height: 12 }} />
            </div>
          </div>
          <div className={styles.skeletonCell} style={{ width: '25%' }}>
            <div className={styles.skeletonBar} style={{ width: '50%', height: 12 }} />
          </div>
          <div className={styles.skeletonCell} style={{ width: '25%' }}>
            <div className={styles.skeletonBar} style={{ width: '40%', height: 12 }} />
          </div>
        </div>
      ))}
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
              renderSkeletonRows()
            ) : staff.length === 0 ? (
              renderEmpty()
            ) : searched.length === 0 ? (
              renderEmpty('No staff match your search.')
            ) : isSuperAdmin && viewMode === 'by-site' ? (
              <>
                {siteLoading && (
                  <div className={styles.skeletonSiteCards}>
                    {[1, 2, 3].map(si => (
                      <div key={si} className={styles.skeletonSiteCard}>
                        <div className={styles.skeletonSiteCardHeader}>
                          <div className={styles.skeletonSiteIcon} />
                          <div className={styles.skeletonBar} style={{ width: '120px', height: 16 }} />
                          <div className={styles.skeletonBar} style={{ width: '60px', height: 14, marginLeft: 'auto' }} />
                        </div>
                      </div>
                    ))}
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
                      <CustomDropdown
                        className={`${styles.formSelect} ${formErrors.siteId ? styles.formInputError : ''}`}
                        value={form.siteId}
                        onChange={(val) => {
                          setForm({ ...form, siteId: val });
                          if (formErrors.siteId) setFormErrors({ ...formErrors, siteId: undefined });
                        }}
                        disabled={modalLoading || sites.length === 0}
                        placeholder={sites.length === 0 ? 'No sites available' : 'Select a site'}
                        options={sites.map((site) => ({ value: site.id, label: site.name }))}
                      />
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

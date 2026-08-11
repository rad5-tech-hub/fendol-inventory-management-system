import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../admin-styles.module.scss';
import Api from '../../shared/api/apiLink';
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import DataTable from "../../shared/data-table/DataTable";
import { Alert } from 'react-bootstrap';
import { SkeletonTable, SkeletonFilterBar } from '../../shared/skeleton/Skeleton';
import { FaUserPlus, FaFilter } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useConfirm } from '../../shared/confirm-modal';

const avatarColors = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47'];

const getInitials = (name) => {
  const parts = (name || '').split(' ');
  return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
};

const formatRole = (role) => {
  return (role || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yr = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${mo}/${yr} ${h}:${mi}`;
};

export default function ViewAll() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [adminsPerPage] = useState(45);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filterSite, setFilterSite] = useState('');
  const [ConfirmDialog] = useConfirm();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await Api.get('/admins');
      console.log('API Response:', response);
      if (Array.isArray(response.data.data)) {
        setAdmins(response.data.data);
      } else {
        throw new Error("Expected an array of admins");
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const filteredAdmins = filterSite
    ? admins.filter(admin => admin.UserSites?.some(us => us.siteId === filterSite))
    : admins;

  const offset = currentPage * adminsPerPage;
  const displayAdmins = filteredAdmins.slice(offset, offset + adminsPerPage);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const columns = [
    {
      key: 'fullName', label: 'Full Name',
      render: (value, _row, rowIndex) => (
        <div className={styles.nameCell}>
          <div className={styles.avatar} style={{ backgroundColor: avatarColors[rowIndex % avatarColors.length] }}>
            {getInitials(value).toUpperCase()}
          </div>
          {value}
        </div>
      ),
    },
    { key: 'email', label: 'E-mail Address' },
    { key: 'role', label: 'Role', render: (value, row) => formatRole(row.roles?.[0]?.name || row.role) },
    { key: 'UserSites', label: 'Assigned Site', render: (value) =>
      value?.length ? value.map(us => us.Site?.name).filter(Boolean).join(', ') : '-'
    },
    { key: 'createdAt', label: 'Date Created', render: (value) => formatDate(value) },
  ];

  const renderActions = (admin) => (
    <PortalDropdown
      btnClass={styles.threeDotBtn}
      stopPropagation
      items={[
        { label: 'Edit', onClick: () => navigate('/admin/add-new-admin', {
          state: {
            isEdit: true,
            adminData: {
              id: admin.id,
              fullName: admin.fullName,
              email: admin.email,
              role: admin.role,
              roleId: admin.roleRef?.id || admin.roleId || '',
              UserSites: admin.UserSites || [],
            }
          }
        })},
      ]}
    />
  );

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content}`}>
            <main style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ConfirmDialog />
            <ToastContainer />

            <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className={styles.pageHeader}>
              <h4 className={styles.pageTitle}>All Admins</h4>
              <div className={styles.headerActions}>
                <button type="button" className={styles.navBtnActive} onClick={() => navigate('/admin/add-new-admin')}>
                  <FaUserPlus style={{ marginRight: '6px' }} /> Create New Admin
                </button>
              </div>
            </div>

            <div className={styles.filterBar}>
              <button type="button" className={styles.filterBtn}>
                <FaFilter /> Filter
              </button>
            </div>

            {loading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonFilterBar />
                <SkeletonTable rows={5} cols={5} />
              </div>
            ) : error ? (
              <ErrorState message={error} />
            ) : admins.length === 0 ? (
              <EmptyState title="No available data" />
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={displayAdmins}
                  emptyMessage="No available data"
                  className={styles.adminTable}
                  actions={renderActions}
                />


              </>
            )}
            </div>
            {!loading && !error && admins.length > 0 && (
              <div className={styles.tableFooter} style={{ paddingTop: 12, paddingBottom: 0, background: '#fff', marginTop: 'auto' }}>
                <small className="text-muted">
                  Showing {offset + 1} to {Math.min(offset + adminsPerPage, filteredAdmins.length)} of {filteredAdmins.length} admins
                </small>
                <ReactPaginate
                  previousLabel={"← Previous"}
                  nextLabel={"Next →"}
                  breakLabel="..."
                  pageCount={Math.ceil(filteredAdmins.length / adminsPerPage)}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={2}
                  onPageChange={handlePageClick}
                  containerClassName={"pagination"}
                  pageClassName={"page-item"}
                  pageLinkClassName={"page-link"}
                  previousClassName={"page-item"}
                  previousLinkClassName={"page-link"}
                  nextClassName={"page-item"}
                  nextLinkClassName={"page-link"}
                  breakClassName={"page-item"}
                  breakLinkClassName={"page-link"}
                  activeClassName={"active"}
                />
              </div>
            )}
          </main>

        </section>
      </div>
    </section>
  );
}

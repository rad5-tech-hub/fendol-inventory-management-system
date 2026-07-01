import React, { useState, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './complaints.module.scss';
import { toast } from 'react-toastify';
import {
  FiSearch, FiMoreVertical, FiX, FiEye, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { BsPeople, BsClock, BsCheckCircle, BsExclamationCircle } from 'react-icons/bs';
import CustomDropdown from '../shared/custom-dropdown/CustomDropdown';
import DataTable from '../shared/data-table/DataTable';

const MOCK_COMPLAINTS = [
  { id: 'CMP-001', complainant: 'John Doe', type: 'Staff', staffName: 'Jane Smith', description: 'Late arrival to work on multiple occasions affecting team productivity and morning shift handover procedures.', date: '2026-06-28T09:15:00', status: 'Pending' },
  { id: 'CMP-002', complainant: 'Mary Johnson', type: 'General', staffName: null, description: 'Broken water dispenser in the staff lounge. It has been leaking for three days and creates a safety hazard.', date: '2026-06-27T14:30:00', status: 'Resolved' },
  { id: 'CMP-003', complainant: 'James Okafor', type: 'Staff', staffName: 'Peter Obi', description: 'Inappropriate comments during team meeting that made colleagues uncomfortable and violated workplace conduct policy.', date: '2026-06-26T11:00:00', status: 'Dismissed' },
  { id: 'CMP-004', complainant: 'Sarah Adeleke', type: 'General', staffName: null, description: 'The air conditioning unit in the main office has not been working for a week. Temperatures are becoming unbearable for staff.', date: '2026-06-25T16:45:00', status: 'Pending' },
  { id: 'CMP-005', complainant: 'Emeka Nwosu', type: 'Staff', staffName: 'Chidi Okonkwo', description: 'Consistent failure to submit weekly reports on time. This has caused delays in the management review process.', date: '2026-06-24T08:20:00', status: 'Pending' },
  { id: 'CMP-006', complainant: 'Blessing Eze', type: 'General', staffName: null, description: 'Insufficient lighting in the parking lot. Staff leaving late shifts have raised safety concerns about walking to their cars in the dark.', date: '2026-06-23T10:10:00', status: 'Resolved' },
  { id: 'CMP-007', complainant: 'Daniel Alabi', type: 'Staff', staffName: 'Funke Akindele', description: 'Unauthorized use of company vehicle for personal errands during work hours without prior approval from management.', date: '2026-06-22T13:00:00', status: 'Pending' },
  { id: 'CMP-008', complainant: 'Chioma Uba', type: 'General', staffName: null, description: 'Request for update to the staff cafeteria menu. Current options lack variety and nutritional balance for long work hours.', date: '2026-06-21T07:30:00', status: 'Resolved' },
  { id: 'CMP-009', complainant: 'Tunde Bakare', type: 'Staff', staffName: 'Amara Okafor', description: 'Ongoing interpersonal conflict between team members that is affecting overall team morale and project deadlines.', date: '2026-06-20T15:15:00', status: 'Pending' },
  { id: 'CMP-010', complainant: 'Grace Adeyemi', type: 'General', staffName: null, description: 'The internet connectivity in the annex building has been intermittent. Remote work and cloud-based tools are frequently inaccessible.', date: '2026-06-19T09:45:00', status: 'Dismissed' },
  { id: 'CMP-011', complainant: 'Kelechi Nwachukwu', type: 'Staff', staffName: 'Ifeanyi Eze', description: 'Repeated failure to respond to urgent emails and messages. Communication bottlenecks are delaying project delivery timelines.', date: '2026-06-18T12:00:00', status: 'Pending' },
  { id: 'CMP-012', complainant: 'Ngozi Odili', type: 'General', staffName: null, description: 'Proposal to implement a flexible work-from-home policy for roles that do not require physical presence at the office.', date: '2026-06-17T11:20:00', status: 'Resolved' },
];

const formatDate = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function AllComplaints() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const itemsPerPage = 8;

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const filtered = useMemo(() => {
    let list = MOCK_COMPLAINTS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.complainant.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.staffName && c.staffName.toLowerCase().includes(q)) ||
          c.description.toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((c) => c.type === typeFilter);
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    return list;
  }, [search, typeFilter, statusFilter]);

  const totalCount = MOCK_COMPLAINTS.length;
  const pendingCount = MOCK_COMPLAINTS.filter((c) => c.status === 'Pending').length;
  const resolvedCount = MOCK_COMPLAINTS.filter((c) => c.status === 'Resolved').length;

  const offset = currentPage * itemsPerPage;
  const currentItems = filtered.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filtered.length / itemsPerPage);

  const handlePageClick = ({ selected }) => setCurrentPage(selected);

  const statusClass = (status) => {
    switch (status) {
      case 'Pending': return `${styles.statusPill} ${styles.statusPending}`;
      case 'Resolved': return `${styles.statusPill} ${styles.statusResolved}`;
      case 'Dismissed': return `${styles.statusPill} ${styles.statusDismissed}`;
      default: return styles.statusPill;
    }
  };

  const typeClass = (type) =>
    type === 'Staff' ? `${styles.typeBadge} ${styles.typeStaff}` : `${styles.typeBadge} ${styles.typeGeneral}`;

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className={styles.headerRow}>
              <h4>All Complaints</h4>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#F3F0F0', color: '#512728' }}>
                  <BsExclamationCircle />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{totalCount}</div>
                  <div className={styles.statLabel}>Total</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#FEF3C7', color: '#B45309' }}>
                  <BsClock />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{pendingCount}</div>
                  <div className={styles.statLabel}>Pending</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#DCFCE7', color: '#15803D' }}>
                  <BsCheckCircle />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{resolvedCount}</div>
                  <div className={styles.statLabel}>Resolved</div>
                </div>
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, ID, or staff..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                />
              </div>
              <CustomDropdown
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'Staff', label: 'Staff' },
                  { value: 'General', label: 'General' },
                ]}
                value={typeFilter}
                onChange={(val) => { setTypeFilter(val); setCurrentPage(0); }}
                className={styles.filterDropdown}
                triggerClassName={styles.filterTrigger}
                placeholder="All Types"
              />
              <CustomDropdown
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Dismissed', label: 'Dismissed' },
                ]}
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setCurrentPage(0); }}
                className={styles.filterDropdown}
                triggerClassName={styles.filterTrigger}
                placeholder="All Status"
              />
            </div>

            <DataTable
              columns={[
                { key: 'index', label: '#', render: (_, row, idx) => <span style={{ color: '#8C949B', fontWeight: 500 }}>{offset + idx + 1}</span> },
                { key: 'complainant', label: 'Complainant', render: (value) => <span style={{ fontWeight: 600 }}>{value}</span> },
                {
                  key: 'type',
                  label: 'Type',
                  render: (value) => (
                    <span className={typeClass(value)}>
                      {value === 'Staff' ? <BsPeople size={12} /> : null}
                      {value}
                    </span>
                  ),
                },
                { key: 'staffName', label: 'Staff', render: (value) => <span style={{ color: value ? '#2E3135' : '#9CA3AF' }}>{value || '\u2014'}</span> },
                {
                  key: 'description',
                  label: 'Description',
                  render: (value) => (
                    <div className={styles.descCell} title={value}>
                      {value}
                    </div>
                  ),
                },
                { key: 'date', label: 'Date', render: (value) => <span style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(value)}</span> },
                { key: 'status', label: 'Status', render: (value) => <span className={statusClass(value)}>{value}</span> },
              ]}
              data={currentItems}
              emptyMessage="No complaints match your filters."
              actions={(row) => (
                <div className={styles.actionsDropdown}>
                  <button
                    className={styles.actionsBtn}
                    onClick={() => setOpenDropdown(openDropdown === row.id ? null : row.id)}
                  >
                    <FiMoreVertical size={18} />
                  </button>
                  {openDropdown === row.id && (
                    <div className={styles.dropdownMenu}>
                      <button className={styles.dropdownItem} onClick={() => { setSelectedComplaint(row); setOpenDropdown(null); }}>
                        <FiEye size={15} /> View Details
                      </button>
                      <button className={`${styles.dropdownItem} ${styles.itemSuccess}`} onClick={() => { toast.info('Resolve action will be available once the API is ready.', { className: 'dark-toast' }); setOpenDropdown(null); }}>
                        <FiCheckCircle size={15} /> Resolve
                      </button>
                      <button className={`${styles.dropdownItem} ${styles.itemDanger}`} onClick={() => { toast.info('Dismiss action will be available once the API is ready.', { className: 'dark-toast' }); setOpenDropdown(null); }}>
                        <FiXCircle size={15} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            />

            {pageCount > 1 && (
              <div className={styles.paginationWrapper}>
                <ReactPaginate
                  previousLabel={<><FiChevronLeft size={16} style={{ marginRight: 4 }} /> Prev</>}
                  nextLabel={<>Next <FiChevronRight size={16} style={{ marginLeft: 4 }} /></>}
                  breakLabel="..."
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageClick}
                  forcePage={currentPage}
                />
              </div>
            )}

            {selectedComplaint && (
              <>
                <div className={styles.overlay} onClick={() => setSelectedComplaint(null)} />
                <div className={styles.slidePanel}>
                  <div className={styles.panelHeader}>
                    <div className={styles.panelHeaderLeft}>
                      <span className={styles.panelIdBadge}>{selectedComplaint.id}</span>
                      <span className={styles.panelDate}>Filed {formatDate(selectedComplaint.date)}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setSelectedComplaint(null)}>
                      <FiX size={20} />
                    </button>
                  </div>

                  <div className={styles.panelBody}>
                    <div className={styles.panelAvatar}>
                      <div className={styles.avatarCircle}>
                        {(selectedComplaint.complainant || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.panelComplainantName}>{selectedComplaint.complainant}</div>
                        <div className={styles.panelComplainantLabel}>Complainant</div>
                      </div>
                    </div>

                    <div className={styles.panelDivider} />

                    <div className={styles.panelGrid}>
                      <div className={styles.panelGridItem}>
                        <div className={styles.panelGridLabel}>Type</div>
                        <div>
                          <span className={typeClass(selectedComplaint.type)}>
                            {selectedComplaint.type === 'Staff' ? <BsPeople size={12} /> : null}
                            {selectedComplaint.type}
                          </span>
                        </div>
                      </div>
                      <div className={styles.panelGridItem}>
                        <div className={styles.panelGridLabel}>Status</div>
                        <div>
                          <span className={statusClass(selectedComplaint.status)}>{selectedComplaint.status}</span>
                        </div>
                      </div>
                      {selectedComplaint.staffName && (
                        <div className={styles.panelGridItem}>
                          <div className={styles.panelGridLabel}>Staff Member</div>
                          <div className={styles.panelGridValue}>{selectedComplaint.staffName}</div>
                        </div>
                      )}
                      <div className={styles.panelGridItem}>
                        <div className={styles.panelGridLabel}>Date Filed</div>
                        <div className={styles.panelGridValue}>{formatDate(selectedComplaint.date)}</div>
                      </div>
                    </div>

                    <div className={styles.panelDivider} />

                    <div className={styles.panelSection}>
                      <div className={styles.panelSectionTitle}>Description</div>
                      <div className={styles.panelDescBox}>
                        {selectedComplaint.description}
                      </div>
                    </div>
                  </div>

                  <div className={styles.panelFooter}>
                    <button
                      className={`${styles.panelActionBtn} ${styles.btnResolve}`}
                      onClick={() => {
                        toast.info('Resolve action will be available once the API is ready.', { className: 'dark-toast' });
                      }}
                    >
                      <FiCheckCircle size={16} />
                      Resolve
                    </button>
                    <button
                      className={`${styles.panelActionBtn} ${styles.btnDismiss}`}
                      onClick={() => {
                        toast.info('Dismiss action will be available once the API is ready.', { className: 'dark-toast' });
                      }}
                    >
                      <FiXCircle size={16} />
                      Dismiss
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

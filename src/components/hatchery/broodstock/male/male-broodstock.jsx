import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from 'react-bootstrap';
import CustomDropdown from "../../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../../shared/data-table/DataTable";
import { toast } from 'react-toastify';
import { IoSearchOutline, IoFilterOutline, IoRefreshOutline, IoDownloadOutline } from 'react-icons/io5';
import { FaMars, FaCheckCircle, FaClock, FaHeart, FaArchive, FaEye } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Total Males', value: '42', icon: FaMars, color: '#3B82F6', sub: 'All time' },
  { label: 'Active Males', value: '32', icon: FaCheckCircle, color: '#22C55E', sub: '76.2% of total' },
  { label: 'In Use', value: '18', icon: FaClock, color: '#F97316', sub: 'Currently in batches' },
  { label: 'Sick / Under Treatment', value: '2', icon: FaHeart, color: '#EF4444', sub: '4.8% of total' },
  { label: 'Retired Males', value: '8', icon: FaArchive, color: '#94A3B8', sub: '19.0% of total' },
];

const statusStyle = (status) => {
  switch (status) {
    case 'Active': return { bg: '#E8F5E9', color: '#2E7D32' };
    case 'In Use': return { bg: '#FFF3E0', color: '#E65100' };
    case 'Retired': return { bg: '#F3F4F6', color: '#6B7280' };
    case 'Sick/Under Treatment': return { bg: '#FEE2E2', color: '#DC2626' };
    default: return { bg: '#F3F4F6', color: '#6B7280' };
  }
};

const rows = [
  { id: 'M-001', weight: 2.70, age: 3.5, lastSpawn: 'May 20, 2025', usageCount: 6, status: 'Active', health: 'Healthy', notes: 'High performer' },
  { id: 'M-002', weight: 2.60, age: 3.2, lastSpawn: 'May 15, 2025', usageCount: 5, status: 'Active', health: 'Healthy', notes: 'Good quality semen' },
  { id: 'M-003', weight: 2.50, age: 3.1, lastSpawn: 'May 10, 2025', usageCount: 4, status: 'Active', health: 'Healthy', notes: 'Strong swimmer' },
  { id: 'M-004', weight: 2.40, age: 2.8, lastSpawn: 'May 05, 2025', usageCount: 3, status: 'In Use', health: 'Healthy', notes: '\u2014' },
  { id: 'M-005', weight: 2.30, age: 2.7, lastSpawn: 'Apr 28, 2025', usageCount: 3, status: 'In Use', health: 'Healthy', notes: '\u2014' },
  { id: 'M-006', weight: 2.20, age: 2.6, lastSpawn: 'Apr 20, 2025', usageCount: 2, status: 'Active', health: 'Under Treatment', notes: 'Minor injury' },
  { id: 'M-007', weight: 2.10, age: 2.4, lastSpawn: 'Apr 15, 2025', usageCount: 1, status: 'Active', health: 'Healthy', notes: 'Newly added' },
  { id: 'M-008', weight: 2.00, age: 2.3, lastSpawn: 'Mar 30, 2025', usageCount: 1, status: 'Retired', health: 'Healthy', notes: 'Low semen quality' },
];

export default function MaleBroodstock() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState(1);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.page}>
            <div className={styles.breadcrumb}>
              <span>Hatchery</span>
              <span className={styles.separator}>&gt;</span>
              <span>Broodstock Management</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Male Broodstock</span>
            </div>

            <div className={styles.broodstockTabs}>
              <button className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Male Broodstock</button>
              <button className={styles.tabBtn} onClick={() => navigate('/hatchery/broodstock/female')}>Female Broodstock</button>
            </div>

            <div className={styles.pageHeader}>
              <h4>Male Broodstock</h4>
              <div className={styles.headerActions}>
                <button className={styles.exportBtn} onClick={() => {}}>
                  <IoDownloadOutline size={16} /> Export Report
                </button>
                <button className={styles.primaryBtn} onClick={() => {}}>
                  + Add Broodstock
                </button>
              </div>
            </div>

            <div className={styles.statGrid}>
              {statCards.map((card, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <div className={styles.statIcon} style={{ background: card.color + '1A' }}>
                      <card.icon size={20} color={card.color} />
                    </div>
                    <span className={styles.statLabel}>{card.label}</span>
                  </div>
                  <div className={styles.statValue}>{card.value}</div>
                  <span style={{ fontSize: '0.75rem', color: card.color, fontWeight: 500 }}>{card.sub}</span>
                </div>
              ))}
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <input type="text" placeholder="Search by ID or Tag number\u2026" />
                <IoSearchOutline size={16} className={styles.searchIcon} />
              </div>
              <div className={styles.filterSelect}>
                <CustomDropdown
                  options={[{ value: '', label: 'All Statuses' }]}
                  placeholder="All Statuses"
                />
              </div>
              <div className={styles.filterSelect}>
                <CustomDropdown
                  options={[{ value: '', label: 'All Age Groups' }]}
                  placeholder="All Age Groups"
                />
              </div>
              <div className={styles.filterSelect}>
                <CustomDropdown
                  options={[{ value: '', label: 'All Usage' }]}
                  placeholder="All Usage"
                />
              </div>
              <button className={styles.filterBtn} onClick={() => {}}>
                <IoFilterOutline size={16} /> Filters
              </button>
              <button className={styles.resetBtn} onClick={() => {}}>
                <IoRefreshOutline size={14} /> Reset
              </button>
            </div>

            <DataTable
              columns={[
                { key: 'id', label: 'ID / Tag No.', render: (v) => <span className={styles.broodstockIdLink} onClick={() => {}}>{v}</span> },
                { key: 'weight', label: 'Weight (kg)', render: (v) => Number(v).toFixed(2) },
                { key: 'age', label: 'Age (Years)', render: (v) => Number(v).toFixed(1) },
                { key: 'lastSpawn', label: 'Last Spawn Date', render: (v) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{v}</span> },
                { key: 'usageCount', label: 'Usage Count' },
                { key: 'status', label: 'Status', render: (v) => { const ss = statusStyle(v); return <span className={styles.statusBadge} style={{ background: ss.bg, color: ss.color }}>{v}</span>; } },
                { key: 'notes', label: 'Notes', render: (v) => <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>{v}</span> },
              ]}
              data={rows}
              actions={() => (
                <div className={styles.actionsCell}>
                  <button className={styles.eyeBtn} onClick={() => {}}><FaEye size={16} /></button>
                  <button className={styles.threeDotBtn} onClick={() => {}}><BsThreeDotsVertical size={16} /></button>
                </div>
              )}
            />

            <div className={styles.paginationRow}>
              <span className={styles.paginationInfo}>Showing 1 to 8 of 42 males</span>
              <div className="d-flex align-items-center gap-3">
                <Pagination>
                  <Pagination.First />
                  <Pagination.Prev />
                  <Pagination.Item active={activePage === 1} onClick={() => setActivePage(1)}>{1}</Pagination.Item>
                  <Pagination.Item active={activePage === 2} onClick={() => setActivePage(2)}>{2}</Pagination.Item>
                  <Pagination.Item active={activePage === 3} onClick={() => setActivePage(3)}>{3}</Pagination.Item>
                  <Pagination.Item active={activePage === 4} onClick={() => setActivePage(4)}>{4}</Pagination.Item>
                  <Pagination.Item active={activePage === 5} onClick={() => setActivePage(5)}>{5}</Pagination.Item>
                  <Pagination.Ellipsis />
                  <Pagination.Item active={activePage === 7} onClick={() => setActivePage(7)}>{7}</Pagination.Item>
                  <Pagination.Next />
                  <Pagination.Last />
                </Pagination>
                <CustomDropdown
                  options={[
                    { value: '10', label: '10 / page' },
                    { value: '25', label: '25 / page' },
                    { value: '50', label: '50 / page' },
                  ]}
                  placeholder="10 / page"
                />
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

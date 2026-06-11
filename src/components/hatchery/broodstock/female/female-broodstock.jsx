import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { IoSearchOutline, IoFilterOutline, IoRefreshOutline, IoDownloadOutline } from 'react-icons/io5';
import { FaVenus, FaCheckCircle, FaClock, FaHeart, FaArchive, FaEye } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Total Females', value: '38', icon: FaVenus, color: '#EC4899', sub: 'All time' },
  { label: 'Active Females', value: '28', icon: FaCheckCircle, color: '#22C55E', sub: '73.7% of total' },
  { label: 'In Use', value: '16', icon: FaClock, color: '#F97316', sub: 'Currently in batches' },
  { label: 'Sick / Under Treatment', value: '2', icon: FaHeart, color: '#EF4444', sub: '5.3% of total' },
  { label: 'Retired Females', value: '8', icon: FaArchive, color: '#94A3B8', sub: '21.1% of total' },
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
  { id: 'F-001', weight: 3.20, age: 4.1, lastSpawn: 'May 20, 2025', usageCount: 5, status: 'Active', health: 'Healthy', notes: 'High egg yield' },
  { id: 'F-002', weight: 3.10, age: 3.8, lastSpawn: 'May 15, 2025', usageCount: 4, status: 'Active', health: 'Healthy', notes: 'Good egg quality' },
  { id: 'F-003', weight: 3.00, age: 3.5, lastSpawn: 'May 10, 2025', usageCount: 4, status: 'Active', health: 'Healthy', notes: 'Strong spawner' },
  { id: 'F-004', weight: 2.90, age: 3.2, lastSpawn: 'May 05, 2025', usageCount: 3, status: 'In Use', health: 'Healthy', notes: '\u2014' },
  { id: 'F-005', weight: 2.80, age: 3.0, lastSpawn: 'Apr 28, 2025', usageCount: 3, status: 'In Use', health: 'Healthy', notes: '\u2014' },
  { id: 'F-006', weight: 2.70, age: 2.8, lastSpawn: 'Apr 20, 2025', usageCount: 2, status: 'Active', health: 'Under Treatment', notes: 'Egg quality declining' },
  { id: 'F-007', weight: 2.60, age: 2.6, lastSpawn: 'Apr 15, 2025', usageCount: 1, status: 'Active', health: 'Healthy', notes: 'Newly added' },
  { id: 'F-008', weight: 2.50, age: 2.4, lastSpawn: 'Mar 30, 2025', usageCount: 1, status: 'Retired', health: 'Healthy', notes: 'Low egg count' },
];

export default function FemaleBroodstock() {
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
              <span className={styles.breadcrumbActive}>Female Broodstock</span>
            </div>

            <div className={styles.broodstockTabs}>
              <button className={styles.tabBtn} onClick={() => navigate('/hatchery/broodstock/male')}>Male Broodstock</button>
              <button className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Female Broodstock</button>
            </div>

            <div className={styles.pageHeader}>
              <h4>Female Broodstock</h4>
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
                <Form.Select>
                  <option>All Statuses</option>
                </Form.Select>
              </div>
              <div className={styles.filterSelect}>
                <Form.Select>
                  <option>All Age Groups</option>
                </Form.Select>
              </div>
              <div className={styles.filterSelect}>
                <Form.Select>
                  <option>All Usage</option>
                </Form.Select>
              </div>
              <button className={styles.filterBtn} onClick={() => {}}>
                <IoFilterOutline size={16} /> Filters
              </button>
              <button className={styles.resetBtn} onClick={() => {}}>
                <IoRefreshOutline size={14} /> Reset
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className="text-start">ID / Tag No.</th>
                    <th className="text-start">Weight (kg)</th>
                    <th className="text-start">Age (Years)</th>
                    <th className="text-start">Last Strip Date</th>
                    <th className="text-start">Usage Count</th>
                    <th className="text-start">Status</th>
                    <th className="text-start">Notes</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const ss = statusStyle(row.status);
                    return (
                      <tr key={row.id}>
                        <td className="text-start">
                          <span className={styles.broodstockIdLink} onClick={() => {}}>{row.id}</span>
                        </td>
                        <td className="text-start">{row.weight.toFixed(2)}</td>
                        <td className="text-start">{row.age.toFixed(1)}</td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.lastSpawn}</td>
                        <td className="text-start">{row.usageCount}</td>
                        <td className="text-start">
                          <span className={styles.statusBadge} style={{ background: ss.bg, color: ss.color }}>{row.status}</span>
                        </td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#6B7280' }}>{row.notes}</td>
                        <td className="text-start">
                          <div className={styles.actionsCell}>
                            <button className={styles.eyeBtn} onClick={() => {}}><FaEye size={16} /></button>
                            <button className={styles.threeDotBtn} onClick={() => {}}><BsThreeDotsVertical size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationRow}>
              <span className={styles.paginationInfo}>Showing 1 to 8 of 38 females</span>
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
                <Form.Select style={{ width: 120, fontSize: '0.85rem' }}>
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                </Form.Select>
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

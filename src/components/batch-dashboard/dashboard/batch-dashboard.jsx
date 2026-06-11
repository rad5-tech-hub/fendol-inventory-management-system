import React, { useState } from 'react';
import { Pagination, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IoGridOutline,
  IoLayersOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoRefreshOutline,
  IoHelpCircleOutline,
  IoDownloadOutline,
} from 'react-icons/io5';
import { FaCheckCircle, FaSkull } from 'react-icons/fa';
import { GiCirclingFish, GiCannedFish } from 'react-icons/gi';
import { MdOutlinePointOfSale, MdOutlineBarChart } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import styles from '../batch-dashboard.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Total Active Batches', value: '24', icon: IoLayersOutline, color: '#3B82F6' },
  { label: 'Total Completed Batches', value: '18', icon: FaCheckCircle, color: '#22C55E' },
  { label: 'Total Fish in Active Batches', value: f(128450), icon: GiCirclingFish, color: '#F97316' },
  { label: 'Total Harvested Fish', value: f(85320), icon: GiCannedFish, color: '#8B5CF6' },
  { label: 'Total Mortality', value: f(2340), icon: FaSkull, color: '#EF4444' },
  { label: 'Total Revenue Generated', value: '₦' + f(18450000), icon: MdOutlinePointOfSale, color: '#10B981' },
];

const stageConfig = {
  Growing: { bg: '#E8F5E9', color: '#2E7D32' },
  Sorting: { bg: '#FFF3E0', color: '#E65100' },
  Harvesting: { bg: '#FEF3C7', color: '#92400E' },
  Smoking: { bg: '#F3E8FF', color: '#6B21A8' },
  Completed: { bg: '#F3F4F6', color: '#374151' },
};

const statusConfig = {
  Active: { bg: '#E8F5E9', color: '#2E7D32' },
  Processing: { bg: '#FFF3E0', color: '#E65100' },
  Completed: { bg: '#F3F4F6', color: '#374151' },
};

const rows = [
  { id: 1, batchNo: 'FDL-BT-2025-001', species: 'Tilapia', date: 'May 28, 2025 09:45 AM', originPond: 'Pond Alpha-01', currentPond: 'Pond Alpha-01', stage: 'Growing', initialQty: 12500, currentQty: 12450, mortality: 50, harvested: 0, revenue: 'N0', status: 'Active' },
  { id: 2, batchNo: 'FDL-BT-2025-002', species: 'Catfish', date: 'May 26, 2025 10:20 AM', originPond: 'Pond Beta-02', currentPond: 'Pond Gamma-01', stage: 'Sorting', initialQty: 8000, currentQty: 7600, mortality: 120, harvested: 0, revenue: 'N0', status: 'Active' },
  { id: 3, batchNo: 'FDL-BT-2025-003', species: 'Tilapia', date: 'May 20, 2025 06:15 AM', originPond: 'Pond Delta-01', currentPond: 'Pond Delta-01', stage: 'Harvesting', initialQty: 10000, currentQty: 2500, mortality: 80, harvested: 7000, revenue: '₦2,450,000', status: 'Processing' },
  { id: 4, batchNo: 'FDL-BT-2025-004', species: 'Tilapia', date: 'May 15, 2025 02:30 PM', originPond: 'Pond Alpha-02', currentPond: 'Smoking Unit-01', stage: 'Smoking', initialQty: 6000, currentQty: 0, mortality: 60, harvested: 5940, revenue: '₦1,980,000', status: 'Processing' },
  { id: 5, batchNo: 'FDL-BT-2025-005', species: 'Catfish', date: 'May 10, 2025 11:10 AM', originPond: 'Pond Gamma-02', currentPond: 'Showcase', stage: 'Completed', initialQty: 5000, currentQty: 0, mortality: 50, harvested: 4950, revenue: '₦2,475,000', status: 'Completed' },
  { id: 6, batchNo: 'FDL-BT-2025-006', species: 'Tilapia', date: 'May 05, 2025 09:00 AM', originPond: 'Pond Beta-01', currentPond: 'Pond Beta-03', stage: 'Completed', initialQty: 7500, currentQty: 0, mortality: 70, harvested: 7430, revenue: '₦2,970,000', status: 'Completed' },
  { id: 7, batchNo: 'FDL-BT-2025-007', species: 'Catfish', date: 'Apr 28, 2025 03:45 PM', originPond: 'Pond Alpha-03', currentPond: 'Showcase', stage: 'Completed', initialQty: 4000, currentQty: 0, mortality: 40, harvested: 3960, revenue: '₦1,584,000', status: 'Completed' },
];

export default function BatchDashboard() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState(1);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const StageBadge = ({ stage }) => {
    const cfg = stageConfig[stage] || { bg: '#F3F4F6', color: '#374151' };
    return <span className={styles.stageBadge} style={{ background: cfg.bg, color: cfg.color }}>{stage}</span>;
  };

  const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || { bg: '#F3F4F6', color: '#374151' };
    return <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>{status}</span>;
  };

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
              <div className={styles.pageHeader}>
                <h4>Batch Dashboard</h4>
                <div className={styles.headerActions}>
                  <button className={styles.howItWorksBtn} onClick={() => {}}>
                    <IoHelpCircleOutline size={18} /> How it works
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
                  <div className={styles.statLink} onClick={() => {}}>View details &rarr;</div>
                </div>
              ))}
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <input type="text" placeholder="Search batch number&hellip;" />
                <IoSearchOutline size={16} className={styles.searchIcon} />
              </div>
              <div className={styles.filterSelect}>
                <Form.Select>
                  <option>All Sites</option>
                </Form.Select>
              </div>
              <div className={styles.filterSelect}>
                <Form.Select>
                  <option>All Ponds</option>
                </Form.Select>
              </div>
              <div className={styles.filterSelect}>
                <Form.Select>
                  <option>All Statuses</option>
                </Form.Select>
              </div>
              <div className={styles.dateRange}>
                <IoGridOutline size={14} /> May 1, 2025 &ndash; May 30, 2025
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
                    <th className="text-start">Batch Number</th>
                    <th className="text-start">Date Created <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Origin Pond</th>
                    <th className="text-start">Current Pond</th>
                    <th className="text-start">Current Stage</th>
                    <th className="text-end">Initial Qty</th>
                    <th className="text-end">Current Qty</th>
                    <th className="text-end">Total Mortality</th>
                    <th className="text-end">Total Harvested</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-start">Status</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600 }} className="text-start">{row.batchNo}</td>
                      <td style={{ fontSize: '0.82rem', color: '#8C949B' }} className="text-start">{row.date}</td>
                      <td className="text-start"><span className={styles.pondCell}><GiCannedFish size={14} color="#8C949B" /> {row.originPond}</span></td>
                      <td className="text-start"><span className={styles.pondCell}><GiCannedFish size={14} color="#8C949B" /> {row.currentPond}</span></td>
                      <td className="text-start"><StageBadge stage={row.stage} /></td>
                      <td className="text-end">{f(row.initialQty)}</td>
                      <td className="text-end">{f(row.currentQty)}</td>
                      <td className={`text-end ${styles.mortalityValue}`}>{f(row.mortality)}</td>
                      <td className="text-end">{f(row.harvested)}</td>
                      <td className="text-end">{row.revenue}</td>
                      <td className="text-start"><StatusBadge status={row.status} /></td>
                      <td className="text-start">
                        <div className={styles.actionsCell}>
                          <button className={styles.viewBtn} onClick={() => navigate(`/batch-dashboard/summary/${row.id}`)}>View Summary</button>
                          <button className={styles.threeDotBtn} onClick={() => {}}><BsThreeDotsVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationRow}>
              <span className={styles.paginationInfo}>Showing 1 to 7 of 42 batches</span>
              <Pagination>
                <Pagination.First />
                <Pagination.Prev />
                <Pagination.Item active={activePage === 1} onClick={() => setActivePage(1)}>{1}</Pagination.Item>
                <Pagination.Item active={activePage === 2} onClick={() => setActivePage(2)}>{2}</Pagination.Item>
                <Pagination.Item active={activePage === 3} onClick={() => setActivePage(3)}>{3}</Pagination.Item>
                <Pagination.Ellipsis />
                <Pagination.Item active={activePage === 6} onClick={() => setActivePage(6)}>{6}</Pagination.Item>
                <Pagination.Next />
                <Pagination.Last />
              </Pagination>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCalendarOutline, IoChevronDown,
} from 'react-icons/io5';
import {
  FiDownload, FiFilter, FiSearch, FiRefreshCw,
  FiChevronLeft, FiChevronRight,
  FiEye, FiEdit2, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';
import { GiChipsBag, GiMoneyStack, GiChart } from 'react-icons/gi';
import { BsBoxSeam } from 'react-icons/bs';
import { FaExclamationTriangle } from 'react-icons/fa';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import Api from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './production-history.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const FEED_TYPE_COLORS = {
  'Starter (0-1mm)': '#7C3AED',
  'Grower (1-3mm)': '#F97316',
  'Finisher (3-5mm)': '#16A34A',
  'Broodstock Feed': '#2563EB',
};

const STATUS_STYLES = {
  Completed: { bg: '#DCFCE7', color: '#15803D' },
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  Cancelled: { bg: '#FEE2E2', color: '#DC2626' },
};

const batches = [
  { batchNo: 'FB-2025-05-24-001', feedType: 'Starter (0-1mm)', siteType: 'Hatchery', startPeriod: 'May 24, 2025', endPeriod: 'May 24, 2025', qty: 1000, unit: 'kg', totalCost: 486000, costPerKg: 486, producedBy: 'John Doe', status: 'Completed' },
  { batchNo: 'FB-2025-05-23-002', feedType: 'Grower (1-3mm)', siteType: 'Hatchery', startPeriod: 'May 21, 2025', endPeriod: 'May 23, 2025', qty: 1500, unit: 'kg', totalCost: 690000, costPerKg: 460, producedBy: 'Sarah Mike', status: 'Completed' },
  { batchNo: 'FB-2025-05-22-003', feedType: 'Finisher (3-5mm)', siteType: 'Hatchery', startPeriod: 'May 22, 2025', endPeriod: 'May 22, 2025', qty: 2000, unit: 'kg', totalCost: 840000, costPerKg: 420, producedBy: 'John Doe', status: 'Completed' },
  { batchNo: 'FB-2025-05-21-004', feedType: 'Starter (0-1mm)', siteType: 'Hatchery', startPeriod: 'May 21, 2025', endPeriod: 'May 21, 2025', qty: 800, unit: 'kg', totalCost: 396000, costPerKg: 495, producedBy: 'Mary Johnson', status: 'Completed' },
  { batchNo: 'FB-2025-05-20-005', feedType: 'Grower (1-3mm)', siteType: 'Hatchery', startPeriod: 'May 20, 2025', endPeriod: 'May 20, 2025', qty: 1200, unit: 'kg', totalCost: 540000, costPerKg: 450, producedBy: 'Sarah Mike', status: 'Completed' },
  { batchNo: 'FB-2025-05-19-006', feedType: 'Broodstock Feed', siteType: 'Hatchery', startPeriod: 'May 18, 2025', endPeriod: 'May 19, 2025', qty: 600, unit: 'kg', totalCost: 354000, costPerKg: 590, producedBy: 'James Brown', status: 'Completed' },
  { batchNo: 'FB-2025-05-19-007', feedType: 'Finisher (3-5mm)', siteType: 'Hatchery', startPeriod: 'May 19, 2025', endPeriod: 'May 19, 2025', qty: 2500, unit: 'kg', totalCost: 1025000, costPerKg: 410, producedBy: 'John Doe', status: 'In Progress' },
  { batchNo: 'FB-2025-05-18-008', feedType: 'Starter (0-1mm)', siteType: 'Hatchery', startPeriod: 'May 18, 2025', endPeriod: 'May 18, 2025', qty: 1000, unit: 'kg', totalCost: 515000, costPerKg: 515, producedBy: 'Mary Johnson', status: 'Cancelled' },
  { batchNo: 'FB-2025-05-17-009', feedType: 'Grower (1-3mm)', siteType: 'Hatchery', startPeriod: 'May 17, 2025', endPeriod: 'May 17, 2025', qty: 1800, unit: 'kg', totalCost: 810000, costPerKg: 450, producedBy: 'Sarah Mike', status: 'Completed' },
  { batchNo: 'FB-2025-05-16-010', feedType: 'Finisher (3-5mm)', siteType: 'Hatchery', startPeriod: 'May 16, 2025', endPeriod: 'May 16, 2025', qty: 1250, unit: 'kg', totalCost: 531250, costPerKg: 425, producedBy: 'James Brown', status: 'Completed' },
];

export default function FeedProductionHistory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  // TODO: replace with real API call
  const handleViewDetails = (row) => {
    // navigate(`/feed/production/${row.batchNo}`);
  };
  const handleEditBatch = (row) => {
    // navigate(`/feed/production/edit/${row.batchNo}`);
  };
  const handleCompleteBatch = (row) => {
    // await Api.put(`/feed-batches/${row.batchNo}/complete`);
  };
  const handleCancelBatch = (row) => {
    // await Api.put(`/feed-batches/${row.batchNo}/cancel`);
  };

  const getActionItems = (row) => {
    const items = [
      {
        label: <><FiEye size={14} style={{ marginRight: 10 }} /> View Details</>,
        onClick: () => handleViewDetails(row),
      },
    ];
    if (row.status === 'In Progress') {
      items.push({
        label: <><FiCheckCircle size={14} style={{ marginRight: 10 }} /> Complete Batch</>,
        onClick: () => handleCompleteBatch(row),
        style: { color: '#15803D', fontWeight: 600 },
      });
    }
    return items;
  };

  return (
    <section className={`${feedStyles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>

            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Feed Management</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Feed Production</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Production History</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Feed Production History</h1>
                <p className={styles.pageSubtitle}>View and track all feed production batches.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.secBtn}>
                  <IoCalendarOutline size={14} />
                  May 1, 2025 - May 31, 2025
                  <IoChevronDown size={12} />
                </button>
                <button className={styles.secBtn}>
                  <FiFilter size={14} />
                  Filter
                </button>
                <button className={styles.secBtn}>
                  <FiDownload size={14} />
                  Export
                </button>
              </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <BsBoxSeam size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Batches</p>
                    <div className={styles.statNumber}>28</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>This Month</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiChipsBag size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Feed Produced</p>
                    <div className={styles.statNumber}>18,450 <span className={styles.statUnit}>kg</span></div>
                  </div>
                </div>
                <p className={`${styles.statTrend} ${styles.trendUp}`}>
                  &uarr; 12.6% vs Apr 1 - Apr 30
                </p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                    <GiMoneyStack size={20} color="#7C3AED" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Production Cost</p>
                    <div className={styles.statNumber}>{formatCurrency(4820000)}</div>
                  </div>
                </div>
                <p className={`${styles.statTrend} ${styles.trendUp}`}>
                  &uarr; 9.3% vs Apr 1 - Apr 30
                </p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                    <GiChart size={20} color="#F97316" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Average Cost / kg</p>
                    <div className={styles.statNumber}>{formatCurrency(261.17)}</div>
                  </div>
                </div>
                <p className={`${styles.statTrend} ${styles.trendDown}`}>
                  &darr; 2.5% vs Apr 1 - Apr 30
                </p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#CCFBF1' }}>
                    <GiMoneyStack size={20} color="#0D9488" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Lowest Cost / kg</p>
                    <div className={styles.statNumber}>{formatCurrency(238.50)}</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Grower (1-3mm)</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FEE2E2' }}>
                    <FaExclamationTriangle size={20} color="#DC2626" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Highest Cost / kg</p>
                    <div className={styles.statNumber}>{formatCurrency(285.40)}</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Starter (0-1mm)</p>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by batch no., feed type or produced by..."
                />
              </div>
              <button className={styles.filterDropdown}>
                All Feed Types <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Statuses <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Sites <IoChevronDown size={11} />
              </button>
              <button className={styles.resetBtn}>
                <FiRefreshCw size={13} />
                Reset
              </button>
            </div>

            {/* ── Data Table ── */}
            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Batch No.</th>
                      <th>Feed Type</th>
                      <th>Site Type</th>
                      <th>Start Period</th>
                      <th>End Period</th>
                      <th>Quantity Produced</th>
                      <th>Unit</th>
                      <th>Total Cost (₦)</th>
                      <th>Cost per Kg (₦)</th>
                      <th>Produced By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((row, i) => {
                      const dotColor = FEED_TYPE_COLORS[row.feedType] || '#9CA3AF';
                      const statusStyle = STATUS_STYLES[row.status] || {};
                      return (
                        <tr key={i}>
                          <td className={styles.batchNoCell}>{row.batchNo}</td>
                          <td>
                            <div className={styles.feedTypeCell}>
                              <span className={styles.feedTypeDot} style={{ background: dotColor }} />
                              {row.feedType}
                            </div>
                          </td>
                          {/* TODO: replace with real site type data once API/taxonomy is available */}
                          <td><span className={styles.siteTypeLink}>{row.siteType}</span></td>
                          <td className={styles.dateCell}>{row.startPeriod}</td>
                          <td className={styles.dateCell}>{row.endPeriod}</td>
                          <td className={styles.numCell}>{f(row.qty)}</td>
                          <td>{row.unit}</td>
                          <td className={styles.boldNumCell}>{formatCurrency(row.totalCost)}</td>
                          <td className={styles.numCell}>{formatCurrency(row.costPerKg)}</td>
                          <td>{row.producedBy}</td>
                          <td>
                            <span
                              className={styles.statusPill}
                              style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td>
                            <PortalDropdown
                              btnClass={feedStyles.threeDotBtn}
                              menuStyle={{
                                background: '#fff',
                                color: '#374151',
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                borderRadius: 8,
                                padding: '4px 0',
                              }}
                              items={getActionItems(row)}
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
                <span className={styles.footerInfo}>Showing 1 to 10 of 28 batches</span>
                <div className={styles.pagination}>
                  <button className={styles.pageArrow}>
                    <FiChevronLeft size={15} />
                  </button>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                  <button className={styles.pageBtn}>2</button>
                  <button className={styles.pageBtn}>3</button>
                  <button className={styles.pageArrow}>
                    <FiChevronRight size={15} />
                  </button>
                  <button className={styles.perPageDropdown}>
                    10 / page <IoChevronDown size={11} />
                  </button>
                </div>
              </div>
            </div>

          </main>
        </section>
      </div>
    </section>
  );
}

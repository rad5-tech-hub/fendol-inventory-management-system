import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoChevronDown,
} from 'react-icons/io5';
import {
  FiDownload, FiFilter, FiSearch, FiRefreshCw,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { GiChipsBag, GiCycle, GiCube, GiShoppingCart } from 'react-icons/gi';
import { BsBoxSeam, BsEye } from 'react-icons/bs';
import { FaExclamationTriangle } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import feedStyles from '../feed.module.scss';
import styles from './feed-inventory.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const FEED_TYPE_PILL_COLORS = {
  'Starter (0-1mm)': { bg: '#FEE2E2', color: '#8B1A1A' },
  'Grower (1-3mm)': { bg: '#FFEDD5', color: '#C2410C' },
  'Finisher (3-5mm)': { bg: '#DCFCE7', color: '#15803D' },
  'Broodstock Feed': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Special / Others': { bg: '#EDE9FE', color: '#6D28D9' },
};

const STATUS_STYLES = {
  'In Stock': { bg: '#DCFCE7', color: '#15803D' },
  'Low Stock': { bg: '#FEF3C7', color: '#B45309' },
  'Out of Stock': { bg: '#FEE2E2', color: '#DC2626' },
};

const FEED_NAME_ICON_COLORS = {
  'Starter Feed (0-1mm)': '#16A34A',
  'Grower Feed (1-3mm)': '#F97316',
  'Finisher Feed (3-5mm)': '#16A34A',
  'Broodstock Feed': '#2563EB',
  'Special Feed': '#7C3AED',
  'Weaner Feed (0-2mm)': '#2563EB',
  'Pre-Starter Feed': '#0D9488',
  'Maintenance Feed': '#F97316',
  'Breeder Feed': '#EAB308',
  'Medicine Mix Feed': '#7C3AED',
};

// TODO: replace with real API call
const feedRows = [
  { name: 'Starter Feed (0-1mm)', type: 'Starter (0-1mm)', unit: 'kg', stock: 6200.00, avgCost: 486.00, totalValue: 3013200.00, status: 'In Stock' },
  { name: 'Grower Feed (1-3mm)', type: 'Grower (1-3mm)', unit: 'kg', stock: 5850.00, avgCost: 460.00, totalValue: 2691000.00, status: 'In Stock' },
  { name: 'Finisher Feed (3-5mm)', type: 'Finisher (3-5mm)', unit: 'kg', stock: 4800.00, avgCost: 420.00, totalValue: 2016000.00, status: 'In Stock' },
  { name: 'Broodstock Feed', type: 'Broodstock Feed', unit: 'kg', stock: 3200.00, avgCost: 590.00, totalValue: 1888000.00, status: 'In Stock' },
  { name: 'Special Feed', type: 'Special / Others', unit: 'kg', stock: 2400.00, avgCost: 510.00, totalValue: 1224000.00, status: 'In Stock' },
  { name: 'Weaner Feed (0-2mm)', type: 'Starter (0-1mm)', unit: 'kg', stock: 2000.00, avgCost: 500.00, totalValue: 1000000.00, status: 'In Stock' },
  { name: 'Pre-Starter Feed', type: 'Starter (0-1mm)', unit: 'kg', stock: 1500.00, avgCost: 520.00, totalValue: 780000.00, status: 'Low Stock' },
  { name: 'Maintenance Feed', type: 'Finisher (3-5mm)', unit: 'kg', stock: 950.00, avgCost: 470.00, totalValue: 446500.00, status: 'Low Stock' },
  { name: 'Breeder Feed', type: 'Broodstock Feed', unit: 'kg', stock: 550.00, avgCost: 600.00, totalValue: 330000.00, status: 'Low Stock' },
  { name: 'Medicine Mix Feed', type: 'Special / Others', unit: 'kg', stock: 400.00, avgCost: 550.00, totalValue: 220000.00, status: 'Out of Stock' },
];

const stockBySourceData = [
  { name: 'Produced Stock', value: 18450, color: '#16A34A' },
  { name: 'Purchased Stock', value: 10000, color: '#2563EB' },
];

const stockByTypeData = [
  { name: 'Starter (0-1mm)', value: 8100, color: '#8B1A1A' },
  { name: 'Grower (1-3mm)', value: 5850, color: '#F97316' },
  { name: 'Finisher (3-5mm)', value: 7700, color: '#16A34A' },
  { name: 'Broodstock Feed', value: 3750, color: '#2563EB' },
  { name: 'Special / Others', value: 3050, color: '#7C3AED' },
];

const totalStock = stockBySourceData.reduce((sum, d) => sum + d.value, 0);
const totalByType = stockByTypeData.reduce((sum, d) => sum + d.value, 0);

const lowStockItems = [
  { name: 'Pre-Starter Feed', stock: 1500.00, reorder: 2000.00, color: '#0D9488' },
  { name: 'Maintenance Feed', stock: 950.00, reorder: 1500.00, color: '#F97316' },
  { name: 'Breeder Feed', stock: 550.00, reorder: 1000.00, color: '#EAB308' },
  { name: 'Medicine Mix Feed', stock: 400.00, reorder: 500.00, color: '#7C3AED' },
];

export default function FeedInventory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const getActionItems = (row) => [
    {
      label: <><BsEye size={14} style={{ marginRight: 10 }} /> View Details</>,
      onClick: () => {},
    },
  ];

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
              <span className={styles.breadcrumbItem}>Inventory</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Feed Inventory</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Feed Inventory</h1>
                <p className={styles.pageSubtitle}>View and manage finished feed stock from both production and purchases.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.secBtn}>
                  <FiDownload size={14} />
                  Stock In (Purchase)
                </button>
                <button className={styles.secBtn}>
                  <BsEye size={14} />
                  View Ledger
                </button>
                <button className={styles.exportBtn}>
                  <FiDownload size={14} />
                  Export Report
                </button>
              </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <GiChipsBag size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Feed Types</p>
                    <div className={styles.statNumber}>10</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>All feed types</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiCycle size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Stock Available</p>
                    <div className={styles.statNumber}>28,450.00 <span className={styles.statUnit}>kg</span></div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Across all feed types</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                    <GiCube size={20} color="#7C3AED" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Stock from Production</p>
                    <div className={styles.statNumber}>18,450.00 <span className={styles.statUnit}>kg</span></div>
                  </div>
                </div>
                <p className={styles.statSecondary}>64.8% of total</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                    <GiShoppingCart size={20} color="#F97316" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Stock from Purchases</p>
                    <div className={styles.statNumber}>10,000.00 <span className={styles.statUnit}>kg</span></div>
                  </div>
                </div>
                <p className={styles.statSecondary}>35.2% of total</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FEE2E2' }}>
                    <FaExclamationTriangle size={20} color="#DC2626" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Low Stock Alerts</p>
                    <div className={styles.statNumber}>4</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Feed types</p>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by feed name or type..."
                />
              </div>
              <button className={styles.filterDropdown}>
                All Feed Types <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Sources <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Sites <IoChevronDown size={11} />
              </button>
              <button className={styles.filterBtn}>
                <FiFilter size={13} />
                Filter
              </button>
              <button className={styles.resetBtn}>
                <FiRefreshCw size={13} />
                Reset
              </button>
            </div>

            {/* ── Main Two‑Column Layout ── */}
            <div className={styles.mainContentRow}>

              {/* ──── LEFT: Table ──── */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.cardTitle}>Feed Stock Overview</h3>
                  <span className={styles.tableBadge}>10 Feed Types</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Feed Name</th>
                        <th>Feed Type</th>
                        <th>Unit</th>
                        <th style={{ textAlign: 'right' }}>Total Stock (Kg)</th>
                        <th style={{ textAlign: 'right' }}>Average Cost (&#8358;/Kg)</th>
                        <th style={{ textAlign: 'right' }}>Total Value (&#8358;)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedRows.map((row, i) => {
                        const iconColor = FEED_NAME_ICON_COLORS[row.name] || '#9CA3AF';
                        const pillStyle = FEED_TYPE_PILL_COLORS[row.type] || { bg: '#F3F4F6', color: '#374151' };
                        const statusStyle = STATUS_STYLES[row.status] || {};
                        return (
                          <tr key={i}>
                            <td>
                              <div className={styles.feedNameCell}>
                                <span className={styles.feedNameIcon} style={{ background: iconColor }} />
                                {row.name}
                              </div>
                            </td>
                            <td>
                              <span className={styles.typePill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                                {row.type}
                              </span>
                            </td>
                            <td>{row.unit}</td>
                            <td className={styles.numCell}>{f(row.stock)}</td>
                            <td className={styles.numCell}>{formatCurrency(row.avgCost)}</td>
                            <td className={styles.boldNumCell}>{formatCurrency(row.totalValue)}</td>
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
                  <span className={styles.footerInfo}>Showing 1 to 10 of 10 feed types</span>
                  <div className={styles.pagination}>
                    <button className={styles.pageArrow}>
                      <FiChevronLeft size={15} />
                    </button>
                    <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                    <button className={styles.pageArrow}>
                      <FiChevronRight size={15} />
                    </button>
                    <button className={styles.perPageDropdown}>
                      10 / page <IoChevronDown size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ──── RIGHT: Sidebar Stacked Cards ──── */}
              <div className={styles.sidebarCol}>

                {/* Card 1: Stock by Source */}
                <div className={styles.sideCard}>
                  <h3 className={styles.cardTitle}>Stock by Source</h3>
                  <div className={styles.donutWrapper}>
                    <div className={styles.donutChartArea}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={stockBySourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={72}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                          >
                            {stockBySourceData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className={styles.donutCenterLabel}>
                        <span className={styles.donutCenterNumber}>{f(totalStock)}</span>
                        <span className={styles.donutCenterText}>Total Stock</span>
                      </div>
                    </div>
                    <div className={styles.donutLegend}>
                      <div className={styles.donutLegendRow}>
                        <span className={styles.donutDot} style={{ background: '#16A34A' }} />
                        <span className={styles.donutLegendLabel}>Produced Stock</span>
                        <span className={styles.donutLegendValue}>18,450 kg</span>
                        <span className={styles.donutLegendPct}>(64.8%)</span>
                      </div>
                      <div className={styles.donutLegendRow}>
                        <span className={styles.donutDot} style={{ background: '#2563EB' }} />
                        <span className={styles.donutLegendLabel}>Purchased Stock</span>
                        <span className={styles.donutLegendValue}>10,000 kg</span>
                        <span className={styles.donutLegendPct}>(35.2%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Stock by Feed Type */}
                <div className={styles.sideCard}>
                  <h3 className={styles.cardTitle}>Stock by Feed Type</h3>
                  <div className={styles.donutWrapper}>
                    <div className={styles.donutChartArea}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={stockByTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={72}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                          >
                            {stockByTypeData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className={styles.donutCenterLabel}>
                        <span className={styles.donutCenterNumber}>{f(totalByType)}</span>
                        <span className={styles.donutCenterText}>Total Stock</span>
                      </div>
                    </div>
                    <div className={styles.donutLegend}>
                      {stockByTypeData.map((item, i) => (
                        <div key={i} className={styles.donutLegendRow}>
                          <span className={styles.donutDot} style={{ background: item.color }} />
                          <span className={styles.donutLegendLabel}>{item.name}</span>
                          <span className={styles.donutLegendValue}>{f(item.value)} kg</span>
                          <span className={styles.donutLegendPct}>({((item.value / totalByType) * 100).toFixed(1)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 3: Low Stock Alerts */}
                <div className={styles.sideCard}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitleNoMargin}>Low Stock Alerts</h3>
                    <span className={styles.viewAllLink}>View All</span>
                  </div>
                  <div className={styles.alertList}>
                    {lowStockItems.map((item, i) => (
                      <div key={i} className={styles.alertItem}>
                        <div className={styles.alertItemLeft}>
                          <span className={styles.alertDot} style={{ background: item.color }} />
                          <span className={styles.alertName}>{item.name}</span>
                        </div>
                        <div className={styles.alertItemRight}>
                          <span className={styles.alertStock}>{f(item.stock)} kg</span>
                          <span className={styles.alertReorder}>Reorder level: {f(item.reorder)} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </main>
        </section>
      </div>
    </section>
  );
}

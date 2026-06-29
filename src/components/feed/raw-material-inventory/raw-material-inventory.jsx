import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiPlus, FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEdit2 } from 'react-icons/fi';
import { BsEye } from 'react-icons/bs';
import { IoChevronDown } from 'react-icons/io5';
import { GiGreenPower, GiMoneyStack } from 'react-icons/gi';
import { BsBoxSeam } from 'react-icons/bs';
import { FaExclamationTriangle } from 'react-icons/fa';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import feedStyles from '../feed.module.scss';
import styles from './raw-material-inventory.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const materials = [
  { name: 'Maize', category: 'Cereals', supplier: 'Agro Allied Resources', unit: 'kg', qty: 5200, unitCost: 220, stockValue: 1144000, status: 'In Stock', lastUpdated: 'May 31, 2025', swatch: '#F59E0B' },
  { name: 'Soybean Meal', category: 'Protein Meals', supplier: 'GreenLife Ingredients', unit: 'kg', qty: 3150, unitCost: 480, stockValue: 1512000, status: 'In Stock', lastUpdated: 'May 31, 2025', swatch: '#D4A373' },
  { name: 'Fishmeal (60%)', category: 'Protein Meals', supplier: 'Blue Ocean Logistics', unit: 'kg', qty: 1250, unitCost: 780, stockValue: 975000, status: 'In Stock', lastUpdated: 'May 31, 2025', swatch: '#FEF3C7' },
  { name: 'Wheat Bran', category: 'By-products', supplier: 'Sunrise Packaging', unit: 'kg', qty: 2800, unitCost: 160, stockValue: 448000, status: 'In Stock', lastUpdated: 'May 31, 2025', swatch: '#92400E' },
  { name: 'Rice Bran', category: 'By-products', supplier: 'Agro Allied Resources', unit: 'kg', qty: 1600, unitCost: 180, stockValue: 288000, status: 'Low Stock', lastUpdated: 'May 31, 2025', swatch: '#A16207' },
  { name: 'Limestone', category: 'Minerals', supplier: 'Natura Additives Ltd.', unit: 'kg', qty: 950, unitCost: 120, stockValue: 114000, status: 'Low Stock', lastUpdated: 'May 31, 2025', swatch: '#D1D5DB' },
  { name: 'DCP (Dicalcium Phosphate)', category: 'Minerals', supplier: 'Natura Additives Ltd.', unit: 'kg', qty: 750, unitCost: 250, stockValue: 187500, status: 'Low Stock', lastUpdated: 'May 31, 2025', swatch: '#F8FAFC' },
  { name: 'Fish Oil', category: 'Oils & Fats', supplier: 'Oceanic Aquatech', unit: 'L', qty: 600, unitCost: 1350, stockValue: 810000, status: 'In Stock', lastUpdated: 'May 31, 2025', swatch: '#F59E0B' },
  { name: 'Salt', category: 'Minerals', supplier: 'Local Supplier', unit: 'kg', qty: 1200, unitCost: 90, stockValue: 108000, status: 'In Stock', lastUpdated: 'May 31, 2025', swatch: '#D4A373' },
  { name: 'Vitamin Premix', category: 'Additives', supplier: 'Natura Additives Ltd.', unit: 'kg', qty: 120, unitCost: 2800, stockValue: 336000, status: 'Low Stock', lastUpdated: 'May 31, 2025', swatch: '#F59E0B' },
];

export default function RawMaterialInventory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const getActionItems = (material) => [
    {
      label: <><BsEye size={14} style={{ marginRight: 10 }} /> View Details</>,
      onClick: () => navigate(`/feed/raw-materials/${encodeURIComponent(material.name)}`),
    },
    {
      label: <><FiEdit2 size={14} style={{ marginRight: 10 }} /> Edit</>,
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

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Raw Material Inventory</h1>
                <p className={styles.pageSubtitle}>Track and manage raw materials used for feed production.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.exportBtn}>
                  <FiDownload size={14} />
                  Export
                </button>
                <button className={styles.addBtn}>
                  <FiPlus size={16} />
                  Add Raw Material
                </button>
              </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className={styles.statCardsRow}>
              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                    <GiGreenPower size={20} color="#16A34A" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Raw Materials</p>
                    <div className={styles.statNumber}>24 <span className={styles.statUnit}>Items</span></div>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                    <BsBoxSeam size={20} color="#2563EB" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Quantity in Stock</p>
                    <div className={styles.statNumber}>28,450 <span className={styles.statUnit}>kg</span></div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Across all materials</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                    <GiMoneyStack size={20} color="#F97316" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Total Stock Value</p>
                    <div className={styles.statNumber}>{formatCurrency(12450000)}</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Based on average cost</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardTop}>
                  <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                    <FaExclamationTriangle size={20} color="#7C3AED" />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>Low Stock Alerts</p>
                    <div className={styles.statNumber}>6</div>
                  </div>
                </div>
                <p className={styles.statSecondary}>Materials</p>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <FiSearch size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by material name..."
                />
              </div>
              <button className={styles.filterDropdown}>
                All Categories <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Suppliers <IoChevronDown size={11} />
              </button>
              <button className={styles.filterDropdown}>
                All Status <IoChevronDown size={11} />
              </button>
              <button className={styles.filterActionBtn}>
                <FiFilter size={13} />
                Filter
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
                      <th>Material Name</th>
                      <th>Category</th>
                      <th>Supplier</th>
                      <th>Unit</th>
                      <th>Quantity in Stock</th>
                      <th>Unit Cost (₦)</th>
                      <th>Stock Value (₦)</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, i) => (
                      <tr key={i}>
                        <td>
                          <div className={styles.materialNameCell}>
                            <span className={styles.materialSwatch} style={{ background: m.swatch }} />
                            <span className={styles.materialName}>{m.name}</span>
                          </div>
                        </td>
                        <td className={styles.bodySecondary}>{m.category}</td>
                        <td className={styles.bodySecondary}>{m.supplier}</td>
                        <td>{m.unit}</td>
                        <td>{f(m.qty)}</td>
                        <td>{formatCurrency(m.unitCost)}</td>
                        <td className={styles.stockValueCell}>{formatCurrency(m.stockValue)}</td>
                        <td>
                          <span className={`${styles.statusPill} ${m.status === 'In Stock' ? styles.statusInStock : styles.statusLowStock}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className={styles.bodySecondary}>{m.lastUpdated}</td>
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
                            items={getActionItems(m)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Table Footer ── */}
              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>Showing 1 to 10 of 24 materials</span>
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

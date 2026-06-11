import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Pagination, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { IoSearchOutline, IoFilterOutline, IoRefreshOutline } from 'react-icons/io5';
import { GiCirclingFish } from 'react-icons/gi';
import { FaChartLine, FaCheckCircle, FaPlus } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Active Batches', value: '8', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Completed Batches', value: '32', icon: FaCheckCircle, color: '#22C55E' },
  { label: 'Total Fry Produced', value: f(582650), icon: GiCirclingFish, color: '#3B82F6' },
  { label: 'Average Hatchability', value: '71.6%', icon: FaChartLine, color: '#8B5CF6' },
];

const hatchabilityColor = (v) => {
  if (v >= 70) return { bg: '#E8F5E9', color: '#22C55E' };
  if (v >= 50) return { bg: '#FFF3E0', color: '#F97316' };
  return { bg: '#FFEBEE', color: '#EF4444' };
};

const rows = [
  { id: 6, batchNo: 'HB-2025-006', dateInjected: 'May 25, 2025', dateStripped: 'May 26, 2025', dateHatched: 'May 28, 2025', females: 3, males: 6, eggWeight: 1.20, hatchability: 75.4, fryProduced: 9048 },
  { id: 5, batchNo: 'HB-2025-005', dateInjected: 'May 20, 2025', dateStripped: 'May 21, 2025', dateHatched: 'May 23, 2025', females: 2, males: 5, eggWeight: 0.95, hatchability: 70.2, fryProduced: 6669 },
  { id: 4, batchNo: 'HB-2025-004', dateInjected: 'May 15, 2025', dateStripped: 'May 16, 2025', dateHatched: 'May 18, 2025', females: 3, males: 6, eggWeight: 1.10, hatchability: 68.9, fryProduced: 7579 },
  { id: 3, batchNo: 'HB-2025-003', dateInjected: 'May 10, 2025', dateStripped: 'May 11, 2025', dateHatched: 'May 13, 2025', females: 2, males: 4, eggWeight: 1.05, hatchability: 65.7, fryProduced: 6899 },
  { id: 2, batchNo: 'HB-2025-002', dateInjected: 'May 06, 2025', dateStripped: 'May 06, 2025', dateHatched: 'May 08, 2025', females: 2, males: 4, eggWeight: 0.90, hatchability: 69.8, fryProduced: 5325 },
  { id: 1, batchNo: 'HB-2025-001', dateInjected: 'May 01, 2025', dateStripped: 'May 02, 2025', dateHatched: 'May 04, 2025', females: 3, males: 5, eggWeight: 1.25, hatchability: 72.1, fryProduced: 8512 },
];

export default function ViewAllBatches() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState(1);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const ActionDropdown = ({ row }) => {
    const [open, setOpen] = useState(false);
    return (
      <Dropdown show={open} onToggle={setOpen} align="end">
        <Dropdown.Toggle as="button" className={styles.threeDotBtn} onClick={() => setOpen(!open)}>
          <BsThreeDotsVertical size={16} />
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ minWidth: 180 }}>
          <Dropdown.Item onClick={() => navigate(`/hatchery/hatch-batches/summary/${row.id}`)}>View Summary</Dropdown.Item>
          <Dropdown.Item onClick={() => navigate('/hatchery/hatch-batches/create', { state: { batch: row } })}>Edit Batch</Dropdown.Item>
          <Dropdown.Item onClick={() => {}}>Transfer to Nursery</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => {}} style={{ color: '#dc3545', fontWeight: 600 }}>Delete Batch</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
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
            <div className={styles.breadcrumb}>
              <span>Hatchery</span>
              <span className={styles.separator}>&gt;</span>
              <span>Hatch Batches</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>All Batches</span>
            </div>

              <div className={styles.pageHeader}>
                <h4>All Hatch Batches</h4>
                <div className={styles.headerActions}>
                  <button className={styles.primaryBtn} onClick={() => navigate('/hatchery/hatch-batches/create')}>
                    <FaPlus size={12} /> New Hatch Batch
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
              <div className={styles.dateRange}>
                <IoFilterOutline size={14} /> May 1, 2025 – May 30, 2025
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
                    <th className="text-start">Batch Number <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Date Injected <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Date Stripped <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Date Hatched <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-end">Females</th>
                    <th className="text-end">Males</th>
                    <th className="text-end">Egg Wt (kg)</th>
                    <th className="text-end">Hatchability</th>
                    <th className="text-end">Fry Produced</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const hc = hatchabilityColor(row.hatchability);
                    return (
                      <tr key={row.id}>
                        <td className="text-start" style={{ fontWeight: 600 }}>{row.batchNo}</td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.dateInjected}</td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.dateStripped}</td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.dateHatched}</td>
                        <td className="text-end">{row.females}</td>
                        <td className="text-end">{row.males}</td>
                        <td className="text-end">{row.eggWeight.toFixed(2)}</td>
                        <td className="text-end"><span className={styles.stageBadge} style={{ background: hc.bg, color: hc.color }}>{row.hatchability}%</span></td>
                        <td className="text-end">{f(row.fryProduced)}</td>
                        <td className="text-start">
                          <div className={styles.actionsCell}>
                            <ActionDropdown row={row} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationRow}>
              <span className={styles.paginationInfo}>Showing 1 to 6 of 40 batches</span>
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

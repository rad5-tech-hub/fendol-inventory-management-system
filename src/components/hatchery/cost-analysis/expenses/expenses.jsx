import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { IoFilterOutline, IoCalendarOutline, IoDownloadOutline } from 'react-icons/io5';
import { GiCirclingFish, GiChipsBag } from 'react-icons/gi';
import { FaMoneyBillWave, FaUsers, FaBolt, FaEye, FaChevronDown } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer as PieResponsive,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceDot,
} from 'recharts';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Total Hatchery Cost', value: '\u20A6185,450.00', icon: FaMoneyBillWave, color: '#F97316', sub: 'This Period' },
  { label: 'Cost Per Fry (Est.)', value: '\u20A62.12', icon: GiCirclingFish, color: '#22C55E', sub: 'This Period' },
  { label: 'Feed Cost', value: '\u20A662,500.00', icon: GiChipsBag, color: '#3B82F6', sub: '33.7% of total' },
  { label: 'Labour Cost', value: '\u20A648,000.00', icon: FaUsers, color: '#8B5CF6', sub: '25.9% of total' },
  { label: 'Energy Cost', value: '\u20A632,000.00', icon: FaBolt, color: '#F97316', sub: '17.2% of total' },
];

const costBreakdown = [
  { name: 'Feed', value: 62500, color: '#3B82F6' },
  { name: 'Labour', value: 48000, color: '#22C55E' },
  { name: 'Energy', value: 32000, color: '#F97316' },
  { name: 'Medicine', value: 18000, color: '#8B5CF6' },
  { name: 'Others', value: 24950, color: '#94A3B8' },
];

const totalCost = costBreakdown.reduce((s, d) => s + d.value, 0);

const monthlyTrend = [
  { month: 'Dec 2024', value: 120000 },
  { month: 'Jan 2025', value: 135000 },
  { month: 'Feb 2025', value: 142000 },
  { month: 'Mar 2025', value: 168000 },
  { month: 'Apr 2025', value: 175000 },
  { month: 'May 2025', value: 185450 },
];

const fmtAmount = (v) => {
  if (v >= 1000) return `\u20A6${(v / 1000).toFixed(0)}K`;
  return `\u20A6${v}`;
};

const categoryBadge = (cat) => {
  const map = {
    Feed: { bg: '#EFF6FF', color: '#3B82F6' },
    Labour: { bg: '#FFF7ED', color: '#F97316' },
    Energy: { bg: '#F0FDF4', color: '#22C55E' },
    Medicine: { bg: '#F5F3FF', color: '#8B5CF6' },
    Others: { bg: '#F9FAFB', color: '#94A3B8' },
  };
  return map[cat] || { bg: '#F9FAFB', color: '#94A3B8' };
};

const rows = [
  { date: 'May 28, 2025', category: 'Feed', description: 'Broodstock feed', reference: 'INV-2025-1287', amount: 25000.00, recordedBy: 'John Doe' },
  { date: 'May 27, 2025', category: 'Labour', description: 'Hatchery staff wages', reference: 'PAY-2025-0527', amount: 16000.00, recordedBy: 'Jane Smith' },
  { date: 'May 26, 2025', category: 'Energy', description: 'Electricity - Incubator', reference: 'BILL-2025-0526', amount: 6500.00, recordedBy: 'Mark Brown' },
  { date: 'May 25, 2025', category: 'Medicine', description: 'Disinfectants & treatments', reference: 'INV-2025-1269', amount: 4200.00, recordedBy: 'Jane Smith' },
  { date: 'May 24, 2025', category: 'Others', description: 'Maintenance supplies', reference: 'INV-2025-1265', amount: 3750.00, recordedBy: 'John Doe' },
];

const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = ((d.value / totalCost) * 100).toFixed(1);
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#2E3135', marginBottom: 2 }}>{d.name}</p>
      <p style={{ margin: 0, fontSize: '0.82rem', color: '#2E3135' }}>{'\u20A6'}{f(d.value)}</p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#8C949B' }}>{pct}%</p>
    </div>
  );
};

const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#2E3135' }}>{'\u20A6'}{f(payload[0].value)}</p>
    </div>
  );
};

export default function Expenses() {
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
              <span>Cost Analysis</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Expenses</span>
            </div>

            <div className={styles.pageHeader}>
              <h4>Expenses</h4>
              <div className={styles.headerActions}>
                <div className={styles.dateRange}>
                  <IoCalendarOutline size={14} /> May 1, 2025 {'\u2013'} May 31, 2025 <FaChevronDown size={10} style={{ marginLeft: 4 }} />
                </div>
                <button className={styles.exportBtn} onClick={() => {}}>
                  <IoDownloadOutline size={16} /> Export Report
                </button>
              </div>
            </div>

            <div className={styles.costStatGrid}>
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

            <div className={styles.costTwoCol}>
              {/* LEFT - Cost Breakdown Donut */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h5>Cost Breakdown</h5>
                </div>
                <div className={styles.costDonutWrapper}>
                  <div className={styles.costDonutChart}>
                    <PieResponsive width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={costBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {costBreakdown.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <PieTooltip content={<PieTooltipContent />} />
                      </PieChart>
                    </PieResponsive>
                    <div className={styles.costDonutCenter}>
                      <span style={{ fontSize: '0.72rem', color: '#8C949B', fontWeight: 600 }}>Total Cost</span>
                       <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2E3135' }}>{'\u20A6'}{f(totalCost)}</span>
                    </div>
                  </div>
                  <div className={styles.costLegend}>
                    {costBreakdown.map((d, i) => {
                      const pct = ((d.value / totalCost) * 100).toFixed(1);
                      return (
                        <div key={i} className={styles.costLegendItem}>
                          <div className="d-flex align-items-center gap-2">
                            <span className={styles.costLegendDot} style={{ background: d.color }} />
                            <span>{d.name}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontWeight: 600, color: '#2E3135' }}>{'\u20A6'}{f(d.value)}</span>
                            <span style={{ color: '#8C949B', fontSize: '0.78rem' }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT - Monthly Cost Trend */}
              <div className={styles.sectionCard}>
                <div className={styles.chartHeader}>
                  <h5>Monthly Cost Trend</h5>
                  <span className={styles.chartDropdown}>This Period {'\u25BE'}</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#8C949B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: '#8C949B', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `\u20A6${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<AreaTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#F97316" strokeWidth={2.5} fill="#F97316" fillOpacity={0.1} dot={false} activeDot={{ r: 5, fill: '#F97316' }} />
                    {monthlyTrend.map((d, i) => (
                      <ReferenceDot key={i} x={d.month} y={d.value} r={4} fill="#F97316" stroke="#fff" strokeWidth={2} />
                    ))}
                    {monthlyTrend.map((d, i) => (
                      <ReferenceDot
                        key={`label-${i}`}
                        x={d.month}
                        y={d.value}
                        r={0}
                        label={{
                          value: fmtAmount(d.value),
                          position: 'top',
                          fill: '#8C949B',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Records */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2E3135', margin: 0 }}>Expense Records</h5>
              <div className="d-flex align-items-center gap-2">
                <button className={styles.filterBtn} onClick={() => {}}>
                  <IoFilterOutline size={16} /> Filters
                </button>
                <button className={styles.primaryBtn} onClick={() => {}}>
                  + Add Expense
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className="text-start">Date <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Category <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Description</th>
                    <th className="text-start">Reference</th>
                    <th className="text-end">Amount ({'\u20A6'}) <span style={{ cursor: 'pointer' }}>↕</span></th>
                    <th className="text-start">Recorded By</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const cb = categoryBadge(row.category);
                    return (
                      <tr key={i}>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.date}</td>
                        <td className="text-start">
                          <span className={styles.stageBadge} style={{ background: cb.bg, color: cb.color, fontSize: 12 }}>{row.category}</span>
                        </td>
                        <td className="text-start" style={{ color: '#6B7280' }}>{row.description}</td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#8C949B' }}>{row.reference}</td>
                        <td className="text-end" style={{ color: '#2E3135', fontWeight: 600 }}>{row.amount.toFixed(2)}</td>
                        <td className="text-start" style={{ fontSize: '0.82rem', color: '#6B7280' }}>{row.recordedBy}</td>
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
              <span className={styles.paginationInfo}>Showing 1 to 5 of 28 records</span>
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
                  <option>45 / page</option>
                  <option>100 / page</option>
                  <option>200 / page</option>
                </Form.Select>
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

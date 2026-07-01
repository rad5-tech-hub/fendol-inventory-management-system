import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceDot,
} from 'recharts';
import { IoGridOutline, IoCalendarOutline } from 'react-icons/io5';
import DataTable from "../../shared/data-table/DataTable";
import { GiCirclingFish, GiEggClutch } from 'react-icons/gi';
import { FaChartLine, FaSkull, FaExchangeAlt, FaEye, FaPlus } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import styles from '../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Active Hatch Batches', value: '6', icon: GiCirclingFish, color: '#F97316' },
  { label: 'Eggs Incubating', value: f(152400), icon: GiEggClutch, color: '#8B5CF6' },
  { label: 'Hatchability Rate', value: '72.8%', icon: FaChartLine, color: '#22C55E' },
  { label: 'Fry Produced', value: f(110850), icon: GiCirclingFish, color: '#3B82F6' },
  { label: 'Fry Mortality', value: f(2340), icon: FaSkull, color: '#EF4444' },
  { label: 'Fry Ready for Transfer', value: f(28650), icon: FaExchangeAlt, color: '#10B981' },
];

const hatchData = [
  { name: 'May 1', value: 68.2 },
  { name: 'May 8', value: 71.5 },
  { name: 'May 15', value: 78.5 },
  { name: 'May 22', value: 74.1 },
  { name: 'May 29', value: 72.8 },
];

const fryData = [
  { name: 'May 1', value: 18200 },
  { name: 'May 8', value: 22500 },
  { name: 'May 15', value: 26450 },
  { name: 'May 22', value: 23800 },
  { name: 'May 29', value: 19900 },
];

const mortalityData = [
  { name: 'May 1', value: 480 },
  { name: 'May 8', value: 560 },
  { name: 'May 15', value: 650 },
  { name: 'May 22', value: 390 },
  { name: 'May 29', value: 260 },
];

const hatchRows = [
  { id: 6, batchNo: 'HB-2025-006', dateInjected: 'May 25, 2025', dateStripped: 'May 26, 2025', dateHatched: 'May 28, 2025', females: 3, males: 6, eggWeight: 1.20, hatchability: 75.4, fryProduced: 9048, status: 'Completed' },
  { id: 5, batchNo: 'HB-2025-005', dateInjected: 'May 20, 2025', dateStripped: 'May 21, 2025', dateHatched: 'May 23, 2025', females: 2, males: 5, eggWeight: 0.95, hatchability: 70.2, fryProduced: 6669, status: 'Completed' },
  { id: 4, batchNo: 'HB-2025-004', dateInjected: 'May 15, 2025', dateStripped: 'May 16, 2025', dateHatched: 'May 18, 2025', females: 3, males: 6, eggWeight: 1.10, hatchability: 68.9, fryProduced: 7579, status: 'Active' },
  { id: 3, batchNo: 'HB-2025-003', dateInjected: 'May 10, 2025', dateStripped: 'May 11, 2025', dateHatched: 'May 13, 2025', females: 2, males: 4, eggWeight: 1.05, hatchability: 65.7, fryProduced: 6899, status: 'Active' },
  { id: 2, batchNo: 'HB-2025-002', dateInjected: 'May 06, 2025', dateStripped: 'May 06, 2025', dateHatched: 'May 08, 2025', females: 2, males: 4, eggWeight: 0.90, hatchability: 69.8, fryProduced: 5325, status: 'Active' },
];

const HatchabilityBadge = ({ value }) => {
  let bg, color;
  if (value >= 70) { bg = '#E8F5E9'; color = '#22C55E'; }
  else if (value >= 50) { bg = '#FFF3E0'; color = '#F97316'; }
  else { bg = '#FFEBEE'; color = '#EF4444'; }
  return <span className={styles.stageBadge} style={{ background: bg, color }}>{value}%</span>;
};

const StatusBadge = ({ status }) => {
  const bg = status === 'Completed' ? '#E8F5E9' : '#EFF6FF';
  const color = status === 'Completed' ? '#2E7D32' : '#1D4ED8';
  return <span className={styles.statusBadge} style={{ background: bg, color }}>{status}</span>;
};

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#2E3135' }}>{payload[0].value}{unit}</p>
    </div>
  );
};

const renderChart = (data, color, unit, yDomain) => {
  const peak = data.reduce((max, d) => d.value > max.value ? d : max, data[0]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#8C949B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={yDomain} tick={{ fill: '#8C949B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: color }} fill={color} fillOpacity={0.08} />
        <ReferenceDot x={peak.name} y={peak.value} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function HatcheryDashboard() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
            <div className={styles.pageHeader}>
              <h4>Hatchery Dashboard</h4>
              <div className={styles.headerActions}>
                <div className={styles.dateRange}>
                  <IoCalendarOutline size={14} /> May 1, 2025 – May 30, 2025
                </div>
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

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Hatchability Trend (%)</h5>
                  <span className={styles.chartDropdown}>This Month ▾</span>
                </div>
                {renderChart(hatchData, '#F97316', '%', [0, 100])}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Fry Production Trend (pcs)</h5>
                  <span className={styles.chartDropdown}>This Month ▾</span>
                </div>
                {renderChart(fryData, '#3B82F6', '', [0, 40000])}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Mortality Trend (pcs)</h5>
                  <span className={styles.chartDropdown}>This Month ▾</span>
                </div>
                {renderChart(mortalityData, '#EF4444', '', [0, 2000])}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2E3135', margin: 0 }}>Recent Hatch Batches</h5>
              <span className={styles.statLink} onClick={() => navigate('/hatchery/hatch-batches/view-all')} style={{ cursor: 'pointer' }}>View all batches &rarr;</span>
            </div>

            <DataTable
              columns={[
                { key: 'batchNo', label: 'Batch Number', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                { key: 'dateInjected', label: 'Date Injected', render: (v) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{v}</span> },
                { key: 'dateStripped', label: 'Date Stripped', render: (v) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{v}</span> },
                { key: 'dateHatched', label: 'Date Hatched', render: (v) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{v}</span> },
                { key: 'females', label: 'Females', align: 'right' },
                { key: 'males', label: 'Males', align: 'right' },
                { key: 'eggWeight', label: 'Egg Wt (kg)', align: 'right', render: (v) => Number(v).toFixed(2) },
                { key: 'hatchability', label: 'Hatchability', align: 'right', render: (v) => <HatchabilityBadge value={v} /> },
                { key: 'fryProduced', label: 'Fry Produced', align: 'right', render: (v) => f(v) },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              ]}
              data={hatchRows}
              actions={(row) => (
                <div className={styles.actionsCell}>
                  <button className={styles.eyeBtn} onClick={() => navigate(`/hatchery/hatch-batches/summary/${row.id}`)}><FaEye size={16} /></button>
                  <button className={styles.threeDotBtn} onClick={() => {}}><BsThreeDotsVertical size={16} /></button>
                </div>
              )}
            />
          </main>
        </section>
      </div>
    </section>
  );
}

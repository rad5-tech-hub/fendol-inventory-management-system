import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from 'react-bootstrap';
import CustomDropdown from "../../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../../shared/data-table/DataTable";
import { toast } from 'react-toastify';
import { IoFilterOutline, IoRefreshOutline, IoCalendarOutline } from 'react-icons/io5';
import { GiCirclingFish, GiChipsBag } from 'react-icons/gi';
import { FaChartLine, FaSkull, FaPlus, FaEye } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceDot,
} from 'recharts';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  { label: 'Total Fry Count', value: f(582650), icon: GiCirclingFish, color: '#3B82F6', sub: 'Across all batches' },
  { label: 'Average Survival Rate', value: '89.2%', icon: FaChartLine, color: '#22C55E', sub: 'This period' },
  { label: 'Total Mortality', value: f(63720), icon: FaSkull, color: '#EF4444', sub: 'This period' },
  { label: 'Total Feed Used', value: '1,245.60 kg', icon: GiChipsBag, color: '#F97316', sub: 'This period' },
];

const fryCountData = [
  { name: 'May 1', value: 38400 },
  { name: 'May 8', value: 45200 },
  { name: 'May 15', value: 62450 },
  { name: 'May 22', value: 56800 },
  { name: 'May 29', value: 51200 },
];

const survivalData = [
  { name: 'May 1', value: 86.5 },
  { name: 'May 8', value: 88.1 },
  { name: 'May 15', value: 90.2 },
  { name: 'May 22', value: 89.8 },
  { name: 'May 29', value: 89.2 },
];

const mortalityTrendData = [
  { name: 'May 1', value: 520 },
  { name: 'May 8', value: 780 },
  { name: 'May 15', value: 1150 },
  { name: 'May 22', value: 890 },
  { name: 'May 29', value: 720 },
];

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

const survivalRateColor = (rate) => {
  if (rate >= 90) return '#22C55E';
  if (rate >= 75) return '#F97316';
  return '#EF4444';
};

const rows = [
  { date: 'May 28, 2025', batch: 'HB-2025-006', tank: 'Incubator Tank - 03', fryCount: 77920, mortality: 850, survival: 89.1, feed: 165.50, recordedBy: 'John Doe' },
  { date: 'May 27, 2025', batch: 'HB-2025-006', tank: 'Incubator Tank - 03', fryCount: 78770, mortality: 760, survival: 90.4, feed: 162.30, recordedBy: 'John Doe' },
  { date: 'May 26, 2025', batch: 'HB-2025-006', tank: 'Incubator Tank - 03', fryCount: 79530, mortality: 820, survival: 89.5, feed: 160.00, recordedBy: 'Jane Smith' },
  { date: 'May 25, 2025', batch: 'HB-2025-006', tank: 'Incubator Tank - 03', fryCount: 80350, mortality: 780, survival: 90.3, feed: 158.90, recordedBy: 'Jane Smith' },
  { date: 'May 24, 2025', batch: 'HB-2025-006', tank: 'Incubator Tank - 03', fryCount: 81130, mortality: 725, survival: 91.1, feed: 155.80, recordedBy: 'Mark Brown' },
];

export default function DailyRecords() {
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
              <span>Fry Production</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Daily Records</span>
            </div>

            <div className={styles.pageHeader}>
              <h4>Daily Records</h4>
              <div className={styles.headerActions}>
                <div className={styles.dateRange}>
                  <IoCalendarOutline size={14} /> May 1, 2025 \u2013 May 30, 2025
                </div>
                <button className={styles.primaryBtn} onClick={() => {}}>
                  <FaPlus size={12} /> Add Daily Record
                </button>
              </div>
            </div>

            <div className={styles.statGrid4}>
              {statCards.map((card, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <div className={styles.statIcon} style={{ background: card.color + '1A' }}>
                      <card.icon size={20} color={card.color} />
                    </div>
                    <span className={styles.statLabel}>{card.label}</span>
                  </div>
                  <div className={styles.statValue}>{card.value}</div>
                  <span style={{ fontSize: '0.75rem', color: '#8C949B', fontWeight: 500 }}>{card.sub}</span>
                </div>
              ))}
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Fry Count Trend (pcs)</h5>
                  <span className={styles.chartDropdown}>This Month \u25be</span>
                </div>
                {renderChart(fryCountData, '#3B82F6', '', [0, 80000])}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Survival Rate Trend (%)</h5>
                  <span className={styles.chartDropdown}>This Month \u25be</span>
                </div>
                {renderChart(survivalData, '#22C55E', '%', [62, 100])}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h5>Mortality Trend (pcs)</h5>
                  <span className={styles.chartDropdown}>This Month \u25be</span>
                </div>
                {renderChart(mortalityTrendData, '#EF4444', '', [0, 2000])}
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.filterSelect}>
                <CustomDropdown
                  options={[{ value: '', label: 'All Batches' }]}
                  placeholder="All Batches"
                />
              </div>
              <div className={styles.filterSelect}>
                <CustomDropdown
                  options={[{ value: '', label: 'All Units' }]}
                  placeholder="All Units"
                />
              </div>
              <div className={styles.dateRange}>
                <IoCalendarOutline size={14} /> May 1, 2025 \u2013 May 30, 2025
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
                { key: 'date', label: 'Date', render: (v) => <span style={{ fontSize: '0.82rem', color: '#8C949B' }}>{v}</span> },
                { key: 'batch', label: 'Batch Number', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                { key: 'tank', label: 'Tank / Unit' },
                { key: 'fryCount', label: 'Fry Count (pcs)', align: 'right', render: (v) => f(v) },
                { key: 'mortality', label: 'Mortality (pcs)', align: 'right', render: (v) => f(v) },
                { key: 'survival', label: 'Survival Rate (%)', align: 'right', render: (v) => <span style={{ color: survivalRateColor(v), fontWeight: 600 }}>{v}%</span> },
                { key: 'feed', label: 'Feed Used (kg)', align: 'right', render: (v) => Number(v).toFixed(2) },
                { key: 'recordedBy', label: 'Recorded By', render: (v) => <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>{v}</span> },
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
              <span className={styles.paginationInfo}>Showing 1 to 5 of 30 records</span>
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

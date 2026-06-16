import React, { useState } from 'react';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../site-management.module.scss';
import {
  BsBuildings,
  BsFillDropletFill,
  BsBarChartFill,
  BsExclamationCircleFill,
  BsArrowLeftRight,
  BsDownload,
  BsEye,
  BsInfoCircleFill,
  BsCalendar3,
  BsChevronDown,
  BsArrowUpShort,
  BsArrowDownShort,
} from 'react-icons/bs';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import ReactPaginate from 'react-paginate';

/* ─────────────────────────────────────────
   MOCK DATA
   TODO: Replace with Api.get('/site-performance') when the endpoint exists.
   Expected shape mirrors what you see below.
───────────────────────────────────────── */
const STATS = {
  totalSites: 5,
  totalFishStock: 1245500,
  totalBiomass: 48760,
  biomassChange: 6.4,
  totalMortality: 12450,
  mortalityChange: -2.8,
  fcr: 1.68,
  totalRevenue: 18450000,
  revenueChange: 12.6,
  comparisonPeriod: 'Apr 1 - Apr 30',
};

const SITE_TYPE_DONUT = [
  { name: 'Hatchery Sites', value: 2, label: '2 (40%)', color: '#FF6B35' },
  { name: 'Main Farm Sites', value: 3, label: '3 (60%)', color: '#F5A623' },
];

const BIOMASS_DONUT = [
  { name: 'Hatchery Sites', value: 12450, label: '12,450 kg (25.5%)', color: '#3B82F6' },
  { name: 'Main Farm Sites', value: 36310, label: '36,310 kg (74.5%)', color: '#22C55E' },
];

const TREND_DATA = [
  { date: 'May 1',  biomass: 22000 },
  { date: 'May 4',  biomass: 24500 },
  { date: 'May 8',  biomass: 27800 },
  { date: 'May 11', biomass: 31000 },
  { date: 'May 15', biomass: 34200 },
  { date: 'May 18', biomass: 37500 },
  { date: 'May 22', biomass: 41000 },
  { date: 'May 25', biomass: 43500 },
  { date: 'May 29', biomass: 45200 },
];

const ALL_SITES = [
  { id: 1, name: 'Main Farm 1', type: 'Main Farm', fishStock: 542300,  biomass: 22450, survivalRate: 89.2, mortality: 6450, fcr: 1.72, revenue: 8450000, status: 'Active' },
  { id: 2, name: 'Main Farm 2', type: 'Main Farm', fishStock: 412800,  biomass: 16230, survivalRate: 91.1, mortality: 4120, fcr: 1.65, revenue: 6250000, status: 'Active' },
  { id: 3, name: 'Main Farm 3', type: 'Main Farm', fishStock: 290400,  biomass: 9630,  survivalRate: 88.3, mortality: 2780, fcr: 1.70, revenue: 3850000, status: 'Active' },
  { id: 4, name: 'Hatchery 1', type: 'Hatchery',  fishStock: null,     biomass: null,  survivalRate: null, mortality: null, fcr: null, revenue: 0,       status: 'Active' },
  { id: 5, name: 'Hatchery 2', type: 'Hatchery',  fishStock: null,     biomass: null,  survivalRate: null, mortality: null, fcr: null, revenue: 0,       status: 'Active' },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmt   = (n) => (n != null ? new Intl.NumberFormat().format(n) : '--');
const fmtKg = (n) => (n != null ? `${new Intl.NumberFormat().format(n)} kg` : '--');
const fmtN  = (n) => (n != null ? `₦${new Intl.NumberFormat().format(n)}` : '--');
const fmtPct = (n) => (n != null ? `${n}%` : '--');

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

/** Reusable donut chart with centered label overlay */
const DonutChart = ({ data, centerLine1, centerLine2 }) => (
  <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={76}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          strokeWidth={0}
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    {/* Center label — absolutely positioned over the chart */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1C1C1C', lineHeight: 1.1 }}>
        {centerLine1}
      </span>
      <span style={{ fontSize: '0.65rem', color: '#8C949B', fontWeight: 500, marginTop: '2px' }}>
        {centerLine2}
      </span>
    </div>
  </div>
);

/** Legend row for donut charts */
const DonutLegend = ({ data }) => (
  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {data.map((entry, idx) => (
      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: entry.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.3 }}>
          {entry.name}
          <br />
          <span style={{ fontWeight: 600, color: '#1C1C1C' }}>{entry.label}</span>
        </span>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const SitePerformance = () => {
  const [siteFilter, setSiteFilter]   = useState('');
  const [trendPeriod]                 = useState('This Month');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const itemsPerPage = 10;

  const filteredSites = siteFilter
    ? ALL_SITES.filter((s) => s.type.toLowerCase() === siteFilter.toLowerCase())
    : ALL_SITES;

  const displayedSites = filteredSites.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const toggleSidebar     = () => setShowSidebar((p) => !p);
  const handleCloseSidebar = () => setShowSidebar(false);

  /* ── Stat card meta ──────────────────── */
  const statCards = [
    {
      label:    'Total Sites',
      value:    fmt(STATS.totalSites),
      sub:      'All active sites',
      change:   null,
      icon:     <BsBuildings size={20} color="#E87722" />,
      iconBg:   '#FFF0E8',
    },
    {
      label:    'Total Fish Stock',
      value:    fmt(STATS.totalFishStock),
      sub:      'Across all sites',
      change:   null,
      icon:     <BsFillDropletFill size={20} color="#2563EB" />,
      iconBg:   '#EFF6FF',
    },
    {
      label:    'Total Biomass',
      value:    `${fmt(STATS.totalBiomass)} kg`,
      sub:      null,
      change:   { value: STATS.biomassChange, period: STATS.comparisonPeriod },
      icon:     <BsBarChartFill size={20} color="#16A34A" />,
      iconBg:   '#F0FDF4',
    },
    {
      label:    'Total Mortality',
      value:    fmt(STATS.totalMortality),
      sub:      null,
      change:   { value: STATS.mortalityChange, period: STATS.comparisonPeriod },
      icon:     <BsExclamationCircleFill size={20} color="#DC2626" />,
      iconBg:   '#FEF2F2',
    },
    {
      label:    'Feed Conversion Ratio',
      value:    STATS.fcr.toFixed(2),
      sub:      'Avg across sites',
      change:   null,
      icon:     <BsArrowLeftRight size={18} color="#7C3AED" />,
      iconBg:   '#F5F3FF',
    },
    {
      label:    'Total Revenue',
      value:    `₦${fmt(STATS.totalRevenue)}`,
      sub:      null,
      change:   { value: STATS.revenueChange, period: STATS.comparisonPeriod },
      icon:     <span style={{ fontSize: '1rem', fontWeight: 800, color: '#D97706' }}>₦</span>,
      iconBg:   '#FFFBEB',
    },
  ];

  return (
    <section className={`${styles.body}`}>
      {/* ── Sticky Header ── */}
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>

      <div className="d-flex gap-2">
        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        {/* ── Main Content ── */}
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>

            {/* ── Breadcrumb ── */}
            <nav style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#8C949B', fontWeight: 500 }}>
                Sites Management
              </span>
              <span style={{ fontSize: '0.8rem', color: '#8C949B', margin: '0 6px' }}>{'>'}</span>
              <span style={{ fontSize: '0.8rem', color: '#B06426', fontWeight: 600 }}>
                Site Performance
              </span>
            </nav>

            {/* ── Page Header ── */}
            <div
              className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4 mt-1"
            >
              <div>
                <h4 className="mb-1 fw-bold" style={{ color: '#111827', fontSize: '1.4rem' }}>
                  Site Performance
                </h4>
                <p className="mb-0" style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  Overview of all sites performance and key operational metrics.
                </p>
              </div>

              {/* Controls row */}
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {/* Site type filter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    color: '#374151',
                    fontWeight: 500,
                    minWidth: '150px',
                  }}
                >
                  <select
                    value={siteFilter}
                    onChange={(e) => { setSiteFilter(e.target.value); setCurrentPage(0); }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.82rem',
                      color: '#374151',
                      fontWeight: 500,
                      flex: 1,
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option value="">All Site Types</option>
                    <option value="Main Farm">Main Farm</option>
                    <option value="Hatchery">Hatchery</option>
                  </select>
                  <BsChevronDown size={12} color="#9CA3AF" />
                </div>

                {/* Date range display */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#fff',
                    fontSize: '0.82rem',
                    color: '#374151',
                    fontWeight: 500,
                    cursor: 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <BsCalendar3 size={13} color="#6B7280" />
                  May 1, 2025 – May 31, 2025
                  <BsChevronDown size={12} color="#9CA3AF" />
                </div>

                {/* Export button */}
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    border: '1.5px solid #2563EB',
                    borderRadius: '8px',
                    background: '#fff',
                    color: '#2563EB',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                  onMouseOut={(e)  => { e.currentTarget.style.background = '#fff'; }}
                >
                  <BsDownload size={14} />
                  Export Report
                </button>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className={styles.stat_grid} style={{ marginBottom: '20px' }}>
              {statCards.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#fff',
                    border: '1px solid #EFEFEF',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Icon + label row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: card.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {card.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#6B7280',
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {card.label}
                    </span>
                  </div>

                  {/* Value */}
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: '#111827',
                        lineHeight: 1.15,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {card.value}
                    </p>

                    {/* Sub-label OR change indicator */}
                    {card.sub && (
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>
                        {card.sub}
                      </p>
                    )}
                    {card.change && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          marginTop: '3px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {card.change.value >= 0 ? (
                          <BsArrowUpShort size={16} color="#16A34A" />
                        ) : (
                          <BsArrowDownShort size={16} color="#DC2626" />
                        )}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: card.change.value >= 0 ? '#16A34A' : '#DC2626',
                          }}
                        >
                          {Math.abs(card.change.value)}%
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginLeft: '2px' }}>
                          vs {card.change.period}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts Row ── */}
            <div className={styles.chart_grid} style={{ marginBottom: '20px' }}>

              {/* Chart 1 — Performance by Site Type (donut) */}
              <div className={styles.chart_panel}>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Performance by Site Type
                </p>
                <DonutChart
                  data={SITE_TYPE_DONUT}
                  centerLine1="5"
                  centerLine2="Total Sites"
                />
                <DonutLegend data={SITE_TYPE_DONUT} />
              </div>

              {/* Chart 2 — Biomass by Site Type (donut) */}
              <div className={styles.chart_panel}>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Biomass by Site Type
                </p>
                <DonutChart
                  data={BIOMASS_DONUT}
                  centerLine1="48,760"
                  centerLine2="kg"
                />
                <DonutLegend data={BIOMASS_DONUT} />
              </div>

              {/* Chart 3 — Site Performance Trend (area) */}
              <div className={styles.chart_panel}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    Site Performance Trend (Biomass)
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#374151',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: '#FAFAFA',
                    }}
                  >
                    {trendPeriod}
                    <BsChevronDown size={11} color="#9CA3AF" />
                  </div>
                </div>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={TREND_DATA}
                      margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="biomassGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#FF6B35" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.0}  />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={(v) => `${v / 1000}K`}
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 60000]}
                        ticks={[0, 10000, 20000, 30000, 40000, 50000, 60000]}
                      />
                      <Tooltip
                        formatter={(v) => [`${new Intl.NumberFormat().format(v)} kg`, 'Biomass']}
                        contentStyle={{
                          fontSize: '0.78rem',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="biomass"
                        stroke="#FF6B35"
                        strokeWidth={2.5}
                        fill="url(#biomassGradient)"
                        dot={{ fill: '#FF6B35', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#FF6B35', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ── Site Performance Overview Table ── */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #EFEFEF',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '20px',
              }}
            >
              {/* Table header bar */}
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #F5F5F5' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Site Performance Overview
                </p>
              </div>

              <div className={styles.table_wrap}>
                <table
                  className="table table-hover mb-0"
                  style={{ fontSize: '0.855rem', minWidth: '900px' }}
                >
                  <thead style={{ backgroundColor: '#F9FAFB' }}>
                    <tr>
                      {[
                        'Site Name',
                        'Site Type',
                        'Fish Stock (pcs)',
                        'Biomass (kg)',
                        'Survival Rate (%)',
                        'Mortality (pcs)',
                        'FCR',
                        'Revenue (₦)',
                        'Status',
                        'Action',
                      ].map((col) => (
                        <th
                          key={col}
                          className="py-3 px-3 border-0 fw-semibold"
                          style={{
                            color: '#6B7280',
                            fontSize: '0.75rem',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSites.map((site) => {
                      const isMainFarm = site.type === 'Main Farm';
                      return (
                        <tr key={site.id} style={{ borderTop: '1px solid #F5F5F5' }}>
                          {/* Site Name */}
                          <td className="py-3 px-3 align-middle fw-semibold" style={{ color: '#111827' }}>
                            {site.name}
                          </td>

                          {/* Site Type badge */}
                          <td className="py-3 px-3 align-middle">
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: isMainFarm ? '#FFF0E8' : '#EFF6FF',
                                color:           isMainFarm ? '#E87722' : '#2563EB',
                              }}
                            >
                              {site.type}
                            </span>
                          </td>

                          {/* Fish Stock */}
                          <td className="py-3 px-3 align-middle" style={{ color: '#374151' }}>
                            {fmt(site.fishStock)}
                          </td>

                          {/* Biomass */}
                          <td className="py-3 px-3 align-middle" style={{ color: '#374151' }}>
                            {fmt(site.biomass)}
                          </td>

                          {/* Survival Rate */}
                          <td className="py-3 px-3 align-middle">
                            {site.survivalRate != null ? (
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: site.survivalRate >= 85 ? '#16A34A' : '#D97706',
                                }}
                              >
                                {fmtPct(site.survivalRate)}
                              </span>
                            ) : (
                              <span style={{ color: '#9CA3AF' }}>--</span>
                            )}
                          </td>

                          {/* Mortality */}
                          <td className="py-3 px-3 align-middle" style={{ color: '#374151' }}>
                            {fmt(site.mortality)}
                          </td>

                          {/* FCR */}
                          <td className="py-3 px-3 align-middle" style={{ color: '#374151' }}>
                            {site.fcr != null ? site.fcr.toFixed(2) : '--'}
                          </td>

                          {/* Revenue */}
                          <td className="py-3 px-3 align-middle fw-semibold" style={{ color: '#111827' }}>
                            {fmtN(site.revenue)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 align-middle">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 10px',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: '#F0FDF4',
                                color: '#16A34A',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#16A34A',
                                  flexShrink: 0,
                                }}
                              />
                              {site.status}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 align-middle text-center">
                            <button
                              title="View site details"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6B7280',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                transition: 'color 0.15s, background 0.15s',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = '#2563EB';
                                e.currentTarget.style.background = '#EFF6FF';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = '#6B7280';
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <BsEye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination row */}
              <div
                className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                style={{ padding: '12px 20px', borderTop: '1px solid #F5F5F5' }}
              >
                <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                  Showing 1 to {filteredSites.length} of {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''}
                </span>
                <ReactPaginate
                  previousLabel="<"
                  nextLabel=">"
                  breakLabel="..."
                  pageCount={Math.ceil(filteredSites.length / itemsPerPage)}
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={3}
                  onPageChange={({ selected }) => setCurrentPage(selected)}
                  forcePage={currentPage}
                  containerClassName="pagination mb-0"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  previousClassName="page-item"
                  previousLinkClassName="page-link"
                  nextClassName="page-item"
                  nextLinkClassName="page-link"
                  breakClassName="page-item"
                  breakLinkClassName="page-link"
                  activeClassName="active"
                />
              </div>
            </div>

            {/* ── Notes ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 18px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                marginBottom: '24px',
              }}
            >
              <BsInfoCircleFill size={16} color="#2563EB" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.82rem', fontWeight: 700, color: '#1D4ED8' }}>
                  Notes
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#3B82F6' }}>
                  Performance metrics are updated based on the selected date range.
                </p>
              </div>
            </div>

          </main>
        </section>
      </div>
    </section>
  );
};

export default SitePerformance;

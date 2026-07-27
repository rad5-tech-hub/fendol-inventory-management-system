import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BsExclamationTriangleFill, BsBuilding, BsWater, BsCurrencyDollar,
  BsCashStack, BsHeartPulseFill, BsGraphUpArrow, BsBoxSeam, BsShop,
  BsCalendarRange, BsArrowClockwise, BsFilter,
} from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { ApiV2 } from '../../shared/api/apiLink';
import styles from '../site-management.module.scss';

const f = (n) => n != null ? new Intl.NumberFormat().format(Number(n)) : '0';
const cf = (n) => n != null
  ? `₦${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : '₦0.00';

const statCards = [
  { key: 'totalSites', label: 'Total Sites', icon: BsBuilding, color: '#6366F1', format: f },
  { key: 'totalFishInPond', label: 'Fish in Pond', icon: BsWater, color: '#0EA5E9', format: f },
  { key: 'totalRevenue', label: 'Total Revenue', icon: BsCurrencyDollar, color: '#22C55E', format: cf },
  { key: 'totalPaid', label: 'Total Paid', icon: BsCashStack, color: '#10B981', format: cf },
  { key: 'totalMortality', label: 'Mortality', icon: BsHeartPulseFill, color: '#EF4444', format: f },
  { key: 'totalExpenses', label: 'Expenses', icon: BsGraphUpArrow, color: '#F97316', format: cf },
  { key: 'totalFeedCost', label: 'Feed Cost', icon: BsBoxSeam, color: '#8B5CF6', format: cf },
  { key: 'totalStoreCost', label: 'Store Cost', icon: BsShop, color: '#EC4899', format: cf },
];

const siteColumns = [
  { key: 'siteName', label: 'Site Name' },
  { key: 'typeName', label: 'Type' },
  { key: 'totalFishInPond', label: 'Fish in Pond', format: f },
  { key: 'totalRevenue', label: 'Revenue', format: cf, right: true },
  { key: 'totalPaid', label: 'Paid', format: cf, right: true },
  { key: 'totalMortality', label: 'Mortality', format: f, right: true },
  { key: 'totalExpenses', label: 'Expenses', format: cf, right: true },
  { key: 'totalFeedCost', label: 'Feed Cost', format: cf, right: true },
  { key: 'totalStoreCost', label: 'Store Cost', format: cf, right: true },
];

const SitePerformance = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.startDate = from;
      if (to) params.endDate = to;
      const res = await ApiV2.get('/v2/site-dashboard/summary', { params });
      const d = res.data?.data;
      setSummary(d?.summary || null);
      setSites(Array.isArray(d?.sites) ? d.sites : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to load site performance data.';
      setError(msg);
      setSummary(null);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateFromChange = (val) => {
    setDateFrom(val);
    if (val && dateTo) {
      fetchData(val, dateTo);
    }
  };

  const handleDateToChange = (val) => {
    setDateTo(val);
    if (dateFrom && val) {
      fetchData(dateFrom, val);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    fetchData();
  };

  const hasData = sites.length > 0 && summary;

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
          <main className={styles.create_form} style={{ padding: '24px 32px', height: 'auto', minHeight: '89vh' }}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: 24, flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <h4 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Site Performance</h4>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
                  Performance metrics across all sites
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                  background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8,
                  color: '#374151', fontSize: 12,
                }}>
                  <BsCalendarRange size={14} color="#9CA3AF" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 12, color: '#374151', fontFamily: 'inherit', minWidth: 130,
                    }}
                  />
                </div>
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>to</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                  background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8,
                  color: '#374151', fontSize: 12,
                }}>
                  <BsCalendarRange size={14} color="#9CA3AF" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 12, color: '#374151', fontFamily: 'inherit', minWidth: 130,
                    }}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: '0 14px', height: 36, background: '#fff',
                      border: '1px solid #D1D5DB', borderRadius: 8,
                      fontSize: 12, color: '#374151', fontWeight: 500, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{
                  width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#512728',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px', display: 'inline-block',
                }} />
                <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
                  Loading site performance data...
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{
                textAlign: 'center', padding: '80px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              }}>
                <BsExclamationTriangleFill size={48} color="#EF4444" />
                <div>
                  <p style={{ color: '#DC2626', fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
                    Failed to load data
                  </p>
                  <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
                <button
                  onClick={() => fetchData(dateFrom, dateTo)}
                  style={{
                    padding: '8px 24px', borderRadius: 8, border: 'none',
                    background: '#111827', color: '#fff', fontSize: 13,
                    cursor: 'pointer', fontWeight: 600, display: 'inline-flex',
                    alignItems: 'center', gap: 8,
                  }}
                >
                  <BsArrowClockwise size={16} /> Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && !hasData && (
              <div style={{
                textAlign: 'center', padding: '80px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <BsExclamationTriangleFill size={48} color="#D1D5DB" />
                <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500, margin: 0 }}>
                  No site performance data available
                </p>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
                  {dateFrom && dateTo
                    ? 'No data found for the selected date range. Try a different range.'
                    : 'Data will appear here once sites are configured.'}
                </p>
              </div>
            )}

            {/* Data */}
            {!loading && !error && hasData && (
              <>
                <style>{`
                  .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    margin-bottom: 28px;
                  }
                  @media (max-width: 991px) {
                    .stat-grid { grid-template-columns: repeat(4, 1fr); }
                  }
                  @media (max-width: 767px) {
                    .stat-grid { grid-template-columns: repeat(2, 1fr); }
                  }
                  @media (max-width: 480px) {
                    .stat-grid { grid-template-columns: repeat(1, 1fr); }
                  }
                `}</style>
                {/* Summary Cards */}
                <div className="stat-grid">
                  {statCards.map((card) => {
                    const Icon = card.icon;
                    const val = summary[card.key];
                    return (
                      <div key={card.key} style={{
                        background: '#fff', borderRadius: 12,
                        border: '1px solid #E5E7EB', padding: 14,
                        display: 'flex', flexDirection: 'column', gap: 6,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `${card.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={16} color={card.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 12, color: '#6B7280', fontWeight: 500,
                              margin: 0, whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {card.label}
                            </p>
                            <p style={{
                              fontSize: 22, fontWeight: 700, color: '#111827',
                              lineHeight: 1.1, margin: '2px 0 0',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {card.format(val)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Per-Site Table */}
                <div style={{
                  background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
                  padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <h5 style={{
                    fontSize: 15, fontWeight: 700, color: '#111827',
                    margin: '0 0 16px',
                  }}>
                    Per-Site Breakdown
                  </h5>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{
                      width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: '0.82rem',
                    }}>
                      <thead>
                        <tr>
                          {siteColumns.map((col) => (
                            <th key={col.key} style={{
                              fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF',
                              textAlign: col.right ? 'right' : 'left',
                              padding: '10px 12px', borderBottom: '1px solid #F0F0F0',
                              whiteSpace: 'nowrap',
                            }}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((site) => (
                          <tr key={site.siteId} style={{ transition: 'background-color 0.15s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            {siteColumns.map((col) => (
                              <td key={col.key} style={{
                                padding: '12px 12px', borderBottom: '1px solid #F3F4F6',
                                color: '#1F2937', fontSize: '0.82rem',
                                textAlign: col.right ? 'right' : 'left',
                                whiteSpace: 'nowrap',
                                fontWeight: col.key === 'siteName' ? 600 : 400,
                              }}>
                                {col.format ? col.format(site[col.key]) : (site[col.key] || '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
};

export default SitePerformance;
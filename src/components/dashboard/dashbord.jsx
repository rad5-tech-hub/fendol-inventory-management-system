import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'react-bootstrap';
import styles from './dashboard.module.scss';
import Api from '../shared/api/apiLink';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import { useSelector } from 'react-redux';
import { SkeletonStatGrid } from '../shared/skeleton/Skeleton';
import { GiCirclingFish } from 'react-icons/gi';
import { BsSearch, BsCalendarRange, BsExclamationTriangleFill, BsArrowClockwise } from 'react-icons/bs';

const Dashboard = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const user = useSelector((store) => store.user);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const activeSite = useSelector((store) => store.activeSite);

  const effectiveSiteId = activeSite?.id || siteId;

  const fetchDashboardData = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (effectiveSiteId) params.siteId = effectiveSiteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const response = await Api.get('/dashboard', { params });
      setDashboardData(response.data?.data || response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch dashboard data.');
      setLoading(false);
    }
  }, [effectiveSiteId, isSuperAdmin, dateFrom, dateTo]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && isSuperAdmin) {
    return (
      <section className={`${styles.body} ${styles.dashBody}`}>
        <div className="sticky-top">
          <Header toggleSidebar={() => setShowSidebar(!showSidebar)} />
        </div>
        <div className="d-flex gap-2">
          <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
            <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={() => setShowSidebar(false)} />
          </div>
          <section className={`${styles.content}`}>
            <main>
              <div className={styles.create_form}>
                <div style={{ padding: "10px 0" }}>
                  <SkeletonStatGrid count={4} />
                  <div style={{ height: 24 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div className={styles.chartCard}><div className={styles.skeletonBlock} style={{ height: 400 }} /></div>
                    <div className={styles.chartCard}><div className={styles.skeletonBlock} style={{ height: 400 }} /></div>
                  </div>
                </div>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  if (error && isSuperAdmin) {
    return (
      <section className={`${styles.body} ${styles.dashBody}`}>
        <div className="sticky-top">
          <Header toggleSidebar={() => setShowSidebar(!showSidebar)} />
        </div>
        <div className="d-flex gap-2">
          <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
            <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={() => setShowSidebar(false)} />
          </div>
          <section className={`${styles.content}`}>
            <main>
              <div className={styles.create_form}>
                <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <BsExclamationTriangleFill size={52} color="#EF4444" />
                  <div>
                    <h1 className={styles.pageTitle} style={{ color: '#C62828', margin: '0 0 8px' }}>Failed to Load Dashboard</h1>
                    <p style={{ color: '#8C949B', fontSize: '0.9rem', margin: 0 }}>{error}</p>
                  </div>
                  <button
                    onClick={fetchDashboardData}
                    style={{
                      padding: '10px 28px', borderRadius: 8, border: 'none',
                      background: '#512728', color: '#fff', fontSize: '0.85rem',
                      cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <BsArrowClockwise size={16} /> Retry
                  </button>
                </div>
              </div>
            </main>
          </section>
        </div>
      </section>
    );
  }

  const summary = dashboardData?.summary || {};
  const totals = dashboardData?.totals || {};
  const daily = dashboardData?.daily || {};
  const sales = dashboardData?.sales || [];
  const topProducts = dashboardData?.topProducts || [];

  const totalSalesFormatted = summary?.totalSalesPrice != null ? `₦${Number(summary.totalSalesPrice).toLocaleString()}` : '₦0';
  const totalCustomers = totals?.totalCustomers ?? 0;
  const totalPonds = totals?.totalPonds ?? 0;

  const searchFiltered = searchQuery
    ? sales.filter(s =>
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sales;

  const filteredProducts = searchQuery
    ? topProducts.filter(p =>
        p.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topProducts;

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body} ${styles.dashBody}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content}`}>
          <main>
            <div className={styles.create_form}>
              <div className={styles.pageTitleRow}>
                  <div className={styles.pageTitleLeft}>
                    <h1 className={styles.pageTitle}>Dashboard Overview</h1>
                  </div>
                <div className={styles.pageTitleRight}>
                  <div className={styles.searchBar}>
                    <BsSearch className={styles.searchIcon} />
                    <input
                      className={styles.searchInput}
                      type="text"
                      placeholder="Search products, sites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <span className={styles.searchClear} onClick={() => setSearchQuery('')}>
                        ✕
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isSuperAdmin ? (
                <>
              {/* Date Range Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <BsCalendarRange size={18} color="#8C949B" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{
                      border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 10px',
                      fontSize: '0.85rem', color: '#374151', background: '#fff', outline: 'none',
                    }}
                  />
                </div>
                <span style={{ color: '#9CA3AF' }}>to</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{
                      border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 10px',
                      fontSize: '0.85rem', color: '#374151', background: '#fff', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Summary Cards */}
              <Row className="g-4 mb-4">
                {[
                  { label: 'TOTAL SALES', value: totalSalesFormatted, icon: '🛍', iconClass: styles.statIconAmber },
                  { label: 'TOTAL CUSTOMERS', value: totalCustomers.toLocaleString(), icon: '👤', iconClass: styles.statIconAmber },
                  { label: 'ACTIVE PONDS', value: totalPonds.toLocaleString(), icon: '🐟', iconClass: styles.statIconBrown },
                  { label: 'COMPLETED SALES', value: summary?.completedCount ?? 0, icon: '✅', iconClass: styles.statIconAmber },
                ].map((card, i) => (
                  <Col key={i} xl={3} lg={6} md={6} sm={12} xs={12}>
                    <div className={styles.statCard}>
                      <div className={styles.statCardTop}>
                        <span className={styles.statLabel}>{card.label}</span>
                        <div className={`${styles.statIcon} ${card.iconClass}`}>{card.icon}</div>
                      </div>
                      <div className={styles.statValue}>{card.value}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Today's Stats */}
              <Row className="g-4 mb-4">
                {[
                  { label: "Today's Sales", value: daily?.todaySalesCount ?? 0, amount: daily?.todaySalesAmount ?? 0, icon: '📊', color: '#22C55E' },
                  { label: "Today's Revenue", value: `₦${(daily?.todaySalesAmount ?? 0).toLocaleString()}`, icon: '💰', color: '#0EA5E9' },
                  { label: "Today's Expenses", value: `₦${(daily?.todayExpenseAmount ?? 0).toLocaleString()}`, icon: '💳', color: '#F97316' },
                ].map((card, i) => (
                  <Col key={i} xl={4} lg={4} md={6} sm={12} xs={12}>
                    <div className={styles.sectionCard}>
                      <div className={styles.todayTile}>
                        <div className={`${styles.todayIcon} ${i === 0 ? styles.todayIconOrange : i === 1 ? styles.todayIconYellow : styles.todayIconGray}`}>
                          {card.icon}
                        </div>
                        <div>
                          <div className={styles.todayLabel}>{card.label}</div>
                          <div className={styles.todayValue}>{card.value}</div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Sales Table */}
              <Row className="g-4 mb-4">
                <Col lg={12} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <div className={styles.topProductsHeader}>
                      <h6 className={styles.sectionTitle}>Recent Sales</h6>
                      {sales.length > 0 && (
                        <div className={styles.topProductsControls}>
                          <span style={{ fontSize: '0.78rem', color: '#8C949B' }}>
                            {summary?.totalSales ?? sales.length} total sales
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.topProductsTable}>
                      {searchFiltered.length === 0 ? (
                        <p className={styles.emptyText}>
                          {searchQuery ? `No sales matching "${searchQuery}".` : sales.length === 0 ? 'No sales data available.' : 'No results.'}
                        </p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Transaction ID</th>
                              <th>Customer</th>
                              <th>Category</th>
                              <th>Payment</th>
                              <th className={styles.cellRight}>Amount (₦)</th>
                              <th className={styles.cellRight}>Paid (₦)</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchFiltered.map((sale) => (
                              <tr key={sale.id}>
                                <td><span style={{ fontWeight: 500, fontSize: '0.78rem' }}>{sale.transactionId || '—'}</span></td>
                                <td>{sale.customerName || '—'}</td>
                                <td>
                                  <span style={{
                                    display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                    fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                                    background: sale.salesCategory === 'fresh-fish' ? '#D1FAE5' : sale.salesCategory === 'feed' ? '#DBEAFE' : '#F3F4F6',
                                    color: sale.salesCategory === 'fresh-fish' ? '#047857' : sale.salesCategory === 'feed' ? '#1D4ED8' : '#374151',
                                  }}>
                                    {(sale.salesCategory || '').replace(/-/g, ' ')}
                                  </span>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{sale.paymentType || '—'}</td>
                                <td className={styles.cellRight}>₦{Number(sale.totalPrice || 0).toLocaleString()}</td>
                                <td className={styles.cellRight}>₦{Number(sale.totalPaid || 0).toLocaleString()}</td>
                                <td>
                                  <span style={{
                                    display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                                    fontSize: '0.72rem', fontWeight: 600,
                                    background: Number(sale.isPending) ? '#FEF3C7' : '#D1FAE5',
                                    color: Number(sale.isPending) ? '#B45309' : '#15803D',
                                  }}>
                                    {Number(sale.isPending) ? 'Pending' : 'Completed'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.78rem', color: '#8C949B', whiteSpace: 'nowrap' }}>
                                  {sale.purchasedDate ? new Date(sale.purchasedDate).toLocaleDateString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Top Products */}
              <Row className="g-4 mb-4">
                <Col lg={12} md={12} sm={12} xs={12}>
                  <div className={styles.sectionCard}>
                    <div className={styles.topProductsHeader}>
                      <h6 className={styles.sectionTitle}>Top Products</h6>
                    </div>
                    <div className={styles.topProductsTable}>
                      {filteredProducts.length === 0 ? (
                        <p className={styles.emptyText}>{searchQuery ? `No products matching "${searchQuery}".` : 'No product data available.'}</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th className={styles.cellRight}>Sales Count</th>
                              <th className={styles.cellRight}>Qty Sold</th>
                              <th className={styles.cellRight}>Revenue (₦)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((item, idx) => (
                              <tr key={item.productName || idx}>
                                <td>
                                  <div className={styles.productCell}>
                                    <div className={styles.productIconBadge} style={{ background: '#E0F2FE' }}>
                                      <GiCirclingFish style={{ color: '#0EA5E9', fontSize: '15px' }} />
                                    </div>
                                    <span className={styles.productName}>{item.productName}</span>
                                  </div>
                                </td>
                                <td className={styles.cellRight}>{item.salesCount ?? 0}</td>
                                <td className={styles.cellRight}>{(item.totalQuantity ?? 0).toLocaleString()}</td>
                                <td className={styles.cellRight}>₦{(item.totalRevenue ?? 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      marginBottom: '24px',
                      boxShadow: '0 8px 24px rgba(81, 39, 40, 0.2)',
                    }}
                  >
                    👋
                  </div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', fontWeight: 700, color: '#2E3135' }}>
                    Welcome, {user?.fullName || user?.name || 'User'}!
                  </h2>
                  <p style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#6C757D' }}>
                    You are logged in as
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      background: '#512728',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '28px',
                    }}
                  >
                    {(user?.userTypes?.[0] || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>

                  {user?.userSites?.length > 0 && (
                    <div style={{ width: '100%', maxWidth: '480px' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Your Sites
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                        {user.userSites.map((site, i) => (
                          <div
                            key={i}
                            style={{
                              background: '#F8F9FA',
                              border: '1px solid #EFEFEF',
                              borderRadius: '12px',
                              padding: '12px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {(site.name?.[0] || site.id?.[0] || 'S').toUpperCase()}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2E3135' }}>
                                {site.name || site.id || '—'}
                              </div>
                              {site.type?.name && (
                                <div style={{ fontSize: '0.72rem', color: '#8C949B' }}>
                                  {site.type.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!user?.userSites?.length && user?.siteId && (
                    <div
                      style={{
                        background: '#F8F9FA',
                        border: '1px solid #EFEFEF',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 700,
                        }}
                      >
                        S
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#2E3135' }}>
                        Site ID: {user.siteId}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </section>
      </div>
    </section>
  );
};

export default Dashboard;
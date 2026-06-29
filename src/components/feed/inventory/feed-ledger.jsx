import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IoCalendarOutline, IoChevronDown, IoClose,
} from 'react-icons/io5';
import {
  FiDownload, FiPrinter, FiChevronLeft, FiChevronRight, FiArrowLeft, FiArrowDown, FiArrowUp,
} from 'react-icons/fi';
import { GiCube } from 'react-icons/gi';
import { BsInfoCircle } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './feed-ledger.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const STATUS_PILL_COLORS = {
  'in stock': { bg: '#DCFCE7', color: '#15803D' },
  'out of stock': { bg: '#FEE2E2', color: '#DC2626' },
  'low stock': { bg: '#FEF3C7', color: '#B45309' },
};

export default function FeedLedger() {
  const { feedName } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [feedDetails, setFeedDetails] = useState(null);
  const [feedMeta, setFeedMeta] = useState(null);
  const [siteTypes, setSiteTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = feedDetails?.feedName || feedMeta?.feedName || 'Feed';

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const [histRes, siteRes, feedsRes] = await Promise.all([
          Api.get(`/feed-history/${feedName}`),
          ApiV2.get('/v2/site-types'),
          Api.get('/feeds?siteId=all').catch(() => null),
        ]);

        if (histRes.data?.success) {
          setHistoryData(histRes.data.data || []);
          if (histRes.data.feedDEtails?.length > 0) {
            setFeedDetails(histRes.data.feedDEtails[0]);
          } else if (histRes.data.data?.length > 0 && histRes.data.data[0].feed) {
            setFeedDetails(histRes.data.data[0].feed);
          }
        }

        if (siteRes.data?.data) {
          setSiteTypes(siteRes.data.data);
        }

        if (feedsRes?.data?.data) {
          const feeds = Array.isArray(feedsRes.data.data) ? feedsRes.data.data : [];
          const match = feeds.find((f) => f.id === feedName);
          if (match) setFeedMeta(match);
        }
      } catch (err) {
        console.error('Failed to fetch feed history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [feedName]);

  const stats = useMemo(() => {
    if (!historyData.length) return null;
    const totalOriginal = historyData.reduce((sum, h) => sum + Number(h.originalQuantity), 0);
    const totalUsed = historyData.reduce((sum, h) => sum + Number(h.quantityUsed), 0);
    const totalRemaining = historyData.reduce((sum, h) => sum + Number(h.remainingFeed), 0);
    const totalBags = historyData.reduce((sum, h) => sum + Number(h.noOfBagAdded), 0);
    const avgPrice = historyData.reduce((sum, h) => sum + Number(h.feedPrice), 0) / historyData.length;
    return { totalOriginal, totalUsed, totalRemaining, totalBags, avgPrice };
  }, [historyData]);

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

            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Inventory</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Feed Ledger</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Transaction History</span>
            </div>

            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>{displayName}</h1>
                <p className={styles.pageSubtitle}>Transaction history for this feed.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                  <FiArrowLeft size={14} />
                  Back to Feed Ledger
                </button>
              </div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                  <GiCube size={18} color="#7C3AED" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Original Qty</span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalOriginal) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                  <FiArrowDown size={18} color="#16A34A" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Qty Used</span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalUsed) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                  <GiCube size={18} color="#2563EB" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>
                    Total Qty Remaining
                    <BsInfoCircle size={12} className={styles.infoIcon} />
                  </span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalRemaining) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#FEF3C7' }}>
                  <GiCube size={18} color="#B45309" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Bags Added</span>
                  <span className={styles.statNumber}>{stats ? f(stats.totalBags) : '--'}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                  <GiCube size={18} color="#F97316" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Avg. Price / Bag</span>
                  <span className={styles.statNumber}>{stats ? formatCurrency(stats.avgPrice) : '--'}</span>
                </div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Feed Name</th>
                      <th>Feed Type</th>
                      <th>Site</th>
                      <th style={{ textAlign: 'right' }}>Original Qty</th>
                      <th style={{ textAlign: 'right' }}>Qty Used</th>
                      <th style={{ textAlign: 'right' }}>Bags Added</th>
                      <th style={{ textAlign: 'right' }}>Price (&#8358;)</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Qty Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '40px 12px', color: '#9CA3AF' }}>
                          Loading...
                        </td>
                      </tr>
                    ) : historyData.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '40px 12px', color: '#9CA3AF' }}>
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      historyData.map((row, i) => {
                        const pillStyle = STATUS_PILL_COLORS[row.status] || { bg: '#F3F4F6', color: '#374151' };
                        const date = new Date(row.createdAt);
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={row.id}>
                            <td>
                              <div className={styles.dateCell}>
                                <span className={styles.dateTop}>{dateStr}</span>
                                <span className={styles.dateBottom}>{timeStr}</span>
                              </div>
                            </td>
                            <td className={styles.feedNameCell}>{feedDetails?.feedName || '--'}</td>
                            <td>{feedDetails?.feedType || '--'}</td>
                            <td>{siteTypes.find(s => s.id === row.siteId)?.name || row.stage || '--'}</td>
                            <td className={styles.numCell}>{f(row.originalQuantity)}</td>
                            <td className={styles.numCell}>{f(row.quantityUsed)}</td>
                            <td className={styles.numCell}>{f(row.noOfBagAdded)}</td>
                            <td className={styles.numCell}>{formatCurrency(row.feedPrice)}</td>
                            <td>
                              <span className={styles.txPill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                                {row.status}
                              </span>
                            </td>
                            <td className={styles.boldNumCell}>{f(row.remainingFeed)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>Showing 1 to {historyData.length} of {historyData.length} transactions</span>
                <div className={styles.pagination}>
                  <button className={styles.pageArrow}>
                    <FiChevronLeft size={15} />
                  </button>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                  <button className={styles.pageArrow}>
                    <FiChevronRight size={15} />
                  </button>
                  <button className={styles.perPageDropdown}>
                    20 / page <IoChevronDown size={11} />
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

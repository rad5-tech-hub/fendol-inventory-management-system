import React, { useState, useMemo } from 'react';
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
import feedStyles from '../feed.module.scss';
import styles from './feed-ledger.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

// TODO: replace with real API call
const rawTransactions = [
  { date: 'May 1, 2025', time: '08:00 AM', type: 'Opening Balance', qtyIn: null, qtyOut: null, unitCost: 480.00, totalAmount: null, notes: ['Opening balance'], notesTwoLine: false },
  { date: 'May 3, 2025', time: '10:15 AM', type: 'Production', qtyIn: 2000.00, qtyOut: null, unitCost: 480.00, totalAmount: 960000.00, notes: ['Batch:', 'PRD-2025-05-03-001'], notesTwoLine: true },
  { date: 'May 5, 2025', time: '11:20 AM', type: 'Purchase', qtyIn: 1500.00, qtyOut: null, unitCost: 500.00, totalAmount: 750000.00, notes: ['Supplier: Agro Feed', 'INV-2025-05-0007'], notesTwoLine: true },
  { date: 'May 6, 2025', time: '09:30 AM', type: 'Usage', qtyIn: null, qtyOut: 1200.00, unitCost: 480.00, totalAmount: 576000.00, notes: ['Daily feeding', '(Pond 1)'], notesTwoLine: true },
  { date: 'May 7, 2025', time: '02:40 PM', type: 'Sales', qtyIn: null, qtyOut: 500.00, unitCost: 520.00, totalAmount: 260000.00, notes: ['Sale Invoice', 'SINV-2025-05-015'], notesTwoLine: true },
  { date: 'May 10, 2025', time: '08:45 AM', type: 'Production', qtyIn: 2500.00, qtyOut: null, unitCost: 481.00, totalAmount: 1202500.00, notes: ['Batch:', 'PRD-2025-05-10-002'], notesTwoLine: true },
  { date: 'May 12, 2025', time: '09:10 AM', type: 'Usage', qtyIn: null, qtyOut: 1800.00, unitCost: 480.00, totalAmount: 864000.00, notes: ['Daily feeding', '(Pond 2)'], notesTwoLine: true },
  { date: 'May 14, 2025', time: '03:00 PM', type: 'Purchase', qtyIn: 3000.00, qtyOut: null, unitCost: 495.00, totalAmount: 1485000.00, notes: ['Supplier: GreenFeed Ltd.', 'INV-2025-05-0012'], notesTwoLine: true },
  { date: 'May 16, 2025', time: '10:00 AM', type: 'Sales', qtyIn: null, qtyOut: 2000.00, unitCost: 525.00, totalAmount: 1050000.00, notes: ['Sale Invoice', 'SINV-2025-05-022'], notesTwoLine: true },
  { date: 'May 18, 2025', time: '11:45 AM', type: 'Usage', qtyIn: null, qtyOut: 1100.00, unitCost: 480.00, totalAmount: 528000.00, notes: ['For hatchery use'], notesTwoLine: false },
  { date: 'May 20, 2025', time: '10:30 AM', type: 'Production', qtyIn: 850.00, qtyOut: null, unitCost: 482.00, totalAmount: 409700.00, notes: ['Batch:', 'PRD-2025-05-20-003'], notesTwoLine: true },
];

const TRANSACTION_PILL_COLORS = {
  'Opening Balance': { bg: '#EDE9FE', color: '#6D28D9' },
  'Production': { bg: '#DCFCE7', color: '#15803D' },
  'Purchase': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Usage': { bg: '#FEF3C7', color: '#B45309' },
  'Sales': { bg: '#FEE2E2', color: '#DC2626' },
};

export default function FeedLedger() {
  const { feedName } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const displayName = feedName ? decodeURIComponent(feedName) : 'Feed';

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const transactions = useMemo(() => {
    let balance = 0;
    let balanceValue = 0;
    return rawTransactions.map((tx) => {
      if (tx.qtyIn) balance += tx.qtyIn;
      if (tx.qtyOut) balance -= tx.qtyOut;
      if (tx.type === 'Opening Balance') {
        balance = tx.qtyIn || 2000;
        balanceValue = tx.qtyIn ? tx.qtyIn * tx.unitCost : 2000 * tx.unitCost;
      } else {
        if (tx.totalAmount) balanceValue += tx.qtyIn ? tx.totalAmount : -tx.totalAmount;
      }
      return { ...tx, balance, balanceValue };
    });
  }, []);

  // TODO: replace with real API call
  const stats = useMemo(() => ({
    openingBalance: 2000,
    openingBalanceValue: 960000,
    totalIn: 6850,
    totalInValue: 3292000,
    totalOut: 6450,
    totalOutValue: 3100000,
    currentBalance: 2400,
    currentBalanceValue: 1152000,
    avgCost: 480,
  }), []);

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
              <span className={styles.breadcrumbItem}>Feed Ledger</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>Transaction History</span>
            </div>

            {/* ── Page Header ── */}
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

            {/* ── Filter Row (loose, not inside a card) ── */}
            <div className={styles.filterRow}>
              <div className={styles.filterLeft}>
                <div className={styles.filterField}>
                  <span className={styles.filterCaption}>Date Range</span>
                  <div className={styles.filterControl}>
                    <IoCalendarOutline size={14} className={styles.ctrlIcon} />
                    <span className={styles.ctrlText}>May 1, 2025 - May 31, 2025</span>
                    <IoClose size={14} className={styles.ctrlClear} />
                    <IoChevronDown size={11} className={styles.ctrlChevron} />
                  </div>
                </div>
                <div className={styles.filterField}>
                  <span className={styles.filterCaption}>Transaction Type</span>
                  <div className={styles.filterControl}>
                    <span className={styles.ctrlText}>All Transaction Types</span>
                    <IoChevronDown size={11} className={styles.ctrlChevron} />
                  </div>
                </div>
              </div>
              <div className={styles.filterRight}>
                <button className={styles.secBtn}>
                  <FiDownload size={14} />
                  Export
                </button>
                <button className={styles.secBtn}>
                  <FiPrinter size={14} />
                  Print
                </button>
              </div>
            </div>

            {/* ── Stat Row (loose, not inside cards) ── */}
            <div className={styles.statRow}>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#EDE9FE' }}>
                  <GiCube size={18} color="#7C3AED" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Opening Balance (May 1)</span>
                  <span className={styles.statNumber}>{f(stats.openingBalance)}.00 kg</span>
                  <span className={styles.statSecondaryVal}>{formatCurrency(stats.openingBalanceValue)}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#DCFCE7' }}>
                  <FiArrowDown size={18} color="#16A34A" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total In</span>
                  <span className={styles.statNumber}>{f(stats.totalIn)}.00 kg</span>
                  <span className={styles.statGreenVal}>{formatCurrency(stats.totalInValue)}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#FEE2E2' }}>
                  <FiArrowUp size={18} color="#DC2626" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total Out</span>
                  <span className={styles.statNumber}>{f(stats.totalOut)}.00 kg</span>
                  <span className={styles.statRedVal}>{formatCurrency(stats.totalOutValue)}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#DBEAFE' }}>
                  <GiCube size={18} color="#2563EB" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>
                    Current Balance
                    <BsInfoCircle size={12} className={styles.infoIcon} />
                  </span>
                  <span className={styles.statNumber}>{f(stats.currentBalance)}.00 kg</span>
                  <span className={styles.statSecondaryVal}>{formatCurrency(stats.currentBalanceValue)}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIconCircle} style={{ background: '#FFEDD5' }}>
                  <GiCube size={18} color="#F97316" />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Average Cost / kg</span>
                  <span className={styles.statNumber}>{formatCurrency(stats.avgCost)}</span>
                </div>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Feed Name</th>
                      <th style={{ textAlign: 'right' }}>Quantity In (Kg)</th>
                      <th style={{ textAlign: 'right' }}>Quantity Out (Kg)</th>
                      <th style={{ textAlign: 'right' }}>Unit Cost (&#8358;)</th>
                      <th style={{ textAlign: 'right' }}>Total Amount (&#8358;)</th>
                      <th style={{ textAlign: 'right' }}>Balance (Kg)</th>
                      <th style={{ textAlign: 'right' }}>Balance Value (&#8358;)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => {
                      const pillStyle = TRANSACTION_PILL_COLORS[tx.type] || { bg: '#F3F4F6', color: '#374151' };
                      return (
                        <tr key={i}>
                          <td>
                            <div className={styles.dateCell}>
                              <span className={styles.dateTop}>{tx.date}</span>
                              <span className={styles.dateBottom}>{tx.time}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.txPill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={styles.feedNameCell}>{displayName}</td>
                          <td className={styles.numCell}>{tx.qtyIn ? f(tx.qtyIn) : '\u2013'}</td>
                          <td className={styles.numCell}>{tx.qtyOut ? f(tx.qtyOut) : '\u2013'}</td>
                          <td className={styles.numCell}>{formatCurrency(tx.unitCost)}</td>
                          <td className={styles.boldNumCell}>{tx.totalAmount ? formatCurrency(tx.totalAmount) : '\u2013'}</td>
                          <td className={styles.numCell}>{f(tx.balance)}</td>
                          <td className={styles.numCell}>{formatCurrency(tx.balanceValue)}</td>
                          <td className={styles.notesCell}>
                            {tx.notesTwoLine ? (
                              <>
                                <span className={styles.notesLine}>{tx.notes[0]}</span>
                                <span className={styles.notesLineRef}>{tx.notes[1]}</span>
                              </>
                            ) : (
                              <span className={styles.notesLine}>{tx.notes[0]}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Table Footer ── */}
              <div className={styles.tableFooter}>
                <span className={styles.footerInfo}>Showing 1 to 10 of {transactions.length} transactions</span>
                <div className={styles.pagination}>
                  <button className={styles.pageArrow}>
                    <FiChevronLeft size={15} />
                  </button>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                  <button className={styles.pageBtn}>2</button>
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

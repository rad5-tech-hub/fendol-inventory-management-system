import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiDollarSign, FiAlertTriangle, FiClock, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { BsBoxSeam, BsTag, BsArrowUpShort } from 'react-icons/bs';
import { ApiV2 } from '../../shared/api/apiLink';
import styles from './RawMaterialDetailSidebar.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_CONFIG = {
  'in stock': { label: 'In Stock', className: 'statusInStock' },
  'low stock': { label: 'Low Stock', className: 'statusLowStock' },
  'out of stock': { label: 'Out of Stock', className: 'statusOutOfStock' },
};

export default function RawMaterialDetailSidebar({ material, onClose }) {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async (cursor) => {
    if (!material?.id) return;
    setHistoryLoading(true);
    try {
      const params = {};
      const rawSid = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]);
      if (rawSid) params.siteId = rawSid;
      if (cursor) params.cursor = cursor;

      const res = await ApiV2.get(`/v2/raw-material-history/${material.id}`, { params });
      if (res.data?.success) {
        const entries = res.data.data || [];
        setHistory((prev) => cursor ? [...prev, ...entries] : entries);
        setPagination(res.data.pagination || null);
      }
    } catch {
      // silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [material?.id, activeSite?.id, isSuperAdmin, user?.siteId]);

  useEffect(() => {
    if (material?.id) {
      setHistory([]);
      setPagination(null);
      fetchHistory();
    }
  }, [material?.id, fetchHistory]);

  if (!material) return null;

  const statusCfg = STATUS_CONFIG[material.status] || { label: material.status, className: 'statusInStock' };
  const stockValue = Number(material.quantity) * Number(material.unitCost);
  const threshold = Number(material.threshold);
  const quantity = Number(material.quantity);
  const isLow = quantity <= threshold;

  const content = (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle}>
              <FiPackage size={22} />
            </div>
            <div>
              <h2 className={styles.title}>{material.name}</h2>
              <span className={`${styles.statusBadge} ${styles[statusCfg.className]}`}>{statusCfg.label}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Overview</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <BsTag size={14} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Category</span>
                  <span className={styles.infoValue}>{material.category || '--'}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <BsBoxSeam size={14} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Unit</span>
                  <span className={styles.infoValue}>{material.unit || '--'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Stock Details</h3>
            <div className={styles.stockCards}>
              <div className={styles.stockCard}>
                <span className={styles.stockCardLabel}>Quantity in Stock</span>
                <span className={styles.stockCardValue}>{f(quantity)}</span>
                <span className={styles.stockCardUnit}>{material.unit}</span>
              </div>
              <div className={styles.stockCard}>
                <span className={styles.stockCardLabel}>Unit Cost</span>
                <span className={styles.stockCardValue}>{formatCurrency(Number(material.unitCost))}</span>
                <span className={styles.stockCardUnit}>per {material.unit}</span>
              </div>
              <div className={styles.stockCard}>
                <span className={styles.stockCardLabel}>Stock Value</span>
                <span className={styles.stockCardValue}>{formatCurrency(stockValue)}</span>
                <span className={styles.stockCardUnit}>total</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Threshold & Alerts</h3>
            <div className={`${styles.thresholdCard} ${isLow ? styles.thresholdWarning : ''}`}>
              <FiAlertTriangle size={16} />
              <div>
                <span className={styles.thresholdLabel}>Low Stock Threshold</span>
                <span className={styles.thresholdValue}>{f(threshold)} {material.unit}</span>
                {isLow && (
                  <span className={styles.thresholdAlert}>
                    Current stock ({f(quantity)} {material.unit}) is at or below threshold
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Timeline</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <FiClock size={14} className={styles.timelineIcon} />
                <div>
                  <span className={styles.timelineLabel}>Last Updated</span>
                  <span className={styles.timelineValue}>{formatDate(material.updatedAt)}</span>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <FiRefreshCw size={14} className={styles.timelineIcon} />
                <div>
                  <span className={styles.timelineLabel}>Date Added</span>
                  <span className={styles.timelineValue}>{formatDate(material.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Stock History</h3>
            {history.length === 0 && !historyLoading && (
              <div className={styles.emptyHistory}>No stock history recorded yet.</div>
            )}
            <div className={styles.historyList}>
              {history.map((entry) => {
                const entryStatusCfg = STATUS_CONFIG[entry.status] || { label: entry.status, className: 'statusInStock' };
                return (
                  <div key={entry.id} className={styles.historyItem}>
                    <div className={styles.historyDot}>
                      <BsArrowUpShort size={16} color="#16A34A" />
                    </div>
                    <div className={styles.historyContent}>
                      <div className={styles.historyRow}>
                        <span className={styles.historyQty}>+{f(Number(entry.quantityAdded))}</span>
                        <span className={styles.historyStatus}><span className={`${styles.statusBadge} ${styles[entryStatusCfg.className]}`}>{entryStatusCfg.label}</span></span>
                      </div>
                      <div className={styles.historyMeta}>
                        <span className={styles.historyStock}>Stock: {f(Number(entry.quantityInStock))}</span>
                        <span className={styles.historyDate}>{formatDateTime(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {pagination?.hasMore && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => fetchHistory(pagination.nextCursor)}
                disabled={historyLoading}
              >
                {historyLoading ? 'Loading...' : <>Load older <FiChevronDown size={13} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

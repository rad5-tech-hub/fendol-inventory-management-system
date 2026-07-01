import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { IoArrowBackOutline, IoPencilOutline } from 'react-icons/io5';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { GiChipsBag, GiMoneyStack } from 'react-icons/gi';
import { BsBoxSeam, BsCalendar } from 'react-icons/bs';
import { FaUserCog } from 'react-icons/fa';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { ApiV2 } from '../../shared/api/apiLink';
import feedStyles from '../feed.module.scss';
import styles from './batch-detail.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const formatDate = (iso) => {
  if (!iso) return '--';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (iso) => {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const StatusBadge = ({ status }) => {
  const colors = {
    completed: { bg: '#DCFCE7', color: '#15803D' },
    'in progress': { bg: '#DBEAFE', color: '#1D4ED8' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626' },
  };
  const s = (status || '').toLowerCase();
  const palette = colors[s] || { bg: '#F3F4F6', color: '#374151' };
  const display = s === 'in progress' ? 'In Progress' : (s.charAt(0).toUpperCase() + s.slice(1));
  return (
    <span className={styles.statusBadge} style={{ background: palette.bg, color: palette.color }}>
      {display}
    </span>
  );
};

export default function FeedProductionBatchDetail() {
  const { batchNumber } = useParams();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batch, setBatch] = useState(null);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    const fetchBatch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ApiV2.get(`/v2/feed-production-batch/${batchNumber}`);
        if (res.data?.success && res.data?.data) {
          setBatch(res.data.data);
        } else {
          throw new Error(res.data?.response_message || 'Batch not found.');
        }
      } catch (err) {
        const msg = !err.response
          ? 'Network error. Please check your internet connection and try again.'
          : err.response?.status === 404
            ? 'Production batch not found.'
            : err.response?.data?.response_message
              || err.response?.data?.message
              || 'Failed to load batch details.';
        setError(msg);
        toast.error(msg, { autoClose: 6000 });
      } finally {
        setLoading(false);
      }
    };
    if (batchNumber) fetchBatch();
  }, [batchNumber]);

  const handleEdit = () => {
    navigate('/feed/production/create', { state: { editBatch: batch } });
  };

  const handleComplete = async () => {
    if (!window.confirm(`Complete batch #${batchNumber}?`)) return;
    try {
      await ApiV2.patch(`/v2/feed-production-batch/${batchNumber}`, { status: 'completed' });
      toast.success(`Batch #${batchNumber} completed successfully!`);
      const res = await ApiV2.get(`/v2/feed-production-batch/${batchNumber}`);
      if (res.data?.data) setBatch(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.response_message || 'Failed to complete batch.', { autoClose: 6000 });
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel batch #${batchNumber}? This action cannot be undone.`)) return;
    try {
      await ApiV2.patch(`/v2/feed-production-batch/${batchNumber}`, { status: 'cancelled' });
      toast.success(`Batch #${batchNumber} cancelled.`);
      const res = await ApiV2.get(`/v2/feed-production-batch/${batchNumber}`);
      if (res.data?.data) setBatch(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.response_message || 'Failed to cancel batch.', { autoClose: 6000 });
    }
  };

  /* ----- derived data ----- */
  const rawMaterials = Array.isArray(batch?.rawMaterials) ? batch.rawMaterials.filter(m => m.rawMaterial) : [];
  const otherCosts = Array.isArray(batch?.rawMaterials) ? batch.rawMaterials.filter(m => m.costType) : [];

  const totalRawCost = rawMaterials.reduce((sum, m) => {
    const qty = Number(m.quantityUsed || 0);
    const unit = Number(m.unitCost || 0);
    return sum + (qty * unit);
  }, 0);

  const totalOtherCost = otherCosts.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const grandTotal = totalRawCost + totalOtherCost;

  /* ----- info cards ----- */
  const infoCards = [
    {
      label: 'Total Feed Produced',
      value: batch ? `${f(Number(batch.totalFeedProduced || 0))} kg` : '--',
      sub: batch?.totalBagsProduced ? `${f(batch.totalBagsProduced)} bags` : 'No bags recorded',
      icon: GiChipsBag,
      color: '#16A34A',
    },
    {
      label: 'Bags Produced',
      value: batch ? f(batch.totalBagsProduced || 0) : '--',
      sub: batch?.totalFeedProduced ? `${f(Number(batch.totalFeedProduced))} kg total` : 'Not yet produced',
      icon: BsBoxSeam,
      color: '#2563EB',
    },
    {
      label: 'Cost per Kg',
      value: batch ? formatCurrency(batch.costPerKg || 0) : '--',
      sub: batch?.feed?.feedName || 'N/A',
      icon: GiMoneyStack,
      color: '#7C3AED',
    },
    {
      label: 'Raw Material Cost',
      value: batch ? formatCurrency(totalRawCost) : '--',
      sub: `${rawMaterials.length} material${rawMaterials.length !== 1 ? 's' : ''}`,
      icon: GiMoneyStack,
      color: '#F97316',
    },
  ];

  return (
    <section className={`${feedStyles.body}`}>
      <ToastContainer />
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`}>
          <main className={styles.summaryPage}>

            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span>Feed Management</span>
              <span className={styles.separator}>&gt;</span>
              <span>Feed Production</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Batch #{batchNumber}</span>
            </div>

            {/* ── Back link ── */}
            <div className={styles.backLink} onClick={() => navigate('/feed/production/history')}>
              <IoArrowBackOutline size={15} />
              Back to Production History
            </div>

            {/* ── Header ── */}
            <div className={styles.summaryHeader}>
              <div className={styles.summaryTitleGroup}>
                <div className={styles.summaryTitleRow}>
                  <h3>Feed Production Batch Summary</h3>
                  {batch && <StatusBadge status={batch.status} />}
                </div>
                <p className={styles.summarySubtitle}>
                  {batch
                    ? `Batch #${batch.batchNumber} — ${batch.feed?.feedName || 'Unknown Feed'} • Started ${formatDate(batch.productionStartDate)}`
                    : 'Loading batch details...'}
                </p>
              </div>
              <div className={styles.summaryActions}>
                {batch?.status === 'in progress' && (
                  <>
                    <button className={styles.outlineBtn} onClick={handleComplete}>
                      <FiCheckCircle size={15} /> Complete Batch
                    </button>
                    <button className={styles.outlineBtn} onClick={handleCancel}>
                      <FiXCircle size={15} /> Cancel Batch
                    </button>
                  </>
                )}
                <button className={styles.primaryBtn} onClick={handleEdit}>
                  <IoPencilOutline size={15} /> Edit
                </button>
              </div>
            </div>

            {/* ── Loading / Error / Empty ── */}
            {loading && (
              <div className={styles.loadingState}>Loading batch details...</div>
            )}
            {!loading && error && (
              <div className={styles.errorState}>{error}</div>
            )}
            {!loading && !error && !batch && (
              <div className={styles.emptyState}>
                <p>Production batch not found.</p>
                <div className={styles.backLink} onClick={() => navigate('/feed/production/history')}>
                  <IoArrowBackOutline size={15} /> Back to Production History
                </div>
              </div>
            )}

            {/* ── Content ── */}
            {!loading && !error && batch && (
              <>
                {/* Info Strip */}
                <div className={styles.infoStrip}>
                  {infoCards.map((card, i) => (
                    <div key={i} className={styles.infoCard}>
                      <div className={styles.infoIcon} style={{ background: card.color + '1A' }}>
                        <card.icon size={20} color={card.color} />
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoLabel}>{card.label}</div>
                        <div className={styles.infoValue}>{card.value}</div>
                        {card.sub && <div className={styles.infoSub}>{card.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two-column layout */}
                <div className={styles.summaryTwoCol}>
                  {/* ── LEFT COLUMN ── */}
                  <div className={styles.summaryLeft}>
                    {/* Batch Information */}
                    <div className={styles.colCard}>
                      <h5>Batch Information</h5>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Feed Name</span>
                        <span className={styles.detailValue}>{batch.feed?.feedName || '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Feed Type</span>
                        <span className={styles.detailValue}>{batch.feed?.feedType || '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Site</span>
                        <span className={styles.detailValue}>{batch.siteType?.name || '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Machine Used</span>
                        <span className={styles.detailValue}>{batch.machineUsed || '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Produced By</span>
                        <span className={styles.detailValue}>{batch.staff?.name || '--'}</span>
                      </div>
                      <div className={styles.detailDivider} />
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Start Date</span>
                        <span className={styles.detailValue}>{formatDate(batch.productionStartDate)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>End Date</span>
                        <span className={styles.detailValue}>{batch.productionEndDate ? formatDate(batch.productionEndDate) : '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Shelf Life</span>
                        <span className={styles.detailValue}>{batch.shelfLife ? `${batch.shelfLife} days` : '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Expiry Date</span>
                        <span className={styles.detailValue}>{batch.expiryDate ? formatDate(batch.expiryDate) : '--'}</span>
                      </div>
                      <div className={styles.detailDivider} />
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Comments</span>
                      </div>
                      <p className={styles.commentsBlock}>{batch.comments || 'No comments.'}</p>
                    </div>

                    {/* Audit Information */}
                    <div className={styles.colCard}>
                      <h5>Audit Information</h5>
                      <div className={styles.auditRow}>
                        <span className={styles.auditLabel}>Created By</span>
                        <span className={styles.auditName}>{batch.createdBy || '--'}</span>
                        <span className={styles.auditDate}>{formatDateTime(batch.createdAt)}</span>
                      </div>
                      <div className={styles.auditRow}>
                        <span className={styles.auditLabel}>Last Updated By</span>
                        <span className={styles.auditName}>{batch.updatedBy || '--'}</span>
                        <span className={styles.auditDate}>{batch.updatedAt ? formatDateTime(batch.updatedAt) : '--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div className={styles.summaryRight}>
                    {/* Raw Materials */}
                    <div className={styles.colCard}>
                      <h5>
                        Raw Materials Used
                        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#8C949B' }}>
                          {rawMaterials.length} item{rawMaterials.length !== 1 ? 's' : ''}
                        </span>
                      </h5>
                      {rawMaterials.length > 0 ? (
                        <>
                          <div className={styles.tableWrapper}>
                            <table className={styles.rawMaterialTable}>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Material</th>
                                  <th>Quantity Used</th>
                                  <th>Unit Cost</th>
                                  <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rawMaterials.map((m, i) => {
                                  const qty = Number(m.quantityUsed || 0);
                                  const unit = Number(m.unitCost || 0);
                                  const total = qty * unit;
                                  return (
                                    <tr key={m.id || i}>
                                      <td style={{ color: '#8C949B' }}>{i + 1}</td>
                                      <td style={{ fontWeight: 600 }}>{m.rawMaterial?.name || '--'}</td>
                                      <td>{f(qty)}</td>
                                      <td>{formatCurrency(unit)}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                        {formatCurrency(total)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Other Costs section */}
                          {otherCosts.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <h5 style={{ fontSize: '0.82rem', margin: '0 0 8px', padding: 0, border: 'none', color: '#8C949B' }}>
                                Other Costs
                              </h5>
                              <div className={styles.tableWrapper}>
                                <table className={styles.rawMaterialTable}>
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Cost Type</th>
                                      <th>Comment</th>
                                      <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {otherCosts.map((c, i) => (
                                      <tr key={c.id || i}>
                                        <td style={{ color: '#8C949B' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{c.costType?.name || '--'}</td>
                                        <td style={{ color: '#6B7280' }}>{c.comment || '--'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                          {formatCurrency(Number(c.amount || 0))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Cost Summary */}
                          <div className={styles.costSummary}>
                            <div className={styles.costRow}>
                              <span className={styles.costLabel}>Raw Materials Total</span>
                              <span className={styles.costValue}>{formatCurrency(totalRawCost)}</span>
                            </div>
                            {otherCosts.length > 0 && (
                              <div className={styles.costRow}>
                                <span className={styles.costLabel}>Other Costs Total</span>
                                <span className={styles.costValue}>{formatCurrency(totalOtherCost)}</span>
                              </div>
                            )}
                            <div className={styles.costRowTotal}>
                              <span className={styles.costLabel}>Grand Total</span>
                              <span className={styles.costValue}>{formatCurrency(grandTotal)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p style={{ color: '#8C949B', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
                          No raw materials recorded for this batch.
                        </p>
                      )}
                    </div>

                    {/* Production Metrics */}
                    <div className={styles.colCard}>
                      <h5>Production Metrics</h5>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Total Feed Produced</span>
                        <span className={styles.detailValue}>{f(Number(batch.totalFeedProduced || 0))} kg</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Total Bags Produced</span>
                        <span className={styles.detailValue}>{f(batch.totalBagsProduced || 0)}</span>
                      </div>
                      <div className={styles.detailDivider} />
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Cost per Kg</span>
                        <span className={styles.detailValue}>{formatCurrency(batch.costPerKg || 0)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Shelf Life</span>
                        <span className={styles.detailValue}>{batch.shelfLife ? `${batch.shelfLife} days` : '--'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Expiry Date</span>
                        <span className={styles.detailValue}>{batch.expiryDate ? formatDate(batch.expiryDate) : '--'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </main>
        </section>
      </div>
    </section>
  );
}

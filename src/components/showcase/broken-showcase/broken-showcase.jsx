import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../showcase.module.scss";
import { FaChevronLeft, FaChevronRight, FaWeightHanging } from "react-icons/fa";
import ErrorState from "../../shared/error-state/ErrorState";
import { FiX } from "react-icons/fi";
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";

const PRIMARY = '#512728';
const PRIMARY_HV = '#714445';
const BG_PAGE = '#f5f6fa';
const BG_CARD = '#ffffff';
const TEXT_MAIN = '#2E3135';
const TEXT_MUTED = '#8C949B';
const BORDER = '#e8eaed';

export default function ViewBrokenHistory() {
  const [brokenQuantity, setBrokenQuantity] = useState(null);
  const [brokenCumulativeKg, setBrokenCumulativeKg] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loadingStages, setLoadingStages] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [errorStages, setErrorStages] = useState("");
  const [errorTable, setErrorTable] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const [showKgModal, setShowKgModal] = useState(false);
  const [kgModalVisible, setKgModalVisible] = useState(false);
  const kgModalMounted = useRef(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [kgQuantity, setKgQuantity] = useState("");
  const [kgWeight, setKgWeight] = useState("");
  const [kgSubmitting, setKgSubmitting] = useState(false);

  const itemsPerPage = 65;

  const fetchTableData = async () => {
    setLoadingStages(true);
    setErrorStages("");
    try {
      const latestRes = await Api.get("/latest-showcase");
      if (latestRes.data?.success && latestRes.data.data) {
        setBrokenQuantity(latestRes.data.data.brokenFishAdded || 0);
        setBrokenCumulativeKg(Number(latestRes.data.data.brokenFishCumulativeKg) || 0);
      } else {
        throw new Error("Invalid data structure");
      }
    } catch (error) {
      setErrorStages(error.response?.data?.message || "Error getting broken fish data.");
    } finally {
      setLoadingStages(false);
    }
  };

  const fetchData = async () => {
    setLoadingTable(true);
    setErrorTable("");
    try {
      const response = await Api.get("/get-all-broken-histories");
      if (response.data && Array.isArray(response.data.data)) {
        const data = response.data.data;
        setTableData(data);
        setPageCount(Math.ceil(data.length / itemsPerPage));
      } else {
        throw new Error("Expected an array in data property");
      }
    } catch (error) {
      setErrorTable(error.response?.data?.message || "Error getting broken history data.");
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchTableData();
    fetchData();
  }, []);

  const handleKgModal = (row) => {
    setSelectedRow(row);
    setKgQuantity(row.quantity || 0);
    setKgWeight("");
    setShowKgModal(true);
  };

  const handleCloseKgModal = () => {
    setKgModalVisible(false);
    setTimeout(() => {
      setShowKgModal(false);
      setSelectedRow(null);
    }, 200);
  };

  const handleKgSubmit = async () => {
    if (!kgWeight || kgWeight <= 0) {
      toast.error("Weight in kg must be greater than 0.");
      return;
    }
    if (!selectedRow?.id) {
      toast.error("No record selected for conversion.");
      return;
    }
    setKgSubmitting(true);
    const loadingToast = toast.loading("Converting...");
    try {
      await Api.patch(`/convert-broken-to-kg/${selectedRow.id}`, {
        brokenQuantityInKg: Number(kgWeight),
      });
      toast.update(loadingToast, {
        render: "Conversion successful!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      handleCloseKgModal();
      fetchData();
      fetchTableData();
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      const status = error.response?.status;
      let msg;
      if (!error.response) {
        msg = "Network error — server is unreachable.";
      } else if (status === 404) {
        msg = `Record ${selectedRow.id} not found on the server.`;
      } else if (status === 400) {
        msg = serverMsg || "Invalid request. Check the weight value.";
      } else if (status >= 500) {
        msg = `Server error (${status}). Please try again later.`;
      } else {
        msg = serverMsg || `Unexpected error (${status}).`;
      }
      toast.update(loadingToast, {
        render: msg,
        type: "error",
        isLoading: false,
        autoClose: 6000,
      });
    } finally {
      setKgSubmitting(false);
    }
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return { d: '—', t: '' };
    const date = new Date(isoDate);
    const d = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    const t = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    return { d, t };
  };

  const sortedData = [...tableData].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  const paginatedData = sortedData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    if (showKgModal) {
      kgModalMounted.current = true;
      requestAnimationFrame(() => setKgModalVisible(true));
    } else {
      setKgModalVisible(false);
    }
  }, [showKgModal]);

  useEffect(() => {
    if (!showKgModal) return;
    const handler = (e) => {
      if (e.key === 'Escape') handleCloseKgModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showKgModal]);

  const columns = [
    {
      key: 'createdAt', label: 'Date',
      render: (value, row) => {
        const dt = formatDateTime(value || row.date);
        return (
          <div>
            <div style={{ fontWeight: 600, color: TEXT_MAIN, fontSize: '13px' }}>{dt.d}</div>
            <div style={{ color: TEXT_MUTED, fontSize: '11px' }}>{dt.t}</div>
          </div>
        );
      },
    },
    {
      key: 'description', label: 'Description',
      render: (value) => (
        <span style={{ color: TEXT_MUTED, fontSize: '12px', display: 'block' }} title={value}>
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'quantity', label: 'Quantity added', align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: '13px' }}>
          {value != null ? new Intl.NumberFormat().format(value) : '—'}
        </span>
      ),
    },
    {
      key: 'kgRemoved', label: 'Removed (kg)', align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 600, color: '#DC2626', fontSize: '13px' }}>
          {value != null ? `${Number(value).toFixed(3)}` : '—'}
        </span>
      ),
    },
    {
      key: '_actions', label: '', width: '100px',
      render: (_value, row) => {
        if (row.isConverted) return null;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleKgModal(row); }}
            title="Convert to kilograms"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: '6px',
              border: `1px solid ${BORDER}`,
              backgroundColor: '#F9FAFB', color: TEXT_MAIN,
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#EEF0F4'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = BORDER; }}
          >
            <FaWeightHanging size={11} color="#6B7280" />
            Convert to kg
          </button>
        );
      },
    },
  ];

  const s = {
    pageWrap: {
      minHeight: '100vh',
      backgroundColor: BG_PAGE,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: TEXT_MAIN,
    },
    contentWrap: {
      padding: '20px 36px',
      maxWidth: '1300px',
      margin: '0 auto',
    },
    pageHeaderRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '14px',
    },
    pageTitle: {
      fontSize: '22px',
      fontWeight: 700,
      color: TEXT_MAIN,
      margin: 0,
      lineHeight: 1.2,
    },
    pageSubtitle: {
      fontSize: '12px',
      color: TEXT_MUTED,
      marginTop: '2px',
    },
    statCard: {
      backgroundColor: BG_CARD,
      borderRadius: '10px',
      padding: '16px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    statLabel: {
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: TEXT_MUTED,
      marginBottom: '4px',
    },
    statValue: {
      fontSize: '30px',
      fontWeight: 800,
      color: '#E07B00',
      lineHeight: 1,
    },
    statUnit: {
      fontSize: '13px',
      fontWeight: 500,
      color: '#AAB0B7',
      marginLeft: '6px',
    },
    statSub: {
      fontSize: '11px',
      color: TEXT_MUTED,
      marginTop: '4px',
    },
    tablePanel: {
      backgroundColor: BG_CARD,
      borderRadius: '10px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },
    tableFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 16px',
      fontSize: '12px',
      color: TEXT_MUTED,
      borderTop: `1px solid ${BORDER}`,
    },
    paginationWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    pageBtn: (active) => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      border: `1px solid ${active ? PRIMARY : BORDER}`,
      backgroundColor: active ? PRIMARY : BG_CARD,
      color: active ? '#fff' : TEXT_MAIN,
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }),
    pageDots: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      fontSize: '13px',
      color: TEXT_MUTED,
    },
  };

  return (
    <section className={styles.body}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content} flex-grow-1`} style={s.pageWrap}>
          <div style={s.contentWrap}>
            {/* ── Page Header ── */}
            <div style={s.pageHeaderRow}>
              <div>
                <h1 style={s.pageTitle}>Broken Fish Showcase</h1>
                <p style={s.pageSubtitle}>Track broken fish inventory and movement records in the showcase.</p>
              </div>
            </div>

            {/* ── Current Stock Card ── */}
            {loadingStages ? (
              <div style={{ ...s.statCard, padding: '20px' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ height: '12px', width: '80px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '32px', width: '120px', background: '#f0f0f0', borderRadius: '4px' }} />
                </div>
              </div>
            ) : errorStages ? (
              <ErrorState message={errorStages} />
            ) : (
              <div style={s.statCard}>
                <div>
                  <div style={s.statLabel}>In Stock — Broken Fish</div>
                  <div>
                    <span style={s.statValue}>{brokenCumulativeKg !== null ? brokenCumulativeKg.toFixed(3) : 'N/A'}</span>
                    <span style={s.statUnit}>kg</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── History Table ── */}
            {loadingTable ? (
              <SkeletonTable cols={4} rows={8} />
            ) : errorTable ? (
              <ErrorState message={errorTable} />
            ) : (
              <div style={s.tablePanel}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%', borderCollapse: 'collapse', fontSize: '12.5px',
                    minWidth: '850px',
                  }}>
                    <thead style={{ backgroundColor: '#F9FAFB' }}>
                      <tr>
                        {columns.map(col => (
                          <th key={col.key} style={{
                            padding: '8px 12px', textAlign: col.align === 'right' ? 'right' : 'left',
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em',
                            textTransform: 'uppercase', color: TEXT_MUTED, whiteSpace: 'nowrap',
                            borderBottom: `1px solid ${BORDER}`,
                          }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 16px', color: TEXT_MUTED }}>
                            No broken history available.
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((row, idx) => (
                          <tr key={row.id || idx} style={{ transition: 'background 0.1s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#FAFBFC'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                          >
                            {columns.map(col => (
                              <td key={col.key} style={{
                                padding: '10px 12px',
                                borderBottom: `1px solid ${BORDER}`,
                                textAlign: col.align === 'right' ? 'right' : 'left',
                                whiteSpace: 'nowrap',
                              }}>
                                {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div style={{
                  ...s.tableFooter, flexDirection: 'row', gap: '10px',
                  position: 'sticky', bottom: 0, zIndex: 10, background: '#fff',
                }}>
                  <span>
                    Showing {Math.min(itemsPerPage, tableData.length - currentPage * itemsPerPage)} of {tableData.length} records
                  </span>
                  {pageCount > 1 && (
                    <div style={s.paginationWrap}>
                      <button
                        style={{ ...s.pageBtn(false), width: '32px' }}
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        <FaChevronLeft size={11} />
                      </button>
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
                        let end = Math.min(pageCount, start + maxVisible);
                        if (end - start < maxVisible) start = Math.max(0, end - maxVisible);
                        if (start > 0) {
                          pages.push(
                            <button key={0} style={s.pageBtn(false)} onClick={() => setCurrentPage(0)}>1</button>
                          );
                          if (start > 1) pages.push(<span key="sl" style={s.pageDots}>...</span>);
                        }
                        for (let i = start; i < end; i++) {
                          pages.push(
                            <button key={i} style={s.pageBtn(currentPage === i)} onClick={() => setCurrentPage(i)}>
                              {i + 1}
                            </button>
                          );
                        }
                        if (end < pageCount) {
                          if (end < pageCount - 1) pages.push(<span key="sr" style={s.pageDots}>...</span>);
                          pages.push(
                            <button key={pageCount - 1} style={s.pageBtn(false)} onClick={() => setCurrentPage(pageCount - 1)}>
                              {pageCount}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                      <button
                        style={{ ...s.pageBtn(false), width: '32px' }}
                        onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                        disabled={currentPage >= pageCount - 1}
                      >
                        <FaChevronRight size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Convert to Kg Modal ── */}
      {kgModalMounted.current && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '20px',
            opacity: kgModalVisible ? 1 : 0, transition: 'opacity 0.2s ease',
          }}
          onClick={handleCloseKgModal}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: '16px',
              width: '100%', maxWidth: '440px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
              opacity: kgModalVisible ? 1 : 0,
              ...(kgModalVisible ? {} : { transform: 'translateY(24px) scale(0.97)' }),
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: '#FDF5F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FaWeightHanging size={20} color="#512728" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, lineHeight: '1.3' }}>
                    Convert to Kilograms
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 400, margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    Record the kg equivalent for this entry.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseKgModal}
                style={{
                  width: '32px', height: '32px', border: 'none',
                  background: '#F3F4F6', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B7280', flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#6B7280'; }}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quantity (pieces) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Quantity (pieces) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={kgQuantity}
                  readOnly
                  style={{
                    width: '100%', height: '44px', padding: '0 14px',
                    border: '1.5px solid #E5E7EB', borderRadius: '10px',
                    fontSize: '14px', color: '#111827', fontWeight: 500,
                    outline: 'none', background: '#F9FAFB',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box', cursor: 'not-allowed',
                  }}
                  autoComplete="off"
                />
              </div>

              {/* Quantity in kg */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Quantity in kg <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={kgWeight}
                    onChange={(e) => setKgWeight(e.target.value)}
                    style={{
                      width: '100%', height: '44px', padding: '0 52px 0 14px',
                      border: '1.5px solid #E5E7EB', borderRadius: '10px',
                      fontSize: '14px', color: '#111827', fontWeight: 500,
                      outline: 'none', background: '#FFFFFF',
                      transition: 'border-color 0.15s ease', fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#512728'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                    autoComplete="off"
                  />
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '13px', fontWeight: 700, color: '#9CA3AF',
                    pointerEvents: 'none', userSelect: 'none',
                  }}>
                    kg
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 28px 24px' }}>
              <button
                type="button"
                onClick={handleCloseKgModal}
                disabled={kgSubmitting}
                style={{
                  height: '42px', padding: '0 20px',
                  border: '1px solid #E5E7EB', borderRadius: '10px',
                  background: '#FFFFFF', color: '#374151',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                onMouseOver={e => { if (!kgSubmitting) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}}
                onMouseOut={e => { if (!kgSubmitting) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleKgSubmit}
                disabled={kgSubmitting}
                style={{
                  height: '42px', padding: '0 24px', border: 'none', borderRadius: '10px',
                  background: kgSubmitting ? '#9CA3AF' : '#512728', color: '#FFFFFF',
                  fontSize: '13px', fontWeight: 600, cursor: kgSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                onMouseOver={e => { if (!kgSubmitting) e.currentTarget.style.background = '#3D1D1E'; }}
                onMouseOut={e => { if (!kgSubmitting) e.currentTarget.style.background = '#512728'; }}
              >
                {kgSubmitting ? (
                  <>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                    Converting...
                  </>
                ) : (
                  <>
                    <FaWeightHanging size={13} />
                    Convert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ToastContainer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../showcase.module.scss";
import { Alert } from "react-bootstrap";
import { FaExclamationTriangle, FaEllipsisV, FaChevronLeft, FaChevronRight, FaExchangeAlt } from "react-icons/fa";
import { FiX, FiArrowRight } from "react-icons/fi";
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

export default function ViewWholeHistory() {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = user?.userTypes || [];
  const isSuperAdmin = userTypes.includes('super_admin');

  const [wholeQuantity, setWholeQuantity] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loadingStages, setLoadingStages] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorStages, setErrorStages] = useState("");
  const [errorTable, setErrorTable] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [brokenFishQuantity, setBrokenFishQuantity] = useState("");
  const [brokenFishWeightKg, setBrokenFishWeightKg] = useState("");
  const [damageFishQuantity, setDamageFishQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [openActions, setOpenActions] = useState(false);
  const actionsRef = useRef(null);

  const itemsPerPage = 65;

  const fetchTableData = async () => {
    setLoadingStages(true);
    setLoadingTable(true);
    setErrorStages("");
    setErrorTable("");

    try {
      const [wholeResponse, historyResponse] = await Promise.all([
        Api.get("/show-glass/whole"),
        Api.get("/get-all-whole-histories"),
      ]);

      if (wholeResponse.data?.success && wholeResponse.data.data) {
        setWholeQuantity(wholeResponse.data.data.wholeFishCumulative || 0);
        setLastUpdated(wholeResponse.data.data.createdAt || null);
      } else {
        throw new Error("Invalid data structure");
      }

      const historyData = historyResponse.data.data || [];
      setTableData(historyData);
      setPageCount(Math.ceil(historyData.length / itemsPerPage));
    } catch (error) {
      console.error("Fetch Error:", error);
      const errorMsg = error.response?.data?.message || "Error fetching data.";
      setErrorStages(errorMsg);
      setErrorTable(errorMsg);
    } finally {
      setLoadingStages(false);
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  useEffect(() => {
    const handler = () => setOpenActions(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleShowModal = (type) => {
    setModalType(type);
    setBrokenFishQuantity("");
    setBrokenFishWeightKg("");
    setDamageFishQuantity("");
    setRemarks("");
    setOpenActions(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Moving...");

    const quantity = modalType === "damage" ? damageFishQuantity : brokenFishQuantity;
    if (!quantity || Number(quantity) <= 0) {
      toast.update(loadingToast, {
        render: modalType === "damage" ? "Damaged fish quantity must be greater than 0." : "Broken fish quantity must be greater than 0.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      setLoading(false);
      return;
    }
    if (modalType === "broken" && (!brokenFishWeightKg || Number(brokenFishWeightKg) <= 0)) {
      toast.update(loadingToast, {
        render: "Weight in kg must be greater than 0 for broken fish.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      setLoading(false);
      return;
    }
    if (!remarks || !remarks.trim()) {
      toast.update(loadingToast, {
        render: "Please provide a remark for this movement.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      setLoading(false);
      return;
    }

    const siteId = isSuperAdmin
      ? (activeSite?.id || 'all')
      : (user?.siteId || 'all');

    try {
      let endpoint, payload;
      if (modalType === "damage") {
        endpoint = "/move-to-damage";
        payload = {
          damagedFishQuantity: Number(damageFishQuantity),
          remarks: remarks.trim(),
          siteId,
        };
      } else {
        endpoint = "/move-to-broken";
        payload = {
          brokenFishQuantity: Number(brokenFishQuantity),
          brokenFishWeightKg: Number(brokenFishWeightKg),
          remarks: remarks.trim(),
        };
      }

      await Api.post(endpoint, payload);
      toast.update(loadingToast, {
        render: "Operation Successful!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setDamageFishQuantity("");
      setBrokenFishQuantity("");
      setBrokenFishWeightKg("");
      setRemarks("");
      handleCloseModal();
      await fetchTableData();
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      const status = error.response?.status;
      let msg;
      if (!error.response) {
        msg = "Network error — server is unreachable.";
      } else if (status === 400) {
        msg = serverMsg || "Invalid request. Check the quantity and site.";
      } else if (status === 404) {
        msg = serverMsg || "The destination resource was not found.";
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
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    const d = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    const t = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    return { d, t };
  };

  const paginatedData = tableData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const formatBig = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return new Intl.NumberFormat().format(n);
  };

  const columns = [
    {
      key: 'createdAt', label: 'Date',
      render: (value) => {
        const { d, t } = formatDateTime(value);
        return (
          <div>
            <div style={{ fontWeight: 600, color: TEXT_MAIN, fontSize: '13px' }}>{d}</div>
            <div style={{ color: TEXT_MUTED, fontSize: '11px' }}>{t}</div>
          </div>
        );
      },
    },
    {
      key: 'remarks', label: 'Description',
      render: (value) => (
        <span style={{ color: TEXT_MUTED, fontSize: '12px', display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'wholeFishAdded', label: 'Added',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: '13px' }}>
          {value != null ? new Intl.NumberFormat().format(value) : '—'}
        </span>
      ),
    },
    {
      key: 'brokenFishAdded', label: 'Removed',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 700, color: '#dc3545', fontSize: '13px' }}>
          {value != null ? new Intl.NumberFormat().format(value) : '—'}
        </span>
      ),
    },
    {
      key: 'wholeFishCumulative', label: 'Cumulative Added',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: '13px' }}>
          {value != null ? new Intl.NumberFormat().format(value) : '—'}
        </span>
      ),
    },
  ];

  const modalMounted = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (showModal) {
      modalMounted.current = true;
      requestAnimationFrame(() => setModalVisible(true));
    } else {
      setModalVisible(false);
      const timer = setTimeout(() => { modalMounted.current = false; }, 200);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const handler = (e) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showModal]);

  const s = {
    pageWrap: {
      minHeight: '100vh',
      backgroundColor: BG_PAGE,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: TEXT_MAIN,
    },
    contentWrap: {
      padding: '32px 36px',
      maxWidth: '1300px',
      margin: '0 auto',
    },
    pageHeaderRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '28px',
    },
    pageTitle: {
      fontSize: '26px',
      fontWeight: 700,
      color: TEXT_MAIN,
      margin: 0,
      lineHeight: 1.2,
    },
    pageSubtitle: {
      fontSize: '13.5px',
      color: TEXT_MUTED,
      marginTop: '4px',
    },
    statCard: {
      backgroundColor: BG_CARD,
      borderRadius: '12px',
      padding: '24px 28px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
    },
    statLabel: {
      fontSize: '10.5px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: TEXT_MUTED,
      marginBottom: '6px',
    },
    statValue: {
      fontSize: '38px',
      fontWeight: 800,
      color: '#1A5276',
      lineHeight: 1,
    },
    statUnit: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#AAB0B7',
      marginLeft: '6px',
    },
    statSub: {
      fontSize: '11.5px',
      color: TEXT_MUTED,
      marginTop: '6px',
    },
    actionBtn: {
      background: 'none',
      border: `1px solid ${BORDER}`,
      borderRadius: '8px',
      cursor: 'pointer',
      color: TEXT_MUTED,
      padding: '8px 10px',
      fontSize: '15px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.15s ease',
    },
    tablePanel: {
      backgroundColor: BG_CARD,
      borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },
    tableFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 20px',
      fontSize: '13px',
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
                <h1 style={s.pageTitle}>Whole Fish Showcase</h1>
                <p style={s.pageSubtitle}>Monitor and manage whole fish inventory in the showcase.</p>
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
              <Alert variant="danger" className="text-center py-4">
                <FaExclamationTriangle size={24} />
                <span className="fw-semibold ms-2">{errorStages}</span>
              </Alert>
            ) : (
              <div style={s.statCard}>
                <div>
                  <div style={s.statLabel}>In Stock — Whole Fish</div>
                  <div>
                    <span style={s.statValue}>{wholeQuantity !== null ? new Intl.NumberFormat().format(wholeQuantity) : 'N/A'}</span>
                    <span style={s.statUnit}>pieces</span>
                  </div>
                  {lastUpdated && (
                    <div style={s.statSub}>Last updated: {formatDateTime(lastUpdated).d} {formatDateTime(lastUpdated).t}</div>
                  )}
                </div>
                <div style={{ position: 'relative' }} ref={actionsRef}>
                  <button
                    style={s.actionBtn}
                    onClick={e => { e.stopPropagation(); setOpenActions(!openActions); }}
                  >
                    <FaExchangeAlt size={12} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Move</span>
                    <FaEllipsisV size={10} />
                  </button>
                  {openActions && createPortal(
                    <div style={{
                      position: 'fixed',
                      top: actionsRef.current ? actionsRef.current.getBoundingClientRect().bottom + 4 : 0,
                      left: actionsRef.current ? actionsRef.current.getBoundingClientRect().right - 180 : 0,
                      zIndex: 9999, backgroundColor: '#fff',
                      border: `1px solid ${BORDER}`, borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      minWidth: '180px', padding: '6px 0',
                    }}>
                      <button
                        style={{
                          display: 'flex', alignItems: 'center', width: '100%',
                          background: 'none', border: 'none', padding: '10px 16px',
                          fontSize: '13px', color: TEXT_MAIN, cursor: 'pointer',
                          textAlign: 'left', whiteSpace: 'nowrap', gap: '10px',
                          transition: 'background 0.1s',
                        }}
                        onClick={() => handleShowModal("damage")}
                        onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc3545', flexShrink: 0 }} />
                        Move to Damage
                      </button>
                      <button
                        style={{
                          display: 'flex', alignItems: 'center', width: '100%',
                          background: 'none', border: 'none', padding: '10px 16px',
                          fontSize: '13px', color: TEXT_MAIN, cursor: 'pointer',
                          textAlign: 'left', whiteSpace: 'nowrap', gap: '10px',
                          transition: 'background 0.1s',
                        }}
                        onClick={() => handleShowModal("broken")}
                        onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E07B00', flexShrink: 0 }} />
                        Move to Broken
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            )}

            {/* ── History Table ── */}
            {loadingTable ? (
              <SkeletonTable cols={5} rows={8} />
            ) : errorTable ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">{errorTable}</span>
                </Alert>
              </div>
            ) : (
              <div style={s.tablePanel}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%', borderCollapse: 'collapse', fontSize: '12.5px',
                    minWidth: '700px',
                  }}>
                    <thead style={{ backgroundColor: '#F9FAFB' }}>
                      <tr>
                        {columns.map(col => (
                          <th key={col.key} style={{
                            padding: '12px 16px', textAlign: col.align === 'right' ? 'right' : 'left',
                            fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
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
                            No data available.
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
                                padding: '14px 16px',
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

      {/* ── Move Modal ── */}
      {modalMounted.current && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '20px',
            opacity: modalVisible ? 1 : 0, transition: 'opacity 0.2s ease',
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: '16px',
              width: '100%', maxWidth: '440px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
              opacity: modalVisible ? 1 : 0,
              ...(modalVisible ? {} : { transform: 'translateY(24px) scale(0.97)' }),
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
                  background: modalType === 'damage' ? '#FDECEA' : '#FFF3E0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FiArrowRight size={22} color={modalType === 'damage' ? '#dc3545' : '#E07B00'} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, lineHeight: '1.3' }}>
                    {modalType === "damage" ? "Move to Damage" : "Move to Broken"}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 400, margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    Current stock: <strong>{wholeQuantity !== null ? new Intl.NumberFormat().format(wholeQuantity) : 'N/A'}</strong> pieces
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Quantity <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Enter quantity"
                  value={modalType === "damage" ? damageFishQuantity : brokenFishQuantity}
                  onChange={(e) =>
                    modalType === "damage"
                      ? setDamageFishQuantity(e.target.value)
                      : setBrokenFishQuantity(e.target.value)
                  }
                  style={{
                    width: '100%', height: '44px', padding: '0 14px',
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
              </div>
              {modalType === "broken" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Weight in kg <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={brokenFishWeightKg}
                      onChange={(e) => setBrokenFishWeightKg(e.target.value)}
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
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Remarks <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a remark..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid #E5E7EB', borderRadius: '10px',
                    fontSize: '14px', color: '#111827', fontWeight: 500,
                    outline: 'none', background: '#FFFFFF', resize: 'vertical',
                    transition: 'border-color 0.15s ease', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#512728'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 28px 24px' }}>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                style={{
                  height: '42px', padding: '0 20px',
                  border: '1px solid #E5E7EB', borderRadius: '10px',
                  background: '#FFFFFF', color: '#374151',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}}
                onMouseOut={e => { if (!loading) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  height: '42px', padding: '0 24px', border: 'none', borderRadius: '10px',
                  background: loading ? '#9CA3AF' : PRIMARY, color: '#FFFFFF',
                  fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.background = PRIMARY_HV; }}
                onMouseOut={e => { if (!loading) e.currentTarget.style.background = PRIMARY; }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                    Moving...
                  </>
                ) : (
                  <>
                    <FiArrowRight size={15} />
                    Move {modalType === "damage" ? "to Damage" : "to Broken"}
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

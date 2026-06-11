import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsExclamationTriangleFill, BsPencilFill, BsTrash, BsSearch, BsDownload, BsThreeDotsVertical, BsInfoCircle, BsWater, BsClipboardData, BsSticky } from "react-icons/bs";
import { Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { SkeletonTable, SkeletonFilterBar, SkeletonStatGrid } from "../../shared/skeleton/Skeleton";
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import SiteSelector from "../../shared/site-selector/SiteSelector";

const ViewAllStages = () => {
  const [stages, setStages] = useState([]);
  const [note, setNote] = useState([]);
  const [sampling, setSampling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [loadingSamp, setLoadingSamp] = useState(false);
  const [error, setError] = useState('');
  const [noteLoader, setNoteLoader] = useState(false); // Start as false, only true during fetch
  const [noteError, setNoteError] = useState('');
  const [samplingLoader, setSamplingLoader] = useState(false); // Start as false, only true during fetch
  const [samplingError, setSamplingError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const itemsPerPage = 10;
  const [selectedStage, setSelectedStage] = useState(null);
  const [openMenuStageId, setOpenMenuStageId] = useState(null);
  const [showPondSummaryModal, setShowPondSummaryModal] = useState(false);
  const [showEditPondModal, setShowEditPondModal] = useState(false);
  const [showAddSamplingModal, setShowAddSamplingModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const navigate = useNavigate();

  const handleSiteChange = (id, name) => {
    setSiteFilter(name || '');
  };

  const fetchStages = async () => {
    try {
      const response = await Api.get('/fish-stages');
      if (Array.isArray(response.data.data)) {
        setStages(response.data.data);
      } else {
        throw new Error('Expected an array of stages');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const filteredStages = stages.filter(stage => {
    const matchesSearch = (stage.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesSite = siteFilter ? (stage.site?.toLowerCase() || '') === siteFilter.toLowerCase() : true;
    const matchesStatus = statusFilter ? (stage.status?.toLowerCase() || '') === statusFilter.toLowerCase() : true;
    return matchesSearch && matchesSite && matchesStatus;
  });

  const handleSave = async () => {
    setLoadingEdit(true)
    const saveToast = toast.loading('Saving changes...');
    try {
      await Api.put(`/fish-stage/${selectedStage.id}`, selectedStage);
      toast.update(saveToast, {
        render: 'Pond updated successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchStages();
      setShowEditPondModal(false);
    } catch (error) {
      toast.update(saveToast, {
        render: 'Failed to update pond. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }finally{
      setLoadingEdit(false)
    }
  };

  const fetchnote = async (stageId) => {
    setNoteLoader(true);
    setNoteError(''); // Reset error before fetch
    try {
      const response = await Api.get(`/note/${stageId}`);
      if (Array.isArray(response.data.data)) {
        setNote(response.data.data);
      } else {
        throw new Error("Expected an array of notes");
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNoteError(err.response?.data?.message || "Failed to fetch notes. Please try again.");
    } finally {
      setNoteLoader(false);
    }
  };

  const handleAddNoteSubmit = async (note) => {
    setLoadingNote(true)
    const noteToast = toast.loading('Adding note...');
    try {
      await Api.post(`/note/${selectedStage.id}`, note);
      toast.update(noteToast, { render: 'Note added successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      setShowAddNoteModal(false);
      fetchnote(selectedStage.id);
    } catch (err) {
      toast.update(noteToast, { render: 'Failed to add note. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    }finally{
      setLoadingNote(false)
    }
  };

  const fetchSampling = async (stageId) => {
    setSamplingLoader(true);
    setSamplingError(''); // Reset error before fetch
    try {
      const response = await Api.get(`/sample/${stageId}`);
      if (Array.isArray(response.data.data)) {
        setSampling(response.data.data);
      } else {
        throw new Error("Expected an array of sampling data");
      }
    } catch (err) {
      console.error("Error fetching sampling data:", err);
      setSamplingError(err.response?.data?.message || "Failed to fetch sampling. Please try again.");
    } finally {
      setSamplingLoader(false);
    }
  };

  const handleAddSamplingSubmit = async (sampling) => {
    setLoadingSamp(true);
    const samplingToast = toast.loading('Adding sampling...');
    try {
      await Api.post(`/sample/${selectedStage.id}`, sampling);
      toast.update(samplingToast, { render: 'Sampling added successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      setShowAddSamplingModal(false);
      fetchSampling(selectedStage.id);
    } catch (err) {
      toast.update(samplingToast, { render: 'Failed to add sampling. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    }finally{
      setLoadingSamp(false);
    }
  };

  const DeletePond = async () => {
    const userConfirmed = window.confirm("Are you sure you want to delete this pond?");
    if (!userConfirmed) return;

    const loadingToast = toast.loading('Deleting pond...');
    try {
      await Api.delete(`/fish-stage/${selectedStage.id}`);
      toast.update(loadingToast, {
        render: 'Pond deleted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchStages();
    } catch (err) {
      toast.update(loadingToast, {
        render: err.response?.data?.message || 'Failed to delete pond. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const displayedStages = filteredStages.slice(startIndex, endIndex);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const handleExportCSV = () => {
    const headers = ['Date Created', 'Pond Name', 'Description', 'Site', 'Current Stock'];
    const rows = filteredStages.map((stage) => [
      formatDate(stage.createdAt),
      stage.title || '',
      (stage.description || '').replace(/,/g, ''),
      stage.site || '',
      stage.quantity ?? '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ponds-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            {/* ── Page Header ── */}
            <div className="d-flex justify-content-between align-items-start mb-4 mt-3 flex-wrap gap-2">
              <div>
                <h4 className="mb-1 fw-bold" style={{ color: '#2E3135' }}>All Ponds</h4>
                <p className="mb-0" style={{ fontSize: '0.875rem', color: '#8C949B' }}>
                  Monitor and manage all active aquaculture ponds across your sites.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn fw-semibold d-flex align-items-center gap-1"
                  style={{ backgroundColor: '#512728', color: '#fff', fontSize: '0.875rem', border: 'none' }}
                  onClick={() => navigate('../create')}
                >
                  + Add Pond
                </button>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="border rounded p-3 mb-4" style={{ backgroundColor: '#fff' }}>
              <div className="d-flex flex-wrap gap-3 align-items-end">
                <div style={{ minWidth: '155px' }}>
                  <label className="form-label mb-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E3135' }}>Site</label>
                  <SiteSelector onChange={handleSiteChange} />
                </div>
                <div style={{ minWidth: '155px' }}>
                  <label className="form-label mb-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E3135' }}>Status</label>
                  <select
                    className="form-select form-select-sm shadow-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label className="form-label mb-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E3135' }}>Search</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <BsSearch size={13} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 shadow-none"
                      placeholder="Pond name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Active filter chips — only render when at least one filter is active */}
              {(siteFilter || statusFilter) && (
                <div className="d-flex gap-2 flex-wrap mt-3 align-items-center">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2E3135', letterSpacing: '0.03em' }}>
                    ACTIVE FILTERS:
                  </span>
                  {siteFilter && (
                    <span
                      className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded"
                      style={{ backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFE69C', fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      Site: {siteFilter}
                      <span
                        style={{ cursor: 'pointer', marginLeft: '2px', fontWeight: 700 }}
                        onClick={() => { setSiteFilter(''); }}
                      >
                        ×
                      </span>
                    </span>
                  )}
                  {statusFilter && (
                    <span
                      className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded"
                      style={{ backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFE69C', fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      Status: {statusFilter}
                      <span
                        style={{ cursor: 'pointer', marginLeft: '2px', fontWeight: 700 }}
                        onClick={() => setStatusFilter('')}
                      >
                        ×
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Loading ── */}
            {loading && (
              <div style={{ padding: "20px 0" }}>
                <SkeletonStatGrid count={4} />
                <div style={{ height: 24 }} />
                <SkeletonFilterBar />
                <SkeletonTable rows={5} cols={5} />
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {/* ── Empty State ── */}
            {!loading && !error && filteredStages.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-75 py-5">
                  No available Pond
                </Alert>
              </div>
            )}

            {/* ── Table + Pagination ── */}
            {!loading && !error && displayedStages.length > 0 && (
              <>
                <div className="border rounded overflow-hidden" style={{ backgroundColor: '#fff' }}>
                  <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#F8F9FA' }}>
                      <tr>
                        <th className="py-3 px-3 border-0 fw-semibold" style={{ color: '#6C757D', fontSize: '0.75rem', letterSpacing: '0.04em' }}>DATE CREATED</th>
                        <th className="py-3 px-3 border-0 fw-semibold" style={{ color: '#6C757D', fontSize: '0.75rem', letterSpacing: '0.04em' }}>POND NAME</th>
                        <th className="py-3 px-3 border-0 fw-semibold" style={{ color: '#6C757D', fontSize: '0.75rem', letterSpacing: '0.04em' }}>DESCRIPTION</th>
                        <th className="py-3 px-3 border-0 fw-semibold" style={{ color: '#6C757D', fontSize: '0.75rem', letterSpacing: '0.04em' }}>SITE</th>
                        <th className="py-3 px-3 border-0 fw-semibold text-end" style={{ color: '#6C757D', fontSize: '0.75rem', letterSpacing: '0.04em' }}>CURRENT STOCK</th>
                        <th className="py-3 px-3 border-0 fw-semibold text-center" style={{ color: '#6C757D', fontSize: '0.75rem', letterSpacing: '0.04em' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedStages.map((stage) => {
                        const formattedCreatedAt = formatDate(stage.createdAt);
                        const isHatchery = stage.site?.toLowerCase() === 'hatchery';
                        return (
                          <tr key={stage.id} style={{ borderTop: '1px solid #F0F0F0' }}>
                            <td className="py-3 px-3 align-middle" style={{ color: '#8C949B' }}>{formattedCreatedAt}</td>
                            <td className="py-3 px-3 align-middle">
                              <span style={{ color: '#512728', fontWeight: 600 }}>{stage.title}</span>
                            </td>
                            <td className="py-3 px-3 align-middle" style={{ color: '#2E3135' }}>{stage.description}</td>
                            <td className="py-3 px-3 align-middle">
                              {stage.site ? (
                                <span
                                  className="px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: isHatchery ? '#FFF3CD' : '#E9ECEF',
                                    color: isHatchery ? '#856404' : '#495057',
                                    fontSize: '0.78rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  {stage.site}
                                </span>
                              ) : (
                                <span style={{ color: '#8C949B' }}>--</span>
                              )}
                            </td>
                            <td className="py-3 px-3 align-middle text-end" style={{ fontWeight: 600, color: '#2E3135' }}>
                              {new Intl.NumberFormat().format(stage.quantity)} pcs
                            </td>
                            <td className="py-3 px-3 align-middle text-center" style={{ position: 'relative' }}>
                              <span
                                style={{ cursor: 'pointer', color: '#6C757D', padding: '4px 8px', display: 'inline-block' }}
                                title="Actions"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuStageId(openMenuStageId === stage.id ? null : stage.id);
                                }}
                              >
                                <BsThreeDotsVertical size={18} />
                              </span>
                              {openMenuStageId === stage.id && (
                                <>
                                  <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 1050 }}
                                    onClick={() => setOpenMenuStageId(null)}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute', right: '50%', top: '100%', zIndex: 1051,
                                      backgroundColor: '#fff',
                                      border: '1px solid #e9ecef',
                                      borderRadius: '12px',
                                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                      minWidth: '200px',
                                      padding: '6px 0',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, color: '#8C949B', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #F0F0F0', marginBottom: '4px' }}>
                                      Pond Actions
                                    </div>
                                    <button
                                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.85rem', color: '#2E3135', cursor: 'pointer', transition: 'all 0.15s', gap: '12px' }}
                                      onClick={() => { setOpenMenuStageId(null); setSelectedStage(stage); setShowPondSummaryModal(true); }}
                                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#EDE7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BsInfoCircle size={14} color="#7B1FA2" /></span>
                                      Pond Summary
                                    </button>
                                    <button
                                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.85rem', color: '#2E3135', cursor: 'pointer', transition: 'all 0.15s', gap: '12px' }}
                                      onClick={() => { setOpenMenuStageId(null); setSelectedStage(stage); setShowEditPondModal(true); }}
                                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BsPencilFill size={13} color="#1565C0" /></span>
                                      Edit Pond
                                    </button>
                                    <button
                                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.85rem', color: '#2E3135', cursor: 'pointer', transition: 'all 0.15s', gap: '12px' }}
                                      onClick={() => { setOpenMenuStageId(null); setSelectedStage(stage); setShowAddSamplingModal(true); }}
                                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BsClipboardData size={13} color="#2E7D32" /></span>
                                      Add Sampling Record
                                    </button>
                                    <button
                                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.85rem', color: '#2E3135', cursor: 'pointer', transition: 'all 0.15s', gap: '12px' }}
                                      onClick={() => { setOpenMenuStageId(null); setSelectedStage(stage); setShowAddNoteModal(true); }}
                                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BsSticky size={13} color="#F57F17" /></span>
                                      Add Notes
                                    </button>
                                    <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '4px 12px' }} />
                                    <button
                                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.85rem', color: '#dc3545', cursor: 'pointer', transition: 'all 0.15s', gap: '12px' }}
                                      onClick={() => { setOpenMenuStageId(null); setSelectedStage(stage); setTimeout(() => DeletePond(), 0); }}
                                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FFF5F5'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BsTrash size={13} color="#dc3545" /></span>
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination row */}
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                  <span style={{ fontSize: '0.875rem', color: '#8C949B' }}>
                    Showing {startIndex + 1}–{Math.min(endIndex, filteredStages.length)} of {filteredStages.length} ponds
                  </span>
                  <ReactPaginate
                    previousLabel={"< "}
                    nextLabel={" >"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(filteredStages.length / itemsPerPage)}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageChange}
                    containerClassName={"pagination mb-0"}
                    pageClassName={"page-item"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    previousLinkClassName={"page-link"}
                    nextClassName={"page-item"}
                    nextLinkClassName={"page-link"}
                    breakClassName={"page-item"}
                    breakLinkClassName={"page-link"}
                    activeClassName={"active-light"}
                  />
                </div>
              </>
            )}
          </main>
        </section>
      </div>

      <ToastContainer />

      {/* ── POND SUMMARY MODAL ── */}
      <Modal show={showPondSummaryModal} onHide={() => setShowPondSummaryModal(false)} size="lg" centered>
        <div style={{
          background: 'linear-gradient(135deg, #4A1C1C 0%, #5A2626 50%, #6B3536 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#fff',
        }}>
          <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.3rem' }}>🌊</span>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{selectedStage?.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>{selectedStage?.site || '--'}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>Created {selectedStage?.createdAt ? formatDate(selectedStage.createdAt) : '--'}</span>
              </div>
            </div>
            <button onClick={() => setShowPondSummaryModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>
          <div style={{ padding: '20px 28px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Current Stock', value: selectedStage ? new Intl.NumberFormat().format(selectedStage.quantity ?? 0) : '0', suffix: 'pcs', icon: '🐟', color: '#B06426' },
                { label: 'Mortality', value: selectedStage?.mortalityCount != null ? new Intl.NumberFormat().format(selectedStage.mortalityCount) : '--', suffix: 'pcs', icon: '⚠️', color: '#EF5350' },
                { label: 'Feed Consumed', value: selectedStage?.feedConsumed != null ? new Intl.NumberFormat().format(selectedStage.feedConsumed) : '--', suffix: 'kg', icon: '🌾', color: '#CC6E1A' },
                { label: 'Status', value: selectedStage?.status?.toUpperCase() || 'ACTIVE', suffix: '', icon: '●', color: selectedStage?.status?.toLowerCase() === 'inactive' ? '#EF5350' : '#66BB6A' },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>{stat.icon}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>
                    {stat.value}
                    {stat.suffix && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '4px' }}>{stat.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>📊 Movement</p>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Fish Added</p>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#B06426' }}>
                      {selectedStage?.fishAdded != null ? `${new Intl.NumberFormat().format(selectedStage.fishAdded)} pcs` : '--'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Fish Moved</p>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#CC6E1A' }}>
                      {selectedStage?.fishMoved != null ? `${new Intl.NumberFormat().format(selectedStage.fishMoved)} pcs` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>🔬 Latest Sampling</p>
                {sampling.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', marginBottom: '6px' }}>
                      <span>Date</span>
                      <span>Data</span>
                    </div>
                    {sampling.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.78rem', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{formatDate(s.createdAt).slice(0, 5)}</span>
                        <span style={{ color: '#fff', fontWeight: 500 }}>{s.sample_labeling?.length > 20 ? `${s.sample_labeling.slice(0, 20)}...` : s.sample_labeling || '--'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No sampling records yet</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>📝 Recent Notes</p>
              {note.length > 0 ? (
                note.slice(0, 3).map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: i === 0 ? '#CC6E1A' : 'rgba(255,255,255,0.2)', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#fff' }}>{n.note?.length > 50 ? `${n.note.substring(0, 50)}...` : n.note}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{n.fullName || 'System'} · {formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No notes recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── EDIT POND MODAL ── */}
      <Modal show={showEditPondModal} onHide={() => setShowEditPondModal(false)} centered>
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✏️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Edit Pond</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>{selectedStage?.title}</p>
              </div>
            </div>
            <button onClick={() => setShowEditPondModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>
          <div style={{ padding: '24px' }}>
            <Form>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Pond Name</label>
                <input type="text" value={selectedStage?.title || ''} onChange={(e) => setSelectedStage(prev => prev ? { ...prev, title: e.target.value } : prev)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', color: '#2E3135', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#512728'} onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Description</label>
                <textarea rows={3} value={selectedStage?.description || ''} onChange={(e) => setSelectedStage(prev => prev ? { ...prev, description: e.target.value } : prev)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', color: '#2E3135', resize: 'vertical', transition: 'border 0.2s', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#512728'} onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
              </div>
            </Form>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAFAFA' }}>
            <button onClick={() => setShowEditPondModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E0E0E0', background: '#fff', color: '#2E3135', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={loadingEdit} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: loadingEdit ? 'not-allowed' : 'pointer', opacity: loadingEdit ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loadingEdit ? <Spinner size="sm" animation="border" /> : '✓'} Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* ── ADD SAMPLING MODAL ── */}
      <Modal show={showAddSamplingModal} onHide={() => setShowAddSamplingModal(false)} centered>
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🔬</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Add Sampling Record</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>{selectedStage?.title}</p>
              </div>
            </div>
            <button onClick={() => setShowAddSamplingModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>
          <div style={{ padding: '24px' }}>
            <Form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleAddSamplingSubmit({ sample_labeling: fd.get('sample_labeling') }); }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Sampling Data / Comment</label>
                <textarea name="sample_labeling" placeholder="Enter sampling observations, measurements, or comments..." rows={4} required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', color: '#2E3135', resize: 'vertical', transition: 'border 0.2s', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#512728'} onBlur={e => e.target.style.borderColor = '#E0E0E0'} onInput={e => { e.target.value = e.target.value.replace(/\D/g, ''); }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddSamplingModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E0E0E0', background: '#fff', color: '#2E3135', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loadingSamp} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: loadingSamp ? 'not-allowed' : 'pointer', opacity: loadingSamp ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loadingSamp ? <Spinner size="sm" animation="border" /> : '✓'} Save Record
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* ── ADD NOTE MODAL ── */}
      <Modal show={showAddNoteModal} onHide={() => setShowAddNoteModal(false)} centered>
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ background: 'linear-gradient(135deg, #B06426 0%, #CC6E1A 100%)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📝</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Add Note</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>{selectedStage?.title}</p>
              </div>
            </div>
            <button onClick={() => setShowAddNoteModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>
          <div style={{ padding: '24px' }}>
            <Form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleAddNoteSubmit({ fullName: fd.get('fullName'), note: fd.get('note') }); }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Full Name</label>
                <input type="text" name="fullName" placeholder="Enter your full name" required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', color: '#2E3135', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#B06426'} onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Note</label>
                <textarea name="note" placeholder="Write your note or observation..." rows={4} required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', color: '#2E3135', resize: 'vertical', transition: 'border 0.2s', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#B06426'} onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddNoteModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E0E0E0', background: '#fff', color: '#2E3135', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loadingNote} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #B06426 0%, #CC6E1A 100%)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: loadingNote ? 'not-allowed' : 'pointer', opacity: loadingNote ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loadingNote ? <Spinner size="sm" animation="border" /> : '✓'} Add Note
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

    </section>
  );
};

export default ViewAllStages;
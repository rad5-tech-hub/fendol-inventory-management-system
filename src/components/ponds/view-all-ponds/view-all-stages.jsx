import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsExclamationTriangleFill, BsPencilFill, BsSearch } from "react-icons/bs";
import { Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import { SkeletonTable, SkeletonFilterBar, SkeletonStatGrid } from "../../shared/skeleton/Skeleton";
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SiteSelector from "../../shared/site-selector/SiteSelector";
import { useConfirm } from "../../shared/confirm-modal";

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
  const [pondDetail, setPondDetail] = useState(null);
  const [pondDetailLoading, setPondDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [siteFilter, setSiteFilter] = useState('');
  const [siteIdFilter, setSiteIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const itemsPerPage = 45;
  const [selectedStage, setSelectedStage] = useState(null);
  const [showPondSummaryPanel, setShowPondSummaryPanel] = useState(false);
  const [showEditPondModal, setShowEditPondModal] = useState(false);
  const [showAddSamplingModal, setShowAddSamplingModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const [ConfirmDialog, confirm] = useConfirm();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');

  const handleSiteChange = (id, name) => {
    setSiteFilter(name || '');
    setSiteIdFilter(id || '');
  };

  const fetchStages = async () => {
    try {
      const response = await Api.get(`/fish-stages?siteId=${siteIdFilter || 'all'}`);
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
    const siteName = stage.site?.name || '';
    const matchesSite = siteFilter ? siteName.toLowerCase() === siteFilter.toLowerCase() : true;
    const matchesStatus = statusFilter ? (stage.status?.toLowerCase() || '') === statusFilter.toLowerCase() : true;
    return matchesSearch && matchesSite && matchesStatus;
  });

  const handleSave = async () => {
    setLoadingEdit(true)
    const saveToast = toast.loading('Saving changes...');
    try {
      const payload = {
        title: selectedStage.title,
        description: selectedStage.description,
      };
      if (isSuperAdmin && selectedStage.siteId) payload.siteId = selectedStage.siteId;
      await Api.put(`/fish-stage/${selectedStage.id}`, payload);
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
      if (selectedStage) fetchPondDetail(selectedStage.id);
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

  const fetchPondDetail = async (stageId) => {
    setPondDetailLoading(true);
    try {
      const response = await Api.get(`/fish-stage/${stageId}`);
      setPondDetail(response.data);
    } catch {
      setPondDetail(null);
    } finally {
      setPondDetailLoading(false);
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
      if (selectedStage) fetchPondDetail(selectedStage.id);
    } catch (err) {
      toast.update(samplingToast, { render: 'Failed to add sampling. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    }finally{
      setLoadingSamp(false);
    }
  };

  const DeletePond = async () => {
    const ok = await confirm({ message: "Are you sure you want to delete this pond?", title: "Confirm Delete", variant: "danger" });
    if (!ok) return;

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
      stage.site?.name || '',
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
                {isSuperAdmin && (
                  <div style={{ minWidth: '155px' }}>
                    <label className="form-label mb-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E3135' }}>Site</label>
                    <SiteSelector onChange={handleSiteChange} />
                  </div>
                )}
                <div style={{ minWidth: '155px' }}>
                  <label className="form-label mb-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E3135' }}>Status</label>
                  <CustomDropdown
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="All Status"
                  />
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
              {(isSuperAdmin && siteFilter || statusFilter) && (
                <div className="d-flex gap-2 flex-wrap mt-3 align-items-center">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2E3135', letterSpacing: '0.03em' }}>
                    ACTIVE FILTERS:
                  </span>
                  {isSuperAdmin && siteFilter && (
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
                <div className="border rounded" style={{ backgroundColor: '#fff' }}>
                  <DataTable
                    columns={[
                      { key: 'createdAt', label: 'DATE CREATED', render: (value) => <span style={{ color: '#8C949B' }}>{formatDate(value)}</span> },
                      { key: 'title', label: 'POND NAME', render: (value) => <span style={{ color: '#512728', fontWeight: 600 }}>{value}</span> },
                      { key: 'description', label: 'DESCRIPTION', render: (value) => <span style={{ color: '#2E3135' }}>{value}</span> },
                      { key: 'site', label: 'SITE', render: (_, row) => {
                        const siteName = row.site?.name;
                        if (!siteName) return <span style={{ color: '#8C949B' }}>--</span>;
                        const isHatchery = siteName.toLowerCase() === 'hatchery';
                        return (
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: isHatchery ? '#FFF3CD' : '#E9ECEF', color: isHatchery ? '#856404' : '#495057', fontSize: '0.78rem', fontWeight: 500 }}>{siteName}</span>
                        );
                      }},
                      { key: 'quantity', label: 'CURRENT STOCK', align: 'right', render: (value) => <span style={{ fontWeight: 600, color: '#2E3135' }}>{new Intl.NumberFormat().format(value)} pcs</span> },
                    ]}
                    data={displayedStages}
                    actions={(row) => (
                      <PortalDropdown
                        btnClass={styles.threeDotBtn}
                        items={[
                          { label: 'Pond Summary', onClick: () => { setSelectedStage(row); setShowPondSummaryPanel(true); fetchPondDetail(row.id); } },
                          { label: 'Edit Pond', onClick: () => { setSelectedStage(row); setShowEditPondModal(true); } },
                          { label: 'Add Sampling Record', onClick: () => { setSelectedStage(row); setShowAddSamplingModal(true); } },
                          { label: 'Add Notes', onClick: () => { setSelectedStage(row); setShowAddNoteModal(true); } },
                          { divider: true },
                          { label: 'Delete', onClick: () => { setSelectedStage(row); DeletePond(); }, style: { color: '#dc3545', fontWeight: 600 } },
                        ]}
                      />
                    )}
                  />
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
                    activeClassName={"active"}
                  />
                </div>
              </>
            )}
          </main>
        </section>
      </div>

      <ToastContainer />

      {/* ── POND SUMMARY SLIDE-IN PANEL ── */}
      <>
        {/* Backdrop */}
        {showPondSummaryPanel && (
          <div
            onClick={() => setShowPondSummaryPanel(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              zIndex: 1049,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              animation: 'pondBackdropIn 0.25s ease forwards',
            }}
          />
        )}

        {/* Slide-in Panel */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '420px',
            maxWidth: '100vw',
            backgroundColor: '#fff',
            zIndex: 1050,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxShadow: '-8px 0 48px rgba(0,0,0,0.18)',
            transform: showPondSummaryPanel ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Panel Header ── */}
          <div style={{
            padding: '22px 24px 16px',
            borderBottom: '1px solid #F0F0F0',
            position: 'relative',
            flexShrink: 0,
          }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '0.7rem', fontWeight: 700, color: '#B06426', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pond Summary
            </p>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 800, color: '#1C1C1C', paddingRight: '36px', lineHeight: 1.25 }}>
              {selectedStage?.title || '—'}
            </h2>
            <p style={{ margin: '0 0 1px 0', fontSize: '0.775rem', color: '#8C949B', fontWeight: 500 }}>
              {selectedStage?.site?.name ? `${selectedStage.site.name.toUpperCase()}` : '—'}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#B0B8C1' }}>
              Created: {selectedStage?.createdAt ? formatDate(selectedStage.createdAt) : '—'}
            </p>
            {/* Close button */}
            <button
              onClick={() => setShowPondSummaryPanel(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #EBEBEB',
                background: '#F7F7F7',
                color: '#555',
                fontSize: '1rem',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#EDEDED'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#F7F7F7'; }}
            >
              ×
            </button>
          </div>

          {/* ── Hero Image Area ── */}
          <div style={{ position: 'relative', width: '100%', height: '178px', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(160deg, #1A3A3A 0%, #0F2828 40%, #1B4040 70%, #2A5040 100%)' }}>
            {/* Water ripple texture overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(ellipse 120% 60% at 50% 80%, rgba(30,80,70,0.55) 0%, transparent 70%), radial-gradient(ellipse 80% 40% at 30% 60%, rgba(20,60,55,0.45) 0%, transparent 60%)',
              zIndex: 1,
            }} />
            {/* Circular pond silhouette */}
            <div style={{ position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%)', width: '220px', height: '220px', borderRadius: '50%', border: '3px solid rgba(60,140,120,0.35)', background: 'radial-gradient(circle, rgba(25,90,80,0.55) 0%, rgba(15,55,50,0.3) 60%, transparent 100%)', zIndex: 2 }} />
            <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: '140px', height: '140px', borderRadius: '50%', border: '2px solid rgba(60,160,130,0.25)', background: 'radial-gradient(circle, rgba(20,100,85,0.4) 0%, transparent 70%)', zIndex: 3 }} />
            {/* Status badge */}
            <div style={{
              position: 'absolute',
              bottom: '14px',
              left: '16px',
              zIndex: 10,
              padding: '5px 12px',
              borderRadius: '100px',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              backgroundColor: selectedStage?.status?.toLowerCase() === 'inactive' ? '#FFEBEE' : '#E8F5E9',
              color: selectedStage?.status?.toLowerCase() === 'inactive' ? '#C62828' : '#2E7D32',
              border: `1px solid ${selectedStage?.status?.toLowerCase() === 'inactive' ? '#FFCDD2' : '#C8E6C9'}`,
              backdropFilter: 'blur(4px)',
            }}>
              {selectedStage?.status?.toUpperCase() || 'ACTIVE'}
            </div>
            {/* Subtle vignette */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)', zIndex: 4 }} />
          </div>

          {/* ── Scrollable Content Body ── */}
          <div style={{ flex: 1, padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 2×2 Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Current Stock', value: selectedStage ? new Intl.NumberFormat().format(selectedStage.quantity ?? 0) : '0', suffix: 'pcs', valueColor: '#1A5276' },
                { label: 'Mortality Count', value: pondDetail?.totalDamages != null ? new Intl.NumberFormat().format(pondDetail.totalDamages) : '--', suffix: 'pcs', valueColor: '#C0392B' },
                { label: 'Feed Consumed', value: selectedStage?.feedConsumed != null ? new Intl.NumberFormat().format(selectedStage.feedConsumed) : '--', suffix: 'kg', valueColor: '#2E3135' },
                { label: 'Last Activity', value: '—', suffix: '', valueColor: '#2E3135' },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: '#FAFAFA',
                  border: '1px solid #EFEFEF',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#9AA0A6', fontWeight: 500 }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: stat.valueColor, lineHeight: 1.1 }}>
                    {stat.value}
                    {stat.suffix && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#AAB0B7', marginLeft: '4px' }}>{stat.suffix}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Movement Stats */}
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Movement Stats
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, background: '#FAFAFA', border: '1px solid #EFEFEF', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.72rem', color: '#9AA0A6', fontWeight: 500 }}>Fish Added</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2E3135' }}>
                    {selectedStage?.fishAdded != null ? `${new Intl.NumberFormat().format(selectedStage.fishAdded)} pcs` : '--'}
                  </p>
                </div>
                <div style={{ flex: 1, background: '#FAFAFA', border: '1px solid #EFEFEF', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.72rem', color: '#9AA0A6', fontWeight: 500 }}>Fish Moved</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2E3135' }}>
                    {selectedStage?.fishMoved != null ? `${new Intl.NumberFormat().format(selectedStage.fishMoved)} pcs` : '--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sampling History */}
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Sampling History
              </p>
              {pondDetailLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8C949B', fontSize: '0.8rem' }}>Loading…</div>
              ) : !pondDetail?.samplings?.length ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#B0B8C1', fontSize: '0.8rem', fontStyle: 'italic', background: '#FAFAFA', borderRadius: '10px', border: '1px solid #EFEFEF' }}>
                  No sampling records yet
                </div>
              ) : (
                <div style={{ border: '1px solid #EFEFEF', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 14px', background: '#F7F8F9', borderBottom: '1px solid #EFEFEF' }}>
                    {['Date', 'Data', 'Status'].map(h => (
                      <span key={h} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9AA0A6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {/* Table rows */}
                  {pondDetail.samplings.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 14px', borderBottom: i < Math.min(pondDetail.samplings.length, 5) - 1 ? '1px solid #F5F5F5' : 'none', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#6C757D' }}>
                        {formatDate(s.createdAt).slice(0, 5)}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#2E3135', fontWeight: 500 }}>
                        {s.sample_labeling?.length > 12 ? `${s.sample_labeling.slice(0, 12)}…` : s.sample_labeling || '--'}
                      </span>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: i % 2 === 0 ? '#2E7D32' : '#B06426',
                      }}>
                        {i % 2 === 0 ? 'Optimal' : 'Stable'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity (Notes) */}
            <div style={{ paddingBottom: '8px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 800, color: '#8C949B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Recent Activity
              </p>
              {pondDetailLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8C949B', fontSize: '0.8rem' }}>Loading…</div>
              ) : !pondDetail?.recentActivities?.length ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#B0B8C1', fontSize: '0.8rem', fontStyle: 'italic', background: '#FAFAFA', borderRadius: '10px', border: '1px solid #EFEFEF' }}>
                  No activity recorded yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {pondDetail.recentActivities.slice(0, 4).map((n, i) => {
                    const dotColors = ['#512728', '#B06426', '#CC6E1A', '#8C949B'];
                    return (
                      <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < Math.min(pondDetail.recentActivities.length, 4) - 1 ? '1px solid #F5F5F5' : 'none' }}>
                        <div style={{ paddingTop: '4px', flexShrink: 0 }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColors[i % dotColors.length] }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px 0', fontSize: '0.82rem', color: '#2E3135', fontWeight: 500, lineHeight: 1.4 }}>
                            {n.action?.length > 50 ? `${n.action.substring(0, 50)}…` : n.action || n.note}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#AAB0B7' }}>
                            {n.performer?.fullName || n.fullName || 'System'} · {formatDate(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>{/* end scrollable body */}

          {/* ── Footer (sticky) ── */}
          <div style={{
            flexShrink: 0,
            padding: '14px 20px 20px',
            borderTop: '1px solid #F0F0F0',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            alignItems: 'center',
          }}>
            <button
              onClick={() => { setShowPondSummaryPanel(false); setShowEditPondModal(true); }}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                border: '1px solid #EBEBEB',
                background: '#FAFAFA',
                color: '#512728',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, border-color 0.15s',
              }}
              title="Edit Pond"
              onMouseOver={e => { e.currentTarget.style.background = '#F0E4E4'; e.currentTarget.style.borderColor = '#DFC4C4'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#EBEBEB'; }}
            >
              <BsPencilFill size={14} />
            </button>
          </div>

        </div>{/* end panel */}
      </>

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
              {isSuperAdmin && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Site</label>
                  <SiteSelector
                    value={selectedStage?.siteId || ''}
                    onChange={(id, name) => setSelectedStage(prev => prev ? { ...prev, siteId: id || '' } : prev)}
                  />
                </div>
              )}
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E3135', marginBottom: '6px' }}>Sample Count <span style={{ color: '#8C949B', fontWeight: 400 }}>(numbers only)</span></label>
                <input
                  type="text"
                  name="sample_labeling"
                  placeholder="e.g. 53"
                  required
                  onInput={e => { e.target.value = e.target.value.replace(/\D/g, ''); }}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', color: '#2E3135', transition: 'border 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#512728'}
                  onBlur={e => e.target.style.borderColor = '#E0E0E0'}
                />
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

      <ConfirmDialog />
      <style>{`
        @keyframes pondBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default ViewAllStages;
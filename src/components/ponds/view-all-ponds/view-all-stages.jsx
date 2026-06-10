import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsExclamationTriangleFill, BsPencilFill, BsTrash, BsSearch, BsDownload, BsThreeDotsVertical } from "react-icons/bs";
import { Form, Button, Spinner, Alert, Modal, Popover, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Api, { ApiV2 } from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import { hasPermission } from "../../shared/permissions/permissions";
import { useNavigate } from 'react-router-dom';

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
  const [modaltype, setModaltype] = useState('view all note');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showMdModal, setShowMdModal] = useState(false);
  const [showSamplingModal, setShowSamplingModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [sites, setSites] = useState([]);
  const [showAside, setShowAside] = useState(false);
  const [asideStage, setAsideStage] = useState(null);
  const [openMenuStageId, setOpenMenuStageId] = useState(null);

  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const canSeeSiteFilter = hasPermission(userTypes, 'site-management');
  const navigate = useNavigate();

  useEffect(() => {
    if (!canSeeSiteFilter) return;
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        setSites(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      }
    };
    fetchSites();
  }, [canSeeSiteFilter]);

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const renderPopover = (note) => (
    <Popover id="popover-basic">
      <Popover.Header as="h5">Full Note</Popover.Header>
      <Popover.Body>{note}</Popover.Body>
    </Popover>
  );

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

  const handleEditStage = (stage) => {
    setSelectedStage(stage);
    setShowModal(true);
    setModaltype('view all note'); // Default to notes view
    setNoteLoader(true); // Trigger note fetch
    fetchnote(stage.id);
  };

  const handleOpenAside = (stage) => {
    setAsideStage(stage);
    setShowAside(true);
  };

  const handleCloseAside = () => {
    setShowAside(false);
  };

  const handleAddNote = () => {
    setShowMdModal(true);
  };

  const handleAddSampling = () => {
    setShowSamplingModal(true);
  };

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
      fetchStages(); // Refresh stages
      setShowModal(false);
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
      setShowMdModal(false);
      fetchnote(selectedStage.id); // Fetch notes immediately after success
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
      setShowSamplingModal(false);
      fetchSampling(selectedStage.id); // Fetch sampling immediately after success
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
      setShowModal(false);
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

  useEffect(() => {
    if (modaltype === 'view all sampling' && selectedStage) {
      fetchSampling(selectedStage.id);
    } else if (modaltype === 'view all note' && selectedStage) {
      fetchnote(selectedStage.id);
    }
  }, [modaltype, selectedStage]);

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
                {canSeeSiteFilter && (
                  <div style={{ minWidth: '155px' }}>
                    <label className="form-label mb-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E3135' }}>Site</label>
                    <select
                      className="form-select form-select-sm shadow-none"
                      value={siteFilter}
                      onChange={(e) => setSiteFilter(e.target.value)}
                    >
                      <option value="">All Sites</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.name}>{site.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                        onClick={() => setSiteFilter('')}
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
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
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
                          <tr key={stage.id} style={{ borderTop: '1px solid #F0F0F0', cursor: 'pointer' }} onClick={() => handleOpenAside(stage)}>
                            <td className="py-3 px-3 align-middle" style={{ color: '#8C949B' }}>{formattedCreatedAt}</td>
                            <td className="py-3 px-3 align-middle">
                              <span
                                style={{ color: '#512728', fontWeight: 600 }}
                              >
                                {stage.title}
                              </span>
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
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                      minWidth: '160px',
                                      padding: '4px 0',
                                    }}
                                  >
                                    <button
                                      style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.875rem', color: '#2E3135', cursor: 'pointer' }}
                                      onClick={() => { setOpenMenuStageId(null); handleEditStage(stage); }}
                                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <BsPencilFill size={13} style={{ marginRight: '10px', color: '#6C757D' }} /> Edit Pond
                                    </button>
                                    <button
                                      style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.875rem', color: '#dc3545', cursor: 'pointer' }}
                                      onClick={() => { setOpenMenuStageId(null); setSelectedStage(stage); setTimeout(() => DeletePond(), 0); }}
                                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFF5F5'}
                                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <BsTrash size={13} style={{ marginRight: '10px', color: '#dc3545' }} /> Delete
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
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setModaltype('view all note');
          setNote([]); // Clear notes on close
          setSampling([]); // Clear sampling on close
          setNoteLoader(false);
          setSamplingLoader(false);
          setNoteError('');
          setSamplingError('');
        }}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton className="border-0 mb-4">
          <div className="row w-100 px-3">
            <div className="col-12 mb-2">
              <Modal.Title id="contained-modal-title-vcenter" className="fw-semibold">
                Name: {selectedStage?.title}
              </Modal.Title>
            </div>
            <div className="col-9 col-md-9">
              <p className="mb-0 fs-5 fw-semibold">Quantity: {selectedStage?.quantity}</p>
            </div>
            <div className="col-3 col-md-3 mb-2 text-end">
              <span className={`bg-light rounded-circle ${styles.action}`} title="Edit pond" onClick={() => setModaltype('edit pond')}>
                <BsPencilFill size={18} className="text-dark text-center" />
              </span>
              <span className={`bg-light rounded-circle ${styles.action}`} onClick={() => DeletePond()} title="Delete Pond">
                <BsTrash size={18} className="text-danger text-center" />
              </span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ height: '40vh', overflowX: 'auto', overflowY: 'auto' }} className="mx-4">
          <div className={`d-flex m-2 ${modaltype === 'edit pond' ? 'justify-content-end' : 'justify-content-start'}`}>
            {modaltype === 'edit pond' ? (
              <div className="d-flex gap-3">
                <span
                  onClick={() => setModaltype('view all note')}
                  style={{ cursor: "pointer" }}
                  className="text-muted text-decoration-underline fw-semibold"
                >
                  View Notes
                </span>
                <span
                  onClick={() => setModaltype('view all sampling')}
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                  className="text-muted text-decoration-underline fw-semibold"
                >
                  View Sampling
                </span>
              </div>
            ) : (
              <div className="d-flex gap-3">
                <h5
                  className={`fw-semibold text-dark ${modaltype === 'view all note' ? 'border-bottom border-danger-subtle' : ''}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setModaltype('view all note')}
                >
                  Notes
                </h5>
                <h5
                  className={`fw-semibold text-dark ${modaltype === 'view all sampling' ? 'border-bottom border-danger-subtle' : ''}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setModaltype('view all sampling')}
                >
                  Sampling
                </h5>
              </div>
            )}
          </div>

          <div>
            {modaltype === 'edit pond' && (
              <>
                {selectedStage && (
                  <Form>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={selectedStage.title}
                        onChange={(e) =>
                          setSelectedStage({ ...selectedStage, title: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-5">
                      <Form.Label className="fw-semibold">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={selectedStage.description}
                        onChange={(e) =>
                          setSelectedStage({
                            ...selectedStage,
                            description: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Form>
                )}
              </>
            )}

            {modaltype === 'view all note' && (
              <>
                {noteLoader && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}

                {!noteLoader && noteError && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-75 py-5">
                      <BsExclamationTriangleFill size={40} />{' '}
                      <span className="fw-semibold">{noteError}</span>
                    </Alert>
                  </div>
                )}

                {!noteLoader && !noteError && note.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-75 py-5">
                      No available notes
                    </Alert>
                  </div>
                )}

                {!noteLoader && !noteError && note.length > 0 && (
                  <table className={`${styles.styled_table} table-responsive`}>
                    <thead>
                      <tr>
                        <th>DATE CREATED</th>
                        <th className="text-center">FULL NAME</th>
                        <th className="text-end">NOTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note.map((stage) => {
                        const formattedCreatedAt = formatDate(stage.createdAt);
                        return (
                          <tr key={stage.id}>
                            <td>{formattedCreatedAt}</td>
                            <td className="text-center">{stage.fullName}</td>
                            <OverlayTrigger
                              trigger="click"
                              placement="right"
                              overlay={renderPopover(stage.note)}
                            >
                              <td
                                style={{ cursor: 'pointer' }}
                                className="text-end"
                                onClick={() => handleNoteClick(stage.note)}
                              >
                                {stage.note.length > 50 ? `${stage.note.substring(0, 50)}...` : stage.note}
                              </td>
                            </OverlayTrigger>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {modaltype === 'view all sampling' && (
              <>
                {samplingLoader && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}

                {!samplingLoader && samplingError && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-75 py-5">
                      <BsExclamationTriangleFill size={40} />{' '}
                      <span className="fw-semibold">{samplingError}</span>
                    </Alert>
                  </div>
                )}

                {!samplingLoader && !samplingError && sampling.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-75 py-5">
                      No available sampling data
                    </Alert>
                  </div>
                )}

                {!samplingLoader && !samplingError && sampling.length > 0 && (
                  <table className={`${styles.styled_table} table-responsive`}>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th className="text-center">SAMPLING DATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampling.map((sample) => {
                        const formattedDate = formatDate(sample.createdAt);
                        return (
                          <tr key={sample.id}>
                            <td>{formattedDate}</td>
                            <td className="text-center">{sample.sample_labeling}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 mx-4">
          {modaltype === 'view all note' ? (
            <Button
              variant="dark"
              onClick={handleAddNote}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
            >
              ADD NOTE
            </Button>
          ) : modaltype === 'view all sampling' ? (
            <Button
              variant="dark"
              onClick={handleAddSampling}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
            >
              ADD SAMPLING
            </Button>
          ) : (
            <Button
              variant="dark"
              onClick={handleSave}
              disabled={loadingEdit}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
            >
              Save Changes
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showMdModal} className="border-0" onHide={() => setShowMdModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Add Note</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const note = {
                fullName: formData.get('fullName'),
                note: formData.get('note'),
              };
              handleAddNoteSubmit(note);
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Note</Form.Label>
              <Form.Control as="textarea" name="note" placeholder="Write Note" rows={3} required />
            </Form.Group>
            <div className="text-end">
              <Button type="submit" disabled={loadingNote} className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}>
                ADD
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showSamplingModal} className="border-0" onHide={() => setShowSamplingModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Add Sampling</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const sampling = {
                sample_labeling: formData.get('sample_labeling'),
              };
              handleAddSamplingSubmit(sampling);
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Sampling Comment</Form.Label>
              <Form.Control as="textarea" name="sample_labeling" placeholder="Write sampling comment" rows={3} required />
            </Form.Group>
            <div className="text-end">
              <Button type="submit" disabled={loadingSamp} className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}>
                ADD
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ── Pond Summary Aside ── */}
      <>
        {/* Backdrop */}
        <div
          onClick={handleCloseAside}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            zIndex: 1040,
            opacity: showAside ? 1 : 0,
            pointerEvents: showAside ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Panel */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '360px',
            maxWidth: '95vw',
            backgroundColor: '#fff',
            zIndex: 1050,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            transform: showAside ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: showAside ? '-8px 0 32px rgba(0,0,0,0.12)' : 'none',
          }}
        >
          {asideStage && (
            <>
              {/* ── Header ── */}
              <div style={{ padding: '20px 20px 0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#2E3135' }}>
                    Pond Summary
                  </h5>
                  <span
                    onClick={handleCloseAside}
                    style={{ cursor: 'pointer', color: '#8C949B', fontSize: '1.1rem', lineHeight: 1, padding: '2px 4px' }}
                    title="Close"
                  >
                    ✕
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#512728', letterSpacing: '0.02em' }}>
                  {asideStage.title?.toUpperCase()} · {asideStage.site || '--'}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C949B' }}>
                  Created: {formatDate(asideStage.createdAt)}
                </p>
              </div>

              {/* ── Pond Image placeholder ── */}
              <div style={{ margin: '16px 20px 0 20px', borderRadius: '10px', overflow: 'hidden', height: '148px', backgroundColor: '#e8edf1', position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(160deg, #b6cfd6 0%, #7fadb8 50%, #4f8a96 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '2.5rem', opacity: 0.35 }}>🌊</span>
                </div>
                {/* Status badge */}
                <span style={{
                  position: 'absolute', bottom: '10px', left: '12px',
                  backgroundColor: asideStage.status?.toLowerCase() === 'inactive' ? '#6C757D' : '#28a745',
                  color: '#fff',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                  padding: '3px 10px', borderRadius: '20px',
                }}>
                  {asideStage.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              {/* ── 2×2 Stat Cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 20px 0 20px' }}>
                {[
                  { label: 'Current Stock', value: `${new Intl.NumberFormat().format(asideStage.quantity ?? 0)} pcs`, danger: false },
                  { label: 'Mortality Count', value: asideStage.mortalityCount != null ? `${new Intl.NumberFormat().format(asideStage.mortalityCount)} pcs` : '--', danger: true },
                  { label: 'Feed Consumed', value: asideStage.feedConsumed != null ? `${new Intl.NumberFormat().format(asideStage.feedConsumed)} kg` : '--', danger: false },
                  { label: 'Last Activity', value: asideStage.lastActivity || '-- hrs ago', danger: false },
                ].map((stat, i) => (
                  <div key={i} style={{
                    backgroundColor: '#F8F9FA',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #F0F0F0',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', marginBottom: '4px' }}>{stat.label}</p>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: stat.danger ? '#dc3545' : '#2E3135' }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Movement Stats ── */}
              <div style={{ margin: '18px 20px 0 20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', fontWeight: 700, color: '#8C949B', letterSpacing: '0.07em' }}>
                  MOVEMENT STATS
                </p>
                <div style={{ display: 'flex', gap: '32px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', marginBottom: '3px' }}>Fish Added</p>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#2E3135' }}>
                      {asideStage.fishAdded != null ? `${new Intl.NumberFormat().format(asideStage.fishAdded)} pcs` : '--'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B', marginBottom: '3px' }}>Fish Moved</p>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#2E3135' }}>
                      {asideStage.fishMoved != null ? `${new Intl.NumberFormat().format(asideStage.fishMoved)} pcs` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Sampling History ── */}
              <div style={{ margin: '18px 20px 0 20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, color: '#2E3135' }}>
                  Sampling History
                </p>
                {sampling.length > 0 && asideStage?.id === selectedStage?.id ? (
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                        {['Date', 'Avg. Wt', 'Health'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.72rem', color: '#8C949B', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampling.slice(0, 4).map((s, i) => (
                        <tr key={s.id || i} style={{ borderBottom: '1px solid #F8F9FA' }}>
                          <td style={{ padding: '7px 8px', color: '#2E3135' }}>{formatDate(s.createdAt).slice(0, 5)}</td>
                          <td style={{ padding: '7px 8px', color: '#2E3135' }}>{s.avgWeight ? `${s.avgWeight}g` : '--'}</td>
                          <td style={{ padding: '7px 8px', fontWeight: 600, color: s.health?.toLowerCase() === 'stable' ? '#e8a020' : '#28a745' }}>
                            {s.health || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                        {['Date', 'Avg. Wt', 'Health'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.72rem', color: '#8C949B', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: 'Oct 14', wt: '145g', health: 'Optimal', color: '#28a745' },
                        { date: 'Oct 07', wt: '132g', health: 'Optimal', color: '#28a745' },
                        { date: 'Sep 30', wt: '118g', health: 'Stable',  color: '#e8a020' },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F8F9FA' }}>
                          <td style={{ padding: '7px 8px', color: '#2E3135' }}>{row.date}</td>
                          <td style={{ padding: '7px 8px', color: '#2E3135' }}>{row.wt}</td>
                          <td style={{ padding: '7px 8px', fontWeight: 600, color: row.color }}>{row.health}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── Recent Activity ── */}
              <div style={{ margin: '18px 20px 0 20px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 700, color: '#2E3135' }}>
                  Recent Activity
                </p>
                {note.length > 0 && asideStage?.id === selectedStage?.id ? (
                  note.slice(0, 3).map((n, i) => (
                    <div key={n.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === 0 ? '#512728' : '#dc3545', marginTop: '5px', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#2E3135' }}>{n.note?.length > 40 ? `${n.note.substring(0, 40)}...` : n.note}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B' }}>{formatDate(n.createdAt)} · {n.fullName || 'System'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { title: 'Morning Feed Dispatched',        sub: '08:30 AM · System Auto',              dot: '#512728' },
                    { title: 'Dissolved Oxygen Low Warning',   sub: 'Yesterday · Aerator-02 Check Required', dot: '#dc3545' },
                    { title: 'Water Sample Collected',         sub: 'Oct 14, 02:16 PM · Marcus J.',          dot: '#dc3545' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: a.dot, marginTop: '5px', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#2E3135' }}>{a.title}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8C949B' }}>{a.sub}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── Footer CTA ── */}
              <div style={{ padding: '20px', marginTop: 'auto', display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid #F0F0F0', backgroundColor: '#fff' }}>
                <button
                  onClick={() => { handleCloseAside(); handleEditStage(asideStage); }}
                  style={{
                    flex: 1,
                    backgroundColor: '#512728',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px 0',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  View Full Analytics
                </button>
                <button
                  onClick={() => { handleCloseAside(); setSelectedStage(asideStage); setShowModal(true); setModaltype('edit pond'); }}
                  style={{
                    width: '40px', height: '40px',
                    backgroundColor: '#F8F9FA',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Edit pond"
                >
                  <BsPencilFill size={15} color="#2E3135" />
                </button>
              </div>
            </>
          )}
        </div>
      </>
    </section>
  );
};

export default ViewAllStages;
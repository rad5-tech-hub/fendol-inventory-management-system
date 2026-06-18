import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { IoArrowBackOutline, IoInformationCircleOutline, IoCheckmarkCircle, IoCalendarOutline, IoSaveOutline, IoClose } from 'react-icons/io5';
import { GiCirclingFish } from 'react-icons/gi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import { ApiV2 } from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const DRAFT_KEY = 'hatchery_hatchBatchDraft';

const generateBatchNo = () => {
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-4);
  return `HB-${year}-${seq}`;
};

const parseDate = (str) => {
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (date) => {
  if (!date) return '';
  if (date instanceof Date && !isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

const serializeForm = (form) => ({
  ...form,
  dateInjected: form.dateInjected instanceof Date ? formatDate(form.dateInjected) : null,
  dateStripped: form.dateStripped instanceof Date ? formatDate(form.dateStripped) : null,
  dateHatched: form.dateHatched instanceof Date ? formatDate(form.dateHatched) : null,
});

const deserializeForm = (data) => ({
  ...data,
  dateInjected: data.dateInjected ? parseDate(data.dateInjected) : null,
  dateStripped: data.dateStripped ? parseDate(data.dateStripped) : null,
  dateHatched: data.dateHatched ? parseDate(data.dateHatched) : null,
});

export default function CreateHatchBatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.batch;
  const isEditing = !!editData;

  const activeSite = useSelector((store) => store.activeSite);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [sites, setSites] = useState([]);
  const [sitesLoaded, setSitesLoaded] = useState(false);

  const [form, setForm] = useState(() => {
    if (!editData) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.hatchbatchNo) return deserializeForm(parsed);
        }
      } catch {}
      return {
        hatchbatchNo: generateBatchNo(),
        site: activeSite?.name || '',
        siteId: activeSite?.id || '',
        dateInjected: null,
        dateStripped: null,
        dateHatched: null,
        numFemales: '',
        avgWeightFemale: '',
        numMales: '',
        avgWeightMale: '',
        eggWeight: '',
        numberOfEggs: '',
        hatchability: '',
        notes: '',
      };
    }
    const e = editData;
    return {
      hatchbatchNo: e.hatchbatchNo || e.batchNo || generateBatchNo(),
      site: e.site || '',
      siteId: e.siteId || activeSite?.id || '',
      dateInjected: parseDate(e.dateInjected),
      dateStripped: parseDate(e.dateStripped),
      dateHatched: parseDate(e.dateHatched),
      numFemales: e.noOfFemaleBroodstock ?? e.females ?? '',
      avgWeightFemale: e.avgWeightOfFemale ?? e.avgWeightFemale ?? '',
      numMales: e.maleBroodStock ?? e.males ?? '',
      avgWeightMale: e.avgWeightOfMaleBroodstock ?? e.avgWeightMale ?? '',
      eggWeight: e.weightOfEgg ?? e.eggWeight ?? '',
      numberOfEggs: e.numberOfEggs ?? '',
      hatchability: e.hatchabilityPercentage ?? e.hatchability ?? '',
      notes: e.comments ?? e.notes ?? '',
    };
  });

  const [selectedFemales, setSelectedFemales] = useState([]);
  const [selectedMales, setSelectedMales] = useState([]);
  const [femaleInput, setFemaleInput] = useState('');
  const [maleInput, setMaleInput] = useState('');

  const addFemale = () => {
    const val = femaleInput.trim();
    if (val && !selectedFemales.includes(val)) {
      setSelectedFemales([...selectedFemales, val]);
      setFemaleInput('');
    }
  };

  const removeFemale = (index) => {
    setSelectedFemales(selectedFemales.filter((_, i) => i !== index));
  };

  const addMale = () => {
    const val = maleInput.trim();
    if (val && !selectedMales.includes(val)) {
      setSelectedMales([...selectedMales, val]);
      setMaleInput('');
    }
  };

  const removeMale = (index) => {
    setSelectedMales(selectedMales.filter((_, i) => i !== index));
  };

  const handleFemaleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFemale();
    }
  };

  const handleMaleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMale();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'site') {
      const found = sites.find((s) => s.name === value);
      setForm((prev) => ({ ...prev, site: value, siteId: found?.id || '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name, date) => {
    setForm((prev) => ({ ...prev, [name]: date }));
  };

  const estimatedFryCount = Math.round(Number(form.numberOfEggs) * (Number(form.hatchability) / 100));
  const notesLength = form.notes.length;

  const buildPayload = (status) => {
    const resolvedSiteId = form.siteId || activeSite?.id || sites.find((s) => s.name === form.site)?.id || '';
    const p = {
      hatchbatchNo: form.hatchbatchNo,
      dateInjected: formatDate(form.dateInjected),
      dateStripped: formatDate(form.dateStripped),
      dateHatched: formatDate(form.dateHatched),
      noOfFemaleBroodstock: Number(form.numFemales),
      avgWeightOfFemale: Number(form.avgWeightFemale),
      maleBroodStock: Number(form.numMales),
      avgWeightOfMaleBroodstock: Number(form.avgWeightMale),
      weightOfEgg: Number(form.eggWeight),
      numberOfEggs: Number(form.numberOfEggs) || 0,
      hatchabilityPercentage: Number(form.hatchability),
      fryProduced: estimatedFryCount,
      comments: form.notes || '',
    };
    if (!isEditing) p.siteId = resolvedSiteId;
    if (status) p.status = status;
    return p;
  };

  const validateForm = () => {
    if (!form.siteId && !form.site) {
      toast.error('Please select a site.', { className: 'dark-toast' });
      return false;
    }
    if (!form.dateInjected) {
      toast.error('Please enter the date injected.', { className: 'dark-toast' });
      return false;
    }
    if (!form.dateStripped) {
      toast.error('Please enter the date stripped.', { className: 'dark-toast' });
      return false;
    }
    if (!form.dateHatched) {
      toast.error('Please enter the date hatched.', { className: 'dark-toast' });
      return false;
    }
    if (!form.numFemales || Number(form.numFemales) <= 0) {
      toast.error('Please enter a valid number of female broodstock.', { className: 'dark-toast' });
      return false;
    }
    if (!form.numMales || Number(form.numMales) <= 0) {
      toast.error('Please enter a valid number of male broodstock.', { className: 'dark-toast' });
      return false;
    }
    if (!form.eggWeight || Number(form.eggWeight) <= 0) {
      toast.error('Please enter a valid egg weight.', { className: 'dark-toast' });
      return false;
    }
    if (!form.numberOfEggs || Number(form.numberOfEggs) <= 0) {
      toast.error('Please enter a valid number of eggs.', { className: 'dark-toast' });
      return false;
    }
    if (!form.hatchability || Number(form.hatchability) <= 0) {
      toast.error('Please enter a valid hatchability percentage.', { className: 'dark-toast' });
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Saving draft...', { className: 'dark-toast' });
    try {
      const data = { ...serializeForm(form), selectedFemales, selectedMales };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      const payload = buildPayload(null);
      await ApiV2.post('/v2/hatch-batches', payload);
      toast.update(loadingToast, {
        render: 'Draft saved successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
      navigate('/hatchery/hatch-batches/view-all');
    } catch (err) {
      let message = 'An unexpected error occurred while saving the draft.';
      if (!err.response) {
        message = err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Network error. Please check your internet connection and try again.';
      } else {
        const status = err.response.status;
        const serverMsg = err.response.data?.message || err.response.data?.error || '';
        if (status >= 400 && status < 500) {
          message = serverMsg || (status === 400 ? 'Invalid input. Please check your form fields and try again.' : status === 401 ? 'Session expired. Please log in again.' : status === 403 ? 'Access denied.' : status === 409 ? 'A hatch batch with these details already exists.' : 'Validation error.');
        } else if (status >= 500) {
          message = serverMsg || 'Server error. Please try again later or contact support.';
        }
      }
      toast.update(loadingToast, { render: message, type: 'error', isLoading: false, autoClose: 5000, className: 'dark-toast' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (markCompleted) => {
    if (!validateForm()) return;
    setLoading(true);
    const label = markCompleted ? 'completing' : 'saving';
    const loadingToast = toast.loading(`${markCompleted ? 'Completing' : 'Saving'} hatch batch...`, { className: 'dark-toast' });

    try {
      if (isEditing) {
        const payload = buildPayload('completed');
        await ApiV2.put(`/v2/hatch-batches/${editData.id}`, payload);
        localStorage.removeItem(DRAFT_KEY);
        toast.update(loadingToast, {
          render: 'Hatch batch completed!',
          type: 'success', isLoading: false, autoClose: 3000, className: 'dark-toast',
        });
        navigate('/hatchery/hatch-batches/view-all');
      } else {
        const createPayload = buildPayload(null);
        const createRes = await ApiV2.post('/v2/hatch-batches', createPayload);
        const created = createRes.data?.data || createRes.data;
        const completePayload = buildPayload('completed');
        delete completePayload.siteId;
        await ApiV2.put(`/v2/hatch-batches/${created.id}`, completePayload);
        localStorage.removeItem(DRAFT_KEY);
        toast.update(loadingToast, {
          render: 'Hatch batch completed!',
          type: 'success', isLoading: false, autoClose: 3000, className: 'dark-toast',
        });
        setSuccessData(created);
        setShowSuccessModal(true);
      }
    } catch (err) {
      let message = 'An unexpected error occurred.';
      if (!err.response) {
        message = err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Network error. Please check your internet connection and try again.';
      } else {
        const status = err.response.status;
        const serverMsg = err.response.data?.message || err.response.data?.error || '';
        if (status >= 400 && status < 500) {
          message = serverMsg || (status === 400 ? 'Invalid input.' : status === 401 ? 'Session expired. Please log in again.' : status === 403 ? 'Access denied.' : status === 409 ? 'A hatch batch with these details already exists.' : 'Validation error.');
        } else if (status >= 500) {
          message = serverMsg || 'Server error. Please try again later or contact support.';
        }
      }
      toast.update(loadingToast, { render: message, type: 'error', isLoading: false, autoClose: 5000, className: 'dark-toast' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    if (!isEditing) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.selectedFemales)) setSelectedFemales(parsed.selectedFemales);
          if (Array.isArray(parsed.selectedMales)) setSelectedMales(parsed.selectedMales);
        }
      } catch {}
    }
  }, [isEditing]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setSites(data);
      } catch {
        setSites([]);
      } finally {
        setSitesLoaded(true);
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    if (sitesLoaded && editData?.siteId) {
      const found = sites.find(s => s.id === editData.siteId);
      if (found) {
        setForm(prev => prev.site ? prev : { ...prev, site: found.name });
      }
    }
  }, [sitesLoaded, editData, sites]);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.createPage}>
            <div className={styles.createContainer}>
              <div className={styles.breadcrumb}>
                <span>Hatchery</span>
                <span className={styles.separator}>&gt;</span>
                <span>Hatch Batches</span>
                <span className={styles.separator}>&gt;</span>
                <span className={styles.breadcrumbActive}>{isEditing ? 'Edit Hatch Batch' : 'Create Hatch Batch'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ fontSize: 20, fontWeight: 600, color: '#2E3135', margin: 0 }}>{isEditing ? 'Edit Hatch Batch' : 'Create Hatch Batch'}</h4>
                  <p className={styles.pageSubtitle}>Record a new hatch batch from spawning to hatching.</p>
                </div>
                <button className={styles.outlineBtn} onClick={() => navigate('/hatchery/hatch-batches/view-all')}>
                  <IoArrowBackOutline size={16} /> Back to Batches
                </button>
              </div>

              {/* Section 1 - Batch Information */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>1</span>
                  <h5>Batch Information</h5>
                </div>
                <Row className="g-3">
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Hatch Batch Number</Form.Label>
                    <Form.Control type="text" value={form.hatchbatchNo} disabled className="bg-light" style={{ height: 38 }} />
                  </Col>
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Site</Form.Label>
                    <Form.Select name="site" value={form.site} onChange={handleChange}>
                      <option value="">Select site</option>
                      {!sitesLoaded ? (
                        <option value="" disabled>Loading sites...</option>
                      ) : sites.length === 0 ? (
                        <option value="" disabled>No sites available</option>
                      ) : (
                        sites.map((site) => (
                          <option key={site.id} value={site.name}>{site.name}</option>
                        ))
                      )}
                    </Form.Select>
                  </Col>
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Date Injected</Form.Label>
                    <div className={styles.dateIconWrapper} style={{ height: 38 }}>
                      <DatePicker
                        selected={form.dateInjected}
                        onChange={(date) => handleDateChange('dateInjected', date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                        className="form-control"
                        wrapperClassName="w-100"
                      />
                      <IoCalendarOutline />
                    </div>
                  </Col>
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Date Stripped</Form.Label>
                    <div className={styles.dateIconWrapper} style={{ height: 38 }}>
                      <DatePicker
                        selected={form.dateStripped}
                        onChange={(date) => handleDateChange('dateStripped', date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                        className="form-control"
                        wrapperClassName="w-100"
                      />
                      <IoCalendarOutline />
                    </div>
                  </Col>
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Date Hatched</Form.Label>
                    <div className={styles.dateIconWrapper} style={{ height: 38 }}>
                      <DatePicker
                        selected={form.dateHatched}
                        onChange={(date) => handleDateChange('dateHatched', date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                        className="form-control"
                        wrapperClassName="w-100"
                      />
                      <IoCalendarOutline />
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Section 2 - Broodstock Information */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>2</span>
                  <h5>Broodstock Information</h5>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <h6 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2E3135', marginBottom: 12 }}>Female</h6>
                    <div style={{ marginBottom: 16 }}>
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Select Female(s)</Form.Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', minHeight: 38 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, flex: 1 }}>
                          {selectedFemales.map((item, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: '#E5E7EB', borderRadius: 6, fontSize: '0.8rem', color: '#1F2937' }}>
                              {item}
                              <IoClose size={13} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => removeFemale(i)} />
                            </span>
                          ))}
                          <input type="text" value={femaleInput} onChange={(e) => setFemaleInput(e.target.value)} onKeyDown={handleFemaleKeyDown} placeholder="Type..." style={{ border: 'none', outline: 'none', flex: 1, minWidth: 80, fontSize: '0.8rem', padding: '2px 0', background: 'transparent' }} />
                        </div>
                        <button type="button" onClick={addFemale} style={{ flexShrink: 0, fontSize: '0.8rem', padding: '4px 12px', background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          + Add More
                        </button>
                      </div>
                    </div>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Number of Females</Form.Label>
                        <Form.Control type="number" name="numFemales" value={form.numFemales} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Average Weight (kg)</Form.Label>
                        <Form.Control type="number" step="0.01" name="avgWeightFemale" value={form.avgWeightFemale} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                    </Row>
                  </Col>
                  <Col md={6}>
                    <h6 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2E3135', marginBottom: 12 }}>Male</h6>
                    <div style={{ marginBottom: 16 }}>
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Select Male(s)</Form.Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', minHeight: 38 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, flex: 1 }}>
                          {selectedMales.map((item, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: '#E5E7EB', borderRadius: 6, fontSize: '0.8rem', color: '#1F2937' }}>
                              {item}
                              <IoClose size={13} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => removeMale(i)} />
                            </span>
                          ))}
                          <input type="text" value={maleInput} onChange={(e) => setMaleInput(e.target.value)} onKeyDown={handleMaleKeyDown} placeholder="Type..." style={{ border: 'none', outline: 'none', flex: 1, minWidth: 80, fontSize: '0.8rem', padding: '2px 0', background: 'transparent' }} />
                        </div>
                        <button type="button" onClick={addMale} style={{ flexShrink: 0, fontSize: '0.8rem', padding: '4px 12px', background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          + Add More
                        </button>
                      </div>
                    </div>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Number of Males</Form.Label>
                        <Form.Control type="number" name="numMales" value={form.numMales} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Average Weight (kg)</Form.Label>
                        <Form.Control type="number" step="0.01" name="avgWeightMale" value={form.avgWeightMale} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>

              {/* Section 3 - Egg Information */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>3</span>
                  <h5>Egg Information</h5>
                </div>
                <Row className="g-3">
                  <Col md>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Weight of Eggs (kg)</Form.Label>
                    <Form.Control type="number" step="0.01" name="eggWeight" value={form.eggWeight} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </Col>
                  <Col md>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Hatchability Percentage (%)</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control type="number" step="0.1" name="hatchability" value={form.hatchability} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, padding: '1px 8px', color: '#8C949B', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none', lineHeight: '1.5' }}>%</span>
                    </div>
                  </Col>
                  <Col md>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Number of Eggs</Form.Label>
                    <Form.Control type="number" name="numberOfEggs" value={form.numberOfEggs} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </Col>
                </Row>
              </div>

              {/* Section 4 - Production Estimate + Section 5 - Remarks */}
              <Row className="g-3">
                <Col lg={6}>
                  <div className={styles.sectionCard} style={{ height: '100%' }}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>4</span>
                      <h5>Production Estimate</h5>
                    </div>
                    <div className={styles.infoBanner}>
                      <IoInformationCircleOutline size={20} color="#28a745" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>This is an auto-calculated estimate based on the number of eggs and hatchability percentage.</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', color: '#8C949B', fontWeight: 600, marginBottom: 4 }}>Estimated Fry Count</div>
                        <span className={styles.estimateValue}>{f(estimatedFryCount)}</span>
                        <span className={styles.estimateUnit} style={{ marginLeft: 8 }}>pcs</span>
                      </div>
                      <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: '#D1FAE5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <GiCirclingFish size={48} color="#22C55E" />
                      </div>
                    </div>
                  </div>
                </Col>
                <Col lg={6}>
                  <div className={styles.sectionCard} style={{ height: '100%' }}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>5</span>
                      <h5>Remarks</h5>
                    </div>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      maxLength={500}
                      placeholder="Enter any additional notes here…"
                      style={{ resize: 'none' }}
                    />
                    <div className={styles.charCounter}>{notesLength} / 500</div>
                  </div>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className={styles.createActions}>
                {!isEditing && (
                  <button className={styles.outlineBtn} onClick={handleSaveDraft} disabled={loading}>
                    <IoSaveOutline size={16} /> Save Draft
                  </button>
                )}
                <button className={styles.primaryBtn} onClick={() => handleSubmit(true)} disabled={loading}>
                  {loading ? '\u23F3' : <IoCheckmarkCircle size={18} />} {loading ? 'Completing...' : 'Complete Hatch Batch'}
                </button>
              </div>
              </div>
            </main>
          </section>

          {/* Success Modal */}
          <Modal show={showSuccessModal} onHide={() => { setShowSuccessModal(false); navigate('/hatchery/hatch-batches/view-all'); }} centered backdrop>
            <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
            </Modal.Header>
            <Modal.Body style={{ textAlign: 'center', paddingTop: 0 }}>
              <div style={{ fontSize: 60, color: '#22C55E', marginBottom: 12, lineHeight: 1 }}>
                <IoCheckmarkCircle />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: 4, color: '#1F2937' }}>Hatch Batch Created!</h4>
              <p style={{ color: '#6B7280', fontSize: '0.88rem', marginBottom: 20 }}>
                Your hatch batch has been created successfully.
              </p>
              {successData && (
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 8 }}>
                  {/* Row 1: Batch No + Site */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Batch No</span>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1F2937', margin: '2px 0 0' }}>{successData.hatchbatchNo || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Site</span>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1F2937', margin: '2px 0 0' }}>{sites.find(s => s.id === successData.siteId)?.name || form.site || 'N/A'}</p>
                    </div>
                  </div>
                  {/* Row 2: Injected + Hatched */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Injected</span>
                      <p style={{ fontSize: '0.88rem', color: '#374151', margin: '2px 0 0' }}>{successData.dateInjected || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Hatched</span>
                      <p style={{ fontSize: '0.88rem', color: '#374151', margin: '2px 0 0' }}>{successData.dateHatched || 'N/A'}</p>
                    </div>
                  </div>
                  {/* Row 3: Broodstock + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Broodstock</span>
                      <p style={{ fontSize: '0.88rem', color: '#374151', margin: '2px 0 0' }}>{successData.noOfFemaleBroodstock || '0'} ♀ + {successData.maleBroodStock || '0'} ♂</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
                      <p style={{ fontSize: '0.88rem', color: '#374151', margin: '2px 0 0', textTransform: 'capitalize' }}>{successData.status || 'N/A'}</p>
                    </div>
                  </div>
                  {/* Highlight: Fry Produced */}
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fry Produced</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#22C55E', margin: '4px 0 0' }}>
                      {successData.fryProduced != null ? f(successData.fryProduced) : f(estimatedFryCount)}
                      <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6B7280', marginLeft: 6 }}>pcs</span>
                    </p>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0, paddingBottom: 24 }}>
              <button className={styles.primaryBtn} onClick={() => { setShowSuccessModal(false); navigate('/hatchery/hatch-batches/view-all'); }} style={{ padding: '10px 36px', fontSize: '0.95rem', borderRadius: 8 }}>
                View All Batches
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      </section>
    );
  }

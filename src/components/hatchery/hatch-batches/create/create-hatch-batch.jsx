import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import { IoArrowBackOutline, IoInformationCircleOutline, IoCheckmarkCircle, IoCalendarOutline, IoSaveOutline, IoClose } from 'react-icons/io5';
import CustomDropdown from "../../../shared/custom-dropdown/CustomDropdown";
import { GiCirclingFish } from 'react-icons/gi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import { ApiV2 } from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';
import { f, generateBatchNo, parseDate, formatDate, serializeForm, deserializeForm } from './hatch-batch-utils';

const DRAFT_KEY = 'hatchery_hatchBatchDraft';

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
  const [weightInput, setWeightInput] = useState('');

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
        site: activeSite?.id || '',
        siteId: activeSite?.id || '',
        dateInjected: null,
        dateStripped: null,
        dateHatched: null,
        numFemales: '',
        femaleWeights: [],
        numMales: '',
        maleTotalWeight: '',
        eggWeight: '',
        hatchability: '',
        fryPerGramRate: '',
        notes: '',
      };
    }
    const e = editData;
    const rawEggKg = e.weightOfEgg ?? e.eggWeight;
    const eggKg = rawEggKg !== '' && rawEggKg != null ? Number(rawEggKg) / 1000 : '';
    const prefillWeights = (() => {
      const v = e.avgWeightOfFemale ?? e.avgWeightFemale;
      return v !== '' && v != null ? [String(v)] : [];
    })();
    return {
      hatchbatchNo: e.hatchbatchNo || e.batchNo || generateBatchNo(),
      site: e.siteId || activeSite?.id || '',
      siteId: e.siteId || activeSite?.id || '',
      dateInjected: parseDate(e._dateInjected || e.dateInjected),
      dateStripped: parseDate(e._dateStripped || e.dateStripped),
      dateHatched: parseDate(e._dateHatched || e.dateHatched),
      numFemales: e.noOfFemaleBroodstock ?? e.females ?? '',
      femaleWeights: prefillWeights,
      numMales: e.maleBroodStock ?? e.males ?? '',
      maleTotalWeight: e.avgWeightOfMaleBroodstock ?? e.avgWeightMale ?? '',
      eggWeight: eggKg,
      hatchability: e.hatchabilityPercentage ?? e.hatchability ?? '',
      fryPerGramRate: e.estimatedFryCount && rawEggKg ? Math.round(e.estimatedFryCount / rawEggKg) : '',
      notes: e.comments ?? e.notes ?? '',
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'site') {
      setForm((prev) => ({ ...prev, site: value, siteId: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name, date) => {
    setForm((prev) => ({ ...prev, [name]: date }));
  };

  const addFemaleWeight = () => {
    const v = weightInput.trim();
    if (!v) return;
    setForm((prev) => ({ ...prev, femaleWeights: [...prev.femaleWeights, v] }));
    setWeightInput('');
  };

  const removeFemaleWeight = (index) => {
    setForm((prev) => ({
      ...prev,
      femaleWeights: prev.femaleWeights.filter((_, i) => i !== index),
    }));
  };

  const handleWeightKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFemaleWeight();
    }
  };

  const eggWeightGrams = Math.round(Number(form.eggWeight) * 1000);
  const estimatedFryCount = Math.round(eggWeightGrams * Number(form.fryPerGramRate || 0));
  const femaleAvgWeight = form.femaleWeights.length
    ? form.femaleWeights.reduce((sum, w) => sum + (Number(w) || 0), 0) / form.femaleWeights.length
    : 0;
  const computedFryProduced = form.hatchability && estimatedFryCount > 0
    ? Math.round(estimatedFryCount * (Number(form.hatchability) / 100))
    : '';
  const notesLength = form.notes.length;

  const buildPayload = (status) => {
    const resolvedSiteId = form.siteId || activeSite?.id || form.site || '';
    const p = {
      hatchbatchNo: form.hatchbatchNo,
      dateInjected: formatDate(form.dateInjected),
      dateStripped: formatDate(form.dateStripped),
      dateHatched: formatDate(form.dateHatched),
      noOfFemaleBroodstock: Number(form.numFemales),
      avgWeightOfFemale: form.femaleWeights.join(', '),
      maleBroodStock: Number(form.numMales),
      avgWeightOfMaleBroodstock: Number(form.maleTotalWeight),
      weightOfEgg: eggWeightGrams || 0,
      hatchabilityPercentage: Number(form.hatchability) || 0,
      fryProduced: Number(computedFryProduced) || 0,
      estimatedFryCount: estimatedFryCount || 0,
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
    if (form.eggWeight === '' || Number(form.eggWeight) <= 0) {
      toast.error('Please enter a valid egg weight (kg).', { className: 'dark-toast' });
      return false;
    }
    if (form.hatchability === '' || Number(form.hatchability) <= 0) {
      toast.error('Please enter a valid hatchability percentage.', { className: 'dark-toast' });
      return false;
    }
    if (!isEditing && (!form.fryPerGramRate || Number(form.fryPerGramRate) <= 0)) {
      toast.error('Please enter a valid fry per gram rate.', { className: 'dark-toast' });
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Saving draft...', { className: 'dark-toast' });
    try {
      const data = { ...serializeForm(form) };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      if (isEditing) {
        const payload = buildPayload('active');
        await ApiV2.put(`/v2/hatch-batches/${editData.id}`, payload);
      } else {
        const payload = buildPayload(null);
        await ApiV2.post('/v2/hatch-batches', payload);
      }
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
        const serverMsg = err.response.data?.message || '';
        const serverErrors = err.response.data?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length) {
          message = serverErrors.join('. ');
        } else if (serverMsg) {
          message = serverMsg;
        } else if (err.response.status === 400) {
          message = 'Invalid input. Please check your form fields and try again.';
        } else if (err.response.status === 401) {
          message = 'Session expired. Please log in again.';
        } else if (err.response.status === 403) {
          message = 'Access denied.';
        } else if (err.response.status === 409) {
          message = 'A hatch batch with these details already exists.';
        } else if (err.response.status >= 500) {
          message = 'Server error. Please try again later or contact support.';
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
        const serverMsg = err.response.data?.message || '';
        const serverErrors = err.response.data?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length) {
          message = serverErrors.join('. ');
        } else if (serverMsg) {
          message = serverMsg;
        } else if (err.response.status === 400) {
          message = 'Invalid input. Please check your form fields and try again.';
        } else if (err.response.status === 401) {
          message = 'Session expired. Please log in again.';
        } else if (err.response.status === 403) {
          message = 'Access denied.';
        } else if (err.response.status === 409) {
          message = 'A hatch batch with these details already exists.';
        } else if (err.response.status >= 500) {
          message = 'Server error. Please try again later or contact support.';
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
      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover={false} theme="light" />
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
              <style>{`.site-dropdown-trigger { height: 38px !important; font-size: 14px !important; } .site-dropdown-wrapper { max-width: 100% !important; }`}</style>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>1</span>
                  <h5>Batch Information</h5>
                </div>
                <Row className="g-3">
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Hatch Batch Number</Form.Label>
                    <Form.Control type="text" value={form.hatchbatchNo} onChange={e => setForm(prev => ({ ...prev, hatchbatchNo: e.target.value }))} style={{ height: 38 }} />
                  </Col>
                  <Col md style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Site</Form.Label>
                    <CustomDropdown
                      className="site-dropdown-wrapper"
                      triggerClassName="site-dropdown-trigger"
                      options={sitesLoaded ? sites.map(s => ({ value: s.id, label: s.name })) : []}
                      value={form.site}
                      onChange={(val) => handleChange({ target: { name: 'site', value: val } })}
                      placeholder="Select site"
                      loading={!sitesLoaded}
                    />
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
              <Row className="g-3" style={{ marginBottom: 24 }}>
                  <Col md={6}>
                  <div className={styles.sectionCard} style={{ height: '100%' }}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>2</span>
                      <h5>Female Broodstock</h5>
                    </div>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135', lineHeight: 1.3 }}>Number of Females</Form.Label>
                        <Form.Control type="number" name="numFemales" value={form.numFemales} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135', lineHeight: 1.3 }}>
                          Average Weight (kg)
                        </Form.Label>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E9EDF2', borderRadius: 10, padding: 10 }}>
                          {form.femaleWeights.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                              {form.femaleWeights.map((w, i) => (
                                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F3ECEC', color: '#512728', border: '1px solid #E8DCDC', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
                                  {w} <span style={{ fontWeight: 400, color: '#9A8A8B' }}>kg</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFemaleWeight(i)}
                                    title="Remove weight"
                                    style={{ width: 16, height: 16, borderRadius: 4, border: 'none', background: 'rgba(81,39,40,0.14)', color: '#512728', fontSize: '0.72rem', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, transition: 'background 0.15s' }}
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(81,39,40,0.28)'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(81,39,40,0.14)'; }}
                                  >×</button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                onKeyDown={handleWeightKeyDown}
                                onWheel={(e) => e.target.blur()}
                                placeholder="e.g. 3.10"
                                style={{ height: 36, paddingRight: 34, fontSize: '0.875rem' }}
                              />
                              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#AAB0B7', fontSize: '0.72rem', fontWeight: 600, pointerEvents: 'none', lineHeight: 1 }}>kg</span>
                            </div>
                            <button
                              type="button"
                              onClick={addFemaleWeight}
                              title="Add weight"
                              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#512728', color: '#fff', fontSize: '1.1rem', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
                              onMouseOver={e => { e.currentTarget.style.background = '#6B3536'; }}
                              onMouseOut={e => { e.currentTarget.style.background = '#512728'; }}
                            >+</button>
                          </div>
                        </div>
                        {femaleAvgWeight > 0 && (
                          <small style={{ display: 'block', marginTop: 8, color: '#512728', fontSize: '0.75rem', fontWeight: 600, background: '#F3ECEC', border: '1px solid #E8DCDC', borderRadius: 6, padding: '4px 8px' }}>
                            Average: {femaleAvgWeight.toFixed(2)} kg
                          </small>
                        )}
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.sectionCard} style={{ height: '100%' }}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge} style={{ visibility: 'hidden' }}>2</span>
                      <h5>Male Broodstock</h5>
                    </div>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135', lineHeight: 1.3 }}>Number of Males</Form.Label>
                        <Form.Control type="number" name="numMales" value={form.numMales} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                      <Col xs={6}>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135', lineHeight: 1.3 }}>Total Weight (kg)</Form.Label>
                        <Form.Control type="number" step="0.01" name="maleTotalWeight" value={form.maleTotalWeight} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              {/* Section 3 - Egg Information */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>3</span>
                  <h5>Egg Information</h5>
                </div>
                <Row className="g-3">
                  <Col md>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Weight of Eggs (kg)</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control type="number" step="0.01" min="0" name="eggWeight" value={form.eggWeight} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, padding: '1px 8px', color: '#8C949B', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none', lineHeight: '1.5' }}>kg</span>
                    </div>
                    <small className="text-muted">{eggWeightGrams > 0 ? `= ${f(eggWeightGrams)} g` : 'Enter weight in kg'}</small>
                  </Col>
                  <Col md>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Hatchability Percentage (%)</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control type="number" step="0.1" min="0" max="100" name="hatchability" value={form.hatchability} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, padding: '1px 8px', color: '#8C949B', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none', lineHeight: '1.5' }}>%</span>
                    </div>
                  </Col>
                  <Col md>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Fingerlings Produced</Form.Label>
                    <Form.Control type="text" value={computedFryProduced ? f(computedFryProduced) : ''} readOnly placeholder="Auto-calculated" />
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
                      <span>Set the fry-per-gram conversion rate to estimate the total fry count from egg weight.</span>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Fry per Gram Rate</Form.Label>
                      <Form.Control type="number" step="1" name="fryPerGramRate" value={form.fryPerGramRate} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="e.g. 1000" />
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
                <button className={styles.outlineBtn} onClick={() => handleSubmit(true)} disabled={loading}>
                  {loading ? '\u23F3' : <IoCheckmarkCircle size={18} />} {loading ? 'Completing...' : 'Complete When Done'}
                </button>
                <button className={styles.primaryBtn} onClick={handleSaveDraft} disabled={loading}>
                  {loading ? '\u23F3' : <IoSaveOutline size={16} />} {loading ? 'Saving Draft...' : 'Save Draft'}
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
                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fingerlings Produced</span>
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

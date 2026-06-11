import React, { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoArrowBackOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { GiCirclingFish } from 'react-icons/gi';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

export default function CreateHatchBatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.batch;
  const isEditing = !!editData;

  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    site: editData?.site || '',
    dateInjected: editData?.dateInjected || '',
    dateStripped: editData?.dateStripped || '',
    dateHatched: editData?.dateHatched || '',
    numFemales: editData?.females ?? 3,
    avgWeightFemale: editData?.avgWeightFemale ?? 3.20,
    numMales: editData?.males ?? 6,
    avgWeightMale: editData?.avgWeightMale ?? 2.70,
    eggWeight: editData?.eggWeight ?? 1.20,
    hatchability: editData?.hatchability ?? 72.8,
    notes: editData?.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const estimatedFryCount = Math.round(Number(form.eggWeight) * 9500 * (Number(form.hatchability) / 100));
  const notesLength = form.notes.length;

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h4 style={{ fontSize: 20, fontWeight: 600, color: '#2E3135', margin: 0 }}>{isEditing ? 'Edit Hatch Batch' : 'Create Hatch Batch'}</h4>
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
                  <Col md={4}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Hatch Batch Number</Form.Label>
                    <Form.Control type="text" value={isEditing ? editData.batchNo : 'Auto-generated'} disabled className="bg-light" />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Site</Form.Label>
                    <Form.Select name="site" value={form.site} onChange={handleChange}>
                      <option value="">Select site</option>
                      <option value="Main Hatchery">Main Hatchery</option>
                      <option value="Secondary Hatchery">Secondary Hatchery</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Date Injected</Form.Label>
                    <Form.Control type="text" name="dateInjected" value={form.dateInjected} onChange={handleChange} placeholder="DD/MM/YYYY" />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Date Stripped</Form.Label>
                    <Form.Control type="text" name="dateStripped" value={form.dateStripped} onChange={handleChange} placeholder="DD/MM/YYYY" />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Date Hatched</Form.Label>
                    <Form.Control type="text" name="dateHatched" value={form.dateHatched} onChange={handleChange} placeholder="DD/MM/YYYY" />
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
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Number of Females</Form.Label>
                    <Form.Control type="number" name="numFemales" value={form.numFemales} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                    <div className="mt-2">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem', color: '#2E3135' }}>Average Weight (kg)</Form.Label>
                      <Form.Control type="number" step="0.01" name="avgWeightFemale" value={form.avgWeightFemale} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                    </div>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Number of Males</Form.Label>
                    <Form.Control type="number" name="numMales" value={form.numMales} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                    <div className="mt-2">
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.82rem', color: '#2E3135' }}>Average Weight (kg)</Form.Label>
                      <Form.Control type="number" step="0.01" name="avgWeightMale" value={form.avgWeightMale} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                    </div>
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
                  <Col md={4}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Weight of Eggs (kg)</Form.Label>
                    <Form.Control type="number" step="0.01" name="eggWeight" value={form.eggWeight} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Hatchability Percentage (%)</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control type="number" step="0.1" name="hatchability" value={form.hatchability} onChange={handleChange} onWheel={(e) => e.target.blur()} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#8C949B', fontSize: '0.85rem', pointerEvents: 'none' }}>%</span>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Section 4 - Production Estimate */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>4</span>
                  <h5>Production Estimate</h5>
                </div>
                <div className={styles.infoBanner}>
                  <IoInformationCircleOutline size={20} color="#28a745" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>This is an auto-calculated estimate based on the weight of eggs and hatchability percentage.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#8C949B', fontWeight: 600, marginBottom: 4 }}>Estimated Fry Count</div>
                    <span className={styles.estimateValue}>{f(estimatedFryCount)}</span>
                    <span className={styles.estimateUnit} style={{ marginLeft: 8 }}>pcs</span>
                  </div>
                  <GiCirclingFish size={64} color="#E5E7EB" />
                </div>
              </div>

              {/* Section 5 - Remarks */}
              <div className={styles.sectionCard}>
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

              {/* Action Buttons */}
              <div className={styles.createActions}>
                <button className={styles.outlineBtn} onClick={() => navigate('/hatchery/hatch-batches/view-all')}>Cancel</button>
                <button className={styles.primaryBtn} onClick={() => {
                  if (isEditing) {
                    toast.success(`Batch ${editData.batchNo} updated successfully!`);
                    navigate('/hatchery/hatch-batches/view-all');
                  } else {
                    toast.success('Hatch batch created successfully!');
                    navigate('/hatchery/hatch-batches/view-all');
                  }
                }}>
                  <span style={{ fontSize: '0.9rem' }}>&#10003;</span> {isEditing ? 'Update Batch' : 'Complete Hatch Batch'}
                </button>
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

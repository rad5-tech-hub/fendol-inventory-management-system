import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { toast } from 'react-toastify';
import feedStyles from '../feed.module.scss';

const FEED_TYPE_OPTIONS = [
  'Starter (0-1mm)', 'Grower (1-3mm)', 'Finisher (3-5mm)',
  'Broodstock Feed', 'Special / Others',
];

const formatWithCommas = (n) => {
  if (n === '' || n === null || n === undefined) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function AddFeedModal({ show, onClose, onSuccess }) {
  const [feedName, setFeedName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [feedType, setFeedType] = useState('');
  const [siteId, setSiteId] = useState('');
  const [threshold, setThreshold] = useState('');
  const [weightPerBag, setWeightPerBag] = useState('');
  const [pricePerBag, setPricePerBag] = useState('');
  const [siteTypes, setSiteTypes] = useState([]);
  const [feedTypes, setFeedTypes] = useState(FEED_TYPE_OPTIONS);
  const [showFeedTypeDropdown, setShowFeedTypeDropdown] = useState(false);
  const [feedTypeSearch, setFeedTypeSearch] = useState('');
  const [feedTypeMode, setFeedTypeMode] = useState('select');
  const [newFeedTypeName, setNewFeedTypeName] = useState('');
  const [creatingFeedType, setCreatingFeedType] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const feedTypeRef = useRef(null);

  useEffect(() => {
    if (show) {
      setFeedName('');
      setUnit('kg');
      setFeedType('');
      setSiteId('');
      setThreshold('');
      setWeightPerBag('');
      setPricePerBag('');
      setFeedTypeSearch('');
      setFeedTypeMode('select');
      setNewFeedTypeName('');
    }
  }, [show]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (feedTypeRef.current && !feedTypeRef.current.contains(e.target)) {
        setShowFeedTypeDropdown(false);
        setFeedTypeMode('select');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSiteTypes = async () => {
      try {
        const res = await ApiV2.get('/v2/site-types');
        if (res.data?.data) {
          setSiteTypes(res.data.data);
        }
      } catch {
        // silently fail
      }
    };
    fetchSiteTypes();
  }, []);

  const handleCreateFeedType = () => {
    const name = newFeedTypeName.trim();
    if (!name || creatingFeedType) return;
    if (feedTypes.includes(name)) {
      toast.error('This feed type already exists.', { className: 'dark-toast' });
      return;
    }
    setFeedTypes((prev) => [...prev, name]);
    setFeedType(name);
    setNewFeedTypeName('');
    setFeedTypeMode('select');
    setShowFeedTypeDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedName || !feedType || !siteId || !threshold || !weightPerBag || !pricePerBag) {
      toast.error('Please fill in all required fields.', { className: 'dark-toast' });
      return;
    }
    setSubmitting(true);
    const loadingToast = toast.loading('Adding feed...', { className: 'dark-toast' });
    try {
      await Api.post('/create-feed', {
        feedName,
        feedType,
        unit,
        threshold: Number(threshold),
        weightPerBag: Number(weightPerBag),
        siteId,
        pricePerBag: Number(pricePerBag.replace(/,/g, '')),
      });
      toast.update(loadingToast, {
        render: 'Feed added successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || 'Error adding feed. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedTypes = feedTypes.filter((t) =>
    t.toLowerCase().includes(feedTypeSearch.toLowerCase())
  );

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-semibold" style={{ fontSize: '20px', color: '#2E3135' }}>
          Add New Feed
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4">
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Feed Name</Form.Label>
              <Form.Control
                placeholder="Enter feed name"
                type="text"
                required
                value={feedName}
                onChange={(e) => setFeedName(e.target.value)}
                className={`py-2 bg-light-subtle shadow-none border-1 ${feedStyles.inputs}`}
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Unit</Form.Label>
              <Form.Select
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`py-2 bg-light-subtle shadow-none border-1 ${feedStyles.inputs}`}
              >
                <option value="" disabled>Select Unit</option>
                <option value="kg">Kg</option>
                <option value="g">Gram</option>
              </Form.Select>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Feed Type</Form.Label>
              <div ref={feedTypeRef} className="position-relative">
                <div
                  className={`py-2 px-3 bg-light-subtle d-flex justify-content-between align-items-center ${feedStyles.inputs}`}
                  style={{ borderRadius: '0.375rem', cursor: 'pointer', minHeight: '48px' }}
                  onClick={() => {
                    if (!showFeedTypeDropdown) {
                      setFeedTypeSearch('');
                      setFeedTypeMode('select');
                    }
                    setShowFeedTypeDropdown(!showFeedTypeDropdown);
                  }}
                >
                  <span style={{ opacity: feedType ? 1 : 0.5, color: feedType ? '#212529' : '#6c757d' }}>
                    {feedType || 'Select Feed Type'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    transition: 'transform 0.25s',
                    transform: showFeedTypeDropdown ? 'rotate(180deg)' : 'none',
                    userSelect: 'none',
                  }}>
                    ▾
                  </span>
                </div>
                {showFeedTypeDropdown && (
                  <div
                    className="position-absolute w-100 bg-white shadow-sm"
                    style={{
                      zIndex: 1050,
                      borderRadius: '10px',
                      marginTop: '6px',
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    }}
                  >
                    {feedTypeMode === 'select' ? (
                      <>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                          <Form.Control
                            type="text"
                            placeholder="Search feed type..."
                            value={feedTypeSearch}
                            onChange={(e) => setFeedTypeSearch(e.target.value)}
                            style={{
                              fontSize: '13px',
                              border: '1px solid #d0d6db',
                              boxShadow: 'none',
                              padding: '6px 10px',
                              borderRadius: '6px',
                            }}
                            autoFocus
                          />
                        </div>
                        <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                          {filteredFeedTypes.length > 0 ? (
                            filteredFeedTypes.map((t, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: feedType === t ? 600 : 400,
                                  color: feedType === t ? '#512728' : '#2E3135',
                                  backgroundColor: feedType === t ? '#fdf5f5' : 'transparent',
                                  borderBottom: i < filteredFeedTypes.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  transition: 'background-color 0.12s',
                                }}
                                onClick={() => {
                                  setFeedType(t);
                                  setShowFeedTypeDropdown(false);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = feedType === t ? '#fdf5f5' : '#FAFCFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = feedType === t ? '#fdf5f5' : 'transparent';
                                }}
                              >
                                {t}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: '14px' }}>
                              No feed types found
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#512728',
                            borderTop: '1px solid #e8e8e8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'background-color 0.12s',
                          }}
                          onClick={() => {
                            setNewFeedTypeName('');
                            setFeedTypeMode('create');
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFCFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#512728',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 400,
                            lineHeight: 1,
                          }}>+</span>
                          Create feed type
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2E3135', marginBottom: '10px' }}>
                          New Feed Type
                        </div>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            placeholder="Enter feed type name"
                            value={newFeedTypeName}
                            onChange={(e) => setNewFeedTypeName(e.target.value)}
                            style={{
                              fontSize: '14px',
                              border: '1px solid #d0d6db',
                              boxShadow: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateFeedType();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: '#512728',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                            onClick={handleCreateFeedType}
                            disabled={creatingFeedType || !newFeedTypeName.trim()}
                          >
                            {creatingFeedType ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            style={{
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              border: '1px solid #d0d6db',
                              color: '#6c757d',
                              whiteSpace: 'nowrap',
                            }}
                            onClick={() => {
                              setNewFeedTypeName('');
                              setFeedTypeMode('select');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Site Type</Form.Label>
              <Form.Select
                required
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className={`py-2 bg-light-subtle shadow-none border-1 ${feedStyles.inputs}`}
              >
                <option value="" disabled>Select Site Type</option>
                {siteTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Threshold Value</Form.Label>
              <Form.Control
                placeholder="Enter threshold value"
                type="number"
                required
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                className={`py-2 bg-light-subtle shadow-none border-1 ${feedStyles.inputs}`}
              />
            </Col>

            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Weight Per Bag (KG)</Form.Label>
              <Form.Control
                placeholder="Enter weight per bag"
                type="number"
                required
                min="1"
                value={weightPerBag}
                onChange={(e) => setWeightPerBag(e.target.value === '' ? '' : Number(e.target.value))}
                className={`py-2 bg-light-subtle shadow-none border-1 ${feedStyles.inputs}`}
              />
            </Col>

            <Col md={6} className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Price Per Bag (&#8358;)</Form.Label>
              <Form.Control
                placeholder="Enter price per bag"
                type="text"
                required
                value={formatWithCommas(pricePerBag)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                  setPricePerBag(raw);
                }}
                className={`py-2 bg-light-subtle shadow-none border-1 ${feedStyles.inputs}`}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button
            type="submit"
            disabled={submitting}
            className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${feedStyles.submit}`}
          >
            {submitting ? 'Adding...' : 'Add'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

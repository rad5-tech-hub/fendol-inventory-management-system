import React, { useState, useEffect } from 'react';
import { Modal, Form, Spinner } from 'react-bootstrap';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import styles from '../store.module.scss';
import { toast } from 'react-toastify';

export default function AddStockModal({ show, onClose, onSuccess, isSuperAdmin }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [threshold, setThreshold] = useState('');
  const [weightPerItem, setWeightPerItem] = useState('');
  const [siteId, setSiteId] = useState('');
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSuperAdmin && show) {
      setSitesLoading(true);
      ApiV2.get('/v2/all-site')
        .then((res) => {
          const data = Array.isArray(res.data?.data) ? res.data.data : [];
          setSites(data);
        })
        .catch(() => setSites([]))
        .finally(() => setSitesLoading(false));
    }
  }, [isSuperAdmin, show]);

  useEffect(() => {
    if (!show) {
      setName('');
      setUnit('');
      setThreshold('');
      setWeightPerItem('');
      setSiteId('');
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !unit || !threshold || !weightPerItem) {
      toast.error('Please fill in all required fields.', { className: 'dark-toast' });
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Adding stock...", { className: 'dark-toast' });

    try {
      const payload = {
        name: name.trim(),
        unit,
        threshold: Number(threshold),
        weightPerItem: Number(weightPerItem),
      };
      if (isSuperAdmin && siteId) payload.siteId = siteId;

      await Api.post('/create-store', payload);
      toast.update(loadingToast, {
        render: "Stock added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Error adding stock. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-semibold" style={{ fontSize: '20px', color: '#2E3135' }}>Add New Stock</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4">
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Name</Form.Label>
              <Form.Control
                placeholder="Enter stock name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                style={{ height: '48px' }}
              />
            </div>
            <div className="col-md-6 mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Unit</Form.Label>
              <CustomDropdown
                required
                value={unit}
                onChange={(value) => setUnit(value)}
                className={`bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                placeholder="Select Unit"
                options={[
                  { value: 'kg', label: 'Kg (Kilogram)' },
                  { value: 'g', label: 'G (Grams)' },
                  { value: 'bags', label: 'Bags' },
                  { value: 'pieces', label: 'Pieces' },
                  { value: 'packs', label: 'Packs' },
                  { value: 'sachets', label: 'Sachets' },
                ]}
              />
            </div>
            <div className="col-md-6 mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Threshold Value</Form.Label>
              <Form.Control
                placeholder="Enter threshold value"
                type="number"
                required
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                className={`bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                style={{ height: '48px' }}
              />
            </div>
            <div className="col-md-6 mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Weight per store item</Form.Label>
              <Form.Control
                placeholder="Enter weight per item"
                type="number"
                required
                min="0"
                value={weightPerItem}
                onChange={(e) => setWeightPerItem(e.target.value === '' ? '' : Number(e.target.value))}
                className={`bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                style={{ height: '48px' }}
              />
            </div>
            {isSuperAdmin && (
              <div className="col-md-6 mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: '14px' }}>Site</Form.Label>
                <CustomDropdown
                  required
                  value={siteId}
                  onChange={(value) => setSiteId(value)}
                  className={`bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  disabled={sitesLoading}
                  loading={sitesLoading}
                  placeholder="Select Site"
                  options={sites.map(site => ({ value: site.id, label: site.name }))}
                />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <button type="button" className="btn btn-secondary shadow-none fw-semibold" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn fw-semibold text-white border-0 shadow-none py-2 px-5 fs-6" style={{ backgroundColor: '#512728' }} disabled={submitting}>
            {submitting ? <><Spinner size="sm" animation="border" className="me-2" />Adding...</> : 'Add'}
          </button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

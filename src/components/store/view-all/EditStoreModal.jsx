import React, { useState, useEffect } from 'react';
import { Modal, Form, Spinner } from 'react-bootstrap';
import Api from '../../shared/api/apiLink';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import styles from '../store.module.scss';
import { toast } from 'react-toastify';

export default function EditStoreModal({ show, store, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState('');
  const [unit, setUnit] = useState('');
  const [weightPerItem, setWeightPerItem] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show && store) {
      setName(store?.name || '');
      setThreshold(store?.threshold !== undefined && store?.threshold !== null ? String(Number(store.threshold)) : '');
      setUnit(store?.unit || '');
      setWeightPerItem(store?.weightPerItem !== undefined && store?.weightPerItem !== null ? String(Number(store.weightPerItem)) : '');
    }
  }, [show, store]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !threshold || !unit || !weightPerItem) {
      toast.error('Please fill in all required fields.', { className: 'dark-toast' });
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Updating stock...', { className: 'dark-toast' });

    try {
      const payload = {
        threshold: Number(threshold),
        weightPerItem: Number(weightPerItem),
      };

      const res = await Api.patch(`/edit-store-threshold/${store.id}`, payload);

      toast.update(loadingToast, {
        render: res.data?.message || res.data?.response_message || `${store?.name} updated successfully`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });

      onClose();
      if (onSuccess) onSuccess(true, res.data?.message || res.data?.response_message, res.data?.data);
    } catch (error) {
      const msg = error.response?.data?.response_message || error.response?.data?.message || 'Failed to update store item. Please try again.';
      toast.update(loadingToast, {
        render: msg,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast',
      });
      if (onSuccess) onSuccess(false, msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-semibold" style={{ fontSize: '20px', color: '#2E3135' }}>Edit Store Item</Modal.Title>
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
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <button type="submit" className="btn fw-semibold text-white border-0 shadow-none py-2 px-5 fs-6" style={{ backgroundColor: '#512728' }} disabled={submitting}>
            {submitting ? <><Spinner size="sm" animation="border" className="me-2" />Updating...</> : 'Update'}
          </button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

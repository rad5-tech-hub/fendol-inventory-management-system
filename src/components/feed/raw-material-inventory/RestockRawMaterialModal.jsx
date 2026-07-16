import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { ApiV2 } from '../../shared/api/apiLink';
import styles from './AddRawMaterialModal.module.scss';

export default function RestockRawMaterialModal({ show, material, onClose, onSuccess }) {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setQuantity('');
      setError(null);
      setTouched(false);
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show]);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const validate = (val) => {
    if (val === '' || val === null || val === undefined) return 'Quantity is required';
    const num = Number(val);
    if (isNaN(num)) return 'Quantity must be a valid number';
    if (!Number.isFinite(num)) return 'Quantity must be a finite number';
    if (num <= 0) return 'Quantity must be greater than 0';
    if (num > 999999999) return 'Quantity exceeds maximum allowed';
    if (val.includes('.') && val.split('.')[1]?.length > 3) return 'Quantity can have at most 3 decimal places';
    return null;
  };

  const handleChange = (value) => {
    setQuantity(value);
    if (touched) setError(validate(value));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(quantity));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validate(quantity);
    setError(err);
    if (err) return;

    setSubmitting(true);

    try {
      const payload = { quantity: Number(quantity) };
      payload.siteId = isSuperAdmin ? (activeSite?.id || '') : (user?.siteId || user?.userSites?.[0]?.id || '');

      const res = await ApiV2.patch(`/v2/restock-raw-material/${material.id}`, payload);

      handleClose();
      const msg = res.data?.response_message || `${material.name} restocked successfully`;
      if (onSuccess) onSuccess(true, msg, res.data?.data);
    } catch (error) {
      let msg = 'Failed to restock raw material. Please try again.';

      if (error.response) {
        const { data } = error.response;
        msg = data?.response_message || data?.message || msg;
      } else {
        msg = 'Network error. Please check your internet connection and try again.';
      }

      if (onSuccess) onSuccess(false, msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={styles.overlay}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
      onClick={handleClose}
    >
      <div
        className={styles.modal}
        style={{
          opacity: visible ? 1 : 0,
          ...(visible ? {} : { transform: 'translateY(24px) scale(0.97)' }),
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <BsBoxSeam size={20} color="#512728" />
            </div>
            <div>
              <h2 className={styles.title}>Restock Raw Material</h2>
              <p className={styles.subtitle}>Add quantity to the existing stock of this material.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>
                Material Name
              </label>
              <div className={styles.displayField}>{material?.name || '--'}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Quantity (Kg)<span className={styles.required}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  className={`${styles.input} ${touched && error ? styles.inputError : ''}`}
                  placeholder="e.g. 78.34"
                  type="number"
                  min={0}
                  step="0.001"
                  value={quantity}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
              </div>
              {touched && error && (
                <span className={styles.errorText}>
                  <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                  {error}
                </span>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  Restocking...
                </>
              ) : (
                <>
                  <FiPackage size={15} />
                  Restock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

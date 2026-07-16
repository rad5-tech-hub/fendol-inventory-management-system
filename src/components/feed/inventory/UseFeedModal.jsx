import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { BsArrowDownCircle } from 'react-icons/bs';
import Api from '../../shared/api/apiLink';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import styles from './TopUpFeedModal.module.scss';

export default function UseFeedModal({ show, feed, onClose, onSuccess }) {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const [pondId, setPondId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pondOptions, setPondOptions] = useState([]);
  const [pondsLoading, setPondsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const qtyRef = useRef(null);

  useEffect(() => {
    if (show) {
      setPondId('');
      setQuantity('');
      setErrors({});
      setTouched({});
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
    if (visible && qtyRef.current) {
      qtyRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    const fetchPonds = async () => {
      setPondsLoading(true);
      try {
        const siteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '');
        const res = await Api.get(`/fish-stages?siteId=${siteId}`);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setPondOptions(list);
      } catch {
        if (!cancelled) setPondOptions([]);
      } finally {
        if (!cancelled) setPondsLoading(false);
      }
    };
    fetchPonds();
    return () => { cancelled = true; };
  }, [show, activeSite?.id]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const validate = (field, value) => {
    if (field === 'pondId') {
      if (!value) return 'Please select a pond';
      return null;
    }
    if (field === 'quantity') {
      if (value === '' || value === null || value === undefined) return 'Quantity is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (!Number.isFinite(num)) return 'Must be a finite number';
      if (num <= 0) return 'Must be greater than 0';
      if (num > 999999999) return 'Value exceeds maximum allowed';
      if (value.includes('.') && value.split('.')[1]?.length > 3) return 'At most 3 decimal places';
      return null;
    }
    return null;
  };

  const handleChange = (field, value) => {
    if (field === 'pondId') setPondId(value);
    if (field === 'quantity') setQuantity(value);
    if (touched[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        const err = validate(field, value);
        if (err) copy[field] = err;
        else delete copy[field];
        return copy;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'pondId' ? pondId : quantity;
    const err = validate(field, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[field] = err;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = { pondId: true, quantity: true };
    setTouched(allTouched);

    const pondErr = validate('pondId', pondId);
    const qtyErr = validate('quantity', quantity);
    const errs = {};
    if (pondErr) errs.pondId = pondErr;
    if (qtyErr) errs.quantity = qtyErr;
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    try {
      const payload = {
        pondId,
        quantity: Number(quantity),
      };

      const res = await Api.patch(`/use-feed/${feed.id}`, payload);

      handleClose();
      const msg = res.data?.message || res.data?.response_message || `${feed.feedName} used successfully`;
      if (onSuccess) onSuccess(true, msg, res.data?.data);
    } catch (error) {
      let msg = 'Failed to use feed. Please try again.';

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

  const pondErr = touched.pondId ? errors.pondId : null;
  const qtyErr = touched.quantity ? errors.quantity : null;

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
              <BsArrowDownCircle size={22} color="#512728" />
            </div>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>Use Feed</h2>
              <p className={styles.subtitle}>Record feed usage from inventory to a pond.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Feed Name</label>
              <div className={styles.displayField}>{feed?.feedName || '--'}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Pond / Stage<span className={styles.required}>*</span>
              </label>
              {pondsLoading ? (
                <div className={styles.displayField} style={{ color: '#9CA3AF', fontWeight: 400 }}>
                  Loading ponds...
                </div>
              ) : (
                <CustomDropdown
                  options={pondOptions.map((p) => ({ value: p.id, label: p.title || 'Unnamed' }))}
                  value={pondId}
                  onChange={(val) => { setPondId(val); handleBlur('pondId'); }}
                  placeholder={pondOptions.length === 0 ? '— No ponds available —' : '— Select Pond —'}
                  isInvalid={!!pondErr}
                  className={`${pondErr ? styles.inputError : ''}`}
                />
              )}
              {pondErr && (
                <span className={styles.errorText}>
                  <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                  {pondErr}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Quantity Used (Kg)<span className={styles.required}>*</span>
              </label>
              <input
                ref={qtyRef}
                className={`${styles.input} ${qtyErr ? styles.inputError : ''}`}
                placeholder="e.g. 10.03"
                type="number"
                min={0}
                step="0.001"
                value={quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                onBlur={() => handleBlur('quantity')}
                autoComplete="off"
              />
              {qtyErr && (
                <span className={styles.errorText}>
                  <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                  {qtyErr}
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
                  Using feed...
                </>
              ) : (
                <>
                  <BsArrowDownCircle size={15} />
                  Use Feed
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

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { BsArrowDownCircle } from 'react-icons/bs';
import Api, { ApiV2 } from '../../shared/api/apiLink';
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
  const [targetType, setTargetType] = useState('pond');
  const [hatchBatchId, setHatchBatchId] = useState('');
  const [hatchBatches, setHatchBatches] = useState([]);
  const [hatchLoading, setHatchLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const qtyRef = useRef(null);

  useEffect(() => {
    if (show) {
      setPondId('');
      setHatchBatchId('');
      setTargetType('pond');
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
    const fetchHatchBatches = async () => {
      setHatchLoading(true);
      try {
        const siteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '');
        const params = siteId ? { siteId } : {};
        const res = await ApiV2.get('/v2/hatch-batches', { params });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        const activeBatches = data.filter(b => !b.status || String(b.status).toLowerCase() === 'active');
        if (!cancelled) setHatchBatches(activeBatches.length ? activeBatches : data);
      } catch {
        if (!cancelled) setHatchBatches([]);
      } finally {
        if (!cancelled) setHatchLoading(false);
      }
    };
    fetchPonds();
    fetchHatchBatches();
    return () => { cancelled = true; };
  }, [show, activeSite?.id]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const validate = (field, value) => {
    if (field === 'pondId') {
      if (targetType === 'pond' && !value) return 'Please select a pond';
      return null;
    }
    if (field === 'hatchBatchId') {
      if (targetType === 'hatchery' && !value) return 'Please select a hatch batch';
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
    if (field === 'hatchBatchId') setHatchBatchId(value);
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
    let value;
    if (field === 'pondId') value = pondId;
    else if (field === 'hatchBatchId') value = hatchBatchId;
    else value = quantity;
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

    const allTouched = targetType === 'pond' ? { pondId: true, quantity: true } : { hatchBatchId: true, quantity: true };
    setTouched(allTouched);

    const pondErr = targetType === 'pond' ? validate('pondId', pondId) : null;
    const hatchErr = targetType === 'hatchery' ? validate('hatchBatchId', hatchBatchId) : null;
    const qtyErr = validate('quantity', quantity);
    const errs = {};
    if (pondErr) errs.pondId = pondErr;
    if (hatchErr) errs.hatchBatchId = hatchErr;
    if (qtyErr) errs.quantity = qtyErr;
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    try {
      const payload = targetType === 'hatchery'
        ? { hatchBatchId, quantity: Number(quantity) }
        : { pondId, quantity: Number(quantity) };

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
              <label className={styles.label}>Record for<span className={styles.required}>*</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setTargetType('pond')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: targetType === 'pond' ? '1px solid #512728' : '1px solid #E5E7EB', background: targetType === 'pond' ? '#FDF5F5' : '#fff', color: targetType === 'pond' ? '#512728' : '#374151', fontWeight: 600, fontSize: '13px' }}>Pond</button>
                <button type="button" onClick={() => setTargetType('hatchery')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: targetType === 'hatchery' ? '1px solid #512728' : '1px solid #E5E7EB', background: targetType === 'hatchery' ? '#FDF5F5' : '#fff', color: targetType === 'hatchery' ? '#512728' : '#374151', fontWeight: 600, fontSize: '13px' }}>Hatchery Batch</button>
              </div>
            </div>

            {targetType === 'pond' ? (
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
            ) : (
              <div className={styles.field}>
                <label className={styles.label}>
                  Hatch Batch (ongoing)<span className={styles.required}>*</span>
                </label>
                {hatchLoading ? (
                  <div className={styles.displayField} style={{ color: '#9CA3AF', fontWeight: 400 }}>Loading hatch batches...</div>
                ) : (
                  <CustomDropdown
                    options={hatchBatches.map((b) => ({ value: b.id, label: `${b.hatchbatchNo || b.batchNo || b.id} — ${b.status || 'active'}` }))}
                    value={hatchBatchId}
                    onChange={(val) => { setHatchBatchId(val); handleBlur('hatchBatchId'); }}
                    placeholder={hatchBatches.length === 0 ? '— No active hatch batches —' : '— Select Hatch Batch —'}
                    isInvalid={!!errors.hatchBatchId}
                    className={`${errors.hatchBatchId ? styles.inputError : ''}`}
                  />
                )}
                {errors.hatchBatchId && touched.hatchBatchId && (
                  <span className={styles.errorText}>
                    <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                    {errors.hatchBatchId}
                  </span>
                )}
              </div>
            )}

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

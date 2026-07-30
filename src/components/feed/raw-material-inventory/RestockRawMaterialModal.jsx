import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { ApiV2 } from '../../shared/api/apiLink';
import styles from './AddRawMaterialModal.module.scss';

const DEFAULT_FORM = {
  numberOfBags: '',
  weightPerBag: '',
  totalCostBought: '',
};

const FIELD_LABELS = {
  numberOfBags: 'Number of Bags',
  weightPerBag: 'Weight per Bag (Kg)',
  totalCostBought: 'Total Cost Bought (₦)',
};

const formatNumberWithCommas = (number) => {
  if (number === '' || number === null || number === undefined) return '';
  const raw = String(number).replace(/,/g, '');
  if (isNaN(raw) || raw === '') return number;
  const [whole, fraction] = raw.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${formattedWhole}.${fraction}` : formattedWhole;
};

const parseCommaNumber = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return String(value).replace(/,/g, '');
};

const extractApiError = (error, fallback = 'Failed to restock raw material. Please try again.') => {
  if (!error.response) return 'Network error. Please check your internet connection and try again.';
  const { data } = error.response;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join('. ');
  return data?.response_message || data?.message || data?.error?.message || fallback;
};

const validateField = (field, value) => {
  if (value === '' || value === null || value === undefined) return `${FIELD_LABELS[field]} is required`;
  const raw = parseCommaNumber(value);
  const num = Number(raw);
  if (isNaN(num)) return `${FIELD_LABELS[field]} must be a valid number`;
  if (!Number.isFinite(num)) return `${FIELD_LABELS[field]} must be a finite number`;
  if (num <= 0) return `${FIELD_LABELS[field]} must be greater than 0`;
  if (num > 999999999) return `${FIELD_LABELS[field]} exceeds maximum allowed`;

  if (field === 'numberOfBags') {
    if (!Number.isInteger(num)) return 'Number of bags must be a whole number';
  }

  if (field === 'weightPerBag') {
    if (raw.includes('.') && raw.split('.')[1]?.length > 3) return 'Weight per bag can have at most 3 decimal places';
  }

  if (field === 'totalCostBought') {
    if (raw.includes('.') && raw.split('.')[1]?.length > 2) return 'Cost can have at most 2 decimal places';
  }

  return null;
};

const validateAll = (form) => {
  const errors = {};
  Object.keys(DEFAULT_FORM).forEach((field) => {
    const err = validateField(field, form[field]);
    if (err) errors[field] = err;
  });
  return errors;
};

export default function RestockRawMaterialModal({ show, material, onClose, onSuccess }) {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');

  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setForm({ ...DEFAULT_FORM });
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
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const handleAmountChange = (value) => {
    const raw = parseCommaNumber(value);
    if (raw === '' || (!isNaN(raw) && raw !== '')) {
      handleChange('totalCostBought', formatNumberWithCommas(raw));
    }
  };

  const totals = useMemo(() => {
    const bags = Number(parseCommaNumber(form.numberOfBags)) || 0;
    const weight = Number(parseCommaNumber(form.weightPerBag)) || 0;
    const cost = Number(parseCommaNumber(form.totalCostBought)) || 0;
    const totalWeight = bags * weight;
    const unitCost = totalWeight > 0 ? cost / totalWeight : 0;
    return { totalWeight, unitCost };
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allErrors = validateAll(form);
    setErrors(allErrors);
    setTouched({ numberOfBags: true, weightPerBag: true, totalCostBought: true });
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);

    try {
      const payload = {
        numberOfBags: Number(parseCommaNumber(form.numberOfBags)),
        weightPerBag: Number(parseCommaNumber(form.weightPerBag)),
        totalCostBought: Number(parseCommaNumber(form.totalCostBought)),
      };
      const restockSid = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]);
      if (restockSid) payload.siteId = restockSid;

      const res = await ApiV2.patch(`/v2/restock-raw-material/${material.id}`, payload);

      handleClose();
      const msg = res.data?.response_message || `${material?.name || 'Raw material'} restocked successfully`;
      if (onSuccess) onSuccess(true, msg, res.data?.data);
    } catch (error) {
      const msg = extractApiError(error);
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
              <p className={styles.subtitle}>Add bags and record the total cost for this restock.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Material Name</label>
              <div className={styles.displayField}>{material?.name || '--'}</div>
            </div>

            <div className={`${styles.row} ${styles.field}`} style={{ marginTop: 18 }}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Number of Bags<span className={styles.required}>*</span>
                </label>
                <input
                  ref={inputRef}
                  className={`${styles.input} ${touched.numberOfBags && errors.numberOfBags ? styles.inputError : ''}`}
                  placeholder="e.g. 10"
                  type="number"
                  min={1}
                  step={1}
                  value={form.numberOfBags}
                  onChange={(e) => handleChange('numberOfBags', e.target.value)}
                  onBlur={() => handleBlur('numberOfBags')}
                  autoComplete="off"
                />
                {touched.numberOfBags && errors.numberOfBags && (
                  <span className={styles.errorText}>
                    <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                    {errors.numberOfBags}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Weight per Bag (Kg)<span className={styles.required}>*</span>
                </label>
                <input
                  className={`${styles.input} ${touched.weightPerBag && errors.weightPerBag ? styles.inputError : ''}`}
                  placeholder="e.g. 20"
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={form.weightPerBag}
                  onChange={(e) => handleChange('weightPerBag', e.target.value)}
                  onBlur={() => handleBlur('weightPerBag')}
                  autoComplete="off"
                />
                {touched.weightPerBag && errors.weightPerBag && (
                  <span className={styles.errorText}>
                    <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                    {errors.weightPerBag}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.field} style={{ marginTop: 18 }}>
              <label className={styles.label}>
                Total Cost Bought (₦)<span className={styles.required}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <FiDollarSign
                  size={16}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  className={`${styles.input} ${touched.totalCostBought && errors.totalCostBought ? styles.inputError : ''}`}
                  placeholder="e.g. 467,890.60"
                  type="text"
                  inputMode="decimal"
                  value={form.totalCostBought}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={() => handleBlur('totalCostBought')}
                  autoComplete="off"
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {touched.totalCostBought && errors.totalCostBought && (
                <span className={styles.errorText}>
                  <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                  {errors.totalCostBought}
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                <span>Total Weight</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>
                  {totals.totalWeight > 0 ? `${totals.totalWeight.toLocaleString('en-US', { maximumFractionDigits: 3 })} Kg` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                <span>Unit Cost</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>
                  {totals.totalWeight > 0 && totals.unitCost > 0
                    ? `₦${totals.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </div>
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

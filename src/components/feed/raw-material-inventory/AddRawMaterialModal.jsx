import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiDollarSign, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { HiOutlineTag } from 'react-icons/hi';
import { BsBoxSeam } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { ApiV2 } from '../../shared/api/apiLink';
import styles from './AddRawMaterialModal.module.scss';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
];

const defaultForm = {
  name: '',
  category: '',
  unit: '',
  quantity: '',
  unitCost: '',
  threshold: '',
};

const FIELD_LABELS = {
  name: 'Material Name',
  category: 'Category',
  unit: 'Unit of Measurement',
  quantity: 'Quantity',
  unitCost: 'Unit Cost',
  threshold: 'Low Stock Threshold',
};

function validateField(field, value, form) {
  if (field === 'name') {
    const trimmed = value.trim();
    if (!trimmed) return 'Material name is required';
    if (trimmed.length < 2) return 'Name must be at least 2 characters';
    if (trimmed.length > 100) return 'Name must be under 100 characters';
    if (!/^[a-zA-Z0-9\s\-'.&()]+$/.test(trimmed)) return 'Name contains invalid characters';
    return null;
  }

  if (field === 'category') {
    const trimmed = value.trim();
    if (!trimmed) return 'Category is required';
    if (trimmed.length < 2) return 'Category must be at least 2 characters';
    if (trimmed.length > 80) return 'Category must be under 80 characters';
    return null;
  }

  if (field === 'unit') {
    if (!value) return 'Please select a unit of measurement';
    return null;
  }

  if (field === 'quantity') {
    if (value === '' || value === null || value === undefined) return 'Quantity is required';
    const num = Number(value);
    if (isNaN(num)) return 'Quantity must be a valid number';
    if (!Number.isFinite(num)) return 'Quantity must be a finite number';
    if (num < 0) return 'Quantity cannot be negative';
    if (num === 0) return 'Quantity must be greater than 0';
    if (num > 999999999) return 'Quantity exceeds maximum allowed';
    if (value.includes('.') && value.split('.')[1]?.length > 3) return 'Quantity can have at most 3 decimal places';
    return null;
  }

  if (field === 'unitCost') {
    if (value === '' || value === null || value === undefined) return 'Unit cost is required';
    const num = Number(value);
    if (isNaN(num)) return 'Unit cost must be a valid number';
    if (!Number.isFinite(num)) return 'Unit cost must be a finite number';
    if (num < 0) return 'Unit cost cannot be negative';
    if (num === 0) return 'Unit cost must be greater than 0';
    if (num > 999999999) return 'Unit cost exceeds maximum allowed';
    if (value.includes('.') && value.split('.')[1]?.length > 2) return 'Unit cost can have at most 2 decimal places';
    return null;
  }

  if (field === 'threshold') {
    if (value === '' || value === null || value === undefined) return 'Low stock threshold is required';
    const num = Number(value);
    if (isNaN(num)) return 'Threshold must be a valid number';
    if (!Number.isInteger(num)) return 'Threshold must be a whole number';
    if (num < 1) return 'Threshold must be at least 1';
    if (num > 999999) return 'Threshold exceeds maximum allowed';
    return null;
  }

  return null;
}

function validateAll(form) {
  const errs = {};
  Object.keys(defaultForm).forEach((field) => {
    const err = validateField(field, form[field], form);
    if (err) errs[field] = err;
  });
  return errs;
}

export default function AddRawMaterialModal({ show, onClose, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setForm(defaultForm);
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

  const set = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);

    if (touched[field]) {
      const err = validateField(field, value, next);
      setErrors((prev) => {
        const copy = { ...prev };
        if (err) copy[field] = err;
        else delete copy[field];
        return copy;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field], form);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[field] = err;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {};
    Object.keys(defaultForm).forEach((f) => { allTouched[f] = true; });
    setTouched(allTouched);

    const errs = validateAll(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      toast.error(
        <div>
          <strong style={{ fontSize: 13 }}>Please fix the following:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12 }}>
            {Object.entries(errs).map(([k, v]) => (
              <li key={k}>{FIELD_LABELS[k]}: {v}</li>
            ))}
          </ul>
        </div>,
        { autoClose: 6000 }
      );
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Creating raw material...');

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
        threshold: Number(form.threshold),
      };

      const res = await ApiV2.post('/v2/raw-material', payload);

      toast.dismiss(loadingToast);
      toast.success(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiCheckCircle size={18} />
          <span>{res.data?.response_message || `${payload.name} created successfully`}</span>
        </div>,
        { autoClose: 4000 }
      );

      handleClose();
      if (onSuccess) onSuccess(res.data?.data);
    } catch (error) {
      toast.dismiss(loadingToast);

      if (!error.response) {
        toast.error(
          <div>
            <strong>Network Error</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>Please check your internet connection and try again.</div>
          </div>,
          { autoClose: 6000 }
        );
        setSubmitting(false);
        return;
      }

      const { status, data } = error.response;
      const serverMsg = data?.response_message || data?.message || '';

      if (status === 422 || status === 400) {
        const fieldErrs = data?.errors;
        if (fieldErrs && typeof fieldErrs === 'object') {
          const mapped = {};
          let toastList = [];
          Object.entries(fieldErrs).forEach(([key, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            mapped[key] = msg;
            toastList.push(`${FIELD_LABELS[key] || key}: ${msg}`);
          });
          setErrors(mapped);
          toast.error(
            <div>
              <strong>Validation Error</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12 }}>
                {toastList.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>,
            { autoClose: 7000 }
          );
          setSubmitting(false);
          return;
        }

        toast.error(serverMsg || 'Invalid data. Please review your inputs.', { autoClose: 5000 });
        setSubmitting(false);
        return;
      }

      if (status === 409) {
        toast.error(
          <div>
            <strong>Duplicate Entry</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>A raw material with this name already exists.</div>
          </div>,
          { autoClose: 5000 }
        );
        setSubmitting(false);
        return;
      }

      if (status === 413) {
        toast.error('The submitted data is too large. Please reduce input sizes.', { autoClose: 5000 });
        setSubmitting(false);
        return;
      }

      if (status === 429) {
        toast.error('Too many requests. Please wait a moment before trying again.', { autoClose: 5000 });
        setSubmitting(false);
        return;
      }

      if (status >= 500) {
        toast.error(
          <div>
            <strong>Server Error</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {serverMsg || 'Something went wrong on our end. Please try again later.'}
            </div>
          </div>,
          { autoClose: 6000 }
        );
        setSubmitting(false);
        return;
      }

      toast.error(
        <div>
          <strong>Error ({status})</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{serverMsg || 'An unexpected error occurred.'}</div>
        </div>,
        { autoClose: 5000 }
      );
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const renderField = (field, opts = {}) => {
    const { label, icon: Icon, placeholder, type = 'text', as: asType, options } = opts;
    const err = touched[field] ? errors[field] : null;

    return (
      <div className={styles.field}>
        <label className={styles.label}>
          {label || FIELD_LABELS[field]}<span className={styles.required}>*</span>
        </label>

        {asType === 'select' ? (
          <select
            className={`${styles.select} ${err ? styles.inputError : ''} ${form[field] ? styles.hasValue : ''}`}
            value={form[field]}
            onChange={(e) => set(field, e.target.value)}
            onBlur={() => handleBlur(field)}
          >
            <option value="" disabled>Select unit</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <div style={{ position: 'relative' }}>
            {Icon && (
              <Icon
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: err ? '#DC2626' : '#9CA3AF',
                  pointerEvents: 'none',
                  zIndex: 1,
                  transition: 'color 0.2s ease',
                }}
              />
            )}
            <input
              ref={field === 'name' ? inputRef : null}
              className={`${styles.input} ${err ? styles.inputError : ''} ${Icon ? styles.inputWithIcon : ''}`}
              style={Icon ? { paddingLeft: 38 } : undefined}
              placeholder={placeholder}
              type={type}
              min={type === 'number' ? 0 : undefined}
              step={field === 'unitCost' ? '0.01' : field === 'quantity' ? '0.001' : '1'}
              value={form[field]}
              onChange={(e) => set(field, type === 'number' ? e.target.value : e.target.value)}
              onBlur={() => handleBlur(field)}
              autoComplete="off"
            />
          </div>
        )}

        {err && (
          <span className={styles.errorText}>
            <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
            {err}
          </span>
        )}
      </div>
    );
  };

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
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
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
              <h2 className={styles.title}>Add Raw Material</h2>
              <p className={styles.subtitle}>Record a new raw material in your inventory.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <div className={styles.row}>
              {renderField('name', { label: 'Material Name', icon: FiPackage, placeholder: 'e.g. Cement' })}
              {renderField('category', { label: 'Category', icon: HiOutlineTag, placeholder: 'e.g. Construction' })}
            </div>

            <div className={styles.row}>
              {renderField('unit', {
                label: 'Unit of Measurement',
                as: 'select',
                options: UNIT_OPTIONS,
              })}
              {renderField('quantity', { label: 'Quantity', placeholder: 'e.g. 50', type: 'number' })}
            </div>

            <div className={styles.row}>
              {renderField('unitCost', { label: 'Unit Cost (₦)', icon: FiDollarSign, placeholder: 'e.g. 4500', type: 'number' })}
              {renderField('threshold', { label: 'Low Stock Threshold', placeholder: 'e.g. 10', type: 'number' })}
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
                  Creating...
                </>
              ) : (
                <>
                  <FiPackage size={15} />
                  Add Material
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

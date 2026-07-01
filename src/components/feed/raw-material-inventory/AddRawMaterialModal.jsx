import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import { HiOutlineTag } from 'react-icons/hi';
import { BsBoxSeam } from 'react-icons/bs';
import { ApiV2 } from '../../shared/api/apiLink';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
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
  numberOfBags: '',
  baseWeightPerBag: '',
};

const FIELD_LABELS = {
  name: 'Material Name',
  category: 'Category',
  unit: 'Unit of Measurement',
  quantity: 'Quantity (Kg)',
  unitCost: 'Unit Cost',
  threshold: 'Low Stock Threshold',
  numberOfBags: 'Number of Bags',
  baseWeightPerBag: 'Base Weight per Bag (Kg)',
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

  if (field === 'numberOfBags') {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (!Number.isInteger(num)) return 'Must be a whole number';
    if (num < 0) return 'Cannot be negative';
    if (num > 999999) return 'Value too large';
    return null;
  }

  if (field === 'baseWeightPerBag') {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num < 0) return 'Cannot be negative';
    if (num > 999999) return 'Value too large';
    if (value.includes('.') && value.split('.')[1]?.length > 2) return 'At most 2 decimal places';
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

export default function AddRawMaterialModal({ show, onClose, onSuccess, editData }) {
  const activeSite = useSelector((store) => store.activeSite);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  const isEditing = !!editData;

  useEffect(() => {
    if (show) {
      if (editData) {
        setForm({
          name: editData.name || '',
          category: editData.category || '',
          unit: editData.unit || '',
          quantity: editData.quantity !== undefined ? String(Number(editData.quantity)) : '',
          unitCost: editData.unitCost !== undefined ? String(Number(editData.unitCost)) : '',
          threshold: editData.threshold !== undefined ? String(Number(editData.threshold)) : '',
        });
      } else {
        setForm(defaultForm);
      }
      setErrors({});
      setTouched({});
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [show, editData]);

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

    if ((field === 'numberOfBags' || field === 'baseWeightPerBag') && next.numberOfBags !== '' && next.baseWeightPerBag !== '') {
      const bags = Number(next.numberOfBags);
      const weight = Number(next.baseWeightPerBag);
      if (!isNaN(bags) && !isNaN(weight) && bags >= 0 && weight >= 0) {
        next.quantity = String(bags * weight);
      }
    }

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
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
        threshold: Number(form.threshold),
      };
      if (activeSite?.id) payload.siteId = activeSite.id;

      const res = isEditing
        ? await ApiV2.patch(`/v2/raw-material/${editData.id}`, payload)
        : await ApiV2.post('/v2/raw-material', payload);

      handleClose();
      const msg = res.data?.response_message || (isEditing ? `${payload.name} updated successfully` : `${payload.name} created successfully`);
      if (onSuccess) onSuccess(true, msg, res.data?.data);
    } catch (error) {
      let msg = isEditing ? 'Failed to update raw material. Please try again.' : 'Failed to create raw material. Please try again.';
      let fieldErrors = null;

      if (error.response) {
        const { status, data } = error.response;
        msg = data?.response_message || data?.message || msg;

        if ((status === 422 || status === 400) && data?.errors) {
          fieldErrors = {};
          Object.entries(data.errors).forEach(([key, msgs]) => {
            fieldErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          setErrors(fieldErrors);
        }
      } else {
        msg = 'Network error. Please check your internet connection and try again.';
      }

      if (onSuccess) onSuccess(false, msg, fieldErrors);
    } finally {
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
          <CustomDropdown
            options={options}
            value={form[field]}
            onChange={(val) => { set(field, val); handleBlur(field); }}
            placeholder="Select unit"
            isInvalid={!!err}
            className={`${err ? styles.inputError : ''}`}
          />
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
              step={field === 'unitCost' ? '0.01' : field === 'quantity' ? '0.001' : field === 'numberOfBags' ? '1' : field === 'baseWeightPerBag' ? '0.01' : '1'}
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
              <h2 className={styles.title}>{isEditing ? 'Edit Raw Material' : 'Add Raw Material'}</h2>
              <p className={styles.subtitle}>{isEditing ? 'Update the details of this raw material.' : 'Record a new raw material in your inventory.'}</p>
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
              {renderField('numberOfBags', { label: 'Number of Bags', placeholder: 'e.g. 50', type: 'number' })}
            </div>

            <div className={styles.row}>
              {renderField('baseWeightPerBag', { label: 'Base Weight per Bag (Kg)', placeholder: 'e.g. 25', type: 'number' })}
              {renderField('quantity', { label: 'Quantity (Kg)', placeholder: 'Calculated or manual', type: 'number' })}
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
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FiPackage size={15} />
                  {isEditing ? 'Update Material' : 'Add Material'}
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

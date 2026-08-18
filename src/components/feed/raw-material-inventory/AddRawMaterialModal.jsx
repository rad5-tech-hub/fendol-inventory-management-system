import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  { value: 'bags', label: 'Bags' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'packs', label: 'Packs' },
  { value: 'sachets', label: 'Sachets' },
];

const defaultForm = {
  name: '',
  category: '',
  unit: '',
  threshold: '',
  numberOfBags: '',
  baseWeightPerBag: '',
  totalCostBought: '',
};

const FIELD_LABELS = {
  name: 'Material Name',
  category: 'Category',
  unit: 'Unit of Measurement',
  threshold: 'Low Stock Threshold',
  numberOfBags: 'Number of Bags',
  baseWeightPerBag: 'Base Weight per Bag (Kg)',
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
    if (num <= 0) return 'Must be greater than 0';
    if (num > 999999) return 'Value too large';
    return null;
  }

  if (field === 'baseWeightPerBag') {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num <= 0) return 'Must be greater than 0';
    if (num > 999999) return 'Value too large';
    if (value.includes('.') && value.split('.')[1]?.length > 3) return 'At most 3 decimal places';
    return null;
  }

  if (field === 'totalCostBought') {
    if (value === '' || value === null || value === undefined) return null;
    const raw = parseCommaNumber(value);
    const num = Number(raw);
    if (isNaN(num)) return 'Must be a valid amount';
    if (num <= 0) return 'Must be greater than 0';
    if (num > 999999999) return 'Amount exceeds maximum allowed';
    if (raw.includes('.') && raw.split('.')[1]?.length > 2) return 'At most 2 decimal places';
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
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
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
        let totalCostBought = '';
        if (editData.totalCostBought !== undefined && editData.totalCostBought !== null) {
          totalCostBought = formatNumberWithCommas(String(editData.totalCostBought));
        } else if (editData.unitCost !== undefined && editData.quantity !== undefined) {
          const derived = Number(editData.unitCost) * Number(editData.quantity);
          if (!isNaN(derived) && isFinite(derived) && derived > 0) {
            totalCostBought = formatNumberWithCommas(String(derived));
          }
        }

        setForm({
          name: editData.name || '',
          category: editData.category || '',
          unit: editData.unit || '',
          threshold: editData.threshold !== undefined ? String(Number(editData.threshold)) : '',
          numberOfBags: editData.numberOfBags !== undefined ? String(Number(editData.numberOfBags)) : '',
          baseWeightPerBag: editData.weightPerBag !== undefined ? String(Number(editData.weightPerBag)) : '',
          totalCostBought,
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

  const handleAmountChange = (value) => {
    const raw = parseCommaNumber(value);
    if (raw === '' || (!isNaN(raw) && raw !== '')) {
      set('totalCostBought', formatNumberWithCommas(raw));
    }
  };

  const totals = useMemo(() => {
    const bags = Number(form.numberOfBags) || 0;
    const weight = Number(form.baseWeightPerBag) || 0;
    const cost = Number(parseCommaNumber(form.totalCostBought)) || 0;
    const totalWeight = bags * weight;
    const unitCost = totalWeight > 0 ? cost / totalWeight : 0;
    return { totalWeight, unitCost };
  }, [form]);

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
        threshold: Number(form.threshold),
      };
      if (form.numberOfBags !== '' && form.numberOfBags !== null && form.numberOfBags !== undefined) {
        payload.numberOfBags = Number(form.numberOfBags);
      }
      if (form.baseWeightPerBag !== '' && form.baseWeightPerBag !== null && form.baseWeightPerBag !== undefined) {
        payload.weightPerBag = Number(form.baseWeightPerBag);
      }
      const rawCost = parseCommaNumber(form.totalCostBought);
      if (rawCost !== '' && rawCost !== null && rawCost !== undefined) {
        payload.totalCostBought = Number(rawCost);
      }
      const addSid = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]);
      if (addSid) payload.siteId = addSid;

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
          {label || FIELD_LABELS[field]}{['numberOfBags', 'baseWeightPerBag', 'totalCostBought'].includes(field) ? null : <span className={styles.required}>*</span>}
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
              step={field === 'numberOfBags' ? '1' : field === 'baseWeightPerBag' ? '0.001' : '1'}
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

  const costErr = touched.totalCostBought ? errors.totalCostBought : null;

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
              <div className={styles.field}>
                <label className={styles.label}>Total Cost Bought (₦)</label>
                <div style={{ position: 'relative' }}>
                  <FiDollarSign
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: costErr ? '#DC2626' : '#9CA3AF',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                  <input
                    className={`${styles.input} ${costErr ? styles.inputError : ''}`}
                    placeholder="e.g. 5000"
                    type="text"
                    inputMode="decimal"
                    value={form.totalCostBought}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={() => handleBlur('totalCostBought')}
                    autoComplete="off"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
                {costErr && (
                  <span className={styles.errorText}>
                    <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                    {costErr}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              {renderField('threshold', { label: 'Low Stock Threshold', placeholder: 'e.g. 10', type: 'number' })}
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

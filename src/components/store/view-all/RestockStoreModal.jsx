import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { BsArrowUpCircle } from 'react-icons/bs';
import Api from '../../shared/api/apiLink';
import styles from './StoreModals.module.scss';

const formatCommas = (v) => {
  const parts = v.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const stripCommas = (v) => v.replace(/,/g, '');

export default function RestockStoreModal({ show, store, onClose, onSuccess }) {
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const priceRef = useRef(null);

  useEffect(() => {
    if (show) {
      setPrice('');
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
    if (visible && priceRef.current) {
      priceRef.current.focus();
    }
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const validate = (field, value) => {
    const raw = stripCommas(String(value));
    if (field === 'price') {
      if (raw === '' || raw === null || raw === undefined) return 'Price is required';
      const num = Number(raw);
      if (isNaN(num)) return 'Must be a valid number';
      if (!Number.isFinite(num)) return 'Must be a finite number';
      if (num <= 0) return 'Must be greater than 0';
      if (num > 999999999) return 'Value exceeds maximum allowed';
      if (raw.includes('.') && raw.split('.')[1]?.length > 2) return 'At most 2 decimal places';
      return null;
    }
    if (field === 'quantity') {
      if (raw === '' || raw === null || raw === undefined) return 'Number of items is required';
      const num = Number(raw);
      if (isNaN(num)) return 'Must be a valid number';
      if (!Number.isInteger(num) && raw.includes('.')) return 'Must be a whole number';
      if (num <= 0) return 'Must be at least 1';
      if (num > 999999) return 'Value too large';
      return null;
    }
    return null;
  };

  const handleChange = (field, raw) => {
    const stripped = stripCommas(raw);
    if (stripped !== '' && isNaN(Number(stripped))) return;
    const formatted = stripped === '' ? '' : formatCommas(stripped);
    if (field === 'price') setPrice(formatted);
    if (field === 'quantity') setQuantity(formatted);
    if (touched[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        const err = validate(field, formatted);
        if (err) copy[field] = err;
        else delete copy[field];
        return copy;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'price' ? price : quantity;
    const err = validate(field, stripCommas(value));
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[field] = err;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = { price: true, quantity: true };
    setTouched(allTouched);

    const priceErr = validate('price', price);
    const qtyErr = validate('quantity', quantity);
    const errs = {};
    if (priceErr) errs.price = priceErr;
    if (qtyErr) errs.quantity = qtyErr;
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    try {
      const rawPrice = stripCommas(price);
      const rawQty = stripCommas(quantity);
      const payload = {
        price: Number(rawPrice),
        quantity: Number(rawQty),
      };

      const resolvedSiteId = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]?.id);
      if (resolvedSiteId) payload.siteId = resolvedSiteId;

      const res = await Api.post(`/store/${store.id}`, payload);

      handleClose();
      const msg = res.data?.message || res.data?.response_message || `${store.name} restocked successfully`;
      if (onSuccess) onSuccess(true, msg, res.data?.data);
    } catch (error) {
      let msg = 'Failed to restock store item. Please try again.';

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

  const priceErr = touched.price ? errors.price : null;
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
              <BsArrowUpCircle size={22} color="#512728" />
            </div>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>Restock Store</h2>
              <p className={styles.subtitle}>Record a new stock-in of items into inventory.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Item Name</label>
              <div className={styles.displayField}>{store?.name || '--'}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Price ({`\u20A6`})<span className={styles.required}>*</span>
              </label>
              <input
                ref={priceRef}
                className={`${styles.input} ${priceErr ? styles.inputError : ''}`}
                placeholder="e.g. 45,600"
                type="text"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => handleChange('price', e.target.value)}
                onBlur={() => handleBlur('price')}
                autoComplete="off"
              />
              {priceErr && (
                <span className={styles.errorText}>
                  <FiAlertTriangle size={11} style={{ marginRight: 4, flexShrink: 0 }} />
                  {priceErr}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Number of Items ({store?.unit || 'units'})<span className={styles.required}>*</span>
              </label>
              <input
                className={`${styles.input} ${qtyErr ? styles.inputError : ''}`}
                placeholder="e.g. 10"
                type="text"
                min={0}
                step="1"
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
                  Restocking...
                </>
              ) : (
                <>
                  <BsArrowUpCircle size={15} />
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

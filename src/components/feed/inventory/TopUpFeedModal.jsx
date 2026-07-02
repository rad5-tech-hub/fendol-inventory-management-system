import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { BsArrowUpCircle } from 'react-icons/bs';
import Api from '../../shared/api/apiLink';
import styles from './TopUpFeedModal.module.scss';

export default function TopUpFeedModal({ show, feed, onClose, onSuccess }) {
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const [feedPrice, setFeedPrice] = useState('');
  const [noOfBag, setNoOfBag] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const priceRef = useRef(null);

  useEffect(() => {
    if (show) {
      setFeedPrice('');
      setNoOfBag('');
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
    if (field === 'feedPrice') {
      if (value === '' || value === null || value === undefined) return 'Feed price is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (!Number.isFinite(num)) return 'Must be a finite number';
      if (num <= 0) return 'Must be greater than 0';
      if (num > 999999999) return 'Value exceeds maximum allowed';
      if (value.includes('.') && value.split('.')[1]?.length > 2) return 'At most 2 decimal places';
      return null;
    }
    if (field === 'noOfBag') {
      if (value === '' || value === null || value === undefined) return 'Number of bags is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (!Number.isInteger(num) && value.includes('.')) return 'Must be a whole number';
      if (num <= 0) return 'Must be at least 1';
      if (num > 999999) return 'Value too large';
      return null;
    }
    return null;
  };

  const handleChange = (field, value) => {
    if (field === 'feedPrice') setFeedPrice(value);
    if (field === 'noOfBag') setNoOfBag(value);
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
    const err = validate(field, field === 'feedPrice' ? feedPrice : noOfBag);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[field] = err;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = { feedPrice: true, noOfBag: true };
    setTouched(allTouched);

    const priceErr = validate('feedPrice', feedPrice);
    const bagErr = validate('noOfBag', noOfBag);
    const errs = {};
    if (priceErr) errs.feedPrice = priceErr;
    if (bagErr) errs.noOfBag = bagErr;
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    try {
      const payload = {
        feedPrice: String(Number(feedPrice)),
        noOfBag: String(Number(noOfBag)),
      };

      const needsSiteId = isSuperAdmin || (user?.siteId && activeSite?.id && user.siteId !== activeSite.id);
      if (needsSiteId && activeSite?.id) {
        payload.siteId = activeSite.id;
      }

      const res = await Api.patch(`/top-feed/${feed.id}`, payload);

      handleClose();
      const msg = res.data?.message || res.data?.response_message || `${feed.feedName} topped up successfully`;
      if (onSuccess) onSuccess(true, msg, res.data?.data);
    } catch (error) {
      let msg = 'Failed to top up feed. Please try again.';

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

  const renderField = (field, opts) => {
    const { label, placeholder, type, step, refField } = opts;
    const value = field === 'feedPrice' ? feedPrice : noOfBag;
    const err = touched[field] ? errors[field] : null;

    return (
      <div className={styles.field}>
        <label className={styles.label}>
          {label}<span className={styles.required}>*</span>
        </label>
        <input
          ref={refField ? priceRef : null}
          className={`${styles.input} ${err ? styles.inputError : ''}`}
          placeholder={placeholder}
          type={type}
          min={0}
          step={step}
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          autoComplete="off"
        />
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
              <BsArrowUpCircle size={22} color="#512728" />
            </div>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>Top Up Feed</h2>
              <p className={styles.subtitle}>Record a new stock-in of feed into inventory.</p>
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

            {renderField('feedPrice', {
              label: 'Feed Price (₦)',
              placeholder: 'e.g. 45600',
              type: 'number',
              step: '0.01',
              refField: true,
            })}

            {renderField('noOfBag', {
              label: 'Number of Bags',
              placeholder: 'e.g. 2',
              type: 'number',
              step: '1',
            })}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  Topping up...
                </>
              ) : (
                <>
                  <BsArrowUpCircle size={15} />
                  Top Up Feed
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

import React, { useState, useRef, useEffect } from 'react';
import styles from './PhoneInput.module.scss';

const COUNTRIES = [
  { code: '+234', label: 'NG', flag: '\uD83C\uDDF3\uD83C\uDDEC', name: 'Nigeria' },
  { code: '+1', label: 'US', flag: '\uD83C\uDDFA\uD83C\uDDF8', name: 'United States' },
  { code: '+44', label: 'GB', flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'United Kingdom' },
  { code: '+233', label: 'GH', flag: '\uD83C\uDDEC\uD83C\uDDED', name: 'Ghana' },
  { code: '+27', label: 'ZA', flag: '\uD83C\uDDFF\uD83C\uDDE6', name: 'South Africa' },
  { code: '+254', label: 'KE', flag: '\uD83C\uDDF0\uD83C\uDDEA', name: 'Kenya' },
  { code: '+256', label: 'UG', flag: '\uD83C\uDDFA\uD83C\uDDEC', name: 'Uganda' },
  { code: '+255', label: 'TZ', flag: '\uD83C\uDDF9\uD83C\uDDFF', name: 'Tanzania' },
  { code: '+91', label: 'IN', flag: '\uD83C\uDDEE\uD83C\uDDF3', name: 'India' },
  { code: '+86', label: 'CN', flag: '\uD83C\uDDE8\uD83C\uDDF3', name: 'China' },
  { code: '+81', label: 'JP', flag: '\uD83C\uDDEF\uD83C\uDDF5', name: 'Japan' },
  { code: '+49', label: 'DE', flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'Germany' },
  { code: '+33', label: 'FR', flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'France' },
  { code: '+39', label: 'IT', flag: '\uD83C\uDDEE\uD83C\uDDF9', name: 'Italy' },
  { code: '+34', label: 'ES', flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Spain' },
  { code: '+55', label: 'BR', flag: '\uD83C\uDDE7\uD83C\uDDF7', name: 'Brazil' },
  { code: '+61', label: 'AU', flag: '\uD83C\uDDE6\uD83C\uDDFA', name: 'Australia' },
  { code: '+7', label: 'RU', flag: '\uD83C\uDDF7\uD83C\uDDFA', name: 'Russia' },
  { code: '+82', label: 'KR', flag: '\uD83C\uDDF0\uD83C\uDDF7', name: 'South Korea' },
  { code: '+971', label: 'AE', flag: '\uD83C\uDDE6\uD83C\uDDEA', name: 'UAE' },
  { code: '+966', label: 'SA', flag: '\uD83C\uDDF8\uD83C\uDDE6', name: 'Saudi Arabia' },
  { code: '+212', label: 'MA', flag: '\uD83C\uDDF2\uD83C\uDDE6', name: 'Morocco' },
  { code: '+20', label: 'EG', flag: '\uD83C\uDDEA\uD83C\uDDEC', name: 'Egypt' },
  { code: '+351', label: 'PT', flag: '\uD83C\uDDF5\uD83C\uDDF9', name: 'Portugal' },
  { code: '+31', label: 'NL', flag: '\uD83C\uDDF3\uD83C\uDDF1', name: 'Netherlands' },
  { code: '+46', label: 'SE', flag: '\uD83C\uDDF8\uD83C\uDDEA', name: 'Sweden' },
  { code: '+47', label: 'NO', flag: '\uD83C\uDDF3\uD83C\uDDF4', name: 'Norway' },
  { code: '+45', label: 'DK', flag: '\uD83C\uDDE9\uD83C\uDDF0', name: 'Denmark' },
  { code: '+358', label: 'FI', flag: '\uD83C\uDDEB\uD83C\uDDEE', name: 'Finland' },
  { code: '+353', label: 'IE', flag: '\uD83C\uDDEE\uD83C\uDDEA', name: 'Ireland' },
  { code: '+65', label: 'SG', flag: '\uD83C\uDDF8\uD83C\uDDEC', name: 'Singapore' },
  { code: '+60', label: 'MY', flag: '\uD83C\uDDF2\uD83C\uDDFE', name: 'Malaysia' },
  { code: '+63', label: 'PH', flag: '\uD83C\uDDF5\uD83C\uDDED', name: 'Philippines' },
  { code: '+62', label: 'ID', flag: '\uD83C\uDDEE\uD83C\uDDE9', name: 'Indonesia' },
  { code: '+64', label: 'NZ', flag: '\uD83C\uDDF3\uD83C\uDDFF', name: 'New Zealand' },
  { code: '+41', label: 'CH', flag: '\uD83C\uDDE8\uD83C\uDDED', name: 'Switzerland' },
];

function parsePhone(value) {
  if (!value) return { code: '+234', number: '' };
  for (const c of COUNTRIES) {
    if (value.startsWith(c.code)) {
      return { code: c.code, number: value.slice(c.code.length) };
    }
  }
  const digits = value.replace(/[^0-9]/g, '');
  for (const c of COUNTRIES) {
    const cleanCode = c.code.replace(/[^0-9]/g, '');
    if (digits.startsWith(cleanCode)) {
      return { code: c.code, number: digits.slice(cleanCode.length) };
    }
  }
  return { code: '+234', number: value.replace(/[^0-9]/g, '') };
}

export default function PhoneInput({ value, onChange, className, placeholder = 'Phone number', required, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const parsed = parsePhone(value);
  const [selected, setSelected] = useState(COUNTRIES.find(c => c.code === parsed.code) || COUNTRIES[0]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCountrySelect = (country) => {
    setSelected(country);
    setOpen(false);
    const newVal = country.code + parsed.number;
    if (onChange) onChange(newVal);
  };

  const handleNumberChange = (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    const newVal = selected.code + raw;
    if (onChange) onChange(newVal);
  };

  return (
    <div className={`${styles.wrapper} ${className || ''}`} ref={ref}>
      <button
        type="button"
        className={styles.countryBtn}
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <span className={styles.flag}>{selected.flag}</span>
        <span className={styles.code}>{selected.code}</span>
        <span className={`${styles.arrow} ${open ? styles.arrowUp : ''}`}>▼</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`${styles.option} ${c.code === selected.code ? styles.optionActive : ''}`}
              onClick={() => handleCountrySelect(c)}
            >
              <span className={styles.flag}>{c.flag}</span>
              <span className={styles.code}>{c.code}</span>
              <span className={styles.label}>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="tel"
        className={styles.input}
        value={parsed.number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={11}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import styles from './CustomDropdown.module.scss';

const CustomDropdown = forwardRef(({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  className = '',
  triggerClassName = '',
  name,
  id,
  required = false,
  isInvalid = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  noResultsText = 'No options available',
}, ref) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => setOpen(false);
    window.addEventListener('scroll', handleScrollOrResize, { once: true });
    window.addEventListener('resize', handleScrollOrResize, { once: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const selected = options.find((o) => {
    const optValue = o.value !== undefined ? o.value : o.id;
    return String(optValue) === String(value);
  });

  const displayLabel = selected
    ? (selected.label !== undefined ? selected.label : selected.name)
    : '';

  const handleToggle = (e) => {
    if (disabled) return;
    if (!open) {
      const rect = e.currentTarget.getBoundingClientRect();
      setCoords({ top: rect.bottom + 2, left: rect.left, width: rect.width });
      if (searchable) setSearch('');
    }
    setOpen(!open);
  };

  const handleSelect = (opt) => {
    const optValue = opt.value !== undefined ? opt.value : opt.id;
    onChange(optValue);
    setOpen(false);
    if (searchable) setSearch('');
  };

  const optionsArray = !Array.isArray(options) ? [] : options;

  const filteredOptions = searchable
    ? optionsArray.filter((opt) => {
        const optValue = opt.value !== undefined ? opt.value : opt.id;
        const optLabel = opt.label !== undefined ? opt.label : opt.name;
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return String(optValue).toLowerCase().includes(query)
          || String(optLabel).toLowerCase().includes(query);
      })
    : optionsArray;

  useEffect(() => {
    if (open && searchable) {
      searchInputRef.current?.focus();
    }
  }, [open, searchable]);

  return (
    <div
      className={`${styles.customSelect} ${className} ${isInvalid ? styles.invalid : ''} ${disabled ? styles.disabled : ''}`}
      ref={containerRef}
      id={id ? `${id}-wrapper` : undefined}
    >
      <button
        type="button"
        className={`${styles.selectTrigger} ${triggerClassName}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        name={name}
        ref={ref}
      >
        <span className={styles.valueText}>
          {loading ? (
            <span className={styles.loadingText}>Loading...</span>
          ) : displayLabel ? (
            displayLabel
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronUp : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C757D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <div
          className={styles.selectDropdown}
          style={{ top: coords.top, left: coords.left, width: coords.width }}
          role="listbox"
        >
          {searchable && (
            <div className={styles.searchBox} onMouseDown={(e) => e.stopPropagation()}>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {filteredOptions.length === 0 && (
            <div className={styles.selectOption} style={{ color: '#8C949B', fontStyle: 'italic' }}>
              {search ? 'No results found' : noResultsText}
            </div>
          )}
          {filteredOptions.map((opt) => {
            const optValue = opt.value !== undefined ? opt.value : opt.id;
            const optLabel = opt.label !== undefined ? opt.label : opt.name;
            const isActive = String(optValue) === String(value);
            return (
              <div
                key={optValue}
                role="option"
                aria-selected={isActive}
                className={`${styles.selectOption} ${isActive ? styles.selectOptionActive : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

CustomDropdown.displayName = 'CustomDropdown';
export default CustomDropdown;

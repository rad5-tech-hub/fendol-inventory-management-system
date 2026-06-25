import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { BsThreeDotsVertical } from 'react-icons/bs';

export default function PortalDropdown({
  items,
  btnClass,
  show,
  onToggle,
  menuStyle,
  stopPropagation,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const btnRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const isControlled = show !== undefined;
  const open = isControlled ? show : internalOpen;

  const setOpen = useCallback(
    (val) => {
      if (isControlled) {
        onToggle?.(val);
      } else {
        setInternalOpen(val);
      }
    },
    [isControlled, onToggle],
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  const handleToggle = useCallback(
    (e) => {
      e.preventDefault();
      if (!open && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: Math.max(4, rect.right - 200) });
      }
      setOpen(!open);
    },
    [open, setOpen],
  );

  const handleClickOutside = useCallback(
    (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        close();
      }
    },
    [close],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', close, { once: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', close);
    };
  }, [open, handleClickOutside, close]);

  const dropdown = (
    <>
      <button ref={btnRef} className={btnClass} onClick={handleToggle} type="button">
        <BsThreeDotsVertical size={16} />
      </button>
      {open &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              minWidth: 180,
              background: '#4F2A25',
              color: '#fff',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10001,
              padding: '4px 0',
              ...menuStyle,
            }}
          >
            {items.map((item, i) =>
              item.divider ? (
                <div
                  key={i}
                  style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '4px 12px' }}
                />
              ) : (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                    close();
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    transition: 'background 0.15s',
                    ...item.style,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {item.label}
                </div>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );

  if (stopPropagation) {
    return <div onClick={(e) => e.stopPropagation()}>{dropdown}</div>;
  }
  return dropdown;
}

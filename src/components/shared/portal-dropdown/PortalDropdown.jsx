import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { BsThreeDotsVertical } from 'react-icons/bs';

const GAP = 6;
const MENU_WIDTH = 200;

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
  const [maxMenuHeight, setMaxMenuHeight] = useState(null);

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
        document.dispatchEvent(new CustomEvent('portal-dropdown-close'));

        const rect = btnRef.current.getBoundingClientRect();
        const estimatedHeight = items.reduce((h, item) => h + (item.divider ? 9 : 36), 8);

        let left = rect.right - MENU_WIDTH;
        if (left < GAP) left = GAP;
        if (left + MENU_WIDTH > window.innerWidth - GAP) left = window.innerWidth - MENU_WIDTH - GAP;

        const spaceBelow = window.innerHeight - rect.bottom - GAP;
        const spaceAbove = rect.top - GAP;

        let top, maxH;
        if (spaceBelow >= estimatedHeight) {
          top = rect.bottom + GAP;
          maxH = null;
        } else if (spaceAbove >= estimatedHeight) {
          top = rect.top - estimatedHeight;
          maxH = null;
        } else if (spaceBelow > 80) {
          top = rect.bottom + GAP;
          maxH = spaceBelow;
        } else {
          top = GAP;
          maxH = window.innerHeight - GAP;
        }

        setCoords({ top, left });
        setMaxMenuHeight(maxH);
      } else {
        setMaxMenuHeight(null);
      }
      setOpen(!open);
    },
    [open, setOpen, items],
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
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('portal-dropdown-close', close);
      window.addEventListener('scroll', close, { once: true });
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('portal-dropdown-close', close);
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
              maxHeight: maxMenuHeight,
              overflowY: maxMenuHeight ? 'auto' : 'visible',
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

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { FiX, FiSearch, FiUsers } from 'react-icons/fi';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import styles from './ProcessingTeamModal.module.scss';

const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA', '#F5A623', '#4A90D9', '#2E7D32'];

const getInitials = (name) => {
  const parts = (name || '').trim().split(' ');
  return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '').toUpperCase();
};

export default function ProcessingTeamModal({ show, processId, existingTeam, onClose, onSuccess }) {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = user?.userTypes || [];
  const isSuperAdmin = userTypes.includes('super_admin');

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setSelectedIds(new Set());
      setSearch('');
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
    if (!show) return;
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const siteParam = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0] || '');
        const res = await ApiV2.get('/api/v1/staff', { params: { siteId: siteParam } });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaff(data);
        if (Array.isArray(existingTeam) && existingTeam.length > 0) {
          const existingIds = new Set(
            existingTeam.map((m) => m.id).filter(Boolean)
          );
          setSelectedIds(existingIds);
        }
      } catch (err) {
        console.error('[ProcessingTeamModal] Failed to fetch staff:', err);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [show, activeSite?.id, isSuperAdmin, user?.siteId, existingTeam]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const toggleStaff = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredStaff = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q)
    );
  }, [staff, search]);

  const handleSave = async () => {
    setSubmitting(true);
    const members = staff
      .filter((s) => selectedIds.has(s.id))
      .map((s) => ({
        staffId: s.id,
        name: s.name,
      }));

    try {
      const res = await Api.post('/processing-team', {
        processId,
        members,
      });

      handleClose();
      if (onSuccess) {
        const saved = res.data?.data || members;
        onSuccess(saved);
      }
    } catch (error) {
      let msg = 'Failed to save processing team. Please try again.';
      if (error.response) {
        msg = error.response?.data?.message ||
              error.response?.data?.response_message ||
              msg;
      }
      if (onSuccess) onSuccess(null, msg);
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
              <FiUsers size={22} color="#512728" />
            </div>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>Add Processing Team</h2>
              <p className={styles.subtitle}>Select staff members to assign to this process.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon} size={14} />
            <input
              className={styles.searchInput}
              placeholder="Search staff by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className={styles.selectedTags}>
              {Array.from(selectedIds).map((id) => {
                const member = staff.find((s) => s.id === id);
                if (!member) return null;
                return (
                  <span key={id} className={styles.tag}>
                    {member.name}
                    <button
                      className={styles.tagRemove}
                      onClick={() => toggleStaff(id)}
                      type="button"
                      aria-label={`Remove ${member.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className={styles.staffList}>
            {loading ? (
              <div className={styles.loadingState}>Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className={styles.emptyState}>
                {search ? 'No staff match your search.' : 'No staff available.'}
              </div>
            ) : (
              filteredStaff.map((member, index) => {
                const isSelected = selectedIds.has(member.id);
                const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
                return (
                  <div
                    key={member.id}
                    className={styles.staffItem}
                    onClick={() => toggleStaff(member.id)}
                  >
                    <input
                      type="checkbox"
                      className={styles.staffCheckbox}
                      checked={isSelected}
                      onChange={() => {}}
                    />
                    <div
                      className={styles.staffAvatar}
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className={styles.staffInfo}>
                      <div className={styles.staffName}>{member.name}</div>
                      <div className={styles.staffRole}>{member.role || '—'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSave}
            disabled={submitting || selectedIds.size === 0}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : (
              <>
                <FiUsers size={15} />
                {selectedIds.size > 0
                  ? `Save (${selectedIds.size} member${selectedIds.size > 1 ? 's' : ''})`
                  : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

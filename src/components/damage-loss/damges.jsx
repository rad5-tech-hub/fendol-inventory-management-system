import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';
import SideBar from "../shared/sidebar/sidebar";
import Header from "../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './damge.module.scss';
import ErrorState from "../shared/error-state/ErrorState";
import EmptyState from "../shared/empty-state/EmptyState";
import Api from '../shared/api/apiLink';
import { SkeletonTable } from "../shared/skeleton/Skeleton";

export default function DamageLoss() {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = user?.userTypes || [];
  const isSuperAdmin = userTypes.includes('super_admin');
  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pondMap, setPondMap] = useState({});

  const siteId = isSuperAdmin ? (activeSite?.id || 'all') : user?.siteId;

  // Fetch pond list to map pondId -> name
  useEffect(() => {
    (async () => {
      try {
        const params = {};
        if (siteId) params.siteId = siteId;
        const res = await Api.get('/fish-stages', { params });
        if (Array.isArray(res.data?.data)) {
          const map = {};
          res.data.data.forEach(p => { if (p.id) map[p.id] = p.title || p.name; });
          setPondMap(map);
        }
      } catch (_) { /* non-critical */ }
    })();
  }, [siteId]);

  const fetchDamageRecords = useCallback(async (appendCursor) => {
    try {
      if (appendCursor) setLoadingMore(true); else setLoading(true);
      setError("");
      const params = {};
      if (siteId) params.siteId = siteId;
      if (appendCursor) params.cursor = appendCursor;
      const response = await Api.get('/damaged-fish', { params });
      const records = Array.isArray(response.data?.data) ? response.data.data : [];
      const pagination = response.data?.pagination || {};
      setHasMore(pagination.hasMore === true);
      setCursor(pagination.nextCursor || null);
      if (appendCursor) {
        setDamageRecords(prev => [...prev, ...records]);
      } else {
        setDamageRecords(records);
      }
    } catch (_) {
      setError("Error fetching damage/loss records. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchDamageRecords();
  }, [fetchDamageRecords]);

  const loadMore = () => {
    if (loadingMore || !hasMore || !cursor) return;
    fetchDamageRecords(cursor);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const getPondName = (record) => {
    if (record.pondId && pondMap[record.pondId]) return pondMap[record.pondId];
    if (record.sourcePond) return record.sourcePond;
    return '\u2014';
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 className="mt-3 mb-5">Damage/Loss</h4>

              {loading ? (
                <div style={{ padding: "20px 0" }}>
                  <SkeletonTable rows={5} cols={4} />
                </div>
              ) : error ? (
                <ErrorState message={error} />
              ) : damageRecords.length === 0 ? (
                <EmptyState title="No available damage or loss records" />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.styled_table}>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>POND</th>
                        <th>QUANTITY</th>
                        <th>REMARK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {damageRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.createdAt)}</td>
                          <td>{getPondName(record)}</td>
                          <td>{record.quantity}</td>
                          <td style={{ maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {record.remarks || record.description || '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {hasMore && (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!loading && !error && damageRecords.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb', background: '#f8f9fa', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                {damageRecords.length} record{damageRecords.length !== 1 ? 's' : ''}
              </div>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

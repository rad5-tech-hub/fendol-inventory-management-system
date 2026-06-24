import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsSearch, BsThreeDotsVertical, BsX } from "react-icons/bs";
import { Dropdown, Alert, Modal, Button, Form } from 'react-bootstrap';
import { SkeletonTable, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
import ReactPaginate from 'react-paginate';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';

const generateMockHistory = () => {
  const ponds = ["Nursery Pond A", "Grow-out Pond B", "Hatchery Tank 1", "Nursery Pond B", "Grow-out Pond C", "Broodstock Pond", "Fry Tank 2", "Nursery Pond C"];
  const sites = ["Riverside Hatchery", "Mountain View Farm", "Green Valley Aquaculture", "Coastal Fish Farm", "Sunrise Tilapia Ltd"];
  const descriptions = ["Juvenile tilapia for nursery pond", "Fingerlings for grow-out phase", "Mixed species transfer", "Catfish fingerlings", "Broodstock transfer", "Advanced fry for nursery"];
  const statuses = ["completed", "completed", "completed", "completed", "pending"];
  const data = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date(2026, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
    data.push({
      id: i,
      date: d.toISOString().split('T')[0],
      pondFrom: ponds[i % ponds.length],
      siteTo: sites[i % sites.length],
      quantity: Math.floor(Math.random() * 4000) + 500,
      description: descriptions[i % descriptions.length],
      status: statuses[i % statuses.length],
    });
  }
  return data.sort((a, b) => b.date.localeCompare(a.date));
};

const MOCK_HISTORY = generateMockHistory();
const ITEMS_PER_PAGE = 10;

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const userTypes = useSelector((store) => store.user?.userTypes || []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setRecords(MOCK_HISTORY);
      } catch {
        setError("Failed to load transfer history.");
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = records.filter((r) => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.pondFrom.toLowerCase().includes(q) || r.siteTo.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const offset = page * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(offset, offset + ITEMS_PER_PAGE);

  const handleViewDetails = (r) => {
    setSelectedRecord(r);
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const hasFilters = search || dateFrom || dateTo;

  const formatNumber = (n) => new Intl.NumberFormat().format(n);

  return (
    <section className={styles.body}>
      <ToastContainer />
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)', color: '#fff', border: 'none' }}>
          <Modal.Title>Transfer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div>
              <div className="mb-3"><strong>Date:</strong> <span className="ms-2">{selectedRecord.date}</span></div>
              <div className="mb-3"><strong>Pond From:</strong> <span className="ms-2">{selectedRecord.pondFrom}</span></div>
              <div className="mb-3"><strong>Site To:</strong> <span className="ms-2">{selectedRecord.siteTo}</span></div>
              <div className="mb-3"><strong>Quantity:</strong> <span className="ms-2">{formatNumber(selectedRecord.quantity)} pcs</span></div>
              <div className="mb-3"><strong>Description:</strong> <span className="ms-2">{selectedRecord.description}</span></div>
              <div className="mb-3"><strong>Status:</strong> <span className="ms-2" style={{ color: selectedRecord.status === 'completed' ? '#16A34A' : '#B06426', fontWeight: 600 }}>{selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}</span></div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="sticky-top">
        <Header />
      </div>

      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar userType={userTypes} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form}>
            <div className="d-flex justify-content-between align-items-start mb-4 mt-3 flex-wrap gap-2">
              <div>
                <h4 className="mb-1 fw-bold" style={{ color: '#2E3135' }}>Transfer History</h4>
                <p className="mb-0" style={{ fontSize: '0.875rem', color: '#8C949B' }}>
                  Complete record of all site-to-site fish transfers.
                </p>
              </div>
            </div>

            {loading && (
              <div className="mt-4"><SkeletonFilterBar /><SkeletonTable rows={8} /></div>
            )}

            {error && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <span>Failed to load transfer history. Please try again.</span>
              </Alert>
            )}

            {!loading && !error && (
              <>
                {/* Date range + search filters */}
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '280px' }}>
                    <Form.Label className="mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8C949B', letterSpacing: '0.3px' }}>FROM</Form.Label>
                    <Form.Control type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                      style={{ fontSize: '0.85rem', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  </div>
                  <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '280px' }}>
                    <Form.Label className="mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8C949B', letterSpacing: '0.3px' }}>TO</Form.Label>
                    <Form.Control type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                      style={{ fontSize: '0.85rem', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  </div>
                  <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px', marginTop: '22px' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C949B', fontSize: '14px', pointerEvents: 'none' }} />
                    <input type="text" placeholder="Search pond, site, description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      style={{ width: '100%', padding: '8px 14px 8px 36px', fontSize: '0.85rem', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = '#512728'; e.target.style.boxShadow = '0 0 0 3px rgba(81,39,40,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  {hasFilters && (
                    <button onClick={clearFilters}
                      style={{ marginTop: '22px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600, color: '#8C949B', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BsX size={16} /> Clear
                    </button>
                  )}
                </div>

                {filtered.length === 0 && (
                  <Alert variant="info">No transfer records found{hasFilters ? ' matching your filters' : ''}.</Alert>
                )}

                {filtered.length > 0 && (
                  <>
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <table className={`table ${styles.styled_table} mb-0`}>
                        <thead className={styles.theader}>
                          <tr>
                            <th>DATE</th>
                            <th>POND FROM</th>
                            <th>SITE TO</th>
                            <th style={{ textAlign: 'right' }}>QUANTITY</th>
                            <th>DESCRIPTION</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'center', width: '80px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((r) => (
                            <tr key={r.id} className={styles.trow}>
                              <td style={{ color: '#8C949B' }}>{r.date}</td>
                              <td style={{ color: '#512728', fontWeight: 600 }}>{r.pondFrom}</td>
                              <td style={{ color: '#2E3135' }}>{r.siteTo}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(r.quantity)}</td>
                              <td style={{ color: '#2E3135' }}>{r.description}</td>
                              <td>
                                <span style={{
                                  display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                  background: r.status === 'completed' ? '#F0FDF4' : '#FFF8F0',
                                  color: r.status === 'completed' ? '#16A34A' : '#B06426',
                                }}>
                                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Dropdown align="end">
                                    <Dropdown.Toggle as="button" className={styles.threeDotBtn}>
                                      <BsThreeDotsVertical size={16} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu style={{ minWidth: 160 }}>
                                      <Dropdown.Item onClick={() => handleViewDetails(r)}>View Details</Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {pageCount > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                        <small style={{ color: '#8C949B' }}>
                          Showing {offset + 1}–{Math.min(offset + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
                        </small>
                        <ReactPaginate
                          previousLabel={"< "}
                          nextLabel={" >"}
                          breakLabel={"..."}
                          pageCount={pageCount}
                          forcePage={page}
                          onPageChange={({ selected }) => setPage(selected)}
                          containerClassName={"pagination mb-0"}
                          pageClassName={"page-item"}
                          pageLinkClassName={"page-link"}
                          previousClassName={"page-item"}
                          previousLinkClassName={"page-link"}
                          nextClassName={"page-item"}
                          nextLinkClassName={"page-link"}
                          breakClassName={"page-item"}
                          breakLinkClassName={"page-link"}
                          activeClassName={"active"}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

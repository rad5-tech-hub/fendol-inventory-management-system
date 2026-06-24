import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsSearch, BsThreeDotsVertical } from "react-icons/bs";
import { GiFishingNet } from "react-icons/gi";
import { Dropdown, Alert, Modal, Button } from 'react-bootstrap';
import { SkeletonTable, SkeletonStatGrid, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
import ReactPaginate from 'react-paginate';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';

const generateMockTransfers = () => {
  const sites = ["Riverside Hatchery", "Mountain View Farm", "Green Valley Aquaculture", "Coastal Fish Farm", "Sunrise Tilapia Ltd", "Riverbend Aqua", "Highland Fisheries", "Delta Fish Co"];
  const descriptions = ["Juvenile tilapia for nursery pond", "Fingerlings for grow-out phase", "Mixed species for polyculture pond", "Catfish fingerlings for stocking", "Sex-reversed tilapia for grow-out", "Broodstock for hatchery", "Advanced fry for nursery", "Table-size fish for harvesting"];
  const data = [];
  for (let i = 1; i <= 24; i++) {
    data.push({
      id: i,
      date: new Date(2026, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      siteFrom: sites[i % sites.length],
      quantity: Math.floor(Math.random() * 4500) + 500,
      description: descriptions[i % descriptions.length],
    });
  }
  return data;
};

const MOCK_TRANSFERS = generateMockTransfers();

const ITEMS_PER_PAGE = 10;

export default function ViewFish() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const userTypes = useSelector((store) => store.user?.userTypes || []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setTransfers(MOCK_TRANSFERS);
      } catch {
        setError("Failed to load transfers.");
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = transfers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.siteFrom.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const totalFish = filtered.reduce((sum, t) => sum + t.quantity, 0);
  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const offset = page * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(offset, offset + ITEMS_PER_PAGE);

  const handleViewDetails = (t) => {
    setSelectedTransfer(t);
    setShowModal(true);
  };

  const formatNumber = (n) => new Intl.NumberFormat().format(n);

  return (
    <section className={styles.body}>
      <ToastContainer />
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #512728 0%, #6B3536 100%)', color: '#fff', border: 'none' }}>
          <Modal.Title>Transfer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransfer && (
            <div>
              <div className="mb-3"><strong>Date:</strong> <span className="ms-2">{selectedTransfer.date}</span></div>
              <div className="mb-3"><strong>Site From:</strong> <span className="ms-2">{selectedTransfer.siteFrom}</span></div>
              <div className="mb-3"><strong>Quantity:</strong> <span className="ms-2">{formatNumber(selectedTransfer.quantity)} pcs</span></div>
              <div className="mb-3"><strong>Description:</strong> <span className="ms-2">{selectedTransfer.description}</span></div>
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
                <h4 className="mb-1 fw-bold" style={{ color: '#2E3135' }}>Site Transfers — Incoming</h4>
                <p className="mb-0" style={{ fontSize: '0.875rem', color: '#8C949B' }}>
                  View all fish transferred to your site from other locations.
                </p>
              </div>
            </div>

            {loading && (
              <>
                <SkeletonStatGrid count={1} />
                <div className="mt-4"><SkeletonFilterBar /><SkeletonTable rows={6} /></div>
              </>
            )}

            {error && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <span>Failed to load transfer records. Please try again.</span>
              </Alert>
            )}

            {!loading && !error && (
              <>
                <div className="d-flex gap-3 flex-wrap mb-4">
                  <div className="d-flex align-items-center gap-3 flex-fill"
                    style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: '200px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#FDF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#512728', flexShrink: 0 }}>
                      <GiFishingNet size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C949B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        TOTAL TRANSFERRED TO ME
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 700, color: '#2E3135', lineHeight: 1.2 }}>
                        {formatNumber(totalFish)} pcs
                      </div>
                    </div>
                  </div>
                </div>

                {filtered.length === 0 && !loading && (
                  <Alert variant="info">No incoming transfers found{search ? ` matching "${search}"` : ''}.</Alert>
                )}

                {filtered.length > 0 && (
                  <>
                    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                      <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '360px' }}>
                        <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C949B', fontSize: '14px', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Search by site or description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                          style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: '0.875rem', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          onFocus={(e) => { e.target.style.borderColor = '#512728'; e.target.style.boxShadow = '0 0 0 3px rgba(81,39,40,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }} />
                      </div>
                      {search && (
                        <button onClick={() => { setSearch(''); setPage(0); }}
                          style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#8C949B', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                          Clear
                        </button>
                      )}
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <table className={`table ${styles.styled_table} mb-0`}>
                        <thead className={styles.theader}>
                          <tr>
                            <th>DATE</th>
                            <th>SITE FROM</th>
                            <th style={{ textAlign: 'right' }}>QUANTITY</th>
                            <th>DESCRIPTION</th>
                            <th style={{ textAlign: 'center', width: '80px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((t) => (
                            <tr key={t.id} className={styles.trow}>
                              <td style={{ color: '#8C949B' }}>{t.date}</td>
                              <td style={{ color: '#512728', fontWeight: 600 }}>{t.siteFrom}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(t.quantity)}</td>
                              <td style={{ color: '#2E3135' }}>{t.description}</td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Dropdown align="end">
                                    <Dropdown.Toggle as="button" className={styles.threeDotBtn}>
                                      <BsThreeDotsVertical size={16} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu style={{ minWidth: 160 }}>
                                      <Dropdown.Item onClick={() => handleViewDetails(t)}>View Details</Dropdown.Item>
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
                          Showing {offset + 1}–{Math.min(offset + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transfers
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

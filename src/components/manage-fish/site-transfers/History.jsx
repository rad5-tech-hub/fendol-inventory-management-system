import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsSearch, BsThreeDotsVertical, BsX } from "react-icons/bs";
import { FaExchangeAlt, FaBoxOpen } from "react-icons/fa";
import { GiFishingNet } from "react-icons/gi";
import { IoEyeOutline } from "react-icons/io5";
import { Dropdown, Modal, Button } from 'react-bootstrap';
import { SkeletonTable, SkeletonStatGrid, SkeletonFilterBar } from "../../shared/skeleton/Skeleton";
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
  const [openDropdownId, setOpenDropdownId] = useState(null);

  /* ── Sidebar state (matches Dashboard / HatchBatchSummary pattern) ── */
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((prev) => !prev);
  const handleCloseSidebar = () => setShowSidebar(false);

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

  /* ── Derived stats (from filtered data) ── */
  const totalTransferred = filtered.reduce((sum, r) => sum + r.quantity, 0);

  const statCards = [
    {
      label: 'TOTAL TRANSFERRED',
      value: `${formatNumber(totalTransferred)} pcs`,
      sub: 'All fish moved across records',
      icon: GiFishingNet,
      color: '#512728',
    },
    {
      label: 'TOTAL RECORDS',
      value: formatNumber(filtered.length),
      sub: 'Transfer history entries',
      icon: FaExchangeAlt,
      color: '#2563EB',
    },
  ];

  return (
    <section className={styles.body}>
      <ToastContainer />
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>Transfer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBodyCompact}>
          {selectedRecord && (
            <>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Date</span>
                <span className={styles.modalValue}>{selectedRecord.date}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Pond From</span>
                <span className={styles.modalValue}>{selectedRecord.pondFrom}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Site To</span>
                <span className={styles.modalValue}>{selectedRecord.siteTo}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Quantity</span>
                <span className={styles.modalValue}>{formatNumber(selectedRecord.quantity)} pcs</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Description</span>
                <span className={styles.modalValue}>{selectedRecord.description}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalLabel}>Status</span>
                <span className={styles.modalValue}>
                  <span className={`${styles.statusBadge} ${selectedRecord.status === 'completed' ? styles.statusCompleted : styles.statusPending}`}>
                    {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                  </span>
                </span>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>

      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form}>
            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span>Fish Operations</span>
              <span className={styles.separator}>&gt;</span>
              <span>Site Transfers</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>History</span>
            </div>

            {/* ── Header row ── */}
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div>
                <h3 className={styles.headingTitle}>Transfer History</h3>
                <p className={styles.headingSubtitle}>
                  Complete record of all site-to-site fish transfers.
                </p>
              </div>
            </div>

            {loading && (
              <div className="mt-4">
                <SkeletonStatGrid count={2} />
                <div className="mt-4"><SkeletonFilterBar /><SkeletonTable rows={8} /></div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <span>Failed to load transfer history. Please try again.</span>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* ── Info strip ── */}
                <div className={styles.infoStrip}>
                  {statCards.map((card, i) => (
                    <div key={i} className={styles.infoCard}>
                      <div className={styles.infoIcon} style={{ background: card.color + '1A' }}>
                        <card.icon size={18} color={card.color} />
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoLabel}>{card.label}</div>
                        <div className={styles.infoValue}>{card.value}</div>
                        <span className={styles.infoSub}>{card.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Filters row ── */}
                <div className="d-flex align-items-end gap-3 mb-4 flex-wrap">
                  <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '420px' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C949B', fontSize: '14px', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search pond, site, description..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      className={styles.searchInput}
                    />
                  </div>
                  <div className="d-flex align-items-end gap-2 ms-auto flex-wrap">
                    <div>
                      <div className={styles.filterLabel}>FROM</div>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                        className={styles.dateInput}
                      />
                    </div>
                    <div>
                      <div className={styles.filterLabel}>TO</div>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                        className={styles.dateInput}
                      />
                    </div>
                    {hasFilters && (
                      <button onClick={clearFilters} className={styles.clearBtn}>
                        <BsX size={16} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Empty state ── */}
                {filtered.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <FaBoxOpen />
                    </div>
                    <div className={styles.emptyStateHeading}>
                      No transfer records found
                    </div>
                    <div className={styles.emptyStateSub}>
                      {hasFilters
                        ? 'No records match your filters. Try adjusting your search or date range.'
                        : 'There are no transfer records to display yet.'}
                    </div>
                  </div>
                )}

                {/* ── Table ── */}
                {filtered.length > 0 && (
                  <>
                    <div className={styles.tableContainer}>
                      <table className={`table ${styles.styled_table} mb-0`}>
                        <thead className={styles.theader}>
                          <tr>
                            <th>DATE</th>
                            <th>POND FROM</th>
                            <th>SITE TO</th>
                            <th className={styles.qtyCell}>QUANTITY</th>
                            <th>DESCRIPTION</th>
                            <th className={styles.actionCell} style={{ width: '80px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((r) => (
                            <tr key={r.id} className={styles.trow}>
                              <td className={styles.dateCell}>{r.date}</td>
                              <td className={styles.pondCell}>{r.pondFrom}</td>
                              <td className={styles.siteCell}>{r.siteTo}</td>
                              <td className={styles.qtyCell}>{formatNumber(r.quantity)}</td>
                              <td className={styles.descCell}>{r.description}</td>
                              <td className={styles.actionCell}>
                                <Dropdown
                                  show={openDropdownId === r.id}
                                  onToggle={(isOpen) => setOpenDropdownId(isOpen ? r.id : null)}
                                  align="end"
                                >
                                  <Dropdown.Toggle as="button" className={styles.threeDotBtn}>
                                    <BsThreeDotsVertical size={16} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu style={{ minWidth: 180 }}>
                                    <Dropdown.Item onClick={() => handleViewDetails(r)}>
                                      <IoEyeOutline size={16} style={{ marginRight: 10 }} /> View Details
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Pagination ── */}
                    {pageCount > 1 && (
                      <div className={styles.paginationFooter}>
                        <small className={styles.paginationInfo}>
                          Showing {offset + 1}&ndash;{Math.min(offset + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
                        </small>
                        <div className={styles.pagination}>
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

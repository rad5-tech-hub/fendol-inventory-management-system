import React, { useState, useEffect } from "react";
import { Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';
import styles from '../product-stages.module.scss';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { useConfirm } from '../../shared/confirm-modal';

const MOCK_SITES = [
  { id: "s1", name: "Riverside Hatchery" },
  { id: "s2", name: "Mountain View Farm" },
  { id: "s3", name: "Green Valley Aquaculture" },
  { id: "s4", name: "Coastal Fish Farm" },
  { id: "s5", name: "Sunrise Tilapia Ltd" },
  { id: "s6", name: "Riverbend Aqua" },
  { id: "s7", name: "Highland Fisheries" },
  { id: "s8", name: "Delta Fish Co" },
];

const MOCK_PONDS = [
  { id: "p1", title: "Nursery Pond A", siteId: "s1", quantity: 5000 },
  { id: "p2", title: "Grow-out Pond B", siteId: "s1", quantity: 12000 },
  { id: "p3", title: "Hatchery Tank 1", siteId: "s1", quantity: 8000 },
  { id: "p4", title: "Nursery Pond B", siteId: "s2", quantity: 3500 },
  { id: "p5", title: "Grow-out Pond C", siteId: "s2", quantity: 9500 },
  { id: "p6", title: "Broodstock Pond", siteId: "s3", quantity: 2000 },
  { id: "p7", title: "Fry Tank 2", siteId: "s3", quantity: 15000 },
  { id: "p8", title: "Nursery Pond C", siteId: "s4", quantity: 6000 },
];

export default function TransferFish() {
  const [ConfirmDialog, confirm] = useConfirm();
  const activeSite = useSelector((store) => store.activeSite);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [ponds, setPonds] = useState([]);
  const [pondSearch, setPondSearch] = useState("");
  const [selectedPond, setSelectedPond] = useState(null);
  const [showPondSuggestions, setShowPondSuggestions] = useState(false);

  const [siteSearch, setSiteSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [showSiteSuggestions, setShowSiteSuggestions] = useState(false);

  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const siteId = activeSite?.id || "s1";
      const filtered = MOCK_PONDS.filter((p) => p.siteId === siteId || siteId === "all");
      setPonds(filtered.length > 0 ? filtered : MOCK_PONDS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeSite?.id]);

  const filteredPonds = ponds.filter((p) =>
    p.title.toLowerCase().includes(pondSearch.toLowerCase())
  );

  const filteredSites = MOCK_SITES.filter(
    (s) =>
      s.name.toLowerCase().includes(siteSearch.toLowerCase()) &&
      s.id !== (activeSite?.id || "s1")
  );

  const handleSelectPond = (pond) => {
    setSelectedPond(pond);
    setPondSearch(pond.title);
    setShowPondSuggestions(false);
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setSiteSearch(site.name);
    setShowSiteSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPond) {
      toast.error("Please select a pond to transfer from.", { className: 'dark-toast' });
      return;
    }
    if (!selectedSite) {
      toast.error("Please select a destination site.", { className: 'dark-toast' });
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity.", { className: 'dark-toast' });
      return;
    }
    if (Number(quantity) > (selectedPond.quantity || 0)) {
      toast.error(`Available quantity in ${selectedPond.title} is ${(selectedPond.quantity || 0).toLocaleString()} pcs.`, { className: 'dark-toast' });
      return;
    }

    const ok = await confirm({
      message: `Transfer ${Number(quantity).toLocaleString()} fish from ${selectedPond.title} to ${selectedSite.name}?`,
      title: "Confirm Transfer",
      variant: "danger",
    });
    if (!ok) return;

    setSubmitting(true);
    const loadingToast = toast.loading("Processing transfer...", { className: 'dark-toast' });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.update(loadingToast, {
        render: "Fish transferred successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
      setSelectedPond(null);
      setSelectedSite(null);
      setPondSearch("");
      setSiteSearch("");
      setQuantity("");
      setDescription("");
    } catch {
      toast.update(loadingToast, {
        render: "Transfer failed. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.body}>
      <ConfirmDialog />
      <ToastContainer />
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar />
        </div>
        <section className={styles.content}>
          <main className={styles.create_form}>
            <div className="d-flex justify-content-between align-items-start mb-4 mt-3 flex-wrap gap-2">
              <div>
                <h4 className="mb-1 fw-bold" style={{ color: '#2E3135' }}>Transfer Fish to Another Site</h4>
                <p className="mb-0" style={{ fontSize: '0.875rem', color: '#8C949B' }}>
                  Move fish from a pond in your site to another location.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" variant="secondary" />
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12} lg={6} className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Pond From</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type="text"
                        placeholder="Search for a pond..."
                        value={pondSearch}
                        onChange={(e) => { setPondSearch(e.target.value); setSelectedPond(null); setShowPondSuggestions(true); }}
                        onFocus={() => setShowPondSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowPondSuggestions(false), 200)}
                        className={styles.inputs}
                        style={{ fontSize: '0.875rem' }}
                      />
                      {showPondSuggestions && pondSearch && (
                        <div className={styles.suggestions_box} style={{ width: '100%', maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 9999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <ul style={{ listStyle: 'none', padding: '4px', margin: 0 }}>
                            {filteredPonds.length > 0 ? (
                              filteredPonds.map((pond) => (
                                <li key={pond.id} onClick={() => handleSelectPond(pond)}
                                  style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.875rem', transition: 'background 0.15s' }}
                                  onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                                  onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                  <div style={{ fontWeight: 600, color: '#2E3135' }}>{pond.title}</div>
                                  <small style={{ color: '#8C949B' }}>Available: {pond.quantity?.toLocaleString() || 0} pcs</small>
                                </li>
                              ))
                            ) : (
                              <li style={{ padding: '12px', color: '#8C949B', fontSize: '0.85rem' }}>No ponds found.</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    {selectedPond && (
                      <small style={{ color: '#16A34A', fontWeight: 500 }}>Selected: {selectedPond.title} ({selectedPond.quantity?.toLocaleString()} pcs available)</small>
                    )}
                  </Col>

                  <Col md={12} lg={6} className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Site To</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type="text"
                        placeholder="Search for a destination site..."
                        value={siteSearch}
                        onChange={(e) => { setSiteSearch(e.target.value); setSelectedSite(null); setShowSiteSuggestions(true); }}
                        onFocus={() => setShowSiteSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSiteSuggestions(false), 200)}
                        className={styles.inputs}
                        style={{ fontSize: '0.875rem' }}
                      />
                      {showSiteSuggestions && siteSearch && (
                        <div className={styles.suggestions_box} style={{ width: '100%', maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 9999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <ul style={{ listStyle: 'none', padding: '4px', margin: 0 }}>
                            {filteredSites.length > 0 ? (
                              filteredSites.map((site) => (
                                <li key={site.id} onClick={() => handleSelectSite(site)}
                                  style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.875rem', transition: 'background 0.15s' }}
                                  onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                                  onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                  <div style={{ fontWeight: 600, color: '#2E3135' }}>{site.name}</div>
                                </li>
                              ))
                            ) : (
                              <li style={{ padding: '12px', color: '#8C949B', fontSize: '0.85rem' }}>No sites found.</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    {selectedSite && (
                      <small style={{ color: '#16A34A', fontWeight: 500 }}>Selected: {selectedSite.name}</small>
                    )}
                  </Col>
                </Row>

                <Row>
                  <Col md={6} lg={6} className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className={styles.inputs}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </Col>
                  <Col md={6} lg={6} className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2E3135' }}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Optional description or remarks"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={styles.inputs}
                      style={{ fontSize: '0.875rem', resize: 'vertical' }}
                    />
                  </Col>
                </Row>

                <div className="mt-4">
                  <Button type="submit" className={styles.submit} disabled={submitting}
                    style={{ padding: '10px 32px', fontWeight: 600, fontSize: '0.9rem', border: 'none' }}>
                    {submitting ? 'Transferring...' : 'Transfer Fish'}
                  </Button>
                </div>
              </Form>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}

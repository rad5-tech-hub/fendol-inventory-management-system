import React, { useState, useEffect } from "react";
import { Form, Button, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';
import styles from '../product-stages.module.scss';
import Api, { ApiV2 } from "../../shared/api/apiLink";
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { useConfirm } from '../../shared/confirm-modal';

export default function TransferFish() {
  const [ConfirmDialog, confirm] = useConfirm();
  const activeSite = useSelector((store) => store.activeSite);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pondsLoading, setPondsLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true);

  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((prev) => !prev);
  const handleCloseSidebar = () => setShowSidebar(false);

  const [pondOptions, setPondOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);
  const [selectedPondId, setSelectedPondId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");

  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  const selectedPond = pondOptions.find((p) => p.id === selectedPondId) || null;
  const selectedSite = siteOptions.find((s) => s.id === selectedSiteId) || null;

  /* ── Fetch ponds from backend by siteId ── */
  useEffect(() => {
    let cancelled = false;
    const fetchPonds = async () => {
      setPondsLoading(true);
      try {
        const siteId = activeSite?.id || 'all';
        const res = await Api.get(`/fish-stages?siteId=${siteId}`);
        let list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (list.length === 0 && siteId !== 'all') {
          const fallback = await Api.get('/fish-stages?siteId=all');
          list = Array.isArray(fallback.data?.data) ? fallback.data.data : [];
        }
        if (!cancelled) setPondOptions(list);
      } catch {
        if (!cancelled) setPondOptions([]);
      } finally {
        if (!cancelled) { setPondsLoading(false); setLoading(false); }
      }
    };
    fetchPonds();
    return () => { cancelled = true; };
  }, [activeSite?.id]);

  /* ── Fetch all sites from backend ── */
  useEffect(() => {
    let cancelled = false;
    const fetchSites = async () => {
      setSitesLoading(true);
      try {
        const res = await ApiV2.get('/v2/all-site');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setSiteOptions(data);
      } catch {
        if (!cancelled) setSiteOptions([]);
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    };
    fetchSites();
    return () => { cancelled = true; };
  }, []);

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
      setSelectedPondId("");
      setSelectedSiteId("");
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
              <span className={styles.breadcrumbActive}>Transfer Fish</span>
            </div>

            {/* ── Header ── */}
            <h4 className="mt-3 mb-5">Transfer Fish to Another Site</h4>

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" variant="secondary" />
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                {/* ── Pond From ── */}
                <Form.Label className="fw-semibold mt-4">Pond From</Form.Label>
                <Form.Select
                  value={selectedPondId}
                  onChange={(e) => setSelectedPondId(e.target.value)}
                  disabled={pondsLoading}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                >
                  <option value="">
                    {pondsLoading ? 'Loading ponds...' : (pondOptions.length === 0 ? 'No ponds available' : 'Select a pond')}
                  </option>
                  {pondOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.quantity != null ? `(${p.quantity.toLocaleString()} pcs)` : ''}
                    </option>
                  ))}
                </Form.Select>
                {selectedPond && (
                  <small style={{ color: '#16A34A', fontWeight: 500 }}>
                    Available: {selectedPond.quantity?.toLocaleString() || 0} pcs
                  </small>
                )}

                {/* ── Site To ── */}
                <Form.Label className="fw-semibold mt-4">Site To</Form.Label>
                <Form.Select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  disabled={sitesLoading}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                >
                  <option value="">
                    {sitesLoading ? 'Loading sites...' : (siteOptions.length === 0 ? 'No sites available' : 'Select a destination site')}
                  </option>
                  {siteOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>

                {/* ── Quantity ── */}
                <Form.Label className="fw-semibold mt-4">Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                />

                {/* ── Description ── */}
                <Form.Label className="fw-semibold fs-6 mt-4">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Optional description or remarks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  style={{ height: '200px' }}
                />

                {/* ── Submit ── */}
                <div className="d-flex justify-content-end my-4">
                  <Button
                    type="submit"
                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                    disabled={submitting}
                  >
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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiPlus, FiUploadCloud, FiInfo, FiTrash2, FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { createPortal } from 'react-dom';
import { toast, ToastContainer } from 'react-toastify';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import DataTable from "../../shared/data-table/DataTable";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import feedStyles from '../feed.module.scss';
import styles from './create-batch.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const FEED_TYPE_OPTIONS = [
  'Starter (0-1mm)', 'Grower (1-3mm)', 'Finisher (3-5mm)',
  'Broodstock Feed', 'Special / Others',
];

const PACKAGE_UNIT_OPTIONS = ['kg', 'g', 'bags', 'units', 'L'];

const MATERIAL_CATALOG = {
  'Maize': { unit: 'kg', unitCost: 220, swatch: '#F59E0B' },
  'Soybean Meal': { unit: 'kg', unitCost: 480, swatch: '#D4A373' },
  'Fishmeal (60%)': { unit: 'kg', unitCost: 780, swatch: '#FEF3C7' },
  'Wheat Bran': { unit: 'kg', unitCost: 160, swatch: '#92400E' },
  'Fish Oil': { unit: 'L', unitCost: 1350, swatch: '#F59E0B' },
  'Cassava': { unit: 'kg', unitCost: 140, swatch: '#E8D5B7' },
  'Rice Bran': { unit: 'kg', unitCost: 120, swatch: '#D4A373' },
  'Vitamin Premix': { unit: 'kg', unitCost: 2500, swatch: '#A7D8DE' },
};

const ModalShell = ({ title, show, onClose, children }) => {
  if (!show) return null;
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalCloseBtn} onClick={onClose} type="button">
            <FiX size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default function CreateFeedBatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const editBatch = location.state?.editBatch || null;
  const isEditing = !!editBatch;
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  // Batch Information fields
  const [feedId, setFeedId] = useState('');
  const [feedTypeId, setFeedTypeId] = useState('');
  const [siteTypeId, setSiteTypeId] = useState('');
  const [siteTypeOptions, setSiteTypeOptions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [machineUsed, setMachineUsed] = useState('');
  const [batchNotes, setBatchNotes] = useState('');

  // Raw Materials table
  const [rawMaterials, setRawMaterials] = useState([]);

  const handleRawMaterialChange = (id, field, value) => {
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: parseFloat(value) || 0 } : m));
  };

  const handleAddMaterial = () => {
    // TODO: replace with real add-material modal/suggestion picker
    const newId = Math.max(...rawMaterials.map(m => m.id)) + 1;
    setRawMaterials([...rawMaterials, { id: newId, name: 'New Material', unit: 'kg', qty: 0, unitCost: 0, swatch: '#D1D5DB' }]);
  };

  const handleRemoveMaterial = (id) => {
    setRawMaterials(rawMaterials.filter(m => m.id !== id));
  };

  const totalRawMaterialQty = rawMaterials.reduce((sum, m) => sum + (parseFloat(m.qty) || 0), 0);
  const totalRawMaterialCost = rawMaterials.reduce((sum, m) => sum + ((parseFloat(m.qty) || 0) * (parseFloat(m.unitCost) || 0)), 0);

  // Production Summary
  const [totalFeedProduced, setTotalFeedProduced] = useState(0);
  const [packagingRows, setPackagingRows] = useState([]);
  const [otherCostInput, setOtherCostInput] = useState(0);
  const [shelfLife, setShelfLife] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Modal state
  const [showFeedProducedModal, setShowFeedProducedModal] = useState(false);
  const [showBagsProducedModal, setShowBagsProducedModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [modalInputValue, setModalInputValue] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState('');
  const [totalBagsProduced, setTotalBagsProduced] = useState(0);
  const [feedOptions, setFeedOptions] = useState([]);
  const [feedTypeDisplay, setFeedTypeDisplay] = useState('');
  const [rawMaterialOptions, setRawMaterialOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [costTypeOptions, setCostTypeOptions] = useState([]);
  const [costTypeDropdownOpen, setCostTypeDropdownOpen] = useState(null);
  const [costTypeDropdownMode, setCostTypeDropdownMode] = useState('list');
  const [costTypeCreateName, setCostTypeCreateName] = useState('');
  const [costTypeCreating, setCostTypeCreating] = useState(false);
  const [costTypeDropdownCoords, setCostTypeDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const [submitting, setSubmitting] = useState(false);

  /* ── Pre-fill form when editing ── */
  useEffect(() => {
    if (!editBatch) return;
    setFeedId(editBatch.feedId || '');
    setFeedTypeDisplay(editBatch.feed?.feedType || '');
    setFeedTypeId(editBatch.feedTypeId || '');
    setSiteTypeId(editBatch.siteTypeId || '');
    setStaffId(editBatch.staffId || '');
    setStartDate(editBatch.productionStartDate ? editBatch.productionStartDate.slice(0, 10) : '');
    setEndDate(editBatch.productionEndDate ? editBatch.productionEndDate.slice(0, 10) : '');
    setMachineUsed(editBatch.machineUsed || '');
    setBatchNotes(editBatch.comments || '');
    setTotalFeedProduced(parseFloat(editBatch.totalFeedProduced) || 0);
    setTotalBagsProduced(parseInt(editBatch.totalBagsProduced, 10) || 0);
    setExpiryDate(editBatch.expiryDate ? editBatch.expiryDate.slice(0, 10) : '');
    if (editBatch.shelfLife) setShelfLife(editBatch.shelfLife);

    // Raw materials
    const rawMats = Array.isArray(editBatch.rawMaterials) ? editBatch.rawMaterials : [];
    const mats = rawMats
      .filter(m => m.rawMaterialId && m.rawMaterial)
      .map(m => ({
        id: m.rawMaterialId,
        name: m.rawMaterial?.name || 'Unknown',
        unit: 'kg',
        qty: parseFloat(m.quantityUsed) || 0,
        unitCost: parseFloat(m.unitCost) || 0,
        swatch: '#6366F1',
      }));
    setRawMaterials(mats);

    // Other cost items
    const costItems = rawMats
      .filter(m => !m.rawMaterialId && m.costTypeId)
      .map((m, i) => ({
        id: i + 1,
        type: m.costTypeId,
        desc: m.comment || '',
        amount: parseFloat(m.amount) || 0,
      }));
    setOtherCostItems(costItems);
  }, [editBatch]);

  /* ── Sync feed info when options load in edit mode ── */
  useEffect(() => {
    if (!isEditing || !feedId || feedOptions.length === 0) return;
    const feed = feedOptions.find(f => f.id === feedId);
    if (feed) {
      setFeedTypeDisplay(feed.feedType || '');
      setFeedTypeId(feed.feedTypeId || '');
    }
  }, [feedOptions, feedId, isEditing]);

  /* ── Fetch feeds from API ── */
  useEffect(() => {
    let cancelled = false;
    const fetchFeeds = async () => {
      try {
        const res = await ApiV2.get('/api/v1/feeds', { params: { siteId: isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '') } });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setFeedOptions(list);
      } catch (err) {
        if (!cancelled) {
          setFeedOptions([]);
          const msg = err?.response?.data?.response_message || err?.response?.data?.message || 'Failed to load feeds.';
          toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
        }
      }
    };
    fetchFeeds();
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch staff from API ── */
  useEffect(() => {
    let cancelled = false;
    const fetchStaff = async () => {
      try {
        const res = await ApiV2.get('/api/v1/staff', { params: { siteId: isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || user?.userSites?.[0]?.id || '') } });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setStaffOptions(list);
      } catch (err) {
        if (!cancelled) {
          setStaffOptions([]);
          const msg = err?.response?.data?.response_message || err?.response?.data?.message || 'Failed to load staff.';
          toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
        }
      }
    };
    fetchStaff();
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch site types from API ── */
  useEffect(() => {
    let cancelled = false;
    const fetchSiteTypes = async () => {
      try {
        const res = await ApiV2.get('/v2/site-types');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setSiteTypeOptions(list);
      } catch (err) {
        if (!cancelled) {
          setSiteTypeOptions([]);
          const msg = err?.response?.data?.response_message || err?.response?.data?.message || 'Failed to load site types.';
          toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
        }
      }
    };
    fetchSiteTypes();
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch raw materials on demand when modal opens ── */
  const openRawMaterialModal = async () => {
    setNewMaterialName('');
    setNewMaterialQty('');
    try {
      const siteId = isSuperAdmin ? activeSite?.id : (user?.siteId || '');
      const params = {};
      if (siteId) params.siteId = siteId;
      const res = await ApiV2.get('/v2/raw-material', { params });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setRawMaterialOptions(list);
      setShowAddMaterialModal(true);
    } catch (err) {
      const serverMsg = err?.response?.data?.response_message || err?.response?.data?.message;
      const networkMsg = !err.response ? 'Network error — please check your internet connection.' : null;
      const finalMsg = serverMsg || networkMsg || 'Failed to load raw materials.';
      toast.error(finalMsg, { className: 'dark-toast', autoClose: 6000 });
      console.error('[RawMaterials] Fetch failed:', {
        endpoint: '/v2/raw-material',
        status: err?.response?.status,
        responseData: err?.response?.data,
        networkMessage: err?.message,
      });
      setRawMaterialOptions([]);
    }
  };

  /* ── Fetch cost types from API ── */
  useEffect(() => {
    let cancelled = false;
    const fetchCostTypes = async () => {
      try {
        const res = await ApiV2.get('/v2/cost-type');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setCostTypeOptions(list);
      } catch (err) {
        if (!cancelled) {
          setCostTypeOptions([]);
          const msg = err?.response?.data?.response_message || err?.response?.data?.message || 'Failed to load cost types.';
          toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
        }
      }
    };
    fetchCostTypes();
    return () => { cancelled = true; };
  }, []);

  /* ── Click-outside for inline cost type dropdown ── */
  useEffect(() => {
    if (costTypeDropdownOpen === null) return;
    const clickOutside = (e) => {
      if (!e.target.closest('[data-cost-dropdown]')) {
        setCostTypeDropdownOpen(null);
        setCostTypeDropdownMode('list');
      }
    };
    const close = () => { setCostTypeDropdownOpen(null); setCostTypeDropdownMode('list'); };
    document.addEventListener('mousedown', clickOutside);
    window.addEventListener('scroll', close, { once: true });
    window.addEventListener('resize', close, { once: true });
    return () => {
      document.removeEventListener('mousedown', clickOutside);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [costTypeDropdownOpen]);

  const handleAddPackaging = () => {
    const newId = Math.max(...packagingRows.map(r => r.id)) + 1;
    setPackagingRows([...packagingRows, { id: newId, unit: 'kg', qty: '' }]);
  };

  const handlePackagingChange = (id, field, value) => {
    setPackagingRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemovePackaging = (id) => {
    setPackagingRows(packagingRows.filter(r => r.id !== id));
  };

  const handleAddFeedProduced = () => {
    const val = parseFloat(modalInputValue);
    if (!isNaN(val) && val > 0) {
      setTotalFeedProduced(prev => prev + val);
    } else {
      toast.error('Please enter a valid quantity greater than 0.', { className: 'dark-toast', autoClose: 4000 });
    }
    setModalInputValue('');
    setShowFeedProducedModal(false);
  };

  const handleAddBagsProduced = () => {
    const val = parseFloat(modalInputValue);
    if (!isNaN(val) && val > 0) {
      setTotalBagsProduced(prev => prev + val);
    } else {
      toast.error('Please enter a valid number of bags greater than 0.', { className: 'dark-toast', autoClose: 4000 });
    }
    setModalInputValue('');
    setShowBagsProducedModal(false);
  };

  const handleTopUpMaterial = () => {
    const val = parseFloat(modalInputValue);
    if (!isNaN(val) && val > 0 && selectedMaterial) {
      setRawMaterials(prev => prev.map(m =>
        m.id === selectedMaterial.id
          ? { ...m, qty: (parseFloat(m.qty) || 0) + val }
          : m
      ));
    } else if (!selectedMaterial) {
      toast.error('No material selected for top-up.', { className: 'dark-toast', autoClose: 4000 });
    } else {
      toast.error('Please enter a valid quantity greater than 0.', { className: 'dark-toast', autoClose: 4000 });
    }
    setModalInputValue('');
    setSelectedMaterial(null);
    setShowTopUpModal(false);
  };

  const handleAddNewMaterial = () => {
    if (!newMaterialName) {
      toast.error('Please select a raw material from the list.', { className: 'dark-toast', autoClose: 4000 });
      return;
    }
    const found = rawMaterialOptions.find(m => m.id === newMaterialName);
    if (!found) {
      toast.error('Selected material not found. Please try again.', { className: 'dark-toast', autoClose: 4000 });
      return;
    }
    const qty = parseFloat(newMaterialQty);
    if (!newMaterialQty || isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than 0.', { className: 'dark-toast', autoClose: 4000 });
      return;
    }
    const already = rawMaterials.find(m => m.id === found.id);
    if (already) {
      setRawMaterials(prev => prev.map(m =>
        m.id === found.id
          ? { ...m, qty: (parseFloat(m.qty) || 0) + (parseFloat(newMaterialQty) || 0) }
          : m
      ));
    } else {
      setRawMaterials([...rawMaterials, {
        id: found.id,
        name: found.name,
        unit: found.unit || 'kg',
        qty: parseFloat(newMaterialQty) || 0,
        unitCost: found.unitCost ? Number(found.unitCost) : 0,
        swatch: '#6366F1',
      }]);
    }
    setNewMaterialName('');
    setNewMaterialQty('');
    setShowAddMaterialModal(false);
  };

  const totalProductionCost = totalRawMaterialCost + (parseFloat(otherCostInput) || 0);
  const costPerKg = totalFeedProduced > 0 ? totalProductionCost / totalFeedProduced : 0;

  // Other Costs Breakdown
  const [otherCostItems, setOtherCostItems] = useState([]);

  const handleCostItemChange = (id, field, value) => {
    setOtherCostItems(prev => prev.map(c => c.id === id ? { ...c, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : c));
  };

  const handleAddCostItem = () => {
    const newId = Math.max(...otherCostItems.map(c => c.id)) + 1;
    const defaultType = costTypeOptions[0]?.id || '';
    setOtherCostItems([...otherCostItems, { id: newId, type: defaultType, desc: '', amount: 0 }]);
  };

  const handleCreateCostType = async (rowId) => {
    const name = costTypeCreateName.trim();
    if (!name) return;
    setCostTypeCreating(true);
    try {
      const res = await ApiV2.post('/v2/cost-type', { name });
      if (res.data?.success) {
        const refreshed = await ApiV2.get('/v2/cost-type');
        const list = Array.isArray(refreshed.data?.data) ? refreshed.data.data : [];
        setCostTypeOptions(list);
        const created = res.data?.data;
        if (created?.id) {
          handleCostItemChange(rowId, 'type', created.id);
        }
        toast.success(`Cost type "${name}" created!`, { className: 'dark-toast' });
        setCostTypeDropdownOpen(null);
        setCostTypeCreateName('');
        setCostTypeDropdownMode('list');
      } else {
        throw new Error(res.data?.response_message || 'Failed to create cost type.');
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.response_message;
      const fallbackMsg = err?.response?.data?.message;
      const networkMsg = err?.message;
      const finalMsg = serverMsg || fallbackMsg || networkMsg || 'An unexpected error occurred.';
      toast.error(finalMsg, { className: 'dark-toast' });
      console.error('[CreateCostType] Failed:', {
        endpoint: '/v2/cost-type',
        payload: { name },
        status: err?.response?.status,
        responseData: err?.response?.data,
        networkMessage: err?.message,
        stack: err?.stack?.split('\n').slice(0, 4).join('\n'),
      });
    } finally {
      setCostTypeCreating(false);
    }
  };

  const handleRemoveCostItem = (id) => {
    setOtherCostItems(otherCostItems.filter(c => c.id !== id));
  };

  // ── Client-side validation ──
  const validate = () => {
    const missing = [];
    if (!isEditing) {
      if (!feedId) missing.push('Feed Name');
      if (!siteTypeId) missing.push('Site');
      if (!staffId) missing.push('Staff');
      if (!startDate) missing.push('Production Start Date');
    }
    if (rawMaterials.length === 0) missing.push('at least one Raw Material');
    return missing;
  };

  // Submit
  const handleSubmit = async () => {
    const missing = validate();
    if (missing.length > 0) {
      toast.error(`Please fill in the required fields: ${missing.join(', ')}`, {
        autoClose: 5000,
        className: 'dark-toast',
      });
      return;
    }
    setSubmitting(true);
    const loadingToast = toast.loading(isEditing ? 'Updating production batch...' : 'Starting production batch...', { className: 'dark-toast' });
    try {
      const basePayload = {
        machineUsed,
        comments: batchNotes || undefined,
        productionEndDate: endDate ? new Date(endDate + 'T00:00:00').toISOString() : undefined,
        rawMaterials: rawMaterials.map(m => ({
          rawMaterialId: String(m.id),
          quantityUsed: parseFloat(m.qty) || 0,
        })),
        costTypes: otherCostItems
          .filter(c => c.type && c.amount > 0)
          .map(c => ({
            costTypeId: c.type,
            amount: c.amount,
            comment: c.desc || undefined,
          })),
      };
      const payload = isEditing ? basePayload : {
        ...basePayload,
        feedId: feedId || undefined,
        siteTypeId: siteTypeId || undefined,
        staffId: staffId || undefined,
        productionStartDate: startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined,
      };
      const res = isEditing
        ? await ApiV2.patch(`/v2/feed-production-batch/${editBatch.batchNumber}`, payload)
        : await ApiV2.post('/v2/feed-production-batch/start', payload);
      if (res.data?.success) {
        toast.update(loadingToast, {
          render: res.data.response_message || (isEditing ? 'Batch updated successfully!' : 'Batch created successfully!'),
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast',
        });
        navigate('/feed/production/history');
      } else {
        throw new Error(res.data?.response_message || `Failed to ${isEditing ? 'update' : 'create'} batch.`);
      }
    } catch (err) {
      const { status, data } = err?.response || {};
      const serverMsg = data?.response_message;
      const fallbackMsg = data?.message;
      const networkMsg = err?.message;
      const fieldErrors = data?.errors || data?.fieldErrors;
      let finalMsg;

      if (!err.response) {
        finalMsg = 'Network error — please check your internet connection and try again.';
      } else if (status === 422 || status === 400) {
        if (fieldErrors && typeof fieldErrors === 'object') {
          const lines = Object.entries(fieldErrors)
            .map(([key, msgs]) => `• ${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
          finalMsg = `Validation failed:\n${lines.slice(0, 5).join('\n')}${lines.length > 5 ? `\n…and ${lines.length - 5} more` : ''}`;
        } else {
          finalMsg = serverMsg || `Request was rejected (status ${status}).`;
        }
      } else if (status >= 500) {
        finalMsg = 'Server error — please try again later or contact support.';
      } else {
        finalMsg = serverMsg || fallbackMsg || networkMsg || 'An unexpected error occurred.';
      }

      toast.update(loadingToast, {
        render: finalMsg,
        type: 'error',
        isLoading: false,
        autoClose: 8000,
        className: 'dark-toast',
      });
      console.error(`[CreateBatch] Failed to ${isEditing ? 'update' : 'start'} batch:`, {
        endpoint: isEditing ? `/v2/feed-production-batch/${editBatch.batchNumber}` : '/v2/feed-production-batch/start',
        status,
        statusText: err?.response?.statusText,
        responseData: data,
        networkMessage: err?.message,
        stack: err?.stack?.split('\n').slice(0, 4).join('\n'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`${feedStyles.body}`}>
      <ToastContainer />
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${feedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${feedStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>

            {/* ── Breadcrumb ── */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Feed Management</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbItem}>Feed Production</span>
              <span className={styles.breadcrumbSep}>&gt;</span>
              <span className={styles.breadcrumbActive}>{isEditing ? 'Edit Batch' : 'Create Batch'}</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>{isEditing ? `Edit Batch #${editBatch.batchNumber}` : 'Create Feed Production Batch'}</h1>
                <p className={styles.pageSubtitle}>{isEditing ? 'Update the details of this production batch.' : 'Record a new batch of feed produced from raw materials.'}</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.backBtn} onClick={() => navigate('/feed/production/history')}>
                  <FiArrowLeft size={14} />
                  Back to Production
                </button>
              </div>
            </div>

            {/* ── Card: Batch Information ── */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Batch Information</h2>
              <div className={styles.formGrid}>
                {/* Row 1 */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Feed Name <span className={styles.required}>*</span></label>
                   <CustomDropdown
                      options={feedOptions.map(f => ({ value: f.id, label: f.feedName }))}
                      value={feedId}
                      onChange={(val) => {
                        setFeedId(val);
                        const feed = feedOptions.find(f => f.id === val);
                        if (feed) {
                          setFeedTypeDisplay(feed.feedType || '');
                          setFeedTypeId(feed.feedTypeId || '');
                          if (feed.siteTypeId) setSiteTypeId(feed.siteTypeId);
                        } else {
                          setFeedTypeDisplay('');
                          setFeedTypeId('');
                        }
                      }}
                      placeholder="— Select Feed —"
                      className={styles.fieldDropdown}
                      triggerClassName={styles.fieldTrigger}
                    />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Feed Type</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={feedTypeDisplay}
                    readOnly
                    placeholder="Auto-populated from feed"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Site <span className={styles.required}>*</span></label>
                   <CustomDropdown
                      options={siteTypeOptions.map(s => ({ value: s.id, label: s.name }))}
                      value={siteTypeId}
                      onChange={(val) => setSiteTypeId(val)}
                      placeholder="— Select Site —"
                      className={styles.fieldDropdown}
                      triggerClassName={styles.fieldTrigger}
                    />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Production Period (Start and End Date) <span className={styles.required}>*</span></label>
                  <div className={styles.dateFieldGroup}>
                    <div className={styles.dateField}>
                      <input
                        type="date"
                        className={styles.dateTextInput}
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        placeholder="Start Date"
                      />
                    </div>
                    <div className={styles.dateField}>
                      <input
                        type="date"
                        className={styles.dateTextInput}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Produced By <span className={styles.required}>*</span></label>
                  <CustomDropdown
                    options={staffOptions.map(s => ({ value: s.id, label: s.name }))}
                    value={staffId}
                    onChange={(val) => setStaffId(val)}
                    placeholder="— Select Staff —"
                    className={styles.fieldDropdown}
                    triggerClassName={styles.fieldTrigger}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Machine Used <span className={styles.optional}>(Optional)</span></label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={machineUsed}
                    onChange={e => setMachineUsed(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Batch Notes <span className={styles.optional}>(Optional)</span></label>
                  <textarea
                    className={styles.textareaInput}
                    value={batchNotes}
                    onChange={e => setBatchNotes(e.target.value)}
                    placeholder="Enter any notes..."
                  />
                </div>
              </div>
            </div>

            {/* ── Two-column row: Raw Materials + Production Summary ── */}
            <div className={styles.sectionRow}>
              <div className={styles.leftCol}>
                <div className={styles.card}>
                  <div className={styles.cardHeaderRow}>
                    <div>
                      <h2 className={styles.cardTitle}>Raw Materials Used</h2>
                      <p className={styles.cardSubtitle}>Add the raw materials and quantities used for this batch.</p>
                    </div>
                    <button className={styles.addBtnOutline} onClick={openRawMaterialModal}>
                      <FiPlus size={14} />
                      Add Material
                    </button>
                  </div>
                  <div className={styles.tableWrapper}>
                    <DataTable
                      className={styles.rawTable}
                      columns={[
                        { key: 'index', label: '#', render: (_, row, i) => <span className={styles.rowNum}>{i + 1}</span> },
                        {
                          key: 'name',
                          label: 'Raw Material',
                          render: (value, row) => (
                            <div className={styles.materialNameCell}>
                              <span className={styles.materialSwatch} style={{ background: row.swatch }} />
                              <span className={styles.materialName}>{row.name}</span>
                            </div>
                          ),
                        },
                        { key: 'unit', label: 'Unit' },
                        {
                          key: 'qty',
                          label: 'Quantity Used',
                          render: (value, row) => (
                            <input
                              type="number"
                              className={styles.inlineInput}
                              value={row.qty}
                              onChange={e => handleRawMaterialChange(row.id, 'qty', e.target.value)}
                              step="0.01"
                            />
                          ),
                        },
                        {
                          key: 'unitCost',
                          label: 'Unit Cost (₦)',
                          render: (value, row) => (
                            <input
                              type="number"
                              className={styles.inlineInput}
                              value={row.unitCost}
                              onChange={e => handleRawMaterialChange(row.id, 'unitCost', e.target.value)}
                              step="0.01"
                            />
                          ),
                        },
                        {
                          key: 'totalCost',
                          label: 'Total Cost (₦)',
                          render: (_, row) => <span className={styles.totalCostCell}>{formatCurrency((parseFloat(row.qty) || 0) * (parseFloat(row.unitCost) || 0))}</span>,
                        },
                      ]}
                      data={rawMaterials}
                      actions={(m) => (
                        <PortalDropdown
                          btnClass={feedStyles.threeDotBtn}
                          menuStyle={{
                            background: '#fff',
                            color: '#374151',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            borderRadius: 8,
                            padding: '4px 0',
                          }}
                          items={[
                            {
                              label: 'Top Up Raw Material',
                              onClick: () => { setSelectedMaterial(m); setModalInputValue(''); setShowTopUpModal(true); },
                            },
                            {
                              label: 'Delete',
                              onClick: () => handleRemoveMaterial(m.id),
                              style: { color: '#DC2626' },
                            },
                          ]}
                        />
                      )}
                    />
                  </div>
                  <div className={styles.tableFooter}>
                    <div>
                      <span className={styles.footerLabel}>Total Raw Materials</span>
                      <span className={styles.footerValue}>{rawMaterials.length} items</span>
                    </div>
                    <div>
                      <span className={styles.footerLabel}>Total Quantity Used</span>
                      <span className={styles.footerValue}>{f(totalRawMaterialQty)} kg</span>
                    </div>
                    <div>
                      <span className={styles.footerLabel}>Total Raw Material Cost (₦)</span>
                      <span className={styles.footerValue}>{formatCurrency(totalRawMaterialCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.rightCol}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Production Summary</h2>

                  {/* Total Feed Produced */}
                  <div className={styles.totalBox}>
                    <div className={styles.totalBoxContent}>
                      <div>
                        <span className={styles.totalBoxLabel}>Total Feed Produced</span>
                        <div className={styles.totalBoxValueRow}>
                          <span className={styles.totalBoxValue}>{f(totalFeedProduced)}</span>
                          <span className={styles.totalBoxUnit}>kg</span>
                        </div>
                      </div>
                      <div className={styles.totalBoxActions}>
                        <button
                          className={styles.smallPlusBtn}
                          onClick={() => { setModalInputValue(''); setShowFeedProducedModal(true); }}
                          type="button"
                        >
                          <FiPlus size={13} />
                        </button>
                        <BsBoxSeam size={48} color="#16A34A" />
                      </div>
                    </div>
                  </div>

                  {/* Packaging rows */}
                  {packagingRows.map((row, idx) => (
                    <div key={row.id} className={styles.packagingRow}>
                      <div className={styles.packagingField}>
                        <label className={styles.fieldLabel}>Packaging Unit</label>
                        <CustomDropdown
                          options={PACKAGE_UNIT_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                          value={row.unit}
                          onChange={(val) => handlePackagingChange(row.id, 'unit', val)}
                          className={styles.fieldDropdown}
                          triggerClassName={styles.fieldTrigger}
                        />
                      </div>
                      <div className={styles.packagingField}>
                        <label className={styles.fieldLabel}>Bags / Units Produced</label>
                        {idx === 0 ? (
                          <div className={styles.bagsDisplayRow}>
                            <span className={styles.bagsDisplayValue}>{f(totalBagsProduced)}</span>
                            <button
                              className={styles.tinyPlusBtn}
                              onClick={() => { setModalInputValue(''); setShowBagsProducedModal(true); }}
                              type="button"
                            >
                              <FiPlus size={11} />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="number"
                            className={styles.textInput}
                            value={row.qty}
                            onChange={e => handlePackagingChange(row.id, 'qty', e.target.value)}
                            placeholder="—"
                            min="0"
                          />
                        )}
                      </div>
                      {idx > 0 && (
                        <button className={styles.deleteBtn} onClick={() => handleRemovePackaging(row.id)}>
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className={styles.addLinkBtn} onClick={handleAddPackaging}>
                    <FiPlus size={13} />
                    Add Packaging
                  </button>

                  {/* Total Raw Material Cost */}
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Total Raw Material Cost (₦)</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalRawMaterialCost)}</span>
                  </div>

                  {/* Other Costs */}
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>
                      Other Costs (₦)
                      <span className={styles.infoIcon} title="Additional costs incurred during production">
                        <FiInfo size={13} />
                      </span>
                    </span>
                    <input
                      type="number"
                      className={styles.summaryInput}
                      value={otherCostInput}
                      onChange={e => setOtherCostInput(parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>

                  <div className={styles.divider} />

                  {/* Total Production Cost */}
                  <div className={styles.totalCostBand}>
                    <span className={styles.totalCostLabel}>Total Production Cost (₦)</span>
                    <span className={styles.totalCostValue}>{formatCurrency(totalProductionCost)}</span>
                  </div>

                  {/* Cost per kg */}
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Cost per kg (₦)</span>
                    <span className={styles.summaryValue}>{formatCurrency(costPerKg)}</span>
                  </div>

                  {/* Shelf Life + Expiry Date */}
                  <div className={styles.twoFieldRow}>
                    <div className={styles.fieldHalf}>
                      <label className={styles.fieldLabel}>Shelf Life (Days) <span className={styles.optional}>(Optional)</span></label>
                      <input
                        type="number"
                        className={styles.textInput}
                        value={shelfLife}
                        onChange={e => setShelfLife(e.target.value)}
                      />
                    </div>
                    <div className={styles.fieldHalf}>
                      <label className={styles.fieldLabel}>Expiry Date <span className={styles.optional}>(Optional)</span></label>
                      <div className={styles.dateField}>
                        <input
                          type="date"
                          className={styles.dateTextInput}
                          value={expiryDate}
                          onChange={e => setExpiryDate(e.target.value)}
                          placeholder="Select date"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Two-column row: Other Costs + Attachments ── */}
            <div className={styles.sectionRow}>
              <div className={styles.leftCol}>
                <div className={styles.card}>
                  <div className={styles.cardHeaderRow}>
                    <div>
                      <h2 className={styles.cardTitle}>Other Costs (Breakdown)</h2>
                      <p className={styles.cardSubtitle}>Add other costs incurred in this production (optional).</p>
                    </div>
                  </div>
                  <div className={styles.tableWrapper}>
                    <DataTable
                      className={styles.rawTable}
                      columns={[
                        {
                          key: 'type',
                          label: 'Cost Type',
                          render: (value, item) => {
                            const isOpen = costTypeDropdownOpen === item.id;
                            const selectedName = costTypeOptions.find(o => o.id === value)?.name || '';
                            return (
                              <div data-cost-dropdown="true" style={{ position: 'relative' }}>
                                <div
                                  className={styles.fieldTrigger}
                                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                                  onClick={(e) => {
                                    if (isOpen) {
                                      setCostTypeDropdownOpen(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setCostTypeDropdownCoords({ top: rect.bottom + 2, left: rect.left, width: rect.width });
                                      setCostTypeDropdownOpen(item.id);
                                      setCostTypeDropdownMode('list');
                                      setCostTypeCreateName('');
                                    }
                                  }}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {selectedName || <span style={{ color: '#9CA3AF' }}>Select...</span>}
                                  </span>
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                {isOpen && (
                                  <div
                                    className={styles.costDropdownPanel}
                                    style={{ top: costTypeDropdownCoords.top, left: costTypeDropdownCoords.left, width: Math.max(costTypeDropdownCoords.width, 300) }}
                                  >
                                    {costTypeDropdownMode === 'list' ? (
                                      <>
                                        {costTypeOptions.length === 0 && (
                                          <div className={styles.costDropdownOption} style={{ color: '#9CA3AF', fontStyle: 'italic', cursor: 'default' }}>
                                            No cost types available
                                          </div>
                                        )}
                                        {costTypeOptions.map(opt => (
                                          <div
                                            key={opt.id}
                                            className={`${styles.costDropdownOption} ${value === opt.id ? styles.costDropdownOptionActive : ''}`}
                                            onClick={() => {
                                              handleCostItemChange(item.id, 'type', opt.id);
                                              setCostTypeDropdownOpen(null);
                                            }}
                                          >
                                            {opt.name}
                                          </div>
                                        ))}
                                        <div
                                          className={styles.costDropdownCreateBtn}
                                          onClick={() => { setCostTypeDropdownMode('create'); setCostTypeCreateName(''); }}
                                        >
                                          <span style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: '#512728', color: '#fff', fontSize: 16, flexShrink: 0,
                                          }}>+</span>
                                          Create cost type
                                        </div>
                                      </>
                                    ) : (
                                      <div className={styles.costDropdownCreateForm}>
                                        <div className={styles.costDropdownCreateTitle}>New Cost Type</div>
                                        <div className="d-flex gap-2" style={{ flexWrap: 'nowrap' }}>
                                          <input
                                            type="text"
                                            placeholder="Enter name"
                                            value={costTypeCreateName}
                                            onChange={e => setCostTypeCreateName(e.target.value)}
                                            autoFocus
                                            className={styles.costDropdownCreateInput}
                                            onKeyDown={e => { if (e.key === 'Enter') handleCreateCostType(item.id); }}
                                          />
                                          <button
                                            className={styles.costDropdownCreateBtnAction}
                                            onClick={() => handleCreateCostType(item.id)}
                                            disabled={costTypeCreating || !costTypeCreateName.trim()}
                                          >
                                            {costTypeCreating ? '...' : 'Save'}
                                          </button>
                                          <button
                                            className={styles.costDropdownCreateBtnCancel}
                                            onClick={() => { setCostTypeDropdownMode('list'); setCostTypeCreateName(''); }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        },
                        {
                          key: 'desc',
                          label: 'Description',
                          render: (value, item) => (
                            <input
                              type="text"
                              className={styles.inlineInput}
                              value={item.desc}
                              onChange={e => handleCostItemChange(item.id, 'desc', e.target.value)}
                              placeholder="Enter description"
                            />
                          ),
                        },
                        {
                          key: 'amount',
                          label: 'Amount (₦)',
                          render: (value, item) => (
                            <input
                              type="number"
                              className={styles.inlineInput}
                              value={item.amount}
                              onChange={e => handleCostItemChange(item.id, 'amount', e.target.value)}
                              step="0.01"
                              style={{ textAlign: 'right' }}
                            />
                          ),
                        },
                      ]}
                      data={otherCostItems}
                      actions={(item) => (
                        <PortalDropdown
                          btnClass={feedStyles.threeDotBtn}
                          menuStyle={{
                            background: '#fff',
                            color: '#374151',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            borderRadius: 8,
                            padding: '4px 0',
                          }}
                          items={[
                            {
                              label: 'Delete',
                              onClick: () => handleRemoveCostItem(item.id),
                              style: { color: '#DC2626' },
                            },
                          ]}
                        />
                      )}
                    />
                  </div>
                  <button className={styles.addBtnOutline} onClick={handleAddCostItem}>
                    <FiPlus size={14} />
                    Add Cost Item
                  </button>
                </div>
              </div>

              <div className={styles.rightCol}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Attachments (Optional)</h2>
                  <p className={styles.cardSubtitle}>Upload supporting documents (e.g., formula, lab result).</p>
                  <div className={styles.dropzone}>
                    <FiUploadCloud size={36} className={styles.uploadIcon} />
                    <span className={styles.dropzoneText}>Drag and drop files here or click to browse</span>
                    <span className={styles.dropzoneHint}>PDF, PNG, JPG up to 5MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Page Footer ── */}
            <div className={styles.pageFooter}>
              <button className={styles.cancelBtn} onClick={() => navigate('/feed/production/history')}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update Batch' : 'Save & Create Batch'}
              </button>
            </div>

            {/* ── Modals ── */}
            <ModalShell title="Add Feed Produced" show={showFeedProducedModal} onClose={() => { setModalInputValue(''); setShowFeedProducedModal(false); }}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Quantity (kg)</label>
                <input type="number" className={styles.modalInput} value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} step="0.01" placeholder="Enter quantity" autoFocus />
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancelBtn} onClick={() => { setModalInputValue(''); setShowFeedProducedModal(false); }} type="button">Cancel</button>
                <button className={styles.modalSaveBtn} onClick={handleAddFeedProduced} type="button">Add</button>
              </div>
            </ModalShell>

            <ModalShell title="Add Bags Produced" show={showBagsProducedModal} onClose={() => { setModalInputValue(''); setShowBagsProducedModal(false); }}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Number of Bags</label>
                <input type="number" className={styles.modalInput} value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} step="1" placeholder="Enter number" autoFocus />
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancelBtn} onClick={() => { setModalInputValue(''); setShowBagsProducedModal(false); }} type="button">Cancel</button>
                <button className={styles.modalSaveBtn} onClick={handleAddBagsProduced} type="button">Add</button>
              </div>
            </ModalShell>

            <ModalShell title={selectedMaterial ? `Top Up \u2014 ${selectedMaterial.name}` : ''} show={showTopUpModal} onClose={() => { setModalInputValue(''); setSelectedMaterial(null); setShowTopUpModal(false); }}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Additional Quantity {selectedMaterial ? `(${selectedMaterial.unit})` : ''}</label>
                <input type="number" className={styles.modalInput} value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} step="0.01" placeholder="Enter quantity" autoFocus />
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancelBtn} onClick={() => { setModalInputValue(''); setSelectedMaterial(null); setShowTopUpModal(false); }} type="button">Cancel</button>
                <button className={styles.modalSaveBtn} onClick={handleTopUpMaterial} type="button">Add</button>
              </div>
            </ModalShell>

            <ModalShell title="Add Raw Material" show={showAddMaterialModal} onClose={() => { setNewMaterialName(''); setNewMaterialQty(''); setShowAddMaterialModal(false); }}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Raw Material</label>
                <CustomDropdown
                  options={rawMaterialOptions.map(m => ({ value: m.id, label: m.name }))}
                  value={newMaterialName}
                  onChange={(val) => {
                    setNewMaterialName(val);
                    const found = rawMaterialOptions.find(m => m.id === val);
                    if (found) setNewMaterialQty('');
                  }}
                  placeholder="— Select Material —"
                  className={styles.fieldDropdown}
                  triggerClassName={styles.fieldTrigger}
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Quantity Used</label>
                <input type="number" className={styles.modalInput} value={newMaterialQty} onChange={e => setNewMaterialQty(e.target.value)} step="0.01" placeholder="Enter quantity" />
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancelBtn} onClick={() => { setNewMaterialName(''); setNewMaterialQty(''); setShowAddMaterialModal(false); }} type="button">Cancel</button>
                <button className={styles.modalSaveBtn} onClick={handleAddNewMaterial} type="button">Add Material</button>
              </div>
            </ModalShell>

          </main>
        </section>
      </div>
    </section>
  );
}

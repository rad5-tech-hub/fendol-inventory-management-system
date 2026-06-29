import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiUploadCloud, FiInfo, FiTrash2, FiX } from 'react-icons/fi';
import { IoCalendarOutline, IoChevronDown } from 'react-icons/io5';
import { BsBoxSeam } from 'react-icons/bs';
import { createPortal } from 'react-dom';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import PortalDropdown from '../../shared/portal-dropdown/PortalDropdown';
import feedStyles from '../feed.module.scss';
import styles from './create-batch.module.scss';

const formatCurrency = (n) =>
  '\u20A6' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const f = (n) => new Intl.NumberFormat().format(n);

const FEED_TYPE_OPTIONS = [
  'Starter (0-1mm)', 'Grower (1-3mm)', 'Finisher (3-5mm)',
  'Broodstock Feed', 'Special / Others',
];

const COST_TYPE_OPTIONS = [
  'Labor', 'Utilities (Power)', 'Transportation', 'Maintenance',
  'Packaging', 'Other',
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
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  // Batch Information fields
  const [feedName, setFeedName] = useState('Starter Feed - Batch 018');
  const [feedType, setFeedType] = useState('Starter (0-1mm)');
  const [startDate, setStartDate] = useState('May 24, 2025');
  const [endDate, setEndDate] = useState('May 24, 2025');
  const [producedBy, setProducedBy] = useState('John Doe');
  const [machineUsed, setMachineUsed] = useState('Hammer Mill Line 1');
  const [batchNotes, setBatchNotes] = useState('');

  // Raw Materials table
  const [rawMaterials, setRawMaterials] = useState([
    { id: 1, name: 'Maize', unit: 'kg', qty: 500, unitCost: 220, swatch: '#F59E0B' },
    { id: 2, name: 'Soybean Meal', unit: 'kg', qty: 300, unitCost: 480, swatch: '#D4A373' },
    { id: 3, name: 'Fishmeal (60%)', unit: 'kg', qty: 200, unitCost: 780, swatch: '#FEF3C7' },
    { id: 4, name: 'Wheat Bran', unit: 'kg', qty: 150, unitCost: 160, swatch: '#92400E' },
    { id: 5, name: 'Fish Oil', unit: 'L', qty: 20, unitCost: 1350, swatch: '#F59E0B' },
  ]);

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
  const [totalFeedProduced, setTotalFeedProduced] = useState(1000);
  const [packagingRows, setPackagingRows] = useState([{ id: 1, unit: 'kg', qty: '' }]);
  const [otherCostInput, setOtherCostInput] = useState(25000);
  const [shelfLife, setShelfLife] = useState('90');
  const [expiryDate, setExpiryDate] = useState('Aug 22, 2025');

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
    if (!isNaN(val) && val > 0) setTotalFeedProduced(prev => prev + val);
    setModalInputValue('');
    setShowFeedProducedModal(false);
  };

  const handleAddBagsProduced = () => {
    const val = parseFloat(modalInputValue);
    if (!isNaN(val) && val > 0) setTotalBagsProduced(prev => prev + val);
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
    }
    setModalInputValue('');
    setSelectedMaterial(null);
    setShowTopUpModal(false);
  };

  const handleAddNewMaterial = () => {
    if (!newMaterialName.trim()) return;
    const info = MATERIAL_CATALOG[newMaterialName];
    const newId = Math.max(...rawMaterials.map(m => m.id), 0) + 1;
    setRawMaterials([...rawMaterials, {
      id: newId,
      name: newMaterialName,
      unit: info?.unit || 'kg',
      qty: parseFloat(newMaterialQty) || 0,
      unitCost: info?.unitCost || 0,
      swatch: info?.swatch || '#D1D5DB',
    }]);
    setNewMaterialName('');
    setNewMaterialQty('');
    setShowAddMaterialModal(false);
  };

  const totalProductionCost = totalRawMaterialCost + (parseFloat(otherCostInput) || 0);
  const costPerKg = totalFeedProduced > 0 ? totalProductionCost / totalFeedProduced : 0;

  // Other Costs Breakdown
  const [otherCostItems, setOtherCostItems] = useState([
    { id: 1, type: 'Labor', desc: 'Production staff wages', amount: 15000 },
    { id: 2, type: 'Utilities (Power)', desc: 'Electricity for production', amount: 10000 },
  ]);

  const handleCostItemChange = (id, field, value) => {
    setOtherCostItems(prev => prev.map(c => c.id === id ? { ...c, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : c));
  };

  const handleAddCostItem = () => {
    const newId = Math.max(...otherCostItems.map(c => c.id)) + 1;
    setOtherCostItems([...otherCostItems, { id: newId, type: COST_TYPE_OPTIONS[0], desc: '', amount: 0 }]);
  };

  const handleRemoveCostItem = (id) => {
    setOtherCostItems(otherCostItems.filter(c => c.id !== id));
  };

  // Submit
  const handleSubmit = () => {
    // TODO: replace with real API call
    // const payload = { feedName, feedType, startDate, endDate, producedBy, machineUsed, batchNotes, rawMaterials, totalFeedProduced, packagingRows, otherCostInput, otherCostItems, shelfLife, expiryDate };
    // await Api.post('/create-feed-batch', payload);
    navigate('/feed/production/history');
  };

  return (
    <section className={`${feedStyles.body}`}>
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
              <span className={styles.breadcrumbActive}>Create Batch</span>
            </div>

            {/* ── Page Header ── */}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>Create Feed Production Batch</h1>
                <p className={styles.pageSubtitle}>Record a new batch of feed produced from raw materials.</p>
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
                  <label className={styles.fieldLabel}>Feed name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={feedName}
                    onChange={e => setFeedName(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Feed Type <span className={styles.required}>*</span></label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.selectInput}
                      value={feedType}
                      onChange={e => setFeedType(e.target.value)}
                    >
                      {FEED_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <IoChevronDown size={13} className={styles.selectChevron} />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Production Period (Start and End Date) <span className={styles.required}>*</span></label>
                  <div className={styles.dateFieldGroup}>
                    <div className={styles.dateField}>
                      <input
                        type="text"
                        className={styles.dateTextInput}
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        placeholder="Start Date"
                      />
                      <IoCalendarOutline size={15} className={styles.dateIcon} />
                    </div>
                    <div className={styles.dateField}>
                      <input
                        type="text"
                        className={styles.dateTextInput}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        placeholder="End Date"
                      />
                      <IoCalendarOutline size={15} className={styles.dateIcon} />
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Produced By <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={producedBy}
                    onChange={e => setProducedBy(e.target.value)}
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
                    <button className={styles.addBtnOutline} onClick={() => { setNewMaterialName(''); setNewMaterialQty(''); setShowAddMaterialModal(true); }}>
                      <FiPlus size={14} />
                      Add Material
                    </button>
                  </div>
                  <div className={styles.tableWrapper}>
                    <table className={styles.rawTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Raw Material</th>
                          <th>Unit</th>
                          <th>Quantity Used</th>
                          <th>Unit Cost (₦)</th>
                          <th>Total Cost (₦)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rawMaterials.map((m, i) => (
                          <tr key={m.id}>
                            <td className={styles.rowNum}>{i + 1}</td>
                            <td>
                              <div className={styles.materialNameCell}>
                                <span className={styles.materialSwatch} style={{ background: m.swatch }} />
                                <span className={styles.materialName}>{m.name}</span>
                              </div>
                            </td>
                            <td>{m.unit}</td>
                            <td>
                              <input
                                type="number"
                                className={styles.inlineInput}
                                value={m.qty}
                                onChange={e => handleRawMaterialChange(m.id, 'qty', e.target.value)}
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className={styles.inlineInput}
                                value={m.unitCost}
                                onChange={e => handleRawMaterialChange(m.id, 'unitCost', e.target.value)}
                                step="0.01"
                              />
                            </td>
                            <td className={styles.totalCostCell}>{formatCurrency((parseFloat(m.qty) || 0) * (parseFloat(m.unitCost) || 0))}</td>
                            <td>
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        <div className={styles.selectWrapper}>
                          <select
                            className={styles.selectInput}
                            value={row.unit}
                            onChange={e => handlePackagingChange(row.id, 'unit', e.target.value)}
                          >
                            {PACKAGE_UNIT_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <IoChevronDown size={13} className={styles.selectChevron} />
                        </div>
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
                          type="text"
                          className={styles.dateTextInput}
                          value={expiryDate}
                          onChange={e => setExpiryDate(e.target.value)}
                          placeholder="Select date"
                        />
                        <IoCalendarOutline size={15} className={styles.dateIcon} />
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
                    <table className={styles.rawTable}>
                      <thead>
                        <tr>
                          <th>Cost Type</th>
                          <th>Description</th>
                          <th>Amount (₦)</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherCostItems.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div className={styles.selectWrapper}>
                                <select
                                  className={styles.selectInput}
                                  value={item.type}
                                  onChange={e => handleCostItemChange(item.id, 'type', e.target.value)}
                                >
                                  {COST_TYPE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <IoChevronDown size={13} className={styles.selectChevron} />
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.inlineInput}
                                value={item.desc}
                                onChange={e => handleCostItemChange(item.id, 'desc', e.target.value)}
                                placeholder="Enter description"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className={styles.inlineInput}
                                value={item.amount}
                                onChange={e => handleCostItemChange(item.id, 'amount', e.target.value)}
                                step="0.01"
                                style={{ textAlign: 'right' }}
                              />
                            </td>
                            <td>
                              <button className={styles.deleteBtn} onClick={() => handleRemoveCostItem(item.id)}>
                                <FiTrash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
              <button className={styles.saveBtn} onClick={handleSubmit}>
                Save &amp; Create Batch
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
                <label className={styles.modalLabel}>Raw Material Name</label>
                <div className={styles.selectWrapper}>
                  <select className={styles.selectInput} value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)}>
                    <option value="">— Select Material —</option>
                    {Object.keys(MATERIAL_CATALOG).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <IoChevronDown size={13} className={styles.selectChevron} />
                </div>
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

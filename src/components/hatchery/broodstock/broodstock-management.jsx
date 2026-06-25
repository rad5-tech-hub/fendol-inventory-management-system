import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import SiteSelector from '../../shared/site-selector/SiteSelector';
import {
  BsGenderFemale, BsCheckCircleFill, BsHeartFill, BsPlusCircleFill,
  BsPauseFill, BsDropletFill, BsPlusLg, BsXLg,
} from 'react-icons/bs';
import { FaArrowRight, FaPlus, FaSkull } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import sharedStyles from '../hatchery.module.scss';
import styles from './broodstock-management.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);

const statCards = [
  {
    label: 'Total Females',
    value: f(186),
    sub: 'Active females',
    icon: BsGenderFemale,
    bg: '#F3E8FF',
    color: '#9333EA',
  },
  {
    label: 'Active (In Use)',
    value: f(112),
    sub: '60.2% of total',
    icon: BsCheckCircleFill,
    bg: '#DCFCE7',
    color: '#16A34A',
  },
  {
    label: 'Retired',
    value: f(48),
    sub: '25.8% of total',
    icon: BsHeartFill,
    bg: '#FEF3C7',
    color: '#D97706',
  },
  {
    label: 'Sick / Under Treatment',
    value: f(14),
    sub: '7.5% of total',
    icon: BsPlusCircleFill,
    bg: '#FEE2E2',
    color: '#DC2626',
  },
  {
    label: 'Total Inactive',
    value: f(12),
    sub: 'Currently inactive',
    icon: BsPauseFill,
    bg: '#F3F4F6',
    color: '#6B7280',
  },
];

const genderData = [
  { name: 'Female', value: 186 },
  { name: 'Male', value: 24 },
];
const GENDER_COLORS = ['#3B82F6', '#F97316'];

const siteData = [
  { site: 'Main Hatchery', females: 98, males: 10, pct: 52.7 },
  { site: 'West Nursery', females: 54, males: 6, pct: 29.0 },
  { site: 'South Grow-out', females: 20, males: 5, pct: 10.8 },
  { site: 'East Extension', females: 14, males: 3, pct: 7.5 },
];

const maxFemales = Math.max(...siteData.map((d) => d.females));

const activities = [
  {
    main: '2 Broodstock moved',
    detail: 'From Main Hatchery to West Nursery',
    actor: 'by John Smith',
    time: '10 mins ago',
    icon: FaArrowRight,
    bg: '#DCFCE7',
    color: '#16A34A',
  },
  {
    main: '1 Female marked as Sick',
    detail: 'Female ID: FB-00231',
    actor: 'by Sarah Mike',
    time: '45 mins ago',
    icon: BsDropletFill,
    bg: '#FEE2E2',
    color: '#DC2626',
  },
  {
    main: '3 Broodstock set to In Use',
    detail: 'Female IDs: FB-00215, FB-00216, FB-00217',
    actor: 'by Sarah Mike',
    time: '2 hours ago',
    icon: BsCheckCircleFill,
    bg: '#DCFCE7',
    color: '#16A34A',
  },
  {
    main: '2 Broodstock retired',
    detail: 'Female IDs: FB-00102, FB-00108',
    actor: 'by John Smith',
    time: '5 hours ago',
    icon: BsHeartFill,
    bg: '#FEF3C7',
    color: '#D97706',
  },
  {
    main: '1 Female died',
    detail: 'Female ID: FB-00155',
    actor: 'by Admin User',
    time: 'Yesterday',
    icon: FaPlus,
    bg: '#FEE2E2',
    color: '#DC2626',
  },
  {
    main: '4 New Broodstock added',
    detail: 'Female IDs: FB-00240 – FB-00243',
    actor: 'by Sarah Mike',
    time: 'Yesterday',
    icon: FaPlus,
    bg: '#DBEAFE',
    color: '#2563EB',
  },
];

export default function BroodstockManagement() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sites, setSites] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logData, setLogData] = useState({
    sick: '',
    mortality: '',
    retired: '',
  });
  const [formData, setFormData] = useState({
    quantity: '',
    gender: 'Female',
    age: '',
    ageUnit: 'weeks',
    origin: '',
    site: '',
    weight: '',
    description: '',
  });

  const resetForm = useCallback(() => {
    setFormData({
      quantity: '',
      gender: 'Female',
      age: '',
      ageUnit: 'weeks',
      origin: '',
      site: '',
      weight: '',
      description: '',
    });
  }, []);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setSites(data);
      } catch {
        if (!cancelled) setSites([]);
      }
    };
    fetchSites();
    return () => { cancelled = true; };
  }, [showModal]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success('Broodstock added successfully!');
      setShowModal(false);
      resetForm();
    } catch {
      toast.error('Failed to add broodstock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogSubmit = async () => {
    setLogSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success('Activity logged successfully!');
      setShowLogModal(false);
      setLogData({ sick: '', mortality: '', retired: '' });
    } catch {
      toast.error('Failed to log activity');
    } finally {
      setLogSubmitting(false);
    }
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);
  const handleSiteChange = (id, name) => setSelectedSite(id);

  return (
    <section className={`${sharedStyles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${sharedStyles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${sharedStyles.content} flex-grow-1`}>
          <main className={styles.pageWrapper}>
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <div className={styles.breadcrumb}>
                  <span>Hatchery</span>
                  <span> &gt; </span>
                  <span className={styles.breadcrumbLink}>Broodstock Management</span>
                </div>
                <h1 className={styles.pageTitle}>Broodstock Management</h1>
                <p className={styles.pageSubtitle}>
                  Monitor and manage your broodstock population and their status.
                </p>
              </div>
              <div className={styles.headerRight}>
                <SiteSelector
                  value={selectedSite}
                  onChange={handleSiteChange}
                  allSitesLabel="All Sites"
                />
                <button className={styles.btnLogActivity} onClick={() => setShowLogModal(true)}>
                  Log Activity
                </button>
                <button
                  className={styles.btnAddBroodstock}
                  onClick={() => setShowModal(true)}
                >
                  + Add Broodstock
                </button>
              </div>
            </div>

            <div className={styles.statCardsRow}>
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className={styles.statCard}>
                    <div
                      className={styles.statIconCircle}
                      style={{ background: card.bg }}
                    >
                      <Icon className={styles.statIcon} color={card.color} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statLabel}>{card.label}</p>
                      <div className={styles.statNumber}>{card.value}</div>
                      <p className={styles.statSubLabel}>{card.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.middleRow}>
              <div className={styles.donutCard}>
                <div className={styles.donutCardTitle}>Broodstock Status</div>
                <div className={styles.donutChartWrapper}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={index} fill={GENDER_COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.donutCenterLabel}>
                    <span className={styles.donutCenterNumber}>210</span>
                    <span className={styles.donutCenterText}>Total</span>
                  </div>
                </div>
                <div className={styles.donutLegend}>
                  <div className={styles.donutLegendRow}>
                    <div className={styles.donutLegendLabel}>
                      <span
                        className={styles.donutDot}
                        style={{ background: '#3B82F6' }}
                      />
                      Female
                    </div>
                    <span className={styles.donutLegendValue}>186 (88.6%)</span>
                  </div>
                  <div className={styles.donutLegendRow}>
                    <div className={styles.donutLegendLabel}>
                      <span
                        className={styles.donutDot}
                        style={{ background: '#F97316' }}
                      />
                      Male
                    </div>
                    <span className={styles.donutLegendValue}>24 (11.4%)</span>
                  </div>
                </div>
              </div>

              <div className={styles.siteCard}>
                <div className={styles.siteCardTitle}>
                  Broodstock by Site (Females)
                </div>
                <div className={styles.siteTableHeader}>
                  <span className={styles.siteTableHeaderSite}>Site</span>
                  <span className={styles.siteTableHeaderFemales}>Females</span>
                </div>
                {siteData.map((row, i) => (
                  <div key={i} className={styles.siteTableRow}>
                    <div className={styles.siteLeft}>
                      <span className={styles.siteName}>{row.site}</span>
                      <div className={styles.siteBarTrack}>
                        <div
                          className={styles.siteBarFill}
                          style={{
                            width: `${(row.females / maxFemales) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className={styles.siteFemaleCount}>
                      {row.females} ({row.pct.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.activitiesFullCard}>
              <div className={styles.activitiesHeader}>
                <span className={styles.activitiesTitle}>
                  Recent Activities
                </span>
                <span className={styles.viewAllLink}>View All</span>
              </div>
              <div className={styles.activityList}>
                {activities.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={styles.activityItem}>
                      <div
                        className={styles.activityIconCircle}
                        style={{ background: item.bg }}
                      >
                        <Icon size={16} color={item.color} />
                      </div>
                      <div className={styles.activityBody}>
                        <div className={styles.activityMain}>{item.main}</div>
                        <div className={styles.activityDetail}>
                          {item.detail}
                        </div>
                        <div className={styles.activityActor}>
                          {item.actor}
                        </div>
                      </div>
                      <div className={styles.activityTime}>{item.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Modal
              show={showModal}
              onHide={() => { if (!submitting) { setShowModal(false); resetForm(); } }}
              centered
              size="md"
              backdrop="static"
              className={styles.modalBackdrop}
            >
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalHeaderLeft}>
                    <div className={styles.modalHeaderIcon}>
                      <BsPlusLg size={20} color="#D97706" />
                    </div>
                    <div>
                      <h3 className={styles.modalHeaderTitle}>Add Broodstock</h3>
                      <p className={styles.modalHeaderSub}>Add new broodstock to the inventory</p>
                    </div>
                  </div>
                  <button
                    className={styles.modalCloseBtn}
                    onClick={() => { if (!submitting) { setShowModal(false); resetForm(); } }}
                    disabled={submitting}
                  >
                    <BsXLg size={14} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Quantity</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="Enter quantity"
                        value={formData.quantity}
                        onChange={(e) => handleFormChange('quantity', e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Gender</label>
                      <select
                        className={styles.formSelect}
                        value={formData.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Age</label>
                      <div className={styles.ageRow}>
                        <input
                          type="number"
                          className={styles.formInput}
                          placeholder="Enter age"
                          value={formData.age}
                          onChange={(e) => handleFormChange('age', e.target.value)}
                          min="0"
                        />
                        <select
                          className={styles.ageSelect}
                          value={formData.ageUnit || 'weeks'}
                          onChange={(e) => handleFormChange('ageUnit', e.target.value)}
                        >
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="Enter weight"
                        value={formData.weight}
                        onChange={(e) => handleFormChange('weight', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Origin / Source</label>
                      <select
                        className={styles.formSelect}
                        value={formData.origin}
                        onChange={(e) => handleFormChange('origin', e.target.value)}
                      >
                        <option value="">Select origin</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Site / Location</label>
                      <select
                        className={styles.formSelect}
                        value={formData.site}
                        onChange={(e) => handleFormChange('site', e.target.value)}
                      >
                        <option value="">Select site</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Enter description or notes"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.btnCancel}
                    onClick={() => { setShowModal(false); resetForm(); }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.btnSubmit}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Broodstock'}
                  </button>
                </div>
              </div>
            </Modal>

            <Modal
              show={showLogModal}
              onHide={() => { if (!logSubmitting) { setShowLogModal(false); setLogData({ sick: '', mortality: '', retired: '' }); } }}
              centered
              size="md"
              backdrop="static"
              className={styles.modalBackdrop}
            >
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalHeaderLeft}>
                    <div className={styles.modalHeaderIcon}>
                      <BsPlusCircleFill size={20} color="#DC2626" />
                    </div>
                    <div>
                      <h3 className={styles.modalHeaderTitle}>Log Activity</h3>
                      <p className={styles.modalHeaderSub}>Record broodstock health activity</p>
                    </div>
                  </div>
                  <button
                    className={styles.modalCloseBtn}
                    onClick={() => { if (!logSubmitting) { setShowLogModal(false); setLogData({ sick: '', mortality: '', retired: '' }); } }}
                    disabled={logSubmitting}
                  >
                    <BsXLg size={14} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.logCard}>
                    <div className={styles.logCardIcon} style={{ background: '#FEE2E2' }}>
                      <BsPlusCircleFill size={18} color="#DC2626" />
                    </div>
                    <div className={styles.logCardContent}>
                      <label className={styles.formLabel}>Number of Sick</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0"
                        value={logData.sick}
                        onChange={(e) => setLogData((p) => ({ ...p, sick: e.target.value }))}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className={styles.logCard}>
                    <div className={styles.logCardIcon} style={{ background: '#FEF2F2' }}>
                      <FaSkull size={18} color="#991B1B" />
                    </div>
                    <div className={styles.logCardContent}>
                      <label className={styles.formLabel}>Number of Mortality</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0"
                        value={logData.mortality}
                        onChange={(e) => setLogData((p) => ({ ...p, mortality: e.target.value }))}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className={styles.logCard}>
                    <div className={styles.logCardIcon} style={{ background: '#FEF3C7' }}>
                      <BsHeartFill size={18} color="#D97706" />
                    </div>
                    <div className={styles.logCardContent}>
                      <label className={styles.formLabel}>Number of Retired</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0"
                        value={logData.retired}
                        onChange={(e) => setLogData((p) => ({ ...p, retired: e.target.value }))}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.btnCancel}
                    onClick={() => { setShowLogModal(false); setLogData({ sick: '', mortality: '', retired: '' }); }}
                    disabled={logSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.btnSubmit}
                    onClick={handleLogSubmit}
                    disabled={logSubmitting}
                  >
                    {logSubmitting ? 'Logging...' : 'Log Activity'}
                  </button>
                </div>
              </div>
            </Modal>
          </main>
        </section>
      </div>
    </section>
  );
}

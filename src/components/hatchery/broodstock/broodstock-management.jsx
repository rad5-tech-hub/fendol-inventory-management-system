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
import CustomDropdown from '../../shared/custom-dropdown/CustomDropdown';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import sharedStyles from '../hatchery.module.scss';
import styles from './broodstock-management.module.scss';

const f = (n) => new Intl.NumberFormat().format(n);
const GENDER_COLORS = ['#3B82F6', '#F97316'];

const activityConfig = {
  added: { label: 'added' },
  mortality: { label: 'died' },
  sick: { label: 'sick' },
  retired: { label: 'retired' },
};

const timeAgo = (dateStr) => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
};

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
    sex: '',
  });
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allSiteOverviews, setAllSiteOverviews] = useState([]);
  const [loadingAllSites, setLoadingAllSites] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setSites((prev) => (prev.length ? prev : data));
      } catch {
        /* silent — sites only needed for modals, already handled */
      }
    };
    fetchSites();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSite) {
      setOverview(null);
      setOverviewError(null);
      return;
    }
    let cancelled = false;
    const fetchOverview = async () => {
      setLoadingOverview(true);
      setOverviewError(null);
      try {
        const res = await ApiV2.get(`/v2/broodstock/overview?siteId=${selectedSite}`);
        if (!cancelled) setOverview(res.data?.data || null);
      } catch (err) {
        if (!cancelled) {
          const data = err.response?.data || {};
          const msg =
            data.response_message ||
            data.message ||
            (typeof data.error === 'string' ? data.error : data.error?.message) ||
            'Failed to load broodstock overview';
          setOverviewError(msg);
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    };
    fetchOverview();
    return () => { cancelled = true; };
  }, [selectedSite, refreshKey]);

  useEffect(() => {
    if (selectedSite || sites.length === 0) return;
    let cancelled = false;
    const fetchAll = async () => {
      setLoadingAllSites(true);
      try {
        const results = await Promise.allSettled(
          sites.map((s) =>
            ApiV2.get(`/v2/broodstock/overview?siteId=${s.id}`).then((r) => r.data?.data),
          ),
        );
        if (!cancelled) {
          const overviews = results
            .filter((r) => r.status === 'fulfilled' && r.value)
            .map((r) => r.value);
          setAllSiteOverviews(overviews);
        }
      } catch {
        if (!cancelled) setAllSiteOverviews([]);
      } finally {
        if (!cancelled) setLoadingAllSites(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [selectedSite, sites, refreshKey]);

  useEffect(() => {
    if (!overviewError) return;
    toast.error(overviewError, { autoClose: 5000 });
  }, [overviewError]);

  const validateForm = () => {
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity.');
      return false;
    }
    if (!formData.age || Number(formData.age) <= 0) {
      toast.error('Please enter a valid age.');
      return false;
    }
    if (!formData.site) {
      toast.error('Please select a site/location.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const loadingToast = toast.loading('Adding broodstock...');

    try {
      const originSite = sites.find((s) => s.id === formData.origin);
      const sourceName = originSite?.name || formData.origin || '';

      const payload = {
        quantity: Number(formData.quantity),
        sex: formData.gender.toLowerCase(),
        age: `${formData.age} ${formData.ageUnit}`,
        averageWeight: formData.weight ? Number(formData.weight) : 0,
        source: sourceName,
        siteId: formData.site,
        comment: formData.description || '',
      };

      await ApiV2.post('/v2/broodstock', payload);

      toast.update(loadingToast, {
        render: 'Broodstock added successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setShowModal(false);
      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      let message = 'An unexpected error occurred.';
      if (!err.response) {
        if (err.code === 'ECONNABORTED') {
          message = 'Request timed out. Please check your connection and try again.';
        } else if (err.message === 'Token expired') {
          message = 'Your session has expired. Please log in again.';
        } else {
          message = 'Network error. Please check your internet connection and try again.';
        }
      } else {
        const status = err.response.status;
        const data = err.response.data || {};
        const serverMsg =
          data.response_message ||
          data.message ||
          (typeof data.error === 'string' ? data.error : data.error?.message) ||
          '';
        if (status >= 400 && status < 500) {
          if (status === 400) {
            message = serverMsg || 'Invalid input. Please check your form fields and try again.';
          } else if (status === 401) {
            message = serverMsg || 'Session expired. Please log in again.';
          } else if (status === 403) {
            message = serverMsg || 'Access denied. You do not have permission to perform this action.';
          } else if (status === 409) {
            message = serverMsg || 'A broodstock entry with these details already exists.';
          } else {
            message = serverMsg || 'Validation error. Please check your input and try again.';
          }
        } else if (status >= 500) {
          message = serverMsg || 'Server error. Please try again later or contact support.';
        } else {
          message = serverMsg || 'An unexpected error occurred. Please try again.';
        }
      }
      toast.update(loadingToast, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogSubmit = async () => {
    if (!selectedSite) {
      toast.error('Please select a site before logging activity.');
      return;
    }

    const sick = Number(logData.sick) || 0;
    const mortality = Number(logData.mortality) || 0;
    const retired = Number(logData.retired) || 0;

    if (!sick && !mortality && !retired) {
      toast.error('Please enter at least one activity (sick, mortality, or retired) with a quantity greater than 0.');
      return;
    }

    const sex = logData.sex || undefined;
    const activities = [];
    if (sick) activities.push({ action: 'sick', quantity: sick });
    if (mortality) activities.push({ action: 'mortality', quantity: mortality, ...(sex && { sex }) });
    if (retired) activities.push({ action: 'retired', quantity: retired });

    setLogSubmitting(true);
    const loadingToast = toast.loading('Logging activity...');

    try {
      await ApiV2.post('/v2/broodstock/activity', {
        siteId: selectedSite,
        activities,
      });

      toast.update(loadingToast, {
        render: 'Activity logged successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setShowLogModal(false);
      setLogData({ sick: '', mortality: '', retired: '', sex: '' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      let message = 'An unexpected error occurred.';
      if (!err.response) {
        if (err.code === 'ECONNABORTED') {
          message = 'Request timed out. Please check your connection and try again.';
        } else if (err.message === 'Token expired') {
          message = 'Your session has expired. Please log in again.';
        } else {
          message = 'Network error. Please check your internet connection and try again.';
        }
      } else {
        const status = err.response.status;
        const data = err.response.data || {};
        const serverMsg =
          data.response_message ||
          data.message ||
          (typeof data.error === 'string' ? data.error : data.error?.message) ||
          '';
        if (status >= 400 && status < 500) {
          if (status === 400) {
            message = serverMsg || 'Invalid input. Please check the activity fields and try again.';
          } else if (status === 401) {
            message = serverMsg || 'Session expired. Please log in again.';
          } else if (status === 403) {
            message = serverMsg || 'Access denied. You do not have permission to perform this action.';
          } else if (status === 409) {
            message = serverMsg || 'This activity has already been recorded.';
          } else {
            message = serverMsg || 'Validation error. Please check your input.';
          }
        } else if (status >= 500) {
          message = serverMsg || 'Server error. Please try again later or contact support.';
        } else {
          message = serverMsg || 'An unexpected error occurred. Please try again.';
        }
      }
      toast.update(loadingToast, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLogSubmitting(false);
    }
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);
  const handleSiteChange = (id, name) => setSelectedSite(id);

  const totalFemales = overview?.totalFemales ?? 186;
  const totalMale = overview?.totalMale ?? 24;
  const totalAll = totalFemales + totalMale;
  const activeFemales = overview?.activeFemales ?? 0;
  const activeMales = overview?.activeMales ?? 0;
  const totalActive = activeFemales + activeMales;
  const totalSick = overview?.sick ?? 14;
  const totalRetired = overview?.retired ?? 48;
  const totalInactive = overview?.totalInactive ?? 12;

  const statCards = [
    {
      label: 'Total Females',
      value: f(totalFemales),
      sub: `${f(activeFemales)} Active females`,
      icon: BsGenderFemale,
      bg: '#F3E8FF',
      color: '#9333EA',
    },
    {
      label: 'Active (In Use)',
      value: f(totalActive),
      sub: totalAll > 0 ? `${((totalActive / totalAll) * 100).toFixed(1)}% of total` : '0% of total',
      icon: BsCheckCircleFill,
      bg: '#DCFCE7',
      color: '#16A34A',
    },
    {
      label: 'Retired',
      value: f(totalRetired),
      sub: totalAll > 0 ? `${((totalRetired / totalAll) * 100).toFixed(1)}% of total` : '-',
      icon: BsHeartFill,
      bg: '#FEF3C7',
      color: '#D97706',
    },
    {
      label: 'Sick / Under Treatment',
      value: f(totalSick),
      sub: totalAll > 0 ? `${((totalSick / totalAll) * 100).toFixed(1)}% of total` : '-',
      icon: BsPlusCircleFill,
      bg: '#FEE2E2',
      color: '#DC2626',
    },
    {
      label: 'Total Inactive',
      value: f(totalInactive),
      sub: totalAll > 0 ? `${((totalInactive / totalAll) * 100).toFixed(1)}% of total` : 'Currently inactive',
      icon: BsPauseFill,
      bg: '#F3F4F6',
      color: '#6B7280',
    },
  ];

  const genderData = [
    { name: 'Female', value: totalFemales },
    { name: 'Male', value: totalMale },
  ];

  const femalePct = totalAll > 0 ? ((totalFemales / totalAll) * 100).toFixed(1) : '0';
  const malePct = totalAll > 0 ? ((totalMale / totalAll) * 100).toFixed(1) : '0';

  const mapActivity = (act) => {
    const cfg = activityConfig[act.action] || { label: act.action };
    let icon;
    let bg;
    let color;
    switch (act.action) {
      case 'added':
        icon = FaPlus;
        bg = '#DBEAFE';
        color = '#2563EB';
        break;
      case 'mortality':
        icon = FaSkull;
        bg = '#FEE2E2';
        color = '#DC2626';
        break;
      case 'sick':
        icon = BsPlusCircleFill;
        bg = '#FEE2E2';
        color = '#DC2626';
        break;
      case 'retired':
        icon = BsHeartFill;
        bg = '#FEF3C7';
        color = '#D97706';
        break;
      default:
        icon = FaPlus;
        bg = '#F3F4F6';
        color = '#6B7280';
    }
    return {
      main: `${act.quantity} Broodstock ${cfg.label}`,
      detail: act.comment || `${act.quantity} ${act.action} recorded`,
      actor: `by ${act.performer?.fullName || 'Unknown'}`,
      time: timeAgo(act.createdAt),
      icon,
      bg,
      color,
    };
  };

  const latestActivities = (overview?.latestActivities || []).map(mapActivity);

  const siteTableData = selectedSite
    ? (overview
        ? [{ site: overview.siteName || 'Selected Site', females: overview.totalFemales || 0, males: overview.totalMale || 0 }]
        : [])
    : allSiteOverviews.map((o) => ({
        site: o.siteName || 'Unknown',
        females: o.totalFemales || 0,
        males: o.totalMale || 0,
      }));

  const siteMaxFemales = Math.max(1, ...siteTableData.map((d) => d.females));

  const isLoadingOverview = loadingOverview && !overview;

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
                    <span className={styles.donutCenterNumber}>{totalAll}</span>
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
                    <span className={styles.donutLegendValue}>{totalFemales} ({femalePct}%)</span>
                  </div>
                  <div className={styles.donutLegendRow}>
                    <div className={styles.donutLegendLabel}>
                      <span
                        className={styles.donutDot}
                        style={{ background: '#F97316' }}
                      />
                      Male
                    </div>
                    <span className={styles.donutLegendValue}>{totalMale} ({malePct}%)</span>
                  </div>
                </div>
              </div>

              <div className={styles.siteCard}>
                <div className={styles.siteCardTitle}>
                  {selectedSite ? 'Site Overview' : 'Broodstock by Site (Females)'}
                </div>
                {siteTableData.length > 0 ? (
                  <>
                    <div className={styles.siteTableHeader}>
                      <span className={styles.siteTableHeaderSite}>Site</span>
                      <span className={styles.siteTableHeaderFemales}>Females</span>
                    </div>
                    {siteTableData.map((row, i) => (
                      <div key={i} className={styles.siteTableRow}>
                        <div className={styles.siteLeft}>
                          <span className={styles.siteName}>{row.site}</span>
                          <div className={styles.siteBarTrack}>
                            <div
                              className={styles.siteBarFill}
                              style={{
                                width: `${(row.females / siteMaxFemales) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className={styles.siteFemaleCount}>
                          {row.females} ({((row.females / siteMaxFemales) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className={styles.siteTableRow}>
                    <span className={styles.siteName} style={{ color: '#9CA3AF' }}>
                      {selectedSite ? 'No overview data' : 'Select a site to view data'}
                    </span>
                  </div>
                )}
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
                {latestActivities.length > 0 ? latestActivities.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id || i} className={styles.activityItem}>
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
                }) : (
                  <div className={styles.activityItem}>
                    <div className={styles.activityBody}>
                      <div className={styles.activityMain}>
                        {selectedSite ? 'No recent activities' : 'Select a site to view activities'}
                      </div>
                      <div className={styles.activityDetail}>
                        {selectedSite ? 'Activities will appear here once recorded' : 'Choose a site from the dropdown above'}
                      </div>
                    </div>
                  </div>
                )}
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
                      <CustomDropdown
                        options={[
                          { value: 'Female', label: 'Female' },
                          { value: 'Male', label: 'Male' },
                        ]}
                        value={formData.gender}
                        onChange={(val) => handleFormChange('gender', val)}
                        className={styles.formSelect}
                      />
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
                        <CustomDropdown
                          options={[
                            { value: 'weeks', label: 'Weeks' },
                            { value: 'months', label: 'Months' },
                          ]}
                          value={formData.ageUnit || 'weeks'}
                          onChange={(val) => handleFormChange('ageUnit', val)}
                          className={styles.ageSelect}
                        />
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
                      <CustomDropdown
                        options={[
                          { value: '', label: 'Select origin' },
                          ...sites.map(site => ({ value: site.id, label: site.name })),
                        ]}
                        value={formData.origin}
                        onChange={(val) => handleFormChange('origin', val)}
                        className={styles.formSelect}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Site / Location</label>
                      <CustomDropdown
                        options={[
                          { value: '', label: 'Select site' },
                          ...sites.map(site => ({ value: site.id, label: site.name })),
                        ]}
                        value={formData.site}
                        onChange={(val) => handleFormChange('site', val)}
                        className={styles.formSelect}
                      />
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
              onHide={() => { if (!logSubmitting) { setShowLogModal(false); setLogData({ sick: '', mortality: '', retired: '', sex: '' }); } }}
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
                    onClick={() => { if (!logSubmitting) { setShowLogModal(false); setLogData({ sick: '', mortality: '', retired: '', sex: '' }); } }}
                    disabled={logSubmitting}
                  >
                    <BsXLg size={14} />
                  </button>
                </div>

                <div className={styles.modalBodyLog}>

                  {/* Sick */}
                  <div className={styles.logCard}>
                    <div className={styles.logCardIcon} style={{ background: '#FEE2E2' }}>
                      <BsPlusCircleFill size={18} color="#DC2626" />
                    </div>
                    <div className={styles.logCardContent}>
                      <label className={styles.logCardLabel}>Number of Sick</label>
                      <input
                        type="number"
                        className={styles.logInput}
                        placeholder="0"
                        value={logData.sick}
                        onChange={(e) => setLogData((p) => ({ ...p, sick: e.target.value }))}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Mortality (with sex selector) */}
                  <div className={styles.logCardMortality}>
                    <div className={styles.logCardMortalityHead}>
                      <div className={styles.logCardIcon} style={{ background: '#FEF2F2' }}>
                        <FaSkull size={18} color="#991B1B" />
                      </div>
                      <div className={styles.logCardContent}>
                        <label className={styles.logCardLabel}>Number of Mortality</label>
                        <input
                          type="number"
                          className={styles.logInput}
                          placeholder="0"
                          value={logData.mortality}
                          onChange={(e) => setLogData((p) => ({ ...p, mortality: e.target.value }))}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className={styles.logCardSexRow}>
                      <div className={styles.sexBadge}>Sex (applies to mortality only)</div>
                      <CustomDropdown
                        options={[
                          { value: '', label: 'All / Not specified' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                        ]}
                        value={logData.sex}
                        onChange={(val) => setLogData((p) => ({ ...p, sex: val }))}
                        className={styles.logSexSelect}
                      />
                    </div>
                  </div>

                  {/* Retired */}
                  <div className={styles.logCard}>
                    <div className={styles.logCardIcon} style={{ background: '#FEF3C7' }}>
                      <BsHeartFill size={18} color="#D97706" />
                    </div>
                    <div className={styles.logCardContent}>
                      <label className={styles.logCardLabel}>Number of Retired</label>
                      <input
                        type="number"
                        className={styles.logInput}
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
                    onClick={() => { setShowLogModal(false); setLogData({ sick: '', mortality: '', retired: '', sex: '' }); }}
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

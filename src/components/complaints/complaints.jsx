import React, { useState, useEffect, useRef } from 'react';
import SideBar from '../shared/sidebar/sidebar';
import Header from '../shared/header/header';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './complaints.module.scss';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiSend, FiUser, FiType, FiAlignLeft, FiChevronDown } from 'react-icons/fi';
import CustomDropdown from '../shared/custom-dropdown/CustomDropdown';
import { BsPeople } from 'react-icons/bs';
import { ApiV2 } from '../shared/api/apiLink';

export default function Complaints() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [complainant, setComplainant] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [description, setDescription] = useState('');
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffAgainst, setStaffAgainst] = useState(null);
  const [staffAgainstSearch, setStaffAgainstSearch] = useState('');
  const [showStaffAgainstDropdown, setShowStaffAgainstDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const staffRef = useRef(null);
  const staffAgainstRef = useRef(null);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    if (complaintType === 'Staff') {
      fetchStaff();
    }
  }, [complaintType]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (staffRef.current && !staffRef.current.contains(e.target)) {
        setShowStaffDropdown(false);
      }
      if (staffAgainstRef.current && !staffAgainstRef.current.contains(e.target)) {
        setShowStaffAgainstDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await ApiV2.get('/api/v1/staff', { params: { siteId: 'all' } });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setStaff(data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaff([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const filteredStaff = staffSearch
    ? staff.filter((s) =>
        (s.name || '').toLowerCase().includes(staffSearch.toLowerCase())
      )
    : staff;

  const filteredStaffAgainst = staffAgainstSearch
    ? staff.filter((s) =>
        s.id !== selectedStaff?.id &&
        (s.name || '').toLowerCase().includes(staffAgainstSearch.toLowerCase())
      )
    : staff.filter((s) => s.id !== selectedStaff?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complainant.trim() || !complaintType || !description.trim()) {
      toast.error('Please fill in all required fields.', { className: 'dark-toast' });
      return;
    }
    if (complaintType === 'Staff' && !selectedStaff) {
      toast.error('Please select a staff member.', { className: 'dark-toast' });
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Submitting complaint...', { className: 'dark-toast' });

    try {
      const body = complaintType === 'Staff'
        ? {
            staffId: selectedStaff.id,
            description: description.trim(),
            ...(staffAgainst && { staffAgainstId: staffAgainst.id }),
          }
        : { name: complainant.trim(), description: description.trim() };

      const res = await ApiV2.post('/v2/complaint', body);

      toast.update(loadingToast, {
        render: res.data?.response_message || 'Complaint submitted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });

      setComplainant('');
      setComplaintType('');
      setDescription('');
      setSelectedStaff(null);
      setStaffSearch('');
      setStaffAgainst(null);
      setStaffAgainstSearch('');
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.response_message || error.response?.data?.message || 'Failed to submit complaint',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className={styles.headerRow}>
              <h4>Make a Complaint</h4>
            </div>

            <div className={styles.formCard}>
              <Form onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Complainant <span>*</span></label>
                    <Form.Control
                      type="text"
                      placeholder="Full name of complainant"
                      value={complainant}
                      onChange={(e) => setComplainant(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Complaint Type <span>*</span></label>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'Select type' },
                        { value: 'Staff', label: 'Staff' },
                        { value: 'General', label: 'General' },
                      ]}
                      value={complaintType}
                      onChange={(val) => {
                        setComplaintType(val);
                        setSelectedStaff(null);
                        setStaffSearch('');
                      }}
                      placeholder="Select type"
                    />
                  </div>

                  {complaintType === 'Staff' && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>Staff Member <span>*</span></label>
                      <div className={styles.staffDropdown} ref={staffRef}>
                        <div style={{ position: 'relative' }}>
                          <Form.Control
                            type="text"
                            placeholder={staffLoading ? 'Loading staff...' : 'Search staff...'}
                            value={staffSearch}
                            onChange={(e) => {
                              setStaffSearch(e.target.value);
                              setShowStaffDropdown(true);
                              setSelectedStaff(null);
                            }}
                            onFocus={() => setShowStaffDropdown(true)}
                          />
                          <FiChevronDown
                            size={16}
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9CA3AF',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                        {showStaffDropdown && (
                          <div className={styles.staffList}>
                            {staffLoading ? (
                              <div className={styles.noStaff}>Loading...</div>
                            ) : filteredStaff.length > 0 ? (
                              filteredStaff.map((s) => (
                                <div
                                  key={s.id}
                                  className={`${styles.staffItem} ${
                                    selectedStaff?.id === s.id ? styles.selected : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedStaff(s);
                                    setStaffSearch(s.name);
                                    setShowStaffDropdown(false);
                                  }}
                                >
                                  {s.name}
                                </div>
                              ))
                            ) : (
                              <div className={styles.noStaff}>No staff found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {complaintType === 'Staff' && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>Complaint Against <span className={styles.optional}>(optional)</span></label>
                      <div className={styles.staffDropdown} ref={staffAgainstRef}>
                        <div style={{ position: 'relative' }}>
                          <Form.Control
                            type="text"
                            placeholder="Search staff to complain against..."
                            value={staffAgainstSearch}
                            onChange={(e) => {
                              setStaffAgainstSearch(e.target.value);
                              setShowStaffAgainstDropdown(true);
                              setStaffAgainst(null);
                            }}
                            onFocus={() => setShowStaffAgainstDropdown(true)}
                          />
                          <FiChevronDown
                            size={16}
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9CA3AF',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                        {showStaffAgainstDropdown && (
                          <div className={styles.staffList}>
                            {filteredStaffAgainst.length > 0 ? (
                              filteredStaffAgainst.map((s) => (
                                <div
                                  key={s.id}
                                  className={`${styles.staffItem} ${
                                    staffAgainst?.id === s.id ? styles.selected : ''
                                  }`}
                                  onClick={() => {
                                    setStaffAgainst(s);
                                    setStaffAgainstSearch(s.name);
                                    setShowStaffAgainstDropdown(false);
                                  }}
                                >
                                  {s.name}
                                </div>
                              ))
                            ) : (
                              <div className={styles.noStaff}>No staff found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Description <span>*</span></label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder="Describe the complaint in detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.submitRow}>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={submitting}
                  >
                    <FiSend size={18} />
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </Form>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

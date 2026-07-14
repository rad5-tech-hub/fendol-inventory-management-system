import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../product-stages.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';

const DamageFish = () => {
  const [stages, setStages] = useState([]);
  const [fishType, setFishType] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [pondSearch, setPondSearch] = useState(''); // State for pond search input
  const [showPondDropdown, setShowPondDropdown] = useState(false); // State for dropdown visibility
  const [formData, setFormData] = useState({
    stageId_from: '',
    actual_quantity: '',
    remarks: ''
  });
  const [loader, setLoader] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const navigate = useNavigate();
  const activeSite = useSelector((store) => store.activeSite);

  // Fetch ponds (stages)
  const fetchStages = async () => {
    try {
      const siteId = activeSite?.id || 'all';
      const response = await Api.get(`/fish-stages?siteId=${siteId}`);
      if (Array.isArray(response.data.data)) {
        if (response.data.data.length === 0 && siteId !== 'all' && /^[a-f0-9-]{36}$/i.test(siteId)) {
          const fallbackResponse = await Api.get('/fish-stages?siteId=all');
          if (Array.isArray(fallbackResponse.data.data)) {
            setStages(fallbackResponse.data.data);
            return;
          }
        }
        setStages(response.data.data);
      } else {
        throw new Error('Expected an array of stages');
      }
    } catch (err) {
      console.error(err.response?.data?.message || 'Failed to fetch data. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to fetch ponds. Please try again.', {
        className: 'dark-toast',
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    fetchStages();
  }, [activeSite?.id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'actual_quantity' ? parseInt(value, 10) || '' : value,
    });
  };

  // Handle pond search input change
  const handlePondSearchChange = (e) => {
    setPondSearch(e.target.value);
    setShowPondDropdown(true);
  };

  // Handle pond selection from dropdown
  const handlePondSelect = (pond) => {
    setFormData({ ...formData, stageId_from: pond.id });
    setPondSearch(`${pond.title} - (${pond.quantity || '0'})`);
    setShowPondDropdown(false);
    getQuantity(pond.id); // Fetch fish type and quantity
  };

  // Fetch fish type and quantity based on stage ID
  const getQuantity = async (stageId_from) => {
    setFishType('loading...');
    if (!stageId_from) {
      setFishType('');
      setSelectedQuantity('Stage ID is required');
      return;
    }

    try {
      const response = await Api.get(`/active-batch?stageId=${stageId_from}`);
      const responseData = response.data;

      if (response.status === 404 || !responseData.success || responseData.data.length === 0) {
        setFishType('No Fish Type');
        setSelectedQuantity('No active batch');
      } else {
        setFishType(responseData.data[0].species.speciesName);
        setSelectedQuantity(responseData.data[0].quantity || '0');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setFishType('No Fish Type');
        setSelectedQuantity('No active batch');
      } else {
        console.error('Failed to fetch quantity:', error);
        setFishType('Error');
        setSelectedQuantity('Error getting quantity or empty pond');
      }
    }
  };

  // Handle form submission
  const handleAddFish = async (e) => {
    e.preventDefault();
    const userConfirmed = window.confirm("Are you sure you want to Remove Damage fish?");
    if (!userConfirmed) return;

    setLoader(true);
    const loadingToast = toast.loading("Removing Damaged fish...", { className: 'dark-toast' });

    try {
      const response = await Api.post('/log-damage', formData);
      setFormData({
        stageId_from: '',
        actual_quantity: '',
        remarks: ''
      });
      setPondSearch(''); // Reset search input
      setFishType('');
      setSelectedQuantity('');
      toast.update(loadingToast, {
        render: "Removed Damage fish successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast'
      });

      // Fetch updated ponds after successful submission
      await fetchStages();
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Error removing damaged fish. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
    } finally {
      setLoader(false);
    }
  };

  // Filter ponds for dropdown
  const filteredPonds = stages.filter((stage) => {
    const matchesSite = activeSite?.id
      ? String(stage.siteId ?? '').toLowerCase() === String(activeSite.id).toLowerCase()
      : activeSite?.name
        ? String(stage.site ?? '').toLowerCase() === String(activeSite.name).toLowerCase()
        : true;
    return matchesSite && String(stage.title ?? '').toLowerCase().includes(pondSearch.toLowerCase());
  });

  // Sidebar toggle handlers
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main>
            <ToastContainer />
            <Form className={styles.create_form} onSubmit={handleAddFish}>
              <h4 className="mt-5 mb-5">Damaged Fish From Pond</h4>
              <Row>
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Pond From</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Search Pond..."
                      value={pondSearch}
                      onChange={handlePondSearchChange}
                      onFocus={() => setShowPondDropdown(true)}
                      className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                      autoComplete="off"
                    />
                    {showPondDropdown && (
                      <div className={styles.suggestions_box} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <ul style={{ listStyle: 'none' }}>
                          {filteredPonds.length > 0 ? (
                            filteredPonds.map((pond, index) => (
                              <li
                                key={index}
                                onClick={() => handlePondSelect(pond)}
                                style={{ cursor: 'pointer', padding: '8px' }}
                              >
                                {pond.title} - ({pond.quantity || '0'})
                              </li>
                            ))
                          ) : (
                            <li style={{ padding: '8px' }}>
                              {stages.length === 0 ? 'Loading ponds...' : 'No ponds found'}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={6} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Fish Type</Form.Label>
                  <Form.Control
                    required
                    placeholder="Select Pond to Show Fish Type"
                    value={fishType}
                    readOnly
                    className={`py-2 bg-light-subtle text-secondary shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
                <Col md={6} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Quantity</Form.Label>
                  <Form.Control
                    placeholder="Enter Quantity"
                    type="number"
                    name="actual_quantity"
                    value={formData.actual_quantity}
                    onChange={handleInputChange}
                    required
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Remark</Form.Label>
                  <Form.Control
                    placeholder="Enter remarks"
                    as="textarea"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
              </Row>
              <div className="d-flex justify-content-end py-5">
                <Button
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                  disabled={loader}
                  type="submit"
                >
                  {loader ? 'Removing Damage...' : 'Remove Damage Fish'}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
    </section>
  );
};

export default DamageFish;
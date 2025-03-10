import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../product-stages.module.scss';
import Api from '../../shared/api/apiLink';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { useNavigate } from 'react-router-dom';

const HarvestFish = () => {
  const navigate = useNavigate();

  // State Declarations
  const [stages, setStages] = useState([]);
  const [pondSearch, setPondSearch] = useState('');
  const [showPondDropdown, setShowPondDropdown] = useState(false);
  const [formData, setFormData] = useState({
    stageId_from: '',
    actual_quantity: '',
    remarks: '',
  });
  const [loader, setLoader] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state

  // Fetch Fish Stages
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await Api.get('/fish-stages');
        if (!Array.isArray(response.data.data)) {
          throw new Error('Expected an array of stages');
        }
        setStages(response.data.data);
      } catch (err) {
        console.error(err.response?.data?.message || 'Failed to fetch stages');
        setStages([]);
      }
    };

    fetchStages();
  }, []);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'actual_quantity' ? parseFloat(value) || '' : value,
    });
  };

  // Handle Pond Search and Selection
  const handlePondSearchChange = (e) => {
    setPondSearch(e.target.value);
    setShowPondDropdown(true);
  };

  const handlePondSelect = (pond) => {
    setFormData({ ...formData, stageId_from: pond.id });
    setPondSearch(`${pond.title} - (${pond.quantity})`);
    setShowPondDropdown(false);
  };

  // Filter Ponds for Dropdown
  const filteredPonds = stages.filter((stage) =>
    stage.title?.toLowerCase().includes(pondSearch.toLowerCase())
  );

  // Handle Form Submission
  const handleAddFish = async (e) => {
    e.preventDefault();

    const userConfirmed = window.confirm('Are you sure you want to harvest this fish?');
    if (!userConfirmed) return;

    setLoader(true);
    const loadingToast = toast.loading('Harvesting fish...', { className: 'dark-toast' });

    try {
      await Api.post('/move-from-pond-to-harvest', formData);
      setFormData({
        stageId_from: '',
        actual_quantity: '',
        remarks: '',
      });
      setPondSearch('');
      toast.update(loadingToast, {
        render: 'Fish harvested successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast',
      });
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || 'Error harvesting fish. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
    } finally {
      setLoader(false);
    }
  };

  // Sidebar toggle handlers
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  // JSX Rendering
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
              <h4 className="mt-5 mb-5">Harvest Fish</h4>
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
                                {pond.title} - ({pond.quantity})
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
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Quantity</Form.Label>
                  <Form.Control
                    placeholder="Enter quantity"
                    type="number"
                    name="actual_quantity"
                    value={formData.actual_quantity}
                    min="1"
                    onChange={handleInputChange}
                    required
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Remarks</Form.Label>
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
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                  disabled={loader}
                  type="submit"
                >
                  {loader ? 'Harvesting...' : 'HARVEST'}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
    </section>
  );
};

export default HarvestFish;
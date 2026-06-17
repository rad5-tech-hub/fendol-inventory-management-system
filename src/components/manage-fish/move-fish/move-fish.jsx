import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../product-stages.module.scss';
import Api from '../../shared/api/apiLink';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';


export default function MoveFish() {
  // State Declarations
  const [stages, setStages] = useState([]);
  const [fishType, setFishType] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedQuantityFrom, setSelectedQuantityFrom] = useState('');
  const [selectedQuantityTo, setSelectedQuantityTo] = useState('');
  const [pondFromSearch, setPondFromSearch] = useState('');
  const [pondToSearch, setPondToSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [moveFishData, setMoveFishData] = useState({
    stageId_from: '',
    stageId_to: '',
    actual_quantity: '',
    remarks: '',
  });
  const [loader, setLoader] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const activeSite = useSelector((store) => store.activeSite);

  // Fetch Stages
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const siteId = activeSite?.id || 'all';
        const response = await Api.get(`/fish-stages?siteId=${siteId}`);
        if (Array.isArray(response.data.data)) {
          const filteredProcessStages = response.data.data.filter(
            (stage) => stage.title !== 'Smoking' && stage.title !== 'Drying'
          );
          if (filteredProcessStages.length === 0 && siteId !== 'all' && /^[a-f0-9-]{36}$/i.test(siteId)) {
            const fallbackResponse = await Api.get('/fish-stages?siteId=all');
            if (Array.isArray(fallbackResponse.data.data)) {
              setStages(fallbackResponse.data.data.filter(
                (stage) => stage.title !== 'Smoking' && stage.title !== 'Drying'
              ));
              return;
            }
          }
          setStages(filteredProcessStages);
        } else {
          throw new Error('Expected an array of stages');
        }
      } catch (err) {
        console.error(err.response?.data?.message || 'Failed to fetch stages');
      }
    };
    fetchStages();
  }, [activeSite?.id]);

  // Handle Input Changes
  const handleInputChangeMoveFish = (e) => {
    const { name, value } = e.target;
    setMoveFishData({
      ...moveFishData,
      [name]: name === 'actual_quantity' ? parseFloat(value) || '' : value,
    });
  };

  // Fetch Quantity for Selected Stage
  const getQuantity = async (stageId, type) => {
    if (!stageId) {
      if (type === 'from') setSelectedQuantityFrom('Select a pond');
      if (type === 'to') setSelectedQuantityTo('Select a pond');
      setFishType('');
      return;
    }

    try {
      const response = await Api.get(`/active-batch?stageId=${stageId}`);
      const responseData = response.data;

      if (response.status === 404 || !responseData.success || responseData.data.length === 0) {
        if (type === 'from') {
          setFishType('No Fish Type');
          setSelectedQuantityFrom('0');
        }
        if (type === 'to') setSelectedQuantityTo('0');
      } else {
        if (type === 'from') {
          setFishType(responseData.data[0].species.speciesName);
          setSelectedQuantityFrom(responseData.data[0].quantity || '0');
        }
        if (type === 'to') setSelectedQuantityTo(responseData.data[0].quantity || '0');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        if (type === 'from') setFishType('No Fish Type');
        setSelectedQuantityFrom('0');
        setSelectedQuantityTo('0');
      } else {
        console.error('Failed to fetch quantity:', error);
        if (type === 'from') setSelectedQuantityFrom('Error fetching quantity');
        if (type === 'to') setSelectedQuantityTo('Error fetching quantity');
      }
    }
  };

  // Handle Pond Search and Selection
  const handlePondFromSearchChange = (e) => {
    setPondFromSearch(e.target.value);
    setShowFromDropdown(true);
  };

  const handlePondToSearchChange = (e) => {
    setPondToSearch(e.target.value);
    setShowToDropdown(true);
  };

  const handlePondFromSelect = (pond) => {
    setMoveFishData({ ...moveFishData, stageId_from: pond.id });
    setPondFromSearch(`${pond.title} - (${pond.quantity || '0'})`);
    setShowFromDropdown(false);
    getQuantity(pond.id, 'from');
  };

  const handlePondToSelect = (pond) => {
    setMoveFishData({ ...moveFishData, stageId_to: pond.id });
    setPondToSearch(`${pond.title} - (${pond.quantity || '0'})`);
    setSelectedTitle(pond.title);
    setShowToDropdown(false);
    getQuantity(pond.id, 'to');
  };

  // Filter Ponds
  const filteredFromPonds = stages.filter((stage) => {
    const matchesSite = activeSite?.name ? String(stage.site ?? '').toLowerCase() === String(activeSite.name).toLowerCase() : true;
    return matchesSite && String(stage.title ?? '').toLowerCase().includes(pondFromSearch.toLowerCase());
  });

  const filteredToPonds = stages.filter((stage) => {
    const matchesSite = activeSite?.name ? String(stage.site ?? '').toLowerCase() === String(activeSite.name).toLowerCase() : true;
    return matchesSite && String(stage.title ?? '').toLowerCase().includes(pondToSearch.toLowerCase());
  });

  // Get Selected Stage Names for Confirmation
  const selectedStageNames = stages
    .filter((stage) => moveFishData.stageId_from === stage.id)
    .map((stage) => stage.title)
    .join(', ') || 'Select Stages';

  // Handle Form Submission
  const handleMoveFishes = async (e) => {
    e.preventDefault();

    const isConfirmed = window.confirm(
      `Are you sure you want to move ${moveFishData.actual_quantity} fish from ${selectedStageNames} to ${selectedTitle}?`
    );
    if (!isConfirmed) return;

    setLoader(true);
    const loadingToast = toast.loading('Moving fish...', { className: 'dark-toast' });

    try {
      await Api.post('/move-fish', moveFishData);
      setMoveFishData({
        stageId_from: '',
        stageId_to: '',
        actual_quantity: '',
        remarks: '',
      });
      setPondFromSearch('');
      setPondToSearch('');
      setFishType('');
      setSelectedQuantityFrom('');
      setSelectedQuantityTo('');
      toast.update(loadingToast, {
        render: 'Fish moved successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || 'Error moving fish. Please try again.',
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
          <main className={styles.create_form}>
            <ToastContainer />
            <Form onSubmit={handleMoveFishes}>
              <h4 className="my-5">Move Fish</h4>

              <Row>
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Pond From</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Search Pond From..."
                      value={pondFromSearch}
                      onChange={handlePondFromSearchChange}
                      onFocus={() => setShowFromDropdown(true)}
                      className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                      autoComplete="off"
                    />
                    {showFromDropdown && (
                      <div className={styles.suggestions_box} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <ul style={{ listStyle: 'none' }}>
                          {filteredFromPonds.length > 0 ? (
                            filteredFromPonds.map((pond, index) => (
                              <li
                                key={index}
                                onClick={() => handlePondFromSelect(pond)}
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
                <Col md={12} lg={6} className="mb-4">
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
                    placeholder="Enter quantity"
                    type="number"
                    name="actual_quantity"
                    value={moveFishData.actual_quantity}                                  
                    required
                    onChange={handleInputChangeMoveFish}
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
                <Col md={6} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Pond To</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Search Pond To..."
                      value={pondToSearch}
                      onChange={handlePondToSearchChange}
                      onFocus={() => setShowToDropdown(true)}
                      className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                      autoComplete="off"
                    />
                    {showToDropdown && (
                      <div className={styles.suggestions_box} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <ul style={{ listStyle: 'none' }}>
                          {filteredToPonds.length > 0 ? (
                            filteredToPonds.map((pond, index) => (
                              <li
                                key={index}
                                onClick={() => handlePondToSelect(pond)}
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
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Remark</Form.Label>
                  <Form.Control
                    placeholder="Enter remark"
                    as="textarea"
                    name="remarks"
                    value={moveFishData.remarks}
                    onChange={handleInputChangeMoveFish}
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>                
              </Row>
              <div className="d-flex justify-content-end my-4">
                <Button
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                  disabled={loader}
                  type="submit"
                >
                  {loader ? 'Moving...' : 'Move'}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
    </section>
  );
}
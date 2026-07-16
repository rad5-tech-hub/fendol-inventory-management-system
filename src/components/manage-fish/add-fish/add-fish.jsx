import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../product-stages.module.scss';
import Api from '../../shared/api/apiLink';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import { useConfirm } from '../../shared/confirm-modal';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";


const AddFish = () => {
  const [ConfirmDialog, confirm] = useConfirm();
  const [stages, setStages] = useState([]);
  const [fishType, setFishType] = useState([]);
  const [pondSearch, setPondSearch] = useState('');
  const [showPondDropdown, setShowPondDropdown] = useState(false);
  const [formData, setFormData] = useState({
    stageId: '',
    quantity: '',
    speciesId: '',
  });
  const [loader, setLoader] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const effectiveSiteId = isSuperAdmin ? (activeSite?.id || 'all') : (user?.siteId || 'all');
  const effectiveSite = isSuperAdmin ? activeSite : (user?.siteId ? { id: user.siteId } : null);

  // Fetch Data with useEffect
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const siteId = effectiveSiteId;
        const response = await Api.get(`/fish-stages?siteId=${siteId}`);
        if (Array.isArray(response.data.data)) {
          const filteredStages = response.data.data.filter(
            (stage) => !['harvest', 'damage', 'loss'].includes(String(stage.title ?? '').toLowerCase())
          );
          if (filteredStages.length === 0 && effectiveSiteId !== 'all' && /^[a-f0-9-]{36}$/i.test(effectiveSiteId)) {
            const fallbackResponse = await Api.get('/fish-stages?siteId=all');
            if (Array.isArray(fallbackResponse.data.data)) {
              setStages(fallbackResponse.data.data.filter(
                (stage) => !['harvest', 'damage', 'loss'].includes(String(stage.title ?? '').toLowerCase())
              ));
              return;
            }
          }
          setStages(filteredStages);
        } else {
          throw new Error('Expected an array of stages');
        }
      } catch (err) {
        console.error(err.response?.data?.message || 'Failed to fetch stages');
      }
    };

    fetchStages();
  }, [effectiveSiteId]);

  useEffect(() => {
    const fetchFishType = async () => {
      try {
        const response = await Api.get('/species');
        if (Array.isArray(response.data.data)) {
          setFishType(response.data.data);
        } else {
          throw new Error('Expected an array of fish types');
        }
      } catch (err) {
        console.error(err.response?.data?.message || 'Failed to fetch fish types');
      }
    };

    fetchFishType();
  }, []);

  // Event Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseInt(value, 10) || '' : value,
    });
  };

  const handlePondSearchChange = (e) => {
    setPondSearch(e.target.value);
    setShowPondDropdown(true);
  };

  const handlePondSelect = (pond) => {
    setFormData({ ...formData, stageId: pond.id });
    setPondSearch(pond.title);
    setShowPondDropdown(false);
  };

  const handleSpeciesChange = (value) => {
    setFormData(prev => ({ ...prev, speciesId: value }));
  };

  const handleAddFish = async (e) => {
    e.preventDefault();

    const ok = await confirm({ message: "Are you sure you want to add this fish?", title: "Add Fish", variant: "danger" });
    if (!ok) return;

    setLoader(true);
    const loadingToast = toast.loading('Adding fish...', { className: 'dark-toast' });

    try {
      await Api.post('/fish', formData);
      setFormData({ stageId: '', quantity: '', speciesId: '' });
      setPondSearch(''); // Reset pond search
      toast.update(loadingToast, {
        render: 'Fish added successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast',
      });
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || 'Error adding fish. Please try again.',
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

  // Filtered Ponds for Dropdown
  const filteredPonds = stages.filter((stage) => {
    const matchesSite = effectiveSite?.id
      ? String(stage.siteId ?? '').toLowerCase() === String(effectiveSite.id).toLowerCase()
      : effectiveSite?.name
        ? String(stage.site ?? '').toLowerCase() === String(effectiveSite.name).toLowerCase()
        : true;
    return matchesSite && String(stage.title ?? '').toLowerCase().includes(pondSearch.toLowerCase());
  });

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
              <h4 className="mt-5 mb-5">Add Fish</h4>

              <Row>
                <Col md={12} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Pond To</Form.Label>
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
                                {pond.title || 'No Data Yet'}
                              </li>
                            ))
                          ) : (
                            <li style={{ padding: '8px' }}>No ponds found</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={6} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    min="1"
                    onChange={handleInputChange}
                    required
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
                <Col md={6} lg={6} className="mb-4">
                  <Form.Label className="fw-semibold">Fish Type</Form.Label>
                  <CustomDropdown
                    name="speciesId"
                    value={formData.speciesId}
                    onChange={handleSpeciesChange}
                    required
                    placeholder="Choose fish type"
                    options={(fishType || []).map(type => ({ value: type.id, label: type.speciesName }))}
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                  />
                </Col>
              </Row>
              <div className="d-flex justify-content-end my-4">
                <Button
                  type="submit"
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                  disabled={loader}
                >
                  {loader ? 'Adding...' : 'ADD'}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
      <ConfirmDialog />
    </section>
  );
};

export default AddFish;
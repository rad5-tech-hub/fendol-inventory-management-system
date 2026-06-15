import React, { useState, useEffect, useMemo } from 'react';
import { Form, Row, Col, Button, Breadcrumb } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { MdOutlineRefresh } from "react-icons/md";
import { BsGrid3X3GapFill, BsXCircleFill, BsArrowRight, BsXLg, BsSave, BsExclamationCircle } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import styles from '../process.module.scss';
import 'react-toastify/dist/ReactToastify.css';

export default function NewBatchFish() {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const activeSite = useSelector((store) => store.activeSite);
  const isSuperAdmin = user?.userTypes?.includes('super_admin');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stages, setStages] = useState({ washing: null });
  const [checkStages, setCheckStages] = useState([]);
  const [fishType, setFishType] = useState([]);
  const [processId, setProcessId] = useState(() => {
    const saved = sessionStorage.getItem('batchProcessId');
    return saved ? JSON.parse(saved) : null;
  });
  const [moveFishData, setMoveFishData] = useState(() => {
    const saved = sessionStorage.getItem('batchMoveFishData');
    return saved ? JSON.parse(saved) : {
      stageId_to: '',
      batch_no: '',
      actual_quantity: 0,
      remarks: '',
    };
  });
  const [moveData, setMoveData] = useState(() => {
    const saved = sessionStorage.getItem('batchMoveData');
    return saved ? JSON.parse(saved) : {
      stageId_from: "",
      stageId_to: "",
      wholeFishQuantity: '',
      brokenFishQuantity: '',
      damageOrLoss: '',
    };
  });
  const [quantity, setQuantity] = useState(() => {
    const saved = sessionStorage.getItem('batchQuantity');
    return saved ? JSON.parse(saved) : {
      wholeFish: 0,
      brokenFish: 0,
      damage: 0,
    };
  });
  const [cumulativeBrokenFishQuantity, setCumulativeBrokenFishQuantity] = useState(() => {
    const saved = sessionStorage.getItem('batchCumBroken');
    return saved ? JSON.parse(saved) : 0;
  });
  const [cumulativeDamageOrLoss, setCumulativeDamageOrLoss] = useState(() => {
    const saved = sessionStorage.getItem('batchCumDamage');
    return saved ? JSON.parse(saved) : 0;
  });
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(() => {
    const savedValue = sessionStorage.getItem('showSuccessOverlay');
    return savedValue ? JSON.parse(savedValue) : false;
  });

  const orderedStages = useMemo(() => {
    return checkStages.sort((a, b) => {
      const stageOrder = ["Washing", "Smoking", "Drying"];
      return stageOrder.indexOf(a.title) - stageOrder.indexOf(b.title);
    });
  }, [checkStages]);

  const fetchWashingStage = async () => {
    setStagesLoading(true);
    try {
      const stageParams = {};
      if (isSuperAdmin) {
        if (activeSite?.id) stageParams.siteId = activeSite.id;
      } else if (user?.siteId) {
        stageParams.siteId = user.siteId;
      }
      const response = await Api.get('/process-stages', { params: stageParams });
      if (Array.isArray(response.data.data)) {
        setCheckStages(response.data.data);
        const washingStage = response.data.data.find(stage => stage.title === "Washing");
        setStages(prev => ({ ...prev, washing: washingStage }));
        setMoveFishData(prev => ({
          ...prev,
          stageId_to: washingStage ? washingStage.id : '',
          remarks: prev.actual_quantity ? `Process started with ${prev.actual_quantity}` : ''
        }));
      } else {
        throw new Error('Expected an array of stages for Washing');
      }
    } catch (err) {
      console.error(err.response?.data?.message || 'Failed to fetch washing stage.');
    } finally {
      setStagesLoading(false);
    }
  };

  const fetchFishType = async () => {
    setShowLoading(true);
    try {
      const params = {};
      if (isSuperAdmin) {
        if (activeSite?.id) params.siteId = activeSite.id;
      } else if (user?.siteId) {
        params.siteId = user.siteId;
      }
      const response = await Api.get('/get-all-active-harvest-batch', { params });
      const quantity = Number(response.data.data) || 0;
      if (quantity > 0) {
        setMoveFishData(prev => ({
          ...prev,
          actual_quantity: quantity,
          remarks: `Process started with ${quantity}`
        }));
      }
    } catch (err) {
      console.error(err.response?.data?.message || 'Failed to fetch harvest data.');
    }finally{
      setShowLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchWashingStage();
      fetchFishType();

      const savedProcessId = sessionStorage.getItem('batchProcessId');
      if (savedProcessId) {
        const pid = JSON.parse(savedProcessId);
        try {
          const res = await Api.get(`/fish-process/${pid}`);
          const data = res.data.data;
          if (data) {
            setQuantity({
              wholeFish: data.wholeFishQuantity || 0,
              brokenFish: data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0,
              damage: data.cumulativeDamageOrLoss || data.damageOrLoss || 0,
            });
            setMoveData(prev => ({
              ...prev,
              stageId_from: data.stageId_from || prev.stageId_from,
              stageId_to: data.stageId_to || prev.stageId_to,
            }));
            setCumulativeBrokenFishQuantity(data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0);
            setCumulativeDamageOrLoss(data.cumulativeDamageOrLoss || data.damageOrLoss || 0);
          }
        } catch (err) {
          if (err.response?.status === 404) {
            clearBatchStorage();
            setShowSuccessOverlay(false);
          } else {
            console.error('Failed to restore process data on reload:', err);
          }
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('showSuccessOverlay', JSON.stringify(showSuccessOverlay));
  }, [showSuccessOverlay]);

  useEffect(() => {
    sessionStorage.setItem('batchMoveData', JSON.stringify(moveData));
  }, [moveData]);

  useEffect(() => {
    sessionStorage.setItem('batchQuantity', JSON.stringify(quantity));
  }, [quantity]);

  useEffect(() => {
    sessionStorage.setItem('batchMoveFishData', JSON.stringify(moveFishData));
  }, [moveFishData]);

  useEffect(() => {
    sessionStorage.setItem('batchCumBroken', JSON.stringify(cumulativeBrokenFishQuantity));
  }, [cumulativeBrokenFishQuantity]);

  useEffect(() => {
    sessionStorage.setItem('batchCumDamage', JSON.stringify(cumulativeDamageOrLoss));
  }, [cumulativeDamageOrLoss]);

  useEffect(() => {
    if (processId !== null) {
      sessionStorage.setItem('batchProcessId', JSON.stringify(processId));
    }
  }, [processId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (orderedStages.length > 0) {
      setMoveData(prev => {
        if (prev.stageId_from) return prev;
        const defaultStageId = orderedStages[0].id;
        return {
          ...prev,
          stageId_from: defaultStageId,
          stageId_to: getNextStageId(defaultStageId),
        };
      });
    }
  }, [orderedStages]);

  const handleInputChangeMoveFish = (e) => {
    const { name, value } = e.target;
    setMoveFishData(prev => ({
      ...prev,
      [name]: name === 'actual_quantity' ? parseFloat(value) || 0 : value,
      remarks: name === 'actual_quantity' ? `Process started with ${value} Fishes` : prev.remarks
    }));
  };

  const handleMoveFish = (e) => {
    const { name, value } = e.target;
    setMoveData(prev => ({
      ...prev,
      [name]: ["wholeFishQuantity", "brokenFishQuantity", "damageOrLoss"].includes(name)
        ? value === '' ? '' : parseFloat(value) >= 0 ? parseFloat(value) : 0
        : value,
    }));
  };

  const handleMoveFishes = async (e) => {
    e.preventDefault();
    setLoader(true);
    const loadingToast = toast.loading("Moving To Process Control...");

    try {
      const payload = {
        ...moveFishData,
        ...(isSuperAdmin
          ? (activeSite?.id ? { siteId: activeSite.id } : {})
          : (user?.siteId ? { siteId: user.siteId } : {})
        ),
      };
      const response = await Api.post('/harvest-washing', payload);
      const newProcessId = response.data.data?.id;
      if (newProcessId) setProcessId(newProcessId);

      if (newProcessId) {
        try {
          const res = await Api.get(`/fish-process/${newProcessId}`);
          const data = res.data.data;
          if (data) {
            setQuantity({
              wholeFish: data.wholeFishQuantity || 0,
              brokenFish: data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0,
              damage: data.cumulativeDamageOrLoss || data.damageOrLoss || 0,
            });
            setMoveData(prev => ({
              ...prev,
              stageId_from: data.stageId_from || prev.stageId_from,
              stageId_to: data.stageId_to || prev.stageId_to,
              wholeFishQuantity: '',
              brokenFishQuantity: '',
              damageOrLoss: '',
            }));
            setCumulativeBrokenFishQuantity(data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0);
            setCumulativeDamageOrLoss(data.cumulativeDamageOrLoss || data.damageOrLoss || 0);
          }
        } catch (err) {
          console.error('Failed to fetch process data:', err);
          setQuantity({
            wholeFish: response.data.data?.actual_quantity || 0,
            brokenFish: 0,
            damage: 0,
          });
        }
      }

      toast.update(loadingToast, {
        render: "Fish moved successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setMoveFishData({
        speciesId: '',
        actual_quantity: '',
        stageId_to: stages.washing ? stages.washing.id : '',
        remarks: '',
      });

      setShowSuccessOverlay(true);
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Error moving fish.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleStageSelect = (stageId) => {
    setMoveData(prev => ({
      ...prev,
      stageId_from: stageId,
      stageId_to: getNextStageId(stageId),
    }));
  };

  const getNextStageId = (currentStageId) => {
    const currentIndex = orderedStages.findIndex(stage => stage.id === currentStageId);
    return currentIndex !== -1 && currentIndex + 1 < orderedStages.length
      ? orderedStages[currentIndex + 1].id
      : null;
  };

  const getEndpoint = (stageTitle) => {
    const normalized = (stageTitle || '').trim().toLowerCase();
    if (normalized === "washing") return "/fish-process";
    if (normalized === "smoking") return "/smoking-to-drying";
    if (normalized === "drying") return "/add-fish-to-show-glass";
    return null;
  };

  const getStageIndex = (stageId) => {
    return orderedStages.findIndex(s => s.id === stageId);
  };

  const getEndpointByIndex = (stageId) => {
    const idx = getStageIndex(stageId);
    if (idx === 0) return "/fish-process";
    if (idx === 1) return "/smoking-to-drying";
    if (idx === 2) return "/add-fish-to-show-glass";
    return null;
  };

  const handleNext = async () => {
    setLoading(true);
    setMessage("Processing your request...");
    try {
      const currentStage = orderedStages.find(stage => stage.id === moveData.stageId_from);

      if (!currentStage || stagesLoading) {
        throw new Error("Stages are still loading. Please wait.");
      }

      const endpoint = getEndpoint(currentStage.title) || getEndpointByIndex(currentStage.id);

      if (endpoint) {
        const payload = {
          ...moveData,
          ...(isSuperAdmin
            ? (activeSite?.id ? { siteId: activeSite.id } : {})
            : (user?.siteId ? { siteId: user.siteId } : {})
          ),
        };
        const response = await Api.post(endpoint, payload);

        const data = response.data.data || response.data.newProcess;
        const newProcessId = data?.id || data?.processId;
        if (newProcessId) setProcessId(newProcessId);

        const fetchProcessData = async (id) => {
          try {
            const res = await Api.get(`/fish-process/${id}`);
            const pd = res.data.data;
            if (pd) {
              setQuantity({
                wholeFish: pd.wholeFishQuantity || 0,
                brokenFish: pd.cumulativeBrokenQuantity || pd.brokenFishQuantity || 0,
                damage: pd.cumulativeDamageOrLoss || pd.damageOrLoss || 0,
              });
              setMoveData(prev => ({
                ...prev,
                stageId_from: pd.stageId_from || prev.stageId_from,
                stageId_to: pd.stageId_to || prev.stageId_to,
                wholeFishQuantity: '',
                brokenFishQuantity: '',
                damageOrLoss: '',
              }));
              setCumulativeBrokenFishQuantity(pd.cumulativeBrokenQuantity || pd.brokenFishQuantity || 0);
              setCumulativeDamageOrLoss(pd.cumulativeDamageOrLoss || pd.damageOrLoss || 0);
            }
          } catch (err) {
            console.error('Failed to fetch process data:', err);
          }
        };

        if (newProcessId) {
          await fetchProcessData(newProcessId);
        } else if (processId) {
          await fetchProcessData(processId);
        }

        setMoveData(prev => ({
          ...prev,
          wholeFishQuantity: '',
          brokenFishQuantity: '',
          damageOrLoss: '',
        }));

        setMessage("Fish moved successfully!");
        const isDrying = getEndpoint(currentStage.title) === "/add-fish-to-show-glass"
          || getEndpointByIndex(currentStage.id) === "/add-fish-to-show-glass";
        if (isDrying) {
          clearBatchStorage();
          setShowSuccessOverlay(false);
          setTimeout(() => navigate('/showcase/whole-showcase'), 2500);
        } else if (!newProcessId) {
          const nextStageId = getNextStageId(moveData.stageId_from);
          if (nextStageId) {
            setMoveData(prev => ({
              ...prev,
              stageId_from: nextStageId,
              stageId_to: getNextStageId(nextStageId),
              wholeFishQuantity: '',
              brokenFishQuantity: '',
              damageOrLoss: '',
            }));
          }
        }
      } else {
        throw new Error("Invalid stage transition.");
      }
    } catch (error) {
      console.error("Error processing fish:", error);
      setMessage("Error processing fish. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchWashingStage();
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const clearBatchStorage = () => {
    setProcessId(null);
    ['batchMoveData', 'batchQuantity', 'batchMoveFishData', 'batchCumBroken', 'batchCumDamage', 'batchProcessId', 'showSuccessOverlay'].forEach(k => sessionStorage.removeItem(k));
  };

  const handleSaveProgress = () => {
    toast.success('Progress saved successfully!', { autoClose: 2000 });
  };

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <ToastContainer />
            {!showSuccessOverlay && (
              <Form onSubmit={handleMoveFishes}>
                <h4 className="my-5">Process Fish</h4>
                <Row>
                  <Col md={12} lg={12} className="mb-4">
                    <Form.Label className="fw-semibold">Import Harvest</Form.Label>
                    <Form.Control
                      type="text"
                      name="batch_no"
                      value="Harvest"
                      readOnly
                      className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                    />
                  </Col>
                  <Col md={12} lg={12} className="mb-4">
                    <Form.Label className="fw-semibold">Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      name="actual_quantity"
                      value={moveFishData.actual_quantity || ""}
                      readOnly
                      className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                    />
                    {showLoading ? (
                      <Form.Text className="text-success mt-1 d-block">Loading...</Form.Text>
                    ) : (
                      (!moveFishData.actual_quantity || moveFishData.actual_quantity === 0) && (
                        <Form.Text className="text-danger mt-1 d-block">
                          No harvested quantity available. Please add fish to harvest to start processing.
                        </Form.Text>
                      )
                    )}
                  </Col>
                  {/* Removed Process To and Remark fields */}
                </Row>
                <div className="d-flex justify-content-end my-4">
                  <Button
                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                    disabled={loader|| moveFishData.actual_quantity === 0}
                    type="submit"
                  >
                    {loader ? 'Processing' : "Process"}
                  </Button>
                </div>
              </Form>
            )}

            {showSuccessOverlay && (() => {
              const currentStage = orderedStages.find(s => s.id === moveData.stageId_from);
              const nextStage = orderedStages[orderedStages.findIndex(s => s.id === moveData.stageId_from) + 1];
              const totalInput = quantity.wholeFish + quantity.brokenFish + quantity.damage;
              const expYield = (totalInput * 0.8).toFixed(2);
              const damageRatio = quantity.wholeFish > 0 ? quantity.damage / quantity.wholeFish : 0;
              const batchHealthy = quantity.wholeFish > 0 && damageRatio < 0.1;

              const processingNotes = {
                Washing: 'Ensure all fish are thoroughly rinsed. Record initial quantity before proceeding.',
                Smoking: 'Ensure smoking temperature remains between 65–75°C. Recording moisture loss is critical for yield calculation.',
                Drying: 'Ensure fish are evenly spread. Target moisture content below 15% before showcase transfer.',
              };
              const noteText = processingNotes[currentStage?.title] || 'Follow standard processing procedures for this stage.';

              return (
                <div style={{ marginTop: '0', fontFamily: 'inherit' }}>

                  {/* ── Page Header Bar ── */}
                  <div style={{ backgroundColor: '#F5F5F3', borderRadius: '10px', padding: '20px 28px 0 28px', marginBottom: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8C949B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Current Operation
                        </p>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.55rem', color: '#2E3135', letterSpacing: '-0.01em' }}>
                          Washing: {moveFishData.batch_no || `#PR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(moveFishData.actual_quantity || 0).padStart(3, '0')}`}
                        </h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8C949B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Processing Date
                        </p>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#2E3135' }}>
                          {(() => { const d = new Date(); return `${d.getDate().toString().padStart(2,'0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`; })()}
                        </p>
                      </div>
                    </div>

                    {/* ── Stage Tabs ── */}
                    <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #E0E0DC' }}>
                      {orderedStages.length > 0 ? orderedStages.map((stage) => {
                        const isActive = moveData.stageId_from === stage.id;
                        const stageIdx = orderedStages.findIndex(s => s.id === stage.id);
                        const currentIdx = orderedStages.findIndex(s => s.id === moveData.stageId_from);
                        const isPast = stageIdx < currentIdx;
                        return (
                          <div
                            key={stage.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '7px',
                              padding: '12px 22px 11px 22px',
                              borderBottom: isActive ? '2px solid #512728' : '2px solid transparent',
                              cursor: isActive ? 'default' : 'not-allowed',
                              marginBottom: '-1px',
                            }}
                          >
                            <span style={{
                              width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                              backgroundColor: isActive ? '#512728' : 'transparent',
                              border: isActive ? 'none' : `2px solid ${isPast ? '#512728' : '#C0C0BA'}`,
                              display: 'inline-block',
                            }} />
                            <span style={{
                              fontSize: '0.82rem', fontWeight: 700,
                              color: isActive ? '#512728' : isPast ? '#512728' : '#8C949B',
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                              {stage.title}
                            </span>
                          </div>
                        );
                      }) : (
                        <p className="text-muted fw-semibold px-3 pb-2" style={{ fontSize: '0.82rem' }}>Loading...</p>
                      )}
                    </div>
                  </div>

                  {/* ── Main Content Card ── */}
                  <div style={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E8E4',
                    borderRadius: '10px',
                    marginTop: '16px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', minHeight: '360px' }}>

                      {/* Left Column */}
                      <div style={{ width: '34%', borderRight: '1px solid #F0F0EC', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Batch Reference Image */}
                        <div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.68rem', fontWeight: 700, color: '#8C949B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Batch Reference Image
                          </p>
                          <div style={{
                            border: '1px dashed #C8C8C4',
                            borderRadius: '6px',
                            padding: '10px',
                            backgroundColor: '#FAFAFA',
                            fontSize: '0.65rem',
                            color: '#8C949B',
                            lineHeight: 1.6,
                          }}>
                            <div style={{ backgroundColor: '#E8E8E4', borderRadius: '3px', padding: '4px 6px', marginBottom: '6px', fontSize: '0.62rem', color: '#5F5E5A', fontWeight: 600 }}>
                              WASHING / SMOKING / DRYING
                            </div>
                            {['WHOLE FISH', 'BROKEN FISH', 'DAMAGE/LOSS'].map((label, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', gap: '6px' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#8C949B', whiteSpace: 'nowrap' }}>{label}</span>
                                <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'flex-end' }}>
                                  <div style={{ height: '14px', flex: 1, backgroundColor: '#E8E8E4', borderRadius: '2px', maxWidth: '36px' }} />
                                  <div style={{ height: '14px', flex: 1, backgroundColor: '#E8E8E4', borderRadius: '2px', maxWidth: '60px' }} />
                                </div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                              <div style={{ backgroundColor: '#512728', borderRadius: '3px', padding: '3px 10px', fontSize: '0.6rem', color: '#fff', fontWeight: 600 }}>Next</div>
                            </div>
                          </div>
                        </div>

                        {/* Processing Notes */}
                        <div style={{
                          backgroundColor: '#FFF8F0',
                          border: '1px solid #FAD8A8',
                          borderLeft: '3px solid #e8a020',
                          borderRadius: '6px',
                          padding: '14px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                            <BsExclamationCircle size={15} color="#e8a020" />
                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#e8a020' }}>Processing Notes</p>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#5F5E5A', lineHeight: 1.6, fontStyle: 'italic' }}>
                            {noteText}
                          </p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div style={{ flex: 1, padding: '0' }}>

                        {/* Column Headers */}
                        <div style={{
                          display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.4fr',
                          padding: '12px 20px',
                          borderBottom: '1px solid #F0F0EC',
                          backgroundColor: '#FAFAFA',
                        }}>
                          {['Fish Category', 'Before (Kg)', 'After (Kg)'].map((h) => (
                            <p key={h} style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8C949B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</p>
                          ))}
                        </div>

                        {/* Fish Rows */}
                        {[
                          {
                            icon: <BsGrid3X3GapFill size={20} color="#512728" />,
                            bgIcon: '#FFF0F0',
                            label: 'Whole Fish',
                            before: quantity.wholeFish,
                            afterName: 'wholeFishQuantity',
                            afterValue: moveData.wholeFishQuantity,
                          },
                          {
                            icon: <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px', padding: '3px' }}>
                              {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: '14px', height: '3px', backgroundColor: '#e8a020', borderRadius: '1px' }} />)}
                            </span>,
                            bgIcon: '#FFFBF0',
                            label: 'Broken Fish',
                            before: quantity.brokenFish,
                            afterName: 'brokenFishQuantity',
                            afterValue: moveData.brokenFishQuantity,
                          },
                          {
                            icon: <BsXCircleFill size={20} color="#dc3545" />,
                            bgIcon: '#FFF5F5',
                            label: 'Damage / Loss',
                            before: quantity.damage,
                            afterName: 'damageOrLoss',
                            afterValue: moveData.damageOrLoss,
                          },
                        ].map((row, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.4fr',
                              padding: '14px 20px', alignItems: 'center',
                              borderBottom: i < 2 ? '1px solid #F8F8F5' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                backgroundColor: row.bgIcon,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {row.icon}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2E3135' }}>{row.label}</span>
                            </div>
                            <div style={{ paddingRight: '12px' }}>
                              <input
                                type="number"
                                readOnly
                                value={row.before}
                                style={{
                                  width: '100%', padding: '9px 12px',
                                  border: '1px solid #E8E8E4', borderRadius: '6px',
                                  backgroundColor: '#F5F5F3', color: '#2E3135',
                                  fontSize: '0.875rem', fontWeight: 600,
                                  outline: 'none',
                                }}
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                name={row.afterName}
                                value={row.afterValue}
                                onChange={handleMoveFish}
                                required
                                placeholder="Enter quantity"
                                style={{
                                  width: '100%', padding: '9px 12px',
                                  border: '1px solid #E0E0DC', borderRadius: '6px',
                                  backgroundColor: '#fff', color: '#2E3135',
                                  fontSize: '0.875rem',
                                  outline: 'none',
                                }}
                                onFocus={e => e.target.style.borderColor = '#512728'}
                                onBlur={e => e.target.style.borderColor = '#E0E0DC'}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Action Buttons */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '16px 20px', borderTop: '1px solid #F0F0EC',
                          justifyContent: 'flex-end',
                        }}>
                          <button
                            type="button"
                            onClick={() => setShowSuccessOverlay(false)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '7px',
                              padding: '9px 18px', borderRadius: '7px',
                              border: '1px solid #D0D0CC', backgroundColor: '#fff',
                              color: '#5F5E5A', fontSize: '0.875rem', fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <BsXLg size={13} /> Cancel Movement
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProgress}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '7px',
                              padding: '9px 18px', borderRadius: '7px',
                              border: '1px solid #D0D0CC', backgroundColor: '#fff',
                              color: '#5F5E5A', fontSize: '0.875rem', fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <BsSave size={13} /> Save Progress
                          </button>
                          <button
                            type="button"
                            onClick={handleNext}
                            disabled={
                              loading ||
                              stagesLoading ||
                              !currentStage ||
                              moveData.wholeFishQuantity === '' ||
                              moveData.brokenFishQuantity === '' ||
                              moveData.damageOrLoss === ''
                            }
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '9px 22px', borderRadius: '7px',
                              border: 'none',
                              backgroundColor:
                                loading ||
                                stagesLoading ||
                                !currentStage ||
                                moveData.wholeFishQuantity === '' ||
                                moveData.brokenFishQuantity === '' ||
                                moveData.damageOrLoss === ''
                                  ? '#8C6364'
                                  : '#512728',
                              color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                              cursor:
                                loading ||
                                stagesLoading ||
                                !currentStage ||
                                moveData.wholeFishQuantity === '' ||
                                moveData.brokenFishQuantity === '' ||
                                moveData.damageOrLoss === ''
                                  ? 'not-allowed'
                                  : 'pointer',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            {stagesLoading || !currentStage ? 'Loading...' : currentStage?.title !== 'Drying' ? `Proceed to ${nextStage?.title || 'Next'}` : 'Move To Showcase'}
                            <BsArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Summary Stat Bar ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                    {[
                      {
                        label: 'Total Input',
                        value: `${totalInput.toFixed(2)} Kg`,
                        valueColor: '#2E3135',
                        content: null,
                      },
                      {
                        label: 'Exp. Yield (80%)',
                        value: `${expYield} Kg`,
                        valueColor: '#e8a020',
                        content: null,
                      },
                      {
                        label: 'Processing Team',
                        value: null,
                        content: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            {['FT', 'JA'].map((init, i) => (
                              <div key={i} style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                backgroundColor: i === 0 ? '#512728' : '#e8a020',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                                border: '2px solid #fff', marginLeft: i > 0 ? '-6px' : '0',
                              }}>
                                {init}
                              </div>
                            ))}
                            <span style={{
                              backgroundColor: '#F0F0EC', borderRadius: '20px',
                              padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, color: '#5F5E5A',
                            }}>+3</span>
                          </div>
                        ),
                      },
                      {
                        label: 'Batch Health',
                        value: null,
                        content: (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                            <span style={{
                              backgroundColor: batchHealthy ? '#E8F5E9' : '#FFF3CD',
                              color: batchHealthy ? '#28a745' : '#e8a020',
                              border: `1px solid ${batchHealthy ? '#C8E6CA' : '#FFE082'}`,
                              borderRadius: '4px', padding: '3px 10px',
                              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
                            }}>
                              {batchHealthy ? 'STABLE' : 'AT RISK'}
                            </span>
                            <span style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              backgroundColor: batchHealthy ? '#28a745' : '#e8a020',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          </div>
                        ),
                      },
                    ].map((card, i) => (
                      <div key={i} style={{
                        backgroundColor: '#fff',
                        border: '1px solid #E8E8E4',
                        borderRadius: '8px',
                        padding: '14px 18px',
                      }}>
                        <p style={{ margin: '0 0 2px 0', fontSize: '0.75rem', color: '#8C949B', fontWeight: 500 }}>{card.label}</p>
                        {card.value !== null && (
                          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: card.valueColor }}>{card.value}</p>
                        )}
                        {card.content}
                      </div>
                    ))}
                  </div>

                  {/* ── Status Footer Bar ── */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '14px', padding: '10px 16px',
                    backgroundColor: '#F5F5F3', borderRadius: '8px',
                    fontSize: '0.75rem', color: '#8C949B',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#28a745', display: 'inline-block' }} />
                        ERP Sync Active
                      </span>
                      <span style={{ color: '#D0D0CC' }}>|</span>
                      <span>Central Cold Store – Sector 4</span>
                    </div>
                    <span>Last change: 2 mins ago</span>
                  </div>

                  {/* Inline fade message */}
                  {message && (
                    <p style={{
                      textAlign: 'right', fontSize: '0.875rem', fontWeight: 600,
                      color: message.includes('Error') ? '#dc3545' : '#28a745',
                      padding: '8px 4px 0 0',
                      animation: 'fadeInOut 0.3s ease',
                    }}>
                      {message}
                    </p>
                  )}

                </div>
              );
            })()}
          </main>
        </section>
      </div>
    </section>
  );
}
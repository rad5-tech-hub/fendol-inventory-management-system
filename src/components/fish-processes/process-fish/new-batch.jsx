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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);

  const orderedStages = useMemo(() => {
    const stageOrder = ["Washing", "Smoking", "Drying"];
    return checkStages
      .filter(s => stageOrder.includes(s.title))
      .sort((a, b) => stageOrder.indexOf(a.title) - stageOrder.indexOf(b.title));
  }, [checkStages]);

  const fetchWashingStage = async () => {
    setStagesLoading(true);
    try {
      const stageParams = {};
      const sid = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]);
      if (sid) stageParams.siteId = sid;
      const response = await Api.get('/process-stages', { params: stageParams });
      if (Array.isArray(response.data.data)) {
        setCheckStages(response.data.data);
        const washingStage = response.data.data.find(stage => stage.title === "Washing");
        setStages(prev => ({ ...prev, washing: washingStage }));
        setMoveFishData(prev => ({
          ...prev,
          stageId_to: washingStage ? washingStage.id : '',
          remarks: prev.actual_quantity ? `Process started with ${Number(prev.actual_quantity).toLocaleString()}` : ''
        }));
      } else {
        throw new Error('Expected an array of stages for Washing');
      }
    } catch (err) {
      console.error(`[GET] /process-stages`, err);
      toast.error(getErrorMessage(err, 'fetching stages'), { autoClose: 6000 });
    } finally {
      setStagesLoading(false);
    }
  };

  const fetchFishType = async () => {
    setShowLoading(true);
    try {
      const params = {};
      const batchSid = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]);
      if (batchSid) params.siteId = batchSid;
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
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 404 && data?.response_message?.includes('No harvest records')) {
        return;
      }
      console.error(`[GET] /get-all-active-harvest-batch`, err);
      toast.error(getErrorMessage(err, 'fetching harvest data'), { autoClose: 6000 });
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
              stageId_from: data.stageId_to || prev.stageId_from,
              stageId_to: getNextStageId(data.stageId_to) || prev.stageId_to,
            }));
            setCumulativeBrokenFishQuantity(data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0);
            setCumulativeDamageOrLoss(data.cumulativeDamageOrLoss || data.damageOrLoss || 0);
          }
        } catch (err) {
          console.error(`[GET] /fish-process/${pid}`, err);
          if (err.response?.status === 404) {
            toast.warn(getErrorMessage(err, 'restoring previous process'), { autoClose: 5000 });
            clearBatchStorage();
          } else {
            toast.error(getErrorMessage(err, 'restoring process data'), { autoClose: 6000 });
          }
        }
      }
    };
    init();
  }, []);

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
    if (orderedStages.length > 0) {
      setMoveData(prev => {
        if (!prev.stageId_from) {
          const defaultStageId = orderedStages[0].id;
          return {
            ...prev,
            stageId_from: defaultStageId,
            stageId_to: getNextStageId(defaultStageId),
          };
        }
        if (!orderedStages.some(s => s.id === prev.stageId_from)) {
          const washing = orderedStages[0];
          return {
            ...prev,
            stageId_from: washing.id,
            stageId_to: getNextStageId(washing.id),
          };
        }
        return prev;
      });
    }
  }, [orderedStages]);

  const handleInputChangeMoveFish = (e) => {
    const { name, value } = e.target;
    setMoveFishData(prev => ({
      ...prev,
      [name]: name === 'actual_quantity' ? parseFloat(value) || 0 : value,
      remarks: name === 'actual_quantity' ? `Process started with ${Number(value).toLocaleString()} Fishes` : prev.remarks
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
          : ((user?.siteId || user?.userSites?.[0]) ? { siteId: user?.siteId || user?.userSites?.[0] } : {})
        ),
      };
      const response = await Api.post('/harvest-washing', payload);
      const newProcessId = response.data.data?.id;
      if (newProcessId) setProcessId(newProcessId);

      if (newProcessId) {
        try {
          const res = await Api.get(`/fish-process/${newProcessId}`);
          const data = res.data.data;
          console.log('[handleMoveFishes] GET /fish-process response', { stageId_from: data?.stageId_from, stageId_to: data?.stageId_to, data });
          if (data) {
            setQuantity({
              wholeFish: data.wholeFishQuantity || 0,
              brokenFish: data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0,
              damage: data.cumulativeDamageOrLoss || data.damageOrLoss || 0,
            });
            setMoveData(prev => ({
              ...prev,
              stageId_from: data.stageId_to || prev.stageId_from,
              stageId_to: getNextStageId(data.stageId_to) || prev.stageId_to,
              wholeFishQuantity: '',
              brokenFishQuantity: '',
              damageOrLoss: '',
            }));
            setCumulativeBrokenFishQuantity(data.cumulativeBrokenQuantity || data.brokenFishQuantity || 0);
            setCumulativeDamageOrLoss(data.cumulativeDamageOrLoss || data.damageOrLoss || 0);
          }
        } catch (err) {
          console.error(`[GET] /fish-process/${newProcessId}`, err);
          toast.error(getErrorMessage(err, 'fetching updated process data'), { autoClose: 6000 });
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

      const targetId = newProcessId || response.data.data?.processId;
      if (targetId) {
        navigate(`/fish-processes/batch-processing/${targetId}`);
      }
    } catch (error) {
      console.error(`[POST] /harvest-washing`, error);
      toast.update(loadingToast, {
        render: getErrorMessage(error, 'starting process'),
        type: "error",
        isLoading: false,
        autoClose: 6000,
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
    if (normalized === "washing") return "/washing-to-smoking";
    if (normalized === "smoking") return "/smoking-to-drying";
    if (normalized === "drying") return "/add-fish-to-show-glass";
    return null;
  };

  const getStageIndex = (stageId) => {
    return orderedStages.findIndex(s => s.id === stageId);
  };

  const getEndpointByIndex = (stageId) => {
    const idx = getStageIndex(stageId);
    if (idx === 0) return "/washing-to-smoking";
    if (idx === 1) return "/smoking-to-drying";
    if (idx === 2) return "/add-fish-to-show-glass";
    return null;
  };

  const getErrorMessage = (error, stageTitle = '') => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') return 'Request timed out. Please check your network and try again.';
      return 'Network error \u2014 server unreachable. Please check your internet connection.';
    }
    const { status, data } = error.response;
    const context = stageTitle ? ` for ${stageTitle} stage` : '';
    const serverMsg = data?.message || data?.response_message || '';
    if (status === 400) return `Invalid request${context}. ${serverMsg || 'Please check your input values.'}`;
    if (status === 404) return `The ${stageTitle || 'requested'} endpoint was not found. Please contact support.`;
    if (status === 409) return `Conflict: ${serverMsg || 'This batch may already be processed through this stage.'}`;
    if (status === 422) return `Validation error${context}. ${serverMsg || 'One or more fields are invalid.'}`;
    if (status >= 500) return `Server error${context} (${status}). Please try again later.`;
    if (!data) return `Server returned empty response${context}.`;
    return serverMsg || `Failed to process${context}. Please try again.`;
  };

  const handleNext = async () => {
    setLoading(true);
    console.log('[handleNext] entry', { moveData_stageId_from: moveData.stageId_from, orderedStageIds: orderedStages.map(s => ({ id: s.id, title: s.title })) });
    try {
      const currentStage = orderedStages.find(stage => stage.id === moveData.stageId_from);
      console.log('[handleNext] currentStage', currentStage);

      if (!currentStage || stagesLoading) {
        toast.warn('Stages are still loading. Please wait.', { autoClose: 4000 });
        throw new Error('Stages are still loading. Please wait.');
      }

      const endpoint = getEndpoint(currentStage.title) || getEndpointByIndex(currentStage.id);
      const isShowcaseMove = endpoint === "/add-fish-to-show-glass";
      console.log('[handleNext] endpoint', endpoint);

      if (endpoint) {
        const wholeFish = parseFloat(moveData.wholeFishQuantity);
        const brokenFish = parseFloat(moveData.brokenFishQuantity);
        const damageLoss = parseFloat(moveData.damageOrLoss);
        if (isNaN(wholeFish) || wholeFish < 0) {
          toast.error('Whole Fish quantity must be 0 or greater.', { autoClose: 4000 });
          throw new Error('Invalid quantity: Whole Fish must be 0 or greater.');
        }
        if (isNaN(brokenFish) || brokenFish < 0) {
          toast.error('Broken Fish quantity must be 0 or greater.', { autoClose: 4000 });
          throw new Error('Invalid quantity: Broken Fish must be 0 or greater.');
        }
        if (isNaN(damageLoss) || damageLoss < 0) {
          toast.error('Damage/Loss quantity must be 0 or greater.', { autoClose: 4000 });
          throw new Error('Invalid quantity: Damage/Loss must be 0 or greater.');
        }

        const payload = {
          ...moveData,
          processId,
          ...(isSuperAdmin
            ? (activeSite?.id ? { siteId: activeSite.id } : {})
            : ((user?.siteId || user?.userSites?.[0]) ? { siteId: user?.siteId || user?.userSites?.[0] } : {})
          ),
        };
        console.log('[handleNext] POST payload', payload);
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
                stageId_from: pd.stageId_to || prev.stageId_from,
                stageId_to: getNextStageId(pd.stageId_to) || prev.stageId_to,
                wholeFishQuantity: '',
                brokenFishQuantity: '',
                damageOrLoss: '',
              }));
              setCumulativeBrokenFishQuantity(pd.cumulativeBrokenQuantity || pd.brokenFishQuantity || 0);
              setCumulativeDamageOrLoss(pd.cumulativeDamageOrLoss || pd.damageOrLoss || 0);
            }
          } catch (err) {
            console.error(`[GET] /fish-process/${id}`, err);
            toast.error(getErrorMessage(err, 'fetching updated process data'), { autoClose: 6000 });
          }
        };

        if (!isShowcaseMove) {
          if (newProcessId) {
            await fetchProcessData(newProcessId);
          } else if (processId) {
            await fetchProcessData(processId);
          }
        }

        setMoveData(prev => ({
          ...prev,
          wholeFishQuantity: '',
          brokenFishQuantity: '',
          damageOrLoss: '',
        }));

        const isDrying = getEndpoint(currentStage.title) === "/add-fish-to-show-glass"
          || getEndpointByIndex(currentStage.id) === "/add-fish-to-show-glass";
        if (isDrying) {
          setSuccessModalData({
            batch_no: moveFishData.batch_no || `#PR-${new Date().getFullYear()}`,
            wholeFish: quantity.wholeFish,
            brokenFish: quantity.brokenFish,
            damage: quantity.damage,
          });
          setShowSuccessModal(true);
          clearBatchStorage();
          setShowSuccessOverlay(false);
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
        toast.error('No matching endpoint found for the current stage.', { autoClose: 6000 });
        throw new Error("Invalid stage transition.");
      }
    } catch (error) {
      const stageTitle = orderedStages.find(s => s.id === moveData.stageId_from)?.title || '';
      console.error(`[POST] stage=${stageTitle}`, error);
      toast.error(getErrorMessage(error, stageTitle ? `processing ${stageTitle}` : 'processing stage'), { autoClose: 6000 });
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
              </Row>
              <div className="d-flex justify-content-end my-4">
                <Button
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                  disabled={loader|| moveFishData.actual_quantity === 0}
                  type="submit"
                >
                  {loader ? (
                    <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.5s linear infinite', marginRight: '8px' }} />Processing</>
                  ) : "Process"}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
    </section>
  );
}
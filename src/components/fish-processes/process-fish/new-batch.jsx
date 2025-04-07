import React, { useState, useEffect, useMemo } from 'react';
import { Form, Row, Col, Button, Breadcrumb } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { MdOutlineRefresh } from "react-icons/md";
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import styles from '../process.module.scss';
import 'react-toastify/dist/ReactToastify.css';

export default function NewBatchFish() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [stages, setStages] = useState({ washing: null });
  const [checkStages, setCheckStages] = useState([]);
  const [fishType, setFishType] = useState([]);
  const [moveFishData, setMoveFishData] = useState({
    stageId_to: '',
    batch_no: '',
    actual_quantity: 0,
    remarks: '',
  });
  const [moveData, setMoveData] = useState({
    stageId_from: "",
    stageId_to: "",
    wholeFishQuantity: '',
    brokenFishQuantity: '',
    damageOrLoss: '',
  });
  const [quantity, setQuantity] = useState({
    wholeFish: 0,
    brokenFish: 0,
    damage: 0,
  });
  const [cumulativeBrokenFishQuantity, setCumulativeBrokenFishQuantity] = useState(0);
  const [cumulativeDamageOrLoss, setCumulativeDamageOrLoss] = useState(0);
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
    try {
      const response = await Api.get('/process-stages');
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
    }
  };

  const fetchFishType = async () => {
    setShowLoading(true);
    try {
      const response = await Api.get('/get-all-active-harvest-batch');
      if (response.data.data.quantity) {
        setMoveFishData(prev => ({
          ...prev,
          actual_quantity: response.data.data.quantity,
          remarks: `Process started with ${response.data.data.quantity}`
        }));
      }
    } catch (err) {
      console.error(err.response?.data?.message || 'Failed to fetch harvest data.');
    }finally{
      setShowLoading(false);
    }
  };

  useEffect(() => {
    fetchWashingStage();
    fetchFishType();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('showSuccessOverlay', JSON.stringify(showSuccessOverlay));
  }, [showSuccessOverlay]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (orderedStages.length > 0) {
      const defaultStageId = orderedStages[0].id;
      setMoveData(prev => ({
        ...prev,
        stageId_from: defaultStageId,
        stageId_to: getNextStageId(defaultStageId),
      }));
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
      const response = await Api.post('/harvest-washing', moveFishData);
      toast.update(loadingToast, {
        render: "Fish moved successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setQuantity({
        wholeFish: response.data.data.actual_quantity,
        damage: 0,
        brokenFish: 0,
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
    switch (stageTitle) {
      case "Washing": return "/fish-process";
      case "Smoking": return "/smoking-to-drying";
      case "Drying": return "/add-fish-to-show-glass";
      default: return null;
    }
  };

  const handleNext = async () => {
    setLoading(true);
    setMessage("Processing your request...");
    try {
      const currentStage = orderedStages.find(stage => stage.id === moveData.stageId_from);
      const endpoint = getEndpoint(currentStage?.title);

      if (endpoint) {
        const response = await Api.post(endpoint, moveData);
        const data = response.data.data || response.data.newProcess;

        const { wholeFishQuantity = 0, brokenFishQuantity = 0, damageOrLoss = 0 } = data;

        setCumulativeBrokenFishQuantity(prev => prev + brokenFishQuantity);
        setCumulativeDamageOrLoss(prev => prev + damageOrLoss);

        setQuantity({
          wholeFish: wholeFishQuantity,
          brokenFish: cumulativeBrokenFishQuantity + brokenFishQuantity,
          damage: cumulativeDamageOrLoss + damageOrLoss,
        });

        setMoveData(prev => ({
          ...prev,
          wholeFishQuantity: '',
          brokenFishQuantity: '',
          damageOrLoss: '',
        }));

        setMessage("Fish moved successfully!");
        if (currentStage.title === "Drying") {
          setShowSuccessOverlay(false);
          setTimeout(() => navigate('/showcase/whole-showcase'), 2500);
        } else {
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

            {showSuccessOverlay && (
              <div className={`${styles.successOverlay}`}>
                <div className={`${styles.successBox}`}>
                  <Form>
                    <div className="d-flex justify-content-end">
                      {/* <span className={styles.refresh} title="Refresh The Process" onClick={handleRefresh}>
                        <MdOutlineRefresh size={25} />
                      </span> */}
                    </div>

                    <h5
                      className={`text-end px-2 py-3 ${
                        message ? styles.fade_in : styles.fade_out
                      }`}
                    >
                      {message}
                    </h5>

                    <Breadcrumb
                      className="mb-4"
                      listProps={{
                        className: "d-flex align-items-center",
                        style: { gap: "0.5rem" },
                      }}
                    >
                      {orderedStages.length > 0 ? (
                        orderedStages.map((stage) => (
                          <Breadcrumb.Item
                            key={stage.id}
                            active={moveData.stageId_from === stage.id}
                            onClick={
                              moveData.stageId_from === stage.id
                                ? () => handleStageSelect(stage.id)
                                : undefined
                            }
                            className="fw-semibold"
                            style={{
                              cursor:
                                moveData.stageId_from === stage.id
                                  ? "pointer"
                                  : "not-allowed",
                              textTransform: "uppercase",
                              textDecoration: "none",
                              color:
                                moveData.stageId_from === stage.id ? "#5e0d0f" : "gray",
                            }}
                            linkAs="span"
                          >
                            {stage.title}
                          </Breadcrumb.Item>
                        ))
                      ) : (
                        <p className="text-muted fw-semibold">Loading...</p>
                      )}
                    </Breadcrumb>

                    <div className="mt-5 mb-4">
                      {/* Whole Fish Section */}
                      <div className="d-flex flex-column flex-md-row align-items-md-center mb-4">
                        <div className="d-flex align-items-center mb-2 mb-md-0">
                          <p className="fw-semibold me-2 mb-0">WHOLE FISH</p>
                          <div className={styles.border_dot}></div>
                        </div>
                        <div className="d-flex flex-column flex-md-row justify-content-md-center align-items-md-center gap-3">
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-3 text-dark">
                              Before
                            </Form.Label>
                            <Form.Control
                              type="number"
                              value={quantity.wholeFish}
                              onChange={(e) =>
                                setQuantity((prev) => ({
                                  ...prev,
                                  wholeFish: parseFloat(e.target.value) || 0,
                                }))
                              }
                              readOnly
                              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label className="fw-semibold mb-3 text-dark">
                              After
                            </Form.Label>
                            <Form.Control
                              name="wholeFishQuantity"
                              value={moveData.wholeFishQuantity}
                              onChange={handleMoveFish}
                              type="number"
                              placeholder={`Enter Whole Quantity after ${
                                orderedStages.find(
                                  (stage) => stage.id === moveData.stageId_from
                                )?.title || "Stage"
                              }`}
                              title={`Enter Whole Quantity after ${
                                orderedStages.find(
                                  (stage) => stage.id === moveData.stageId_from
                                )?.title || "Stage"
                              }`}
                              required
                              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />
                          </Form.Group>
                        </div>
                      </div>

                      {/* Broken Fish Section */}
                      <div className="d-flex flex-column flex-md-row align-items-md-center mb-4">
                        <div className="d-flex align-items-center mb-2 mb-md-0">
                          <p className="fw-semibold me-2 mb-0">BROKEN FISH</p>
                          <div className={styles.border_dote}></div>
                        </div>
                        <div className="d-flex flex-column flex-md-row justify-content-md-center align-items-md-center gap-3">
                          <Form.Control
                            type="number"
                            value={quantity.brokenFish}
                            onChange={(e) =>
                              setQuantity((prev) => ({
                                ...prev,
                                brokenFish: parseFloat(e.target.value) || 0,
                              }))
                            }
                            readOnly
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                          />
                          <Form.Control
                            type="number"
                            placeholder={`Enter Broken Quantity after ${
                              orderedStages.find(
                                (stage) => stage.id === moveData.stageId_from
                              )?.title || "Stage"
                            }`}
                            name="brokenFishQuantity"
                            value={moveData.brokenFishQuantity}
                            onChange={handleMoveFish}
                            required
                            title={`Enter Broken Quantity after ${
                              orderedStages.find(
                                (stage) => stage.id === moveData.stageId_from
                              )?.title || "Stage"
                            }`}
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                          />
                        </div>
                      </div>

                      {/* Damage/Loss Section */}
                      <div className="d-flex flex-column flex-md-row align-items-md-center">
                        <div className="d-flex align-items-center mb-2 mb-md-0">
                          <p className="fw-semibold me-2 mb-0">DAMAGE/LOSS</p>
                          <div className={styles.border_dots}></div>
                        </div>
                        <div className="d-flex flex-column flex-md-row justify-content-md-center align-items-md-center gap-3">
                          <Form.Control
                            type="number"
                            value={quantity.damage}
                            onChange={(e) =>
                              setQuantity((prev) => ({
                                ...prev,
                                damage: parseFloat(e.target.value) || 0,
                              }))
                            }
                            readOnly
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                          />
                          <Form.Control
                            required
                            placeholder={`Enter Damage Quantity after ${
                              orderedStages.find(
                                (stage) => stage.id === moveData.stageId_from
                              )?.title || "Stage"
                            }`}
                            type="number"
                            title={`Enter Damage Quantity after ${
                              orderedStages.find(
                                (stage) => stage.id === moveData.stageId_from
                              )?.title || "Stage"
                            }`}
                            name="damageOrLoss"
                            value={moveData.damageOrLoss}
                            onChange={handleMoveFish}
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <Button
                        onClick={handleNext}
                        disabled={
                          loading ||
                          moveData.wholeFishQuantity === "" ||
                          moveData.brokenFishQuantity === "" ||
                          moveData.damageOrLoss === ""
                        }
                        className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                      >
                        {moveData.stageId_from &&
                        orderedStages.find((stage) => stage.id === moveData.stageId_from)
                          ?.title !== "Drying"
                          ? "Next"
                          : "Move To Showcase"}
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
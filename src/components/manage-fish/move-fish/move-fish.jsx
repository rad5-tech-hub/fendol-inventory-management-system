import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button} from 'react-bootstrap';
import styles from '../product-stages.module.scss'; 
import { toast, ToastContainer } from 'react-toastify';
import SideBar from '../../shared/sidebar/sidebar'; 
import Header from '../../shared/header/header'; 
import Api from '../../shared/api/apiLink';



export default function MoveFish() {
    const [stages, setStages] = useState([]);
    const [fishType, setFishType] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState('');
    const [moveFishData, setMoveFishData] = useState({
        stageId_from: '',
        stageId_to: '',
        batch_no: '',
        actual_quantity: null,
        remarks: '',
    });
    const [loader, setLoader] = useState(false);


    useEffect(() => {
        const fetchStages = async () => {
            try {
                const response = await Api.get('/fish-stages');
                if (Array.isArray(response.data.data)) {
                    const filteredProcessStages = response.data.data.filter(
                        (stage) => stage.title !== "Smoking" && stage.title !== "Drying"
                      );
                      setStages(filteredProcessStages); // Set the filtered stages

                } else {
                    throw new Error('Expected an array of stages');
                }
            } catch (err) {
                console.error(err.response?.data?.message || 'Failed to fetch data. Please try again.');
            }
        };
        fetchStages();
    }, []);

    const handleInputChangeMoveFish = (e) => {
        const { name, value } = e.target;
        if (name === 'stageId_from') {
            setMoveFishData({ ...moveFishData, stageId_from: value });
            getQuantity(value);  // Pass stageId_from to getQuantity
        } else if (name === 'stageId_to') {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const title = selectedOption.getAttribute('data-title');
            setSelectedTitle(title);
        }
        setMoveFishData({ 
            ...moveFishData, 
            [name]: name === 'actual_quantity' ? parseFloat(value) : value // Ensure actual_quantity is a number
        });
    };
    
    const getQuantity = async (stageId_from) => {
        setSelectedQuantity('loading...')
        if (stageId_from) {
            try {
                const response = await Api.get(`/active-batch?stageId=${stageId_from}`);
                setFishType(response.data.data); // Update with the fetched quantity
            } catch (error) {
                console.error('Failed to fetch quantity:', error);
                setSelectedQuantity('Error getting quantity or empty pond'); // Update with an error message
            }
        } else {
            console.error('Stage ID from is required.');
            setSelectedQuantity('Stage ID is required'); // Handle missing ID case
        }
    };
    
    

    
    // Get the names of the selected stages
    const selectedStageNames = stages
    .filter((stage) => moveFishData.stageId_from.includes(stage.id))
    .map((stage) => stage.title)
    .join(', ') || 'Select Stages'; // Default text if no stages are selected   
    console.log(moveFishData.stageId_from)

    const handleMoveFishes = async (e) => {
        e.preventDefault();

        // Display confirmation dialog
        const isConfirmed = window.confirm(
            `Are you sure you want to move ${moveFishData.actual_quantity} fish from ${selectedStageNames} to ${selectedTitle}?`
        );

        if (!isConfirmed) {
            return; // If the user cancels, stop the process
        }

        setLoader(true);
        const loadingToast = toast.loading("Moving fish...");

        try {
            const response = await Api.post('/move-fish', moveFishData);

            // Reset the form data
            setMoveFishData({
                stageId_from: '',
                stageId_to: '',
                batch_no: '',
                actual_quantity: '',
                remarks: ''
            });

            toast.update(loadingToast, {
                render: "Fish moved successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error moving fish. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        } finally {
            setLoader(false);
        }
    };

    return (
            <section className={`d-none d-lg-block ${styles.body}`}>
                <div className="sticky-top">
                    <Header />
                </div>
                <div className="d-flex gap-2">
                    <div className={`${styles.sidebar}`}>
                        <SideBar className={styles.sidebarItem} />
                    </div>
                    <section className={`${styles.content}`}>
                        <main className={styles.create_form}>
                            <ToastContainer/>
                            <Form onSubmit={handleMoveFishes}>
                                <h4 className="my-5">Move Fish</h4>                                                   
                                <Row xxl={2} xl={2} lg={2}>
                                    <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Pond From</Form.Label>
                                        <Form.Select
                                        name="stageId_from"
                                        value={moveFishData.stageId_from}
                                        onChange={handleInputChangeMoveFish}
                                        required
                                         className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        >
                                        <option value="" disabled>Choose Pond</option>
                                        {stages && stages.length > 0 ? (
                                            stages.map((stage, index) => (
                                                <option value={stage.id} key={index} data-title={stage.title}>                                                                                
                                                    {stage.title}
                                                    {/* {moveFishData.stageId_from === stage.id ? `-(${selectedQuantity || '0'})` : ''} */}
                                                </option>                                                
                                            ))
                                        ) : (
                                            <option>No stages available</option>
                                        )}
                                        </Form.Select>
                                    </Col>
                                    <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Fish Batch</Form.Label>
                                        <Form.Select
                                            name="batch_no"
                                            value={moveFishData.batch_no}
                                            onChange={handleInputChangeMoveFish}
                                            required
                                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        >
                                            <option value="" disabled>Choose Fish Batch</option>
                                            {!fishType ? (
                                                <option>Please wait...</option>
                                            ) : fishType.length < 1 ? (
                                                <option>No Active Batch</option>
                                            ) : (
                                                fishType.map((stage, index) => (
                                                    <option value={stage.batch_no} key={index}>{stage.batch_no} {moveFishData.stageId_from === stage.stageId ? `-(${stage.quantity || '0'})` : ''}</option>
                                                ))
                                            )}
                                        </Form.Select>
                                    </Col>
                                    <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Pond To</Form.Label>
                                        <Form.Select
                                            name="stageId_to"
                                            value={moveFishData.stageId_to}
                                            onChange={handleInputChangeMoveFish}
                                            required
                                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        >
                                            <option value="" disabled>Choose Pond</option>
                                            {!stages ? (
                                                <option>Please wait...</option>
                                            ) : stages.length < 1 ? (
                                                <option>No data available</option>
                                            ) : (
                                                stages.map((stage, index) => (
                                                    <option value={stage.id} key={index} data-title={stage.title} >{stage.title}</option>
                                                ))
                                            )}
                                        </Form.Select>
                                    </Col>                                 
                                    <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Quantity</Form.Label>
                                        <Form.Control
                                            placeholder="Enter quantity"
                                            type="number"
                                            name="actual_quantity"
                                            value={moveFishData.actual_quantity}
                                            min='1'
                                            required
                                            onChange={handleInputChangeMoveFish}
                                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        />
                                    </Col>
                                    <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Remark</Form.Label>
                                        <Form.Control
                                            placeholder="Enter remark"
                                            as="textarea"
                                            name="remarks"                                        
                                            value={moveFishData.remarks}
                                            onChange={handleInputChangeMoveFish}
                                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        />
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end my-4">
                                    <Button className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} disabled={loader} type="submit">
                                        {loader ? 'Moving' : "Move"}
                                    </Button>
                                </div>
                            </Form>                    
                        </main>
                    </section>
                </div>
            </section>
        );
    }

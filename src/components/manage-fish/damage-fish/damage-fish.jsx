import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../product-stages.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink'
import { useNavigate } from 'react-router-dom';

const DamageFish = () => {
  const [stages, setStages] = useState([]);
  const [fishType, setfishType] = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState('');

  useEffect(() => {
    const fetchStages = async () => {
        try {
            const response = await Api.get('/fish-stages'); // Replace with your API URL
            // console.log(response.data);
            
            if (Array.isArray(response.data.data)) {
                // Filter out "washing", "smoking", and "drying"
                const filteredStages = response.data.data
                setStages(filteredStages); // Set the filtered stages to state
            } else {
                throw new Error('Expected an array of stages');
            }
        } catch (err) {
            // console.log(err.response?.data?.message || 'Failed to fetch data. Please try again.');
        } finally {
            // console.log('Fetch stages success');
        }
    };

    fetchStages();
  }, []);


    const [formData, setFormData] = useState({
        stageId_from: '',
        actual_quantity: null,
        batch_no: '' ,
        remarks : ''     
    });
    const [loader, setLoader] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Check if the input is for actual_quantity and convert the value to a number
        setFormData({
            ...formData,
            [name]: value, // or use parseFloat if you need decimal values
        });
    };

    // collecting the id of selected  pond to get the actual_quantity
    const handleInputChangepond = (e) => {
        const { name, value } = e.target;
        if (name === 'stageId_from') {
            setFormData({ ...formData, stageId_from: value });
            getQuantity(value);  // Pass stageId_from to getQuantity
        }
        setFormData({ 
            ...formData, 
            [name]: value
        });
    };

    // get the actual_quantity of the pond 
    const getQuantity = async (stageId_from) => {
        setSelectedQuantity('loading...')
        if (stageId_from) {
            try {
                const response = await Api.get(`/active-batch?stageId=${stageId_from}`);
                setfishType(response.data.data ); // Update with the fetched actual_quantity
            } catch (error) {
                console.error('Failed to fetch actual_quantity:', error);
                setSelectedQuantity('Error getting actual_quantity or empty pond'); // Update with an error message
            }
        } else {
            console.error('Stage ID from is required.');
            setSelectedQuantity('Stage ID is required'); // Handle missing ID case
        }
    };

    const handleAddFish = async (e) => {
        e.preventDefault();
        // Show confirmation prompt
        const userConfirmed = window.confirm("Are you sure you want to Remove Damage fish?");
        if (!userConfirmed) {
            return; // Exit if the user cancels
        }
    
        setLoader(true);
        const loadingToast = toast.loading("Removing Damaged fish...", {
            className: 'dark-toast'
        });
    
        try {
            const response = await Api.post('/log-damage', formData);
    
            // Reset form or handle success as needed
            setFormData({
                stageId_from: '',
                actual_quantity: '',
                batch_no: '',
                remarks:''
            });
    
            // After a successful API call
            toast.update(loadingToast, {
                render: "Removed Damage fish successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast'
            });
        
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
                    <main>
                        <ToastContainer />
                        <Form className={styles.create_form} onSubmit={handleAddFish}>
                            <h4 className="mt-5 mb-5">Damaged Fish From Pond</h4>
                            <Row xxl={2} xl={2} lg={2}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Pond From</Form.Label>
                                    <Form.Select
                                    name="stageId_from"
                                    value={formData.stageId_from}
                                    onChange={handleInputChangepond}
                                    required
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    >
                                    <option value="" disabled>Choose Pond</option>
                                    {stages && stages.length > 0 ? (
                                        stages.map((stage, index) => (
                                            <option value={stage.id} key={index} data-title={stage.title}>                                                                                
                                                {stage.title} 
                                            </option>
                                            
                                        ))
                                    ) : (
                                        <option>No stages available</option>
                                    )}
                                    </Form.Select>
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Fish Batch </Form.Label>
                                    <Form.Select
                                        name="batch_no"
                                        value={formData.batch_no}
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Choose Fish Batch </option>
                                        {!fishType ? (
                                            <option>Please wait...</option>
                                        ) : fishType.length < 1 ? (
                                            <option>No Active Batch available</option>
                                        ) : (
                                            fishType.map((stage, index) => (
                                                <option value={stage.batch_no} key={index}>{stage.batch_no} {formData.stageId_from === stage.stageId ? `-(${stage.quantity || '0'})` : ''}</option>
                                            ))
                                        )}
                                    </Form.Select>                                   
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Quantity</Form.Label>
                                    <Form.Control
                                        placeholder="Enter Quantity"
                                        type="number"
                                        name="actual_quantity"
                                        value={formData.actual_quantity}
                                        min="1"
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Remark</Form.Label>
                                        <Form.Control
                                            placeholder="Enter remarks"
                                            as="textarea"
                                            name="remarks"                                        
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        />
                                    </Col>        
                            </Row>
                            <div className="d-flex justify-content-end py-5">
                                <Button className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}  disabled={loader} type="submit">
                                    {loader ? (
                                      'Removing Damage...'
                                        
                                    ) : (
                                        "Remove Damage Fish"
                                    )}
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

import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../product-stages.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';

const HarvestFish = () => {
    const navigate = useNavigate();
    // States for storing data
    const [stages, setStages] = useState([]);
    const [fishType, setFishType] = useState([]);
    const [formData, setFormData] = useState({
        stageId_from: '',
        actual_quantity: null,
        batch_no: '',
        remarks: '',
    });
    const [selectedQuantity, setSelectedQuantity] = useState('');
    const [loader, setLoader] = useState(false);


    // Fetch fish stages
    useEffect(() => {
        const fetchStages = async () => {
            try {
                const response = await Api.get('/fish-stages');
                // console.log(response.data);

                if (Array.isArray(response.data.data)) {
                    setStages(response.data.data); // Update stages state
                } else {
                    throw new Error('Expected an array of stages');
                }
            } catch (err) {
                // console.log(err.response?.data?.message || 'Failed to fetch data. Please try again.');
            }
        };

        fetchStages();
    }, []);


    // Handle input changes for form fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'actual_quantity' ? parseFloat(value) : value,
        });
    };

    // Handle Pond selection to fetch quantity
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
                setFishType(response.data.data ); // Update with the fetched actual_quantity
            } catch (error) {
                console.error('Failed to fetch actual_quantity:', error);
                setSelectedQuantity('Error getting actual_quantity or empty pond'); // Update with an error message
            }
        } else {
            console.error('Stage ID from is required.');
            setSelectedQuantity('Stage ID is required'); // Handle missing ID case
        }
    };

    // Submit form data to harvest fish
    const handleAddFish = async (e) => {
        e.preventDefault();

        const userConfirmed = window.confirm('Are you sure you want to harvest this fish?');
        if (!userConfirmed) return;

        setLoader(true);
        const loadingToast = toast.loading('Harvesting fish...', { className: 'dark-toast' });

        try {
            const response = await Api.post('/move-from-pond-to-harvest', formData);

            // Reset form
            setFormData({
                stageId_from: '',
                actual_quantity: '',
                batch_no: '',
                remarks: '',
            });

            toast.update(loadingToast, {
                render: 'Fish harvested successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast',
            });
            setTimeout(()=>{
                navigate('/fish-processes/process-fish');
            }, 3000)
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

    return (
        <section className={`d-none d-lg-block ${styles.body}`}>
            <div className="sticky-top">
                <Header />
            </div>
            <div className="d-flex gap-2">
                {/* Sidebar Section */}
                <div className={styles.sidebar}>
                    <SideBar className={styles.sidebarItem} />
                </div>

                {/* Content Section */}
                <section className={styles.content}>
                    <main>
                        <ToastContainer />
                        <Form className={styles.create_form} onSubmit={handleAddFish}>
                            <h4 className="mt-5 mb-5">Harvest Fish</h4>

                            {/* Form Fields */}
                            <Row xxl={2} xl={2} lg={2}>
                                {/* Pond From */}
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Pond From</Form.Label>
                                    <Form.Select
                                        name="stageId_from"
                                        value={formData.stageId_from}
                                        onChange={handleInputChangepond}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Choose Pond</option>
                                        {stages.length > 0 ? (
                                            stages.map((stage, index) => (
                                                <option value={stage.id} key={index}>
                                                    {stage.title}
                                                </option>
                                            ))
                                        ) : (
                                            <option>No stages available</option>
                                        )}
                                    </Form.Select>
                                </Col>

                                {/* Fish Batch */}
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Fish Batch</Form.Label>
                                    <Form.Select
                                        name="batch_no"
                                        value={formData.batch_no}
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Choose Fish Batch</option>
                                        {fishType.length > 0 ? (
                                            fishType.map((batch, index) => (
                                                <option
                                                    value={batch.batch_no}
                                                    key={index}
                                                >
                                                    {batch.batch_no} {formData.stageId_from === batch.stageId ? `- (${batch.quantity || '0'})` : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <option>No Active Batch available</option>
                                        )}
                                    </Form.Select>
                                </Col>

                                {/* Quantity */}
                                <Col className="mb-4">
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

                                {/* Remarks */}
                                <Col className="mb-4">
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

                            {/* Submit Button */}
                            <div className="d-flex justify-content-end py-5">
                                <Button
                                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
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

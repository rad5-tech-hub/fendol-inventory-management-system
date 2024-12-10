import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../feed.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';
const AddFeed = () => {
    const [formData, setFormData] = useState({
        feedName: '',
        feedType: '',
        unit:'',
        threshold: Number,
        weightPerBag: null
    });
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
                // Handle price input separately to format it with commas
            if (name === 'weightPerBag') {
                // Remove commas to get the pure number
                const numberValue = value.replace(/[^0-9]/g, '');
                setFormData({
                    ...formData,
                    weightPerBag: numberValue, // Format the price with commas for display
                });            
            } else {
                setFormData({ ...formData, [name]: value });
            }
    };

    const handleAddFeed = async (e) => {
        e.preventDefault();
        setLoader(true);
        const loadingToast = toast.loading("Adding feed...", {
            className: 'dark-toast'
        });

        try {
            // Make the actual API call
            const response = await Api.post('/create-feed', formData);

             // Reset form or handle success as needed
            setFormData({
                feedName: '',
                unit: '',
                feedType: '',
                threshold: Number,
                weightPerBag: null
            });
            // After a successful API call
            toast.update(loadingToast, {
                render: "Feed added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast'
            });
           
            navigate('/feed/view-all');
        } catch (error) {
            toast.update(loadingToast, {
                render:error.response?.data?.message || "Error adding feed. Please try again.",
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
                        <Form className={styles.create_form} onSubmit={handleAddFeed}>
                            <h4 className="mt-4 mb-5">Add New Feed</h4>
                            <Row xxl={2} xl={2} lg={2}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Feed Name</Form.Label>
                                    <Form.Control
                                        placeholder="Enter feed name"
                                        type="text"
                                        name="feedName"
                                        value={formData.feedName}
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Unit</Form.Label>
                                    <Form.Select
                                        name="unit"
                                        required
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Select Unit</option>
                                        <option value="kg">Kg</option>
                                    </Form.Select>
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Feed Type</Form.Label>
                                    <Form.Control
                                        placeholder="Enter feed type"
                                        type="text"
                                        name="feedType"
                                        required
                                        value={formData.feedType}
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    />
                                </Col>                         
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Threshold Value</Form.Label>
                                    <Form.Control
                                        placeholder="Enter threshold value"
                                        type="number"
                                        name="threshold"
                                        value={formData.threshold}
                                        required
                                        min="1"
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Weight Per Bag</Form.Label>
                                    <div className={`${styles.inputContainer} position-relative`}>
                                        <Form.Control
                                            placeholder="Enter weight Per Bag"
                                            type="text" // Change input type to text to handle commas
                                            name="weightPerBag"
                                            value={formData.weightPerBag} // Display the formatted price
                                            required
                                            onChange={handleInputChange}
                                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        />
                                        <span className={`${styles.nairaSign} position-absolute end-0 top-50 translate-middle-y pe-2`}>KG</span>
                                    </div>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end my-4">
                                <Button className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} disabled={loader} type="submit">
                                    {loader ? ' Adding...' : 'Add'}
                                </Button>
                            </div>
                        </Form>
                    </main>
                </section>
            </div>
        </section>
    );
};

export default AddFeed;

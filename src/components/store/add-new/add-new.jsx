import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../store.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';

const AddStock = () => {
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        threshold: Number,
    });
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        setLoader(true);
        const loadingToast = toast.loading("Adding stock...", {
            className: 'dark-toast'
        });

        try {
            // Replace 'YOUR_API_ENDPOINT' with your actual endpoint URL
            const response = await Api.post('/create-store', formData);

            setFormData({
                name: '',
                unit: '',
                threshold: Number,
            });

            toast.update(loadingToast, {
                render: "Stock added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            navigate('/store/view-all');
          
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message ||  "Error adding stock. Please try again.",
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
                        <Form className={styles.create_form} onSubmit={handleAddStock}>
                            <h4 className="mt-4 mb-5">Add New </h4>
                            <Row xxl={2} xl={2} lg={2}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Name</Form.Label>
                                    <Form.Control
                                        placeholder="Enter stock name"
                                        type="text"
                                        name="name"                                        
                                        value={formData.name}
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
                                        <option value="liters">Liters</option>
                                        <option value="pieces">Pieces</option>
                                    </Form.Select>
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Threshold Value</Form.Label>
                                    <Form.Control
                                        placeholder="Enter threshold value"
                                        type="number"
                                        name="threshold"
                                        value={formData.threshold}
                                        required
                                        min="0"
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    />
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

export default AddStock;

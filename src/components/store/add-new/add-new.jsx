import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../store.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import { useNavigate } from 'react-router-dom';

const AddStock = () => {
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        threshold: '', // Changed to empty string for controlled input
    });
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); // Added for sidebar toggle

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'threshold' ? (value === '' ? '' : Number(value)) : value });
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        setLoader(true);
        const loadingToast = toast.loading("Adding stock...", {
            className: 'dark-toast'
        });

        try {
            const response = await Api.post('/create-store', formData);

            setFormData({
                name: '',
                unit: '',
                threshold: '',
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
                render: error.response?.data?.message || "Error adding stock. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
        } finally {
            setLoader(false);
        }
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
                    <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
                </div>
                <section className={`${styles.content} flex-grow-1`}>
                    <main>
                        <ToastContainer />
                        <Form className={styles.create_form} onSubmit={handleAddStock}>
                            <h4 className="mt-4 mb-5">Add New</h4>
                            <Row xxl={2} xl={2} lg={2} md={1} sm={1}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Name</Form.Label>
                                    <Form.Control
                                        placeholder="Enter stock name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Unit</Form.Label>
                                    <CustomDropdown
                                        name="unit"
                                        required
                                        value={formData.unit}
                                        onChange={(value) => setFormData({ ...formData, unit: value })}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        placeholder="Select Unit"
                                        options={[
                                            { value: 'kg', label: 'Kg (Kilogram)' },
                                            { value: 'g', label: 'G (Grams)' },
                                        ]}
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
                                        min="0"
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end my-4">
                                <Button
                                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                                    disabled={loader}
                                    type="submit"
                                >
                                    {loader ? 'Adding...' : 'Add'}
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
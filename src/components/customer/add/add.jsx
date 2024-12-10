import React, { useState } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import styles from '../customer.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import {useNavigate} from 'react-router-dom';

const AddCustomer = () => {
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        category: "",
        address: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoader(true);
        
        const loadingToast = toast.loading("Adding New Customer...", {
            className: 'dark-toast'
        });
    
        try {
            const response = await Api.post('/customers', formData);
            const { message } = response.data;

            setFormData({
                fullName: "",
                phone: "",
                category: "",
                address: ""
            });

            toast.update(loadingToast, {
                render: message || "Customer added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            navigate('/customer/view-all');
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error adding customer. Please try again.";
            toast.update(loadingToast, {
                render: errorMessage,
                type: "error",
                isLoading: false,
                autoClose: 6000,
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
                        <Form className={styles.create_form} onSubmit={handleSubmit}>
                            <h4 className="mt-5 mb-5">Add Customer</h4>
                            <Row xxl={2} xl={2} lg={2} md={1} sm={1} xs={1}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Full Name</Form.Label>
                                    <Form.Control
                                        placeholder="Enter Full Name"
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Phone</Form.Label>
                                    <Form.Control
                                        placeholder="Enter Phone Number"
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Category</Form.Label>
                                    <Form.Select
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="Marketer">Marketer</option>
                                        <option value="Customer">Customer</option>
                                    </Form.Select>
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Address</Form.Label>
                                    <Form.Control
                                        placeholder="Enter Address"
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end my-5">
                                <Button  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} disabled={loader} type="submit">
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

export default AddCustomer;

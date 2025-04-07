import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../finance.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';

// Utility function to format numbers with commas
const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const AddExpense = () => {
    const [formData, setFormData] = useState({
        price: '',
        description: '',
        paymentType: ''
    });
    const [unformattedPrice, setUnformattedPrice] = useState(0);
    const [loader, setLoader] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'price') {
            const numberValue = value.replace(/,/g, '');
            setFormData({
                ...formData,
                price: formatNumberWithCommas(numberValue),
            });
            setUnformattedPrice(parseFloat(numberValue) || 0);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle form submission
    const handleAddExpense = async (e) => {
        e.preventDefault();

        const isConfirmed = window.confirm("Are you sure you want to add this expense?");
        if (!isConfirmed) return;

        setLoader(true);
        const loadingToast = toast.loading("Adding expense...", { className: 'dark-toast' });

        try {
            const response = await Api.post('/expense', {
                ...formData,
                price: unformattedPrice
            });

            toast.update(loadingToast, {
                render: "Expense added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            setFormData({
                price: '',
                description: '',
                paymentType: ''
            });
            setUnformattedPrice(0);
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error adding expense. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
        } finally {
            setLoader(false);
        }
    };

    // Sidebar toggle handlers
    const toggleSidebar = () => setShowSidebar(!showSidebar);
    const handleCloseSidebar = () => setShowSidebar(false);

    return (
        <section className={`${styles.body}`}>
            <div className="sticky-top">
                <Header toggleSidebar={toggleSidebar} />
            </div>
            <div className="d-flex gap-2">
                <div className={`${styles.sidebar}`}>
                    <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
                </div>
                <section className={`${styles.content} flex-grow-1`}>
                    <main>
                        <ToastContainer />
                        <Form className={styles.create_form} onSubmit={handleAddExpense}>
                            <h4 className="mt-4 mb-5">Add New Expense</h4>
                            <Row lg={1} md={1} className="g-4">
                                <Col>
                                    <Form.Label className="fw-semibold">Amount/Total Price</Form.Label>
                                    <Form.Control
                                        placeholder="Enter total price"
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        required
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col>
                                    <Form.Label className="fw-semibold">Payment Type</Form.Label>
                                    <Form.Select
                                        name="paymentType"
                                        value={formData.paymentType || ''}
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Select Payment Type</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </Form.Select>
                                </Col>
                                <Col>
                                    <Form.Label className="fw-semibold">Description</Form.Label>
                                    <Form.Control
                                        placeholder="Enter description"
                                        as="textarea"
                                        name="description"
                                        required
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end my-4">
                                <Button
                                    className={`btn shadow btn-dark py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                                    disabled={loader}
                                    type="submit"
                                >
                                    {loader ? 'Adding...' : 'Add Expense'}
                                </Button>
                            </div>
                        </Form>
                    </main>
                </section>
            </div>
        </section>
    );
};

export default AddExpense;
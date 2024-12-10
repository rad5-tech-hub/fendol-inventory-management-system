import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../finance.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';

// Utility function to format numbers with commas
const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const AddSalary = () => {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
    });
    
    const [unformattedPrice, setUnformattedPrice] = useState(0);
    const [loader, setLoader] = useState(false);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle price input separately to format it with commas
        if (name === 'amount') {
            // Remove commas to get the pure number
            const numberValue = value.replace(/[^0-9]/g, '');
            setFormData({
                ...formData,
                amount: formatNumberWithCommas(numberValue), // Format the price with commas for display
            });
            setUnformattedPrice(parseFloat(numberValue) || 0); // Store the unformatted number
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle form submission
    const handleAddExpense = async (e) => {
        e.preventDefault();

        // Show confirmation dialog
        const isConfirmed = window.confirm("Are you sure you want to pay this salary?");
        
        if (!isConfirmed) {
            return; // If the user cancels, exit the function
        }

        setLoader(true);
        const loadingToast = toast.loading("Paying Salary...", {
            className: 'dark-toast'
        });

        try {
            // Post the unformatted number to the API (not the formatted one)
            const response = await Api.post('/expense', { 
                ...formData, 
                amount: unformattedPrice // Send unformatted price
            });

            // After a successful API call
            toast.update(loadingToast, {
                render: "Expense added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            // Reset form after successful submission
            setFormData({
                amount: '',
                description: '',
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
                        <Form className={styles.create_form} onSubmit={handleAddExpense}>
                            <h4 className="mt-4 mb-5">Staff Salary</h4>
                            <Row xxl={2} xl={2} lg={2}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Description</Form.Label>
                                    <Form.Control
                                        placeholder="Enter description"
                                        as="textarea"
                                        name="description"
                                        required
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Amount</Form.Label>
                                    <div className={`${styles.inputContainer} position-relative`}>
                                        <Form.Control
                                            placeholder="Enter total price"
                                            type="text" // Change input type to text to handle commas
                                            name="amount"
                                            value={formData.amount} // Display the formatted price
                                            required
                                            onChange={handleInputChange}
                                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        />
                                        <span className={`${styles.nairaSign} position-absolute end-0 top-50 translate-middle-y pe-2`}>₦</span>
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

export default AddSalary;

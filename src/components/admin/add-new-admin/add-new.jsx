import React, { useState } from 'react';
import { Form, Row, Col, Button, InputGroup  } from 'react-bootstrap';
import styles from '../admin-styles.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';


const AddNew = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: ""
    });

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoader(true);
        
        const loadingToast = toast.loading("Creating New Admin..", {
            className: 'dark-toast'
        });
    
        try {
            const response = await Api.post('/admin', formData);
    
            // Extract the response data
            const { message, admin } = response.data; // Adjust based on your API response

            // Reset form or handle success as needed
            setFormData({
                fullName: "",
                email: "",
                password: "",
                role: ""
            });
    
            // After a successful API call
            toast.update(loadingToast, {
                render: message || "Created Admin successfully!", // Use the message from response if available
                type: "success", // Use string for type
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast'
            });

            setTimeout(()=>{
                navigate('/admin/view-all');
            }, 4500)
                
        } catch (error) {
            // Log the error response for debugging
            console.error("Error creating admin:", error);
    
            // Extract the error message if it exists
            const errorMessage = error.response?.data?.message || "Error creating admin. Please try again."; // Fallback message
    
            toast.update(loadingToast, {
                render: errorMessage, // Use the error message from the response
                type: "error", // Use string for type
                isLoading: false,
                autoClose: 6000,
                className: 'dark-toast'
            });
        } finally {
            setLoader(false);
        }
    }; 
    

    return (
        <section className={`d-none d-lg-block ${styles.body}`} >
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
                            <h4 className="mt-5 mb-5">Create Admin</h4>
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
                                    <Form.Label className="fw-semibold">E-Mail</Form.Label>
                                    <Form.Control
                                        placeholder="Enter E-Mail"
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} ${styles.fadedPlaceholder}`}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Password</Form.Label>
                                    <InputGroup className="mb-4">
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            className={`py-2 bg-light-subtle shadow-none  border-1 border-end-0 ${styles.inputs} ${styles.fadedPlaceholder}`}
                                            placeholder="Enter Password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            minLength={7}
                                            maxLength={10}
                                            required
                                        />
                                        <InputGroup.Text
                                            onClick={togglePasswordVisibility}
                                            className={`py-2 bg-light-subtle shadow-none  border-1 border-start-0 ${styles.inputs}`}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </InputGroup.Text>
                                    </InputGroup>
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold fs-6">Role</Form.Label>
                                    <Form.Select
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="" disabled>Select Role</option>                                
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end my-5">
                                <Button  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} disabled={loader} type="submit">
                                    {loader ? (
                                      ' Creating...'
                                        
                                    ) : (
                                        "Create"
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

export default AddNew;

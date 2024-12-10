import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, InputGroup, Button } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from './login.module.scss';
import top from '../../../assests/top.png';
import bottom from '../../../assests/bottom.png';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Logo from '../../../assests/logo.png';
import { LOGIN_USER } from "../reduxForProtectingRoute/actions/types";
import 'react-toastify/dist/ReactToastify.css';

export default function LogIn() {
    const [showPassword, setShowPassword] = useState(false);
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const dispatch = useDispatch();

    // Toggle password visibility
    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData({ ...loginData, [name]: value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoader(true);
    
        // Show loading toast
        const loadingToast = toast.loading("Logging in...", { className: 'dark-toast' });
    
        try {
            const response = await axios.post('https://dev-api.fendolgroup.com/api/v1/login', loginData);
            const { token, role, success } = response.data; // Destructure response data
    
            if (success) {               
                // Store token and role in sessionStorage
                sessionStorage.setItem('authToken', token);
                sessionStorage.setItem('role', role);
    
                // Clear form data
                setLoginData({ email: '', password: '' });
    
                // Dispatch token to Redux (important for state updates)
                dispatch({ type: LOGIN_USER, payload: token });
    
                // Update success toast
                toast.update(loadingToast, {
                    render: "Logged in successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                    className: 'dark-toast',
                });
    
                if (role === 'super_admin') {
                    navigate("/dashboard");
                } else {
                    navigate('/customer/view-all');
                }
    
            } else {
                // Handle failed login
                throw new Error("Login failed");
            }
        } catch (error) {
            // Show error toast
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error while logging in. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 7000,
                className: 'dark-toast',
            });
        } finally {
            setLoader(false); // Reset loader state
        }
    };
    
    
    return (
        <section className={styles.login_section}>
            <div className={`${styles.imageCont} text-end`}>
                <img src={top} alt="Top Vector" className={styles.top_img} />
            </div>
            <Container>
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className={`${styles.form_box} rounded-5`}>
                        <Form className={styles.form} onSubmit={handleSubmit}>
                            <div className="text-center mb-4">
                                <img src={Logo} alt="logo" />
                            </div>                          

                            <Form.Label className="fw-semibold">Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                className={`shadow-none ${styles.inputs}`}
                                placeholder="name@example.com"
                                value={loginData.email}
                                onChange={handleInputChange}
                                required
                            />

                            <Form.Label className="mt-4 fw-semibold">Password</Form.Label>
                            <InputGroup className="mb-4">
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className={`shadow-none ${styles.inputs} border-end-0`}
                                    placeholder="Password"
                                    value={loginData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                                <InputGroup.Text
                                    onClick={togglePasswordVisibility}
                                    className={`shadow-none ${styles.inputs} text-white border-start-0`}
                                    style={{ cursor: "pointer" }}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </InputGroup.Text>
                            </InputGroup>

                            <a href="#pasword" className="text-white border-0 fw-semibold">Forgot Password?</a>
                            <Button type="submit" className={`w-100 ${styles.btn} shadow-sm btn-dark py-2 fs-5 mt-5 fw-semibold`} disabled={loader}>
                                {loader ? 'Logging In' : "Log in"}
                            </Button>
                        </Form>
                    </div>
                </div>
            </Container>
            <div className={`${styles.imageCont} text-start`}>
                <img src={bottom} alt="Bottom Vector" className={styles.bottom_img} />
            </div>
            <ToastContainer />
        </section>
    );
}

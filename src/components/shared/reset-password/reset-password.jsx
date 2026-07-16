import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, InputGroup, Button } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from './reset-password.module.scss';
import top from '../../../assests/top.png';
import bottom from '../../../assests/bottom.png';
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Logo from '../../../assests/logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", { className: 'dark-toast' });
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.", { className: 'dark-toast' });
      return;
    }

    setLoader(true);
    const loadingToast = toast.loading("Resetting password...", { className: 'dark-toast' });

    try {
      const response = await Api.post('/admin/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });

      toast.update(loadingToast, {
        render: response.data?.response_message || "Password reset successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });

      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.response_message || "Error resetting password. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast'
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <section className={styles.resetSection}>
      <div className={`${styles.imageCont} text-end`}>
        <img src={top} alt="Top Vector" className={styles.top_img} />
      </div>
      <Container>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className={`${styles.formBox} rounded-5`}>
            <Form className={styles.form} onSubmit={handleSubmit}>
              <div className="text-center mb-4">
                <img src={Logo} alt="logo" className={styles.logo} />
              </div>
              <h5 className="text-center fw-bold mb-1">Reset Password</h5>
              <p className="text-center mb-4" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                Enter your new password.
              </p>

              <Form.Label className="fw-semibold">Token</Form.Label>
              <Form.Control
                type="text"
                className={`shadow-none ${styles.inputs}`}
                placeholder="Reset token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />

              <Form.Label className="mt-3 fw-semibold">New Password</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  className={`shadow-none ${styles.inputs} border-end-0`}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <InputGroup.Text
                  onClick={() => setShowPassword(!showPassword)}
                  className={`shadow-none ${styles.inputs} text-white border-start-0`}
                  style={{ cursor: "pointer" }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </InputGroup.Text>
              </InputGroup>

              <Form.Label className="fw-semibold">Confirm Password</Form.Label>
              <InputGroup className="mb-4">
                <Form.Control
                  type={showConfirm ? "text" : "password"}
                  className={`shadow-none ${styles.inputs} border-end-0`}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <InputGroup.Text
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`shadow-none ${styles.inputs} text-white border-start-0`}
                  style={{ cursor: "pointer" }}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </InputGroup.Text>
              </InputGroup>

              <Button type="submit" className={`w-100 ${styles.btn} shadow-sm btn-dark py-2 fs-5 mt-4 fw-semibold`} disabled={loader}>
                {loader ? 'Resetting...' : 'Reset Password'}
              </Button>

              <div className="text-center mt-4">
                <Link to="/" className="text-white" style={{ textDecoration: 'underline', opacity: 0.8 }}>
                  Back to Login
                </Link>
              </div>
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

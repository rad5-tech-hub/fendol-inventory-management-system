import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, Button } from "react-bootstrap";
import styles from './forgot-password.module.scss';
import top from '../../../assests/top.png';
import bottom from '../../../assests/bottom.png';
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, Link } from "react-router-dom";
import Logo from '../../../assests/logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loader, setLoader] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const loadingToast = toast.loading("Sending reset link...", { className: 'dark-toast' });

    try {
      const response = await Api.get('/admin/forgot-password', { params: { email } });

      toast.update(loadingToast, {
        render: response.data?.response_message || "If this email exists, a password reset email has been sent.",
        type: "success",
        isLoading: false,
        autoClose: 5000,
        className: 'dark-toast'
      });
      setSent(true);
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.response_message || "Something went wrong. Please try again.",
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
    <section className={styles.forgotSection}>
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
              <h5 className="text-center fw-bold mb-1">Forgot Password</h5>
              <p className="text-center mb-4" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                Enter your email and we'll send you a reset link.
              </p>

              {!sent ? (
                <>
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control
                    type="email"
                    className={`shadow-none ${styles.inputs}`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className={`w-100 ${styles.btn} shadow-sm btn-dark py-2 fs-5 mt-4 fw-semibold`} disabled={loader}>
                    {loader ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <p>If this email exists, a password reset email has been sent.</p>
                  <Button
                    className={`${styles.btn} shadow-sm btn-dark py-2 px-4 fs-6 mt-3 fw-semibold`}
                    onClick={() => navigate('/')}
                  >
                    Back to Login
                  </Button>
                </div>
              )}

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

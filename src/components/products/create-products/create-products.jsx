import React, { useState, useEffect, useRef } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Form, Row, Button } from 'react-bootstrap';
import styles from '../product.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import Api, { ApiV2 } from "../../shared/api/apiLink";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { hasPermission } from "../../shared/permissions/permissions";

export default function CreateProducts() {
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();
    const [showSidebar, setShowSidebar] = useState(false);

    // Form fields state
    const [formData, setFormData] = useState({
        productName: "",
        productWeight: "",
        unit: "",
        basePrice: "",
        siteId: "",
        showOnwebsite: false
    });

    const userTypes = useSelector((state) => state.user?.userTypes || []);
    const [sites, setSites] = useState([]);
    const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
    const siteSelectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (siteSelectRef.current && !siteSelectRef.current.contains(e.target)) {
                setSiteDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const canAssignSite = hasPermission(userTypes, 'products', 'assign-site');

    useEffect(() => {
        if (!canAssignSite) return;
        const fetchSites = async () => {
            try {
                const res = await ApiV2.get('/v2/all-site');
                setSites(Array.isArray(res.data?.data) ? res.data.data : res.data || []);
            } catch {
                // Silent fail — form still works; super admin sees empty site dropdown
            }
        };
        fetchSites();
    }, [canAssignSite]);

    // Function to format numbers with commas
    const formatNumberWithCommas = (value) => {
        if (!value) return "";
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Function to remove commas from formatted numbers
    const removeCommas = (value) => {
        return value ? value.toString().replace(/,/g, "") : "";
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "basePrice") {
            // Ensure only numeric input for basePrice
            const numericValue = value.replace(/[^\d]/g, "");
            setFormData({
                ...formData,
                basePrice: formatNumberWithCommas(numericValue)
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoader(true);

        if (canAssignSite && !formData.siteId) {
            toast.error("Please select a site.", { className: 'dark-toast' });
            setLoader(false);
            return;
        }

        const loadingToast = toast.loading("Creating Product...", {
            className: 'dark-toast'
        });

        try {
            const formDataToSubmit = {
                productName: formData.productName,
                productWeight: parseFloat(formData.productWeight) || 0,
                unit: formData.unit,
                basePrice: parseFloat(removeCommas(formData.basePrice)) || 0,
                showOnwebsite: formData.showOnwebsite,
            };
            if (formData.siteId) formDataToSubmit.siteId = formData.siteId;

            const response = await ApiV2.post('/api/v1/product', formDataToSubmit);

            // Reset form or handle success as needed
            setFormData({
                productName: "",
                productWeight: "",
                unit: "",
                basePrice: "",
                siteId: "",
                showOnwebsite: false
            });

            // After a successful API call
            toast.update(loadingToast, {
                render: "Created Product successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            setTimeout(() => {
                navigate('/products/view-all');
            }, 2500)
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error creating product. Please try again.",
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
                <div className={styles.sidebar}>
                    <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
                </div>
                <section className={`${styles.content} flex-grow-1`}>
                    <main>
                        <ToastContainer />
                        <Form className={styles.create_form} onSubmit={handleSubmit}>
                            <h4 className="mt-3 mb-5">{canAssignSite ? 'Create & Assign Product' : 'Create Product'}</h4>
                            <Row xxl={2} xl={2} lg={2} md={1}>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Product Name</Form.Label>
                                    <Form.Control
                                        placeholder="Enter product name"
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        type="text"
                                        name="productName"
                                        value={formData.productName}
                                        required
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Base Weight</Form.Label>
                                    <Form.Control
                                        placeholder="Enter product weight"
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        type="number"
                                        name="productWeight"
                                        value={formData.productWeight}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Product Unit</Form.Label>
                                    <Form.Select
                                        name="unit"
                                        value={formData.unit}
                                        required
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Select Unit</option>
                                        <option value="kg">Kilogram</option>
                                        <option value="g">Gram</option>
                                    </Form.Select>
                                </Col>
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Base Price (₦)</Form.Label>
                                    <Form.Control
                                        placeholder="Enter base price"
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        type="text" // Text to allow commas
                                        name="basePrice"
                                        value={formData.basePrice}
                                        required
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                {canAssignSite && (
                                    <Col className="mb-4">
                                        <Form.Label className="fw-semibold">Assign to Site</Form.Label>
                                        <div className={styles.customSelect} ref={siteSelectRef}>
                                            <button
                                                type="button"
                                                className={styles.selectTrigger}
                                                onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
                                            >
                                                <span>{sites.find(s => s.id === formData.siteId)?.name || 'Select a site'}</span>
                                                <span className={`${styles.chevron} ${siteDropdownOpen ? styles.chevronUp : ''}`}>
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C757D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </span>
                                            </button>
                                            {siteDropdownOpen && (
                                                <div className={styles.selectDropdown}>
                                                    <div
                                                        className={`${styles.selectOption} ${!formData.siteId ? styles.selectOptionActive : ''}`}
                                                        onClick={() => {
                                                            setFormData({ ...formData, siteId: "" });
                                                            setSiteDropdownOpen(false);
                                                        }}
                                                    >
                                                        Select a site
                                                    </div>
                                                    {sites.map((site) => (
                                                        <div
                                                            key={site.id}
                                                            className={`${styles.selectOption} ${site.id === formData.siteId ? styles.selectOptionActive : ''}`}
                                                            onClick={() => {
                                                                setFormData({ ...formData, siteId: site.id });
                                                                setSiteDropdownOpen(false);
                                                            }}
                                                        >
                                                            {site.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                            <Row>
                                <Col className="mb-4">
                                    <Form.Check
                                        type="checkbox"
                                        id="showOnwebsite"
                                        name="showOnwebsite"
                                        label="Show on website"
                                        checked={formData.showOnwebsite}
                                        onChange={(e) => setFormData({ ...formData, showOnwebsite: e.target.checked })}
                                        className="fw-semibold"
                                        style={{ fontSize: '1rem' }}
                                    />
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-end mt-5">
                                <Button className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`} disabled={loader} type="submit">
                                    {loader ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </Form>
                    </main>
                </section>
            </div>
        </section>
    );
}
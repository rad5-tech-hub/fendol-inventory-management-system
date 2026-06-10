import React, { useState, useEffect } from 'react';
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button } from 'react-bootstrap';
import styles from '../product-stages.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import Api from "../../shared/api/apiLink";
import { ApiV2 } from "../../shared/api/apiLink";
import { jwtDecode } from 'jwt-decode';
import { extractUserTypes, hasPermission } from "../../shared/permissions/permissions";
import { useNavigate } from "react-router-dom";

export default function CreateStages() {
    const [loader, setLoader] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        siteId: "",
    });
    const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
    const navigate = useNavigate();
    const token = sessionStorage.getItem('authToken');
    const decoded = token ? jwtDecode(token) : {};
    const userTypes = extractUserTypes(decoded);
    const canManageSite = hasPermission(userTypes, 'site-management');
    const [sites, setSites] = useState([]);
    const [sitesLoading, setSitesLoading] = useState(false);
    const [sitesError, setSitesError] = useState('');

    useEffect(() => {
        if (!canManageSite) return;
        const fetchSites = async () => {
            setSitesLoading(true);
            try {
                const res = await ApiV2.get('/v2/all-site');
                setSites(res.data.data);
            } catch (err) {
                setSitesError(err.response?.data?.message || 'Failed to load sites');
            } finally {
                setSitesLoading(false);
            }
        };
        fetchSites();
    }, [canManageSite]);

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoader(true);

        const loadingToast = toast.loading("Creating Pond...", {
            className: 'dark-toast'
        });

        try {
            const payload = { title: formData.title, description: formData.description };
            if (canManageSite && formData.siteId) payload.siteId = formData.siteId;
            const response = await Api.post('/fish-stage', payload);

            setFormData({
                title: "",
                description: "",
                siteId: "",
            });
            toast.update(loadingToast, {
                render: "Created Pond successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast'
            });
            setTimeout(() => {
                navigate('/ponds/view-all-ponds');
            }, 4000);
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error creating stage. Please try again.",
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
                <div className={styles.sidebar}>
                    <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
                </div>

                <section className={`${styles.content} flex-grow-1`}>
                    <main>
                        <Form className={styles.create_form} onSubmit={handleSubmit}>
                            <ToastContainer />
                            <div className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <h4 className="mt-3 mb-5 mb-md-0">Create Pond</h4>
                            </div>
                            <Form.Label className="fw-semibold mt-4">Name</Form.Label>
                            <Form.Control
                                placeholder="Enter Pond Name.."
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                            {canManageSite && (
                                <>
                                    <Form.Label className="fw-semibold mt-4">Site</Form.Label>
                                    {sitesError && <div className="text-danger small mb-1">{sitesError}</div>}
                                    <Form.Select
                                        name="siteId"
                                        value={formData.siteId}
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        disabled={sitesLoading}
                                    >
                                        <option value="">Select Site</option>
                                        {sites.map(site => (
                                            <option key={site.id} value={site.id}>{site.name}</option>
                                        ))}
                                    </Form.Select>
                                    <div className="text-muted small mt-1">Select the operational site where this pond belongs.</div>
                                </>
                            )}
                            <Form.Label className="fw-semibold fs-6 mt-4">Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={formData.description}
                                required
                                onChange={handleInputChange}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                style={{ height: '200px' }}
                            />
                            <div className="d-flex justify-content-end my-4">
                                <Button
                                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                                    disabled={loader}
                                    type="submit"
                                >
                                    {loader ? "Creating..." : "Create"}
                                </Button>
                            </div>
                        </Form>
                    </main>
                </section>
            </div>
        </section>
    );
}
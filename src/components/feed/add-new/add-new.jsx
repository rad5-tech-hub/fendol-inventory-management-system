import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import styles from '../feed.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";

const AddFeed = () => {
    const activeSite = useSelector((store) => store.activeSite);
    const user = useSelector((store) => store.user);
    const userTypes = useSelector((store) => store.user?.userTypes || []);
    const isSuperAdmin = userTypes.includes('super_admin');
    const [formData, setFormData] = useState({
        feedName: '',
        feedType: '',
        unit: '',
        threshold: '',
        weightPerBag: ''
    });
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); // Added for sidebar toggle

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'weightPerBag' || name === 'threshold') {
            // Allow only numbers and ensure proper formatting
            const numberValue = value.replace(/[^0-9]/g, '');
            setFormData({
                ...formData,
                [name]: numberValue
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAddFeed = async (e) => {
        e.preventDefault();
        setLoader(true);
        const loadingToast = toast.loading("Adding feed...", {
            className: 'dark-toast'
        });

        try {
            const currentSiteId = isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0]?.id);
            const response = await Api.post('/create-feed', {
                ...formData,
                ...(currentSiteId ? { siteId: currentSiteId } : {}),
                threshold: Number(formData.threshold),
                weightPerBag: Number(formData.weightPerBag)
            });

            setFormData({
                feedName: '',
                unit: '',
                feedType: '',
                threshold: '',
                weightPerBag: ''
            });

            toast.update(loadingToast, {
                render: "Feed added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast'
            });

            navigate('/feed/view-all');
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error adding feed. Please try again.",
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
                        <Form className={styles.create_form} onSubmit={handleAddFeed}>
                            <h4 className="mt-4 mb-5">Add New Feed</h4>
                            <Row>
                                <Col md={12} lg={6} className="mb-4">
                                    <Form.Label className="fw-semibold">Feed Name</Form.Label>
                                    <Form.Control
                                        placeholder="Enter feed name"
                                        type="text"
                                        name="feedName"
                                        value={formData.feedName}
                                        onChange={handleInputChange}
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col md={12} lg={6} className="mb-4">
                                    <Form.Label className="fw-semibold">Unit</Form.Label>
                                    <CustomDropdown
                                        options={[
                                            { value: 'kg', label: 'Kg' },
                                            { value: 'g', label: 'Gram' },
                                            { value: 'bags', label: 'Bags' },
                                            { value: 'pieces', label: 'Pieces' },
                                            { value: 'packs', label: 'Packs' },
                                            { value: 'sachets', label: 'Sachets' },
                                        ]}
                                        value={formData.unit}
                                        onChange={(val) => handleInputChange({ target: { name: 'unit', value: val } })}
                                        placeholder="Select Unit"
                                        required
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col md={12} lg={6} className="mb-4">
                                    <Form.Label className="fw-semibold">Feed Type</Form.Label>
                                    <Form.Control
                                        placeholder="Enter feed type"
                                        type="text"
                                        name="feedType"
                                        required
                                        value={formData.feedType}
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col md={12} lg={6} className="mb-4">
                                    <Form.Label className="fw-semibold">Threshold Value</Form.Label>
                                    <Form.Control
                                        placeholder="Enter threshold value"
                                        type="number"
                                        name="threshold"
                                        value={formData.threshold}
                                        required
                                        min="1"
                                        onChange={handleInputChange}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                </Col>
                                <Col md={12} lg={6} className="mb-4">
                                    <Form.Label className="fw-semibold">Weight Per Bag</Form.Label>
                                    <div className={`${styles.inputContainer} position-relative`}>
                                        <Form.Control
                                            placeholder="Enter weight per bag"
                                            type="number"
                                            name="weightPerBag"
                                            value={formData.weightPerBag}
                                            required
                                            onChange={handleInputChange}
                                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        />
                                        <span className={`${styles.nairaSign} position-absolute end-0 top-50 translate-middle-y pe-2`}>KG</span>
                                    </div>
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

export default AddFeed;
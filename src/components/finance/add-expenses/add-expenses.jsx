import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import styles from '../finance.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { useConfirm } from '../../shared/confirm-modal';

const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const extractError = (error, fallback) => {
  const data = error?.response?.data;
  if (data) {
    if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(". ");
    if (data.response_message) return data.response_message;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
  }
  return fallback;
};

const AddExpense = () => {
    const [formData, setFormData] = useState({
        price: '',
        description: '',
        paymentType: '',
        siteId: ''
    });
    const [unformattedPrice, setUnformattedPrice] = useState(0);
    const [loader, setLoader] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [siteOptions, setSiteOptions] = useState([]);
    const [ConfirmDialog, confirm] = useConfirm();
    const userTypes = useSelector((store) => store.user?.userTypes || []);
    const activeSite = useSelector((store) => store.activeSite);
    const isAdmin = userTypes.includes('super_admin');

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const res = await ApiV2.get('/v2/all-site');
                const list = Array.isArray(res.data?.data) ? res.data.data : [];
                setSiteOptions(list.map(s => ({ value: s.id, label: s.name })));
            } catch {
                setSiteOptions([]);
            }
        };
        if (isAdmin) fetchSites();
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin && activeSite?.id) {
            setFormData(prev => ({ ...prev, siteId: activeSite.id }));
        }
    }, [isAdmin, activeSite]);

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

        if (!unformattedPrice || unformattedPrice <= 0) {
            toast.error("Please enter a valid positive amount.", { className: 'dark-toast' });
            return;
        }
        if (!formData.description.trim()) {
            toast.error("Please enter a description.", { className: 'dark-toast' });
            return;
        }
        const resolvedSiteId = formData.siteId || activeSite?.id;
        if (!resolvedSiteId) {
            toast.error("No site selected. Please select a site.", { className: 'dark-toast' });
            return;
        }

        const ok = await confirm({ message: "Are you sure you want to add this expense?", title: "Confirm Expense", variant: "primary" }); if (!ok) return;

        setLoader(true);
        const loadingToast = toast.loading("Adding expense...", { className: 'dark-toast' });

        try {
            const response = await Api.post('/expense', {
                ...formData,
                price: unformattedPrice,
                siteId: resolvedSiteId
            });

            toast.update(loadingToast, {
                render: response.data?.message || "Expense added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            setFormData({
                price: '',
                description: '',
                paymentType: '',
                siteId: isAdmin ? '' : (activeSite?.id || '')
            });
            setUnformattedPrice(0);
        } catch (error) {
            const msg = extractError(error, "Error adding expense. Please try again.");
            toast.update(loadingToast, {
                render: msg,
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
                                    <CustomDropdown
                                        name="paymentType"
                                        value={formData.paymentType || ''}
                                        onChange={(val) => handleInputChange({ target: { name: 'paymentType', value: val } })}
                                        placeholder="Select Payment Type"
                                        required
                                        className={`py-2 bg-light-subtle shadow-none ${styles.fullWidthDropdown}`}
                                        options={[
                                            { value: 'cash', label: 'Cash' },
                                            { value: 'transfer', label: 'Bank Transfer' },
                                        ]}
                                    />
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
                                {isAdmin && (
                                    <Col>
                                        <Form.Label className="fw-semibold">Site</Form.Label>
                                        <CustomDropdown
                                            name="siteId"
                                            value={formData.siteId || ''}
                                            onChange={(val) => handleInputChange({ target: { name: 'siteId', value: val } })}
                                            placeholder="Select Site"
                                            required
                                            className={`py-2 bg-light-subtle shadow-none ${styles.fullWidthDropdown}`}
                                            options={siteOptions}
                                        />
                                    </Col>
                                )}
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
                        <ConfirmDialog />
                    </main>
                </section>
            </div>
        </section>
    );
};

export default AddExpense;
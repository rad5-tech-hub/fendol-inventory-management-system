import React, { useState, useEffect } from 'react';
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button, Spinner } from 'react-bootstrap';
import styles from '../site-management.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import { ApiV2 } from "../../shared/api/apiLink";
import { useNavigate, useLocation } from "react-router-dom";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";

export default function CreateSite() {
    const location = useLocation();
    const editData = location.state?.editData || null;
    const isEdit = editData !== null;

    const [siteName, setSiteName] = useState(editData?.name || '');
    const [locationField, setLocationField] = useState(editData?.location || '');
    const [siteType, setSiteType] = useState(editData?.description || '');
    const [typeId, setTypeId] = useState('');
    const [editId] = useState(editData?.id || null);
    const [loading, setLoading] = useState(false);
    const [siteTypes, setSiteTypes] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isEdit && (!siteName.trim() || !locationField.trim())) {
            toast.error('Please fill in all required fields.', { className: 'dark-toast' });
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading(
            isEdit ? "Updating Site..." : "Creating Site...",
            { className: 'dark-toast' }
        );

        try {
            if (isEdit) {
                const body = {};
                if (siteName.trim()) body.name = siteName;
                if (locationField.trim()) body.location = locationField;
                if (typeId) body.typeId = typeId;

                await ApiV2.patch(`/v2/update-site/${editId}`, body);

                toast.update(loadingToast, {
                    render: "Site updated successfully",
                    type: "success",
                    isLoading: false,
                    autoClose: 5000,
                    className: 'dark-toast'
                });
            } else {
                await ApiV2.post('/v2/create-site', { name: siteName, location: locationField, typeId });

                toast.update(loadingToast, {
                    render: "Site created successfully",
                    type: "success",
                    isLoading: false,
                    autoClose: 5000,
                    className: 'dark-toast'
                });
                setSiteName('');
                setLocationField('');
                setSiteType('');
                setTypeId(siteTypes[0]?.id || '');
            }

            setTimeout(() => {
                navigate('/site-management/view-all');
            }, 4000);
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || (isEdit ? 'Failed to update site. Please try again.' : 'Failed to create site. Please try again.'),
                type: "error",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSiteTypes = async () => {
            try {
                const res = await ApiV2.get('/v2/site-types');
                const types = Array.isArray(res.data?.data) ? res.data.data : [];
                setSiteTypes(types);
                if (types.length > 0) {
                    if (editData?.description) {
                        const match = types.find(t => t.name === editData.description);
                        if (match) setTypeId(match.id);
                    } else if (!typeId) {
                        setTypeId(types[0].id);
                    }
                }
            } catch {
                setSiteTypes([]);
            }
        };
        fetchSiteTypes();
    }, []);

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
                                <h4 className="mt-3 mb-5 mb-md-0">{isEdit ? 'Edit Site' : 'Create New Site'}</h4>
                            </div>
                            <Form.Label className="fw-semibold mt-4">Site Name</Form.Label>
                            <Form.Control
                                placeholder="Enter site name"
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                type="text"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                required={!isEdit}
                            />
                            <Form.Label className="fw-semibold fs-6 mt-4">Location/Address</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="Enter site address"
                                value={locationField}
                                onChange={(e) => setLocationField(e.target.value)}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                required={!isEdit}
                            />
                            <Form.Label className="fw-semibold mt-4">Site Type</Form.Label>
                            <CustomDropdown
                                options={siteTypes.map(t => ({ value: t.id, label: t.name }))}
                                value={typeId}
                                onChange={(val) => {
                                    setTypeId(val);
                                    const match = siteTypes.find(t => t.id === val);
                                    if (match) setSiteType(match.name);
                                }}
                                placeholder="Select site type"
                            />
                            <div className="d-flex justify-content-end my-4 gap-2">
                                <Button
                                    variant="outline-secondary"
                                    className="py-2 px-5 fs-6 fw-semibold"
                                    onClick={() => navigate('/site-management/view-all')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                                    disabled={loading}
                                    type="submit"
                                >
                                    {loading ? <><Spinner animation="border" size="sm" className="me-2" />{isEdit ? 'Updating...' : 'Initializing...'}</> : (isEdit ? 'Update' : 'Initialize Site')}
                                </Button>
                            </div>
                        </Form>
                    </main>
                </section>
            </div>
        </section>
    );
}

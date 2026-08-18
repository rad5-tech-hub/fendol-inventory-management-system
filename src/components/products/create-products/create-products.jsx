import React, { useState, useEffect, useRef } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Form, Row, Button } from 'react-bootstrap';
import styles from '../product.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import Api, { ApiV2 } from "../../shared/api/apiLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";

export default function CreateProducts() {
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const editProduct = location.state?.editProduct;
    const isEditing = !!editProduct;
    const [showSidebar, setShowSidebar] = useState(false);
    const [siteTypes, setSiteTypes] = useState([]);
    const user = useSelector((store) => store.user);
    const isSuperAdmin = user?.userTypes?.includes('super_admin');
    const profileSiteId = user?.siteId || user?.userSites?.[0] || '';

    useEffect(() => {
        const fetchSiteTypes = async () => {
            try {
                const res = await ApiV2.get('/v2/site-types');
                if (res.data?.data) {
                    setSiteTypes(res.data.data);
                }
            } catch {
                // silently fail
            }
        };
        fetchSiteTypes();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await ApiV2.get('/api/v1/product-types');
                if (res.data?.data) {
                    setCategories(res.data.data);
                }
            } catch {
                // silently fail
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setShowCategoryDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Category state
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [dropdownMode, setDropdownMode] = useState('categories'); // 'categories' | 'create'
    const [creatingCategory, setCreatingCategory] = useState(false);
    const categoryRef = useRef(null);

    const handleCreateCategory = async () => {
        const name = newCategoryName.trim();
        if (!name || creatingCategory) return;
        setCreatingCategory(true);
        try {
            const res = await ApiV2.post('/api/v1/product-type', { name });
            const created = res.data?.data;
            if (created?.id && created?.name) {
                setCategories(prev => [...prev, { id: created.id, name: created.name }]);
                setFormData(prev => ({ ...prev, categoryId: created.id }));
            }
            setNewCategoryName('');
            setShowCategoryDropdown(false);
            setDropdownMode('categories');
        } catch {
            toast.error('Failed to create category.', { className: 'dark-toast' });
        } finally {
            setCreatingCategory(false);
        }
    };

    // Form fields state
    const [formData, setFormData] = useState({
        productName: editProduct?.productName || "",
        productWeight: editProduct?.productWeight?.toString() || "",
        unit: editProduct?.unit || "",
        basePrice: editProduct?.basePrice?.toString() || "",
        siteId: editProduct?.siteType || "",
        showOnwebsite: editProduct?.showOnwebsite || false,
        categoryId: editProduct?.productType || ""
    });

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

        const loadingToast = toast.loading(isEditing ? "Updating Product..." : "Creating Product...", {
            className: 'dark-toast'
        });

        try {
            const formDataToSubmit = {
                productName: formData.productName,
                productWeight: parseFloat(formData.productWeight) || 0,
                unit: formData.unit,
                basePrice: parseFloat(removeCommas(formData.basePrice)) || 0,
                showOnwebsite: formData.showOnwebsite,
                productType: formData.categoryId,
            };
            if (formData.siteId) {
                formDataToSubmit.siteType = formData.siteId;
            }

            let response;
            if (isEditing) {
                response = await ApiV2.patch(`/api/v1/product/${editProduct.id}`, formDataToSubmit);
            } else {
                response = await ApiV2.post('/api/v1/product', formDataToSubmit);
            }

            // Reset form or handle success as needed
            setFormData({
                productName: "",
                productWeight: "",
                unit: "",
                basePrice: "",
                siteId: "",
                showOnwebsite: false,
                categoryId: ""
            });

            // After a successful API call
            toast.update(loadingToast, {
                render: response.data?.response_message || (isEditing ? "Product updated successfully" : "Product created successfully"),
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
                render: error.response?.data?.message || `Error ${isEditing ? 'updating' : 'creating'} product. Please try again.`,
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
                            <h4 className="mt-3 mb-5">{isEditing ? 'Edit Product' : 'Create Product'}</h4>
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
                                    <CustomDropdown
                                        options={[
                                            { value: 'kg', label: 'Kilogram' },
                                            { value: 'g', label: 'Gram' },
                                            { value: 'bags', label: 'Bags' },
                                            { value: 'pieces', label: 'Pieces' },
                                            { value: 'packs', label: 'Packs' },
                                            { value: 'sachets', label: 'Sachets' },
                                        ]}
                                        value={formData.unit}
                                        onChange={(val) => handleInputChange({ target: { name: 'unit', value: val } })}
                                        placeholder="Select Unit"
                                        triggerClassName={styles.inputs}
                                    />
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
                                {isSuperAdmin && (
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Assign to Site</Form.Label>
                                    <CustomDropdown
                                        options={siteTypes.map(type => ({ value: type.id, label: type.name }))}
                                        value={formData.siteId}
                                        onChange={(val) => handleInputChange({ target: { name: 'siteId', value: val } })}
                                        placeholder="Select Site Type"
                                        triggerClassName={styles.inputs}
                                    />
                                </Col>
                                )}
                                <Col className="mb-4">
                                    <Form.Label className="fw-semibold">Category</Form.Label>
                                    <div ref={categoryRef} className="position-relative">
                                        <div
                                            className={`py-2 px-3 bg-light-subtle d-flex justify-content-between align-items-center ${styles.inputs}`}
                                            style={{ borderRadius: '0.375rem', cursor: 'pointer', minHeight: '48px' }}
                                            onClick={() => {
                                                if (!showCategoryDropdown) setDropdownMode('categories');
                                                setShowCategoryDropdown(!showCategoryDropdown);
                                            }}
                                        >
                                            <span style={{ opacity: formData.categoryId ? 1 : 0.5, color: formData.categoryId ? '#212529' : '#6c757d' }}>
                                                {categories.find(c => c.id === formData.categoryId)?.name || 'Select Category'}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#6c757d',
                                                transition: 'transform 0.25s',
                                                transform: showCategoryDropdown ? 'rotate(180deg)' : 'none'
                                            }}>▾</span>
                                        </div>
                                        {showCategoryDropdown && (
                                            <div
                                                className="position-absolute w-100 bg-white shadow-sm"
                                                style={{
                                                    zIndex: 1050,
                                                    borderRadius: '10px',
                                                    marginTop: '6px',
                                                    border: '1px solid #e0e0e0',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {dropdownMode === 'categories' ? (
                                                    <>
                                                        <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                                                            {categories.map((cat, i) => (
                                                                <div
                                                                    key={cat.id}
                                                                    style={{
                                                                        padding: '12px 16px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '14px',
                                                                        fontWeight: formData.categoryId === cat.id ? 600 : 400,
                                                                        color: formData.categoryId === cat.id ? '#512728' : '#2E3135',
                                                                        backgroundColor: formData.categoryId === cat.id ? '#fdf5f5' : 'transparent',
                                                                        borderBottom: i < categories.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                                        transition: 'background-color 0.12s'
                                                                    }}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, categoryId: cat.id });
                                                                        setShowCategoryDropdown(false);
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = formData.categoryId === cat.id ? '#fdf5f5' : '#FAFCFF'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.categoryId === cat.id ? '#fdf5f5' : 'transparent'}
                                                                >
                                                                    {cat.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div
                                                            style={{
                                                                padding: '12px 16px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: 600,
                                                                color: '#512728',
                                                                borderTop: '1px solid #e8e8e8',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                transition: 'background-color 0.12s'
                                                            }}
                                                            onClick={() => {
                                                                setNewCategoryName('');
                                                                setDropdownMode('create');
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFCFF'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <span style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '22px',
                                                                height: '22px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#512728',
                                                                color: '#fff',
                                                                fontSize: '16px',
                                                                fontWeight: 400,
                                                                lineHeight: 1
                                                            }}>+</span>
                                                            Create category
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ padding: '14px 16px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2E3135', marginBottom: '10px' }}>
                                                            New Category
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <Form.Control
                                                                type="text"
                                                                placeholder="Enter category name"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                style={{
                                                                    fontSize: '14px',
                                                                    border: '1px solid #d0d6db',
                                                                    boxShadow: 'none',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px'
                                                                }}
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleCreateCategory();
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                style={{
                                                                    backgroundColor: '#512728',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '8px 16px',
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                onClick={handleCreateCategory}
                                                                disabled={creatingCategory || !newCategoryName.trim()}
                                                            >
                                                                {creatingCategory ? 'Adding...' : 'Add'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-secondary"
                                                                style={{
                                                                    borderRadius: '6px',
                                                                    padding: '8px 12px',
                                                                    fontSize: '13px',
                                                                    border: '1px solid #d0d6db',
                                                                    color: '#6c757d',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                onClick={() => {
                                                                    setNewCategoryName('');
                                                                    setDropdownMode('categories');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Col>
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
                                    {loader ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
                                </Button>
                            </div>
                        </Form>
                    </main>
                </section>
            </div>
        </section>
    );
}
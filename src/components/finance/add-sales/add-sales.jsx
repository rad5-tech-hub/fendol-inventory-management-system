import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import styles from '../finance.module.scss';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import SalesForm from './dryfish';
import FreshForm from './freshfish';
import FingerlingsForm from './fingerlingsfish';
import FeedForm from './feed';

const formatTypeLabel = (name) =>
    name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const getSalesForm = (typeName) => {
    const n = typeName?.toLowerCase() || '';
    if (n === 'dry-fish' || n.includes('dry')) return SalesForm;
    if (n === 'fresh-fish' || n.includes('fresh fish')) return FreshForm;
    if (n === 'fingerlings' || n.includes('fingerlings')) return FingerlingsForm;
    if (n === 'feed') return FeedForm;
    return null;
};

const AddSales = () => {
    const [salesType, setSalesType] = useState('');
    const [selectedProductTypeId, setSelectedProductTypeId] = useState('');
    const [stages, setStages] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const activeSite = useSelector((store) => store.activeSite);

    // Fetch stages
    const fetchStages = async () => {
        try {
            const response = await Api.get('/fish-stages?siteId=all');
            if (Array.isArray(response.data.data)) {
                setStages(response.data.data);
            } else {
                throw new Error('Expected an array of stages');
            }
        } catch (err) {
            console.log(err.response?.data?.message || 'Failed to fetch stages.');
        }
    };

    // Fetch customers
    const fetchCustomers = async () => {
        try {
            const response = await Api.get('/customers');
            if (Array.isArray(response.data.data)) {
                setCustomers(response.data.data);
            } else {
                throw new Error('Expected an array of customers');
            }
        } catch (err) {
            console.log(err.response?.data?.message || 'Failed to fetch customers.');
        }
    };

    useEffect(() => {
        const fetchProductTypes = async () => {
            try {
                const res = await ApiV2.get('/api/v1/product-types');
                setProductTypes(res.data.data || []);
            } catch {
                setProductTypes([]);
            }
        };
        fetchProductTypes();
    }, []);

    // Fetch filtered products when product type is selected
    useEffect(() => {
        if (!selectedProductTypeId) {
            setProducts([]);
            return;
        }
        const fetchFilteredProducts = async () => {
            setLoadingProducts(true);
            try {
                const response = await ApiV2.get(`/api/v1/products?productType=${selectedProductTypeId}`);
                setProducts(response.data.data || []);
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchFilteredProducts();
    }, [selectedProductTypeId]);

    // Fetch stages and customers
    useEffect(() => {
        fetchStages();
        fetchCustomers();
    }, []);

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
                    <main className={styles.create_form}>
                        <ToastContainer />
                        <div className="d-flex flex-column flex-md-row justify-content-between mt-4 mb-5 align-items-md-center">
                            <h4 className="mb-3 mb-md-0">Add New Sale</h4>
                            <div style={{ width: '18%', minWidth: '150px' }}>
                                <CustomDropdown
                                    value={salesType || ''}
                                    onChange={(val) => {
                                        const pt = productTypes.find(p => p.name === val);
                                        setSalesType(val);
                                        setSelectedProductTypeId(pt ? pt.id : '');
                                    }}
                                    placeholder="Select Sales Type"
                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    options={productTypes.map(pt => ({
                                        value: pt.name,
                                        label: formatTypeLabel(pt.name)
                                    }))}
                                />
                            </div>
                        </div>

                        {salesType === '' && (
                            <div
                                style={{ height: '15vh' }}
                                className="text-muted fs-5 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-center fw-semibold"
                            >
                                <p className="text-muted fs-5 fw-semibold mb-0">
                                    Please select sales type
                                </p>
                                <div style={{ width: '18%', minWidth: '150px' }}>
                                    <CustomDropdown
                                        value={salesType || ''}
                                        onChange={(val) => {
                                            const pt = productTypes.find(p => p.name === val);
                                            setSalesType(val);
                                            setSelectedProductTypeId(pt ? pt.id : '');
                                        }}
                                        placeholder="Select Sales Type"
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        options={productTypes.map(pt => ({
                                            value: pt.name,
                                            label: formatTypeLabel(pt.name)
                                        }))}
                                    />
                                </div>
                            </div>
                        )}

                        {salesType && (() => {
                            const FormComponent = getSalesForm(salesType);
                            return FormComponent ? (
                                <FormComponent customers={customers} stages={stages} products={products} siteId={activeSite?.id} productTypes={productTypes} />
                            ) : null;
                        })()}
                    </main>
                </section>
            </div>
        </section>
    );
};

export default AddSales;
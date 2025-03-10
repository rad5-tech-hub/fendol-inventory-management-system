import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import styles from '../finance.module.scss';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import SalesForm from './dryfish';
import FreshForm from './freshfish';
import FingerlingsForm from './fingerlingsfish';

const AddSales = () => {
    const [salesType, setSalesType] = useState('');
    const [stages, setStages] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state

    // Fetch stages
    const fetchStages = async () => {
        try {
            const response = await Api.get('/fish-stages');
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

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await Api.get('/products');
                setProducts(response.data.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };
        fetchProducts();
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
                                <Form.Select
                                    value={salesType || ''}
                                    onChange={(e) => setSalesType(e.target.value)}
                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                >
                                    <option value="" disabled>Select Sales Type</option>
                                    <option value="Dry Fish">Dry Fish</option>
                                    <option value="Fresh Fish">Fresh Fish</option>
                                    <option value="Fingerlings Fish">Fingerlings Fish</option>
                                </Form.Select>
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
                                    <Form.Select
                                        value={salesType || ''}
                                        onChange={(e) => setSalesType(e.target.value)}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Select Sales Type</option>
                                        <option value="Dry Fish">Dry Fish</option>
                                        <option value="Fresh Fish">Fresh Fish</option>
                                        <option value="Fingerlings Fish">Fingerlings Fish</option>
                                    </Form.Select>
                                </div>
                            </div>
                        )}

                        {salesType === 'Dry Fish' && (
                            <SalesForm customers={customers} stages={stages} products={products} />
                        )}
                        {salesType === 'Fresh Fish' && (
                            <FreshForm customers={customers} stages={stages} products={products} />
                        )}
                        {salesType === 'Fingerlings Fish' && (
                            <FingerlingsForm customers={customers} stages={stages} products={products} />
                        )}
                    </main>
                </section>
            </div>
        </section>
    );
};

export default AddSales;
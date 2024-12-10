import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Dropdown } from 'react-bootstrap';
import styles from '../finance.module.scss'; // Adjust the import as needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import SalesForm from './dryfish';
import FreshForm from './freshfish';
import FingerlingsForm from './fingerlingsfish';

const AddSales = () => {
    const [salesType, setSalesType] = useState('');
    const [stages, setStages] = useState([]); // Stage data state
    const [customers, setCustomers] = useState([]); // Customer data state
    const [products, setProducts] = useState([]); // Products data state

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
            console.log(err.response?.data?.message || 'Failed to fetch data. Please try again.');
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
            console.log(err.response?.data?.message || 'Failed to fetch data. Please try again.');
        }
    };

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await Api.get('/products'); // Adjust the API endpoint as necessary
                setProducts(response.data.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };
        fetchProducts();
        fetchStages();
        fetchCustomers();
    }, []);

    return (
        <section className={`d-none d-lg-block ${styles.body}`}>
            <div className="sticky-top">
                <Header />
            </div>
            <div className="d-flex gap-2">
                <div className={`${styles.sidebar}`}>
                    <SideBar className={styles.sidebarItem} />
                </div>
                <section className={`${styles.content}`}>
                    <main className={styles.create_form}>
                        <ToastContainer />
                        <div className='d-flex justify-content-between'>
                            <h4 className="mt-4 mb-5">Add New Sale</h4>
                            {(salesType === 'Dry Fish' || salesType === 'Fresh Fish' || salesType === 'Fingerlings Fish') && (
                                <div style={{ width: '18%' }}>
                                    <Form.Select
                                        value={salesType || ''}
                                        onChange={(e) => setSalesType(e.target.value)}
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Select Sales Type</option>
                                        <option value="Dry Fish">Dry Fish</option>
                                        <option value="Fresh Fish">Fresh Fish</option>
                                        <option value="Fingerlings Fish">Fingerlings Fish</option>
                                    </Form.Select>
                                </div>
                            )}
                        </div>

                        {salesType === '' ? (
                            <div style={{ height: '15vh' }} className='text-muted fs-5 d-flex gap-3 align-items-center justify-content-center fw-semibold'>
                                <p className='text-muted fs-5 fw-semibold'>
                                    Please select sales type
                                </p>
                                <div style={{ width: '18%' }}>
                                    <Form.Select
                                        value={salesType || ''}
                                        onChange={(e) => setSalesType(e.target.value)}
                                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                    >
                                        <option value="" disabled>Select Sales Type</option>
                                        <option value="Dry Fish">Dry Fish</option>
                                        <option value="Fresh Fish">Fresh Fish</option>
                                        <option value="Fingerlings Fish">Fingerlings Fish</option>
                                    </Form.Select>
                                </div>
                            </div>
                        ) : null}

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

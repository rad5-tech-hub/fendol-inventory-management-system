import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button, Dropdown } from 'react-bootstrap';
import Api from '../../shared/api/apiLink'; // Adjust based on your API import path
import styles from '../finance.module.scss'; // Adjust the import as needed

const SalesForm = ({ customers, stages, products}) => {
    const [dryData, setDryData] = useState({
        productName: '',
        quantity: 0,
        description: '',
        category: '',
        fullName: '',
        discount: 0,
        quantityUsedToPack: null,
        paymentType: ''
    });

    const [loader, setLoader] = useState(false);
    const [product, setProduct] = useState([]);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [productDetails, setProductDetails] = useState(null);
    const [stage, setStage] = useState([]);
    const [customer, setCustomer] = useState([]);

    // Fetch products
    useEffect(() => {
        setCustomer(customers);
        setStage(stages);
        setProduct(products)
    }, []);

    // Product selection handler
    const handleProductSelect = async (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const selectedProductId = selectedOption?.getAttribute('data-id');
        const productName = e.target.value;        
    
        setDryData(prevData => ({ ...prevData, productName }));
    
        if (selectedProductId) {
            try {
                const { data } = await Api.get(`/product/${selectedProductId}`);
                const productData = data.data;
    
                setDryData(prevData => {
                    const quantity = prevData.quantity || 1;  // Default to 1 if quantity is undefined
                    const discount = prevData.discount || 0; // Default to 0 if discount is undefined
                    const basePrice = productData.basePrice || 0;  // Default to 0 if basePrice is undefined
                    const totalPrice = basePrice * quantity;  // Calculate total price before discount            
    
                    // Ensure totalPrice is not negative
                    return {
                        ...prevData,
                        basePrice,
                        totalPrice: Math.max(totalPrice, 0),
                        productWeight: productData.productWeight
                    };
                });
    
                setProductDetails(productData); // Store the fetched product details
            } catch (error) {
                toast.error('Error fetching product details.');
            }
        }
    };
    
    // Handle input change for dryData
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numericValue = name === 'quantity' || name === 'discount' ? parseFloat(value) || 0 : value;

        setDryData(prevData => {
            const quantity = name === 'quantity' ? numericValue : prevData.quantity || 1;
            const discount = name === 'discount' ? numericValue : prevData.discount || 0;
            const basePrice = prevData.basePrice || 0;
            const totalPrice = (basePrice || 0) * quantity - discount;

            return {
                ...prevData,
                [name]: numericValue,
                totalPrice: Math.max(totalPrice, 0),
            };
        });
    };

    const handleSearchChange = (e) => {
        const { value } = e.target;
        setDryData(prevData => ({ ...prevData, fullName: value }));
    
        const filtered = customer.filter(c => 
            c.fullName?.toLowerCase().includes(value.toLowerCase()) && 
            (!dryData.category || c.category === dryData.category)
        );
    
        setFilteredCustomer(filtered.length ? filtered : []);
    };
    

    // Handle customer selection
    const handleSelectCustomer = (name) => {
        setDryData(prevData => ({ ...prevData, fullName: name }));
        setFilteredCustomer([]); // Clear suggestions after selection
    };
    
    // Add Dry Fish sale
    const handleAddSales = async (e) => {
        e.preventDefault();
    
        // Show confirmation dialog
        const isConfirmed = window.confirm("Are you sure you want to add this sale?");
        
        if (!isConfirmed) {
            return; // If the user cancels, exit the function
        }
    
        setLoader(true);
        const loadingToast = toast.loading("Adding sale...", { className: 'dark-toast' });
    
        try {
            const response = await Api.post('/sales', dryData);
            
            toast.update(loadingToast, {
                render: "Sale added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
            
            setDryData({
                productName: '',
                quantity: 0,
                description: '',
                category: '',
                fullName: '',
                quantityUsedToPack: null,
                paymentType: ''
            });
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response ? error.response.data.message : 'Something went wrong',
                type: "error",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
        } finally {
            setLoader(false);
        }
    };
    

    return (
        <Form onSubmit={handleAddSales}>
            <Row xxl={2} xl={2} lg={2}>
                {/* Product Name Select */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Product Name</Form.Label>
                    <Form.Select
                        name="productName"
                        required
                        value={dryData.productName || ''}
                        onChange={handleProductSelect}
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    >
                        <option value="" disabled>Select Product</option>
                        {products
                            .filter(product => {
                                const lowerProductName = product.productName?.toLowerCase() || '';
                                return (
                                    product.productName &&
                                    !lowerProductName.includes('fresh fish') &&
                                    !lowerProductName.includes('fingerlings fish')
                                );
                            })
                            .map(product => (
                                <option key={product.id} value={product.productName} data-id={product.id}>
                                    {`${product.productName} - (₦ ${new Intl.NumberFormat().format(product.basePrice)})`}
                                </option>
                            ))
                        }
                    </Form.Select>
                </Col>
                {/* Product Weight (Readonly) */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Product Weight(Kg)</Form.Label>
                    <Form.Control
                        placeholder="Product weight"
                        type="text"
                        name="productWeight"
                        value={dryData.productWeight || ''}
                        readOnly
                        className={`py-2 bg-light-subtle text-secondary shadow-none  border-1 ${styles.inputs} ${styles.Pweight}`}
                    />
                </Col>

                {/* Buyer Category */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Buyer Category</Form.Label>                               
                    <Form.Select
                        name="category"
                        value={dryData.category || ''}
                        onChange={handleInputChange}
                        required
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} pe-5`}
                    >
                        <option value="" disabled>Select Category</option>
                        <option value="Marketer">Marketer</option>
                        <option value="Customer">Customer</option>
                    </Form.Select>
                </Col>

                {/* Customer Name with Suggestions */}
                <Col className="mb-4">
                    <Form.Group controlId="searchCustomer">
                        <Form.Label className="fw-semibold">Name</Form.Label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Form.Control
                                type="text"
                                placeholder="Search Name..."
                                name="fullName"
                                value={dryData.fullName || ''}
                                onChange={handleSearchChange}
                                style={{ width: '100%' }}
                                className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} pe-5`}
                            />
                            {dryData.fullName && filteredCustomer.length > 0 && (
                                <div className={`${styles.suggestions_box}`}>
                                    <ul>
                                        {filteredCustomer.map((customer, index) => (
                                            <li
                                                key={index}
                                                onClick={() => handleSelectCustomer(customer.fullName)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {customer.fullName}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Form.Group>
                </Col>

                {/* Quantity Input */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Quantity</Form.Label>
                    <Form.Control
                        placeholder="Enter quantity"
                        type="number"
                        name="quantity"
                        value={dryData.quantity || ''}
                        required
                        onChange={handleInputChange}
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>

                {/* Quantity Used to Pack */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Quantity Used to Pack</Form.Label>
                    <Form.Control
                        placeholder="Enter quantity used to pack"
                        type="number"
                        name="quantityUsedToPack"
                        value={dryData.quantityUsedToPack || ''}
                        min="0"
                        onChange={handleInputChange}
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>

                {/* Discount Input */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Discount</Form.Label>
                    <div className={`${styles.inputContainer} position-relative`}>
                        <Form.Control
                            placeholder="Enter discount"
                            type="text"
                            name="discount"
                            value={dryData.discount || ''}                            
                            onChange={handleInputChange}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} pe-5`}
                        />
                        <span className={`${styles.nairaSign} position-absolute end-0 top-50 translate-middle-y pe-2`}>₦</span>
                    </div>
                </Col>

                {/* Description Textarea */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Description</Form.Label>
                    <Form.Control
                        placeholder="Enter description"
                        as="textarea"
                        name="description"
                        value={dryData.description || ''}
                        onChange={handleInputChange}
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>

                {/* Payment Type */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Payment Type</Form.Label>
                    <Form.Select
                        name="paymentType"
                        value={dryData.paymentType || ''}
                        onChange={handleInputChange}
                        required
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    >
                        <option value="" disabled>Select Payment Type</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit">Credit</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Pos">Pos</option>
                    </Form.Select>
                </Col>

                {/* Total Price (Readonly) */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Total Price</Form.Label>
                    <Form.Control
                        placeholder="Total price"
                        type="text"
                        name="totalPrice"
                        value={
                            dryData && typeof dryData.totalPrice === 'number'
                                ? `₦ ${new Intl.NumberFormat().format(dryData.totalPrice)}`
                                : ''
                        }
                        readOnly
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>
            </Row>
            <div className="text-end">
                <Button
                    variant="dark"
                    disabled={loader}
                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                    type="submit"
                >
                    {loader ? 'Adding Sale...' : 'Add Sale'}
                </Button>
            </div>
        </Form>
    );
};

export default SalesForm;

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button, Dropdown } from 'react-bootstrap';
import Api from '../../shared/api/apiLink'; // Adjust based on your API import path
import styles from '../finance.module.scss'; // Adjust the import as needed

const FreshForm = ({ customers, stages, products}) => {
    const [freshData, setFreshData] = useState({        
        productName:"",
        productWeight: 0,
        quantity: 0,
        description: "",
        category: '',
        fullName: '',
        discount: 0,
        batch_no: '',
        stageId_from: "",
        paymentType:''
    })

    const [loader, setLoader] = useState(false);
    const [product, setProduct] = useState([]);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [productDetails, setProductDetails] = useState(null);
    const [unit, setUnit] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState('');
    const [stage, setStage] = useState([]);
    const [fishType, setFishType] = useState([]);
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
    
        setFreshData(prevData => ({ ...prevData, productName }));
    
        if (selectedProductId) {
            try {
                const { data } = await Api.get(`/product/${selectedProductId}`);
                const productData = data.data;
                setUnit(productData.unit)
                setFreshData(prevData => {
                    const quantity = prevData.productWeight || 1;  // Default to 1 if quantity is undefined
                    const discount = prevData.discount || 0; // Default to 0 if discount is undefined
                    const basePrice = productData.basePrice || 0;  // Default to 0 if basePrice is undefined
                    const totalPrice = basePrice * quantity;  // Calculate total price before discount            
    
                    // Ensure totalPrice is not negative
                    return {
                        ...prevData,
                        basePrice,
                        totalPrice: Math.max(totalPrice, 0),
                        productWeight: productData.productWeight,                        
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
        const numericValue = name === 'productWeight' || name === 'discount' ? parseFloat(value) || 0 : value;
        if (name === 'stageId_from') {
            setFreshData({ ...freshData, stageId_from: value });
            getQuantity(value);  // Pass stageId_from to getQuantity
        }

        setFreshData(prevData => {
            const quantity = name === 'productWeight' ? numericValue : prevData.productWeight || 1;
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

    // get batches available
    const getQuantity = async (stageId_from) => {
        setSelectedQuantity('loading...')
        if (stageId_from) {
            try {
                const response = await Api.get(`/active-batch?stageId=${stageId_from}`);
                setFishType(response.data.data); // Update with the fetched quantity
            } catch (error) {
                console.error('Failed to fetch quantity:', error);
                setSelectedQuantity('Error getting quantity or empty pond'); // Update with an error message
            }
        } else {
            console.error('Stage ID from is required.');
            setSelectedQuantity('Stage ID is required'); // Handle missing ID case
        }
    };

    const handleSearchChange = (e) => {
        const { value } = e.target;
    
        setFreshData(prevData => ({ ...prevData, fullName: value }));
    
        const filtered = value
            ? customer.filter(c => 
                c.fullName?.toLowerCase().includes(value.toLowerCase()) && c.category === freshData.category
            )
            : customer.filter(c => c.category === freshData.category);
    
        setFilteredCustomer(filtered.length ? filtered : []);
    };    

    // Handle customer selection
    const handleSelectCustomer = (name) => {
        setFreshData(prevData => ({ ...prevData, fullName: name }));
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
            const response = await Api.post('/sales-fresh-fish', freshData);
            
            toast.update(loadingToast, {
                render: "Sale added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
            
            setFreshData({
                productName: "",
                productWeight: 0,
                quantity: 0,
                description: "",
                category: '',
                fullName: '',
                discount: 0,
                stageId_from: "",
                paymentType: '',
                batch_no: ''
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
               {/* Stage From */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Pond From</Form.Label>
                    <Form.Select
                        name="stageId_from"
                        required
                        value={freshData.stageId_from || ''}
                        onChange={handleInputChange}
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    >
                        <option value="" disabled>Select Pond</option>
                        {stages                          
                            .map((stage, index) => (
                                <option key={index} value={stage.id}>
                                    {stage.title || 'No Data Yet'}
                                </option>
                            ))}
                    </Form.Select>
                </Col> 

                {/* Fish Batch */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Fish Batch</Form.Label>
                    <Form.Select
                        name="batch_no"
                        value={freshData.batch_no}
                        onChange={handleInputChange}
                        required
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    >
                        <option value="" disabled>Choose Fish Batch</option>
                        {!fishType ? (
                            <option>Please wait...</option>
                        ) : fishType.length < 1 ? (
                            <option>No Active Batch</option>
                        ) : (
                            fishType.map((stage, index) => (
                                <option value={stage.batch_no} key={index}>{stage.batch_no} {freshData.stageId_from === stage.stageId ? `-(${stage.quantity || '0'})` : ''}</option>
                            ))
                        )}
                    </Form.Select>
                </Col>

                {/* Product Name */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Product Name</Form.Label>                                        
                    <Form.Select
                    name="productName"
                    required
                    value={freshData.productName || ''}
                    onChange={handleProductSelect}
                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    >
                    <option value="" disabled>Select Fresh Fish Product</option>
                    {products
                        .filter(product => product.productName && product.productName.toLowerCase().includes('fresh'))
                        .map((product, index) => (
                        <option key={index} value={product.productName} data-id={product.id}>
                            {product.productName ? `${product.productName} - (₦ ${new Intl.NumberFormat().format(product.basePrice)})` : 'No Data Yet'}
                        </option>
                        ))
                    }
                    </Form.Select>
                </Col>                   

                {/* Total Product Weight */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Total Product Weight {`(${unit})`}</Form.Label>
                    <Form.Control
                    placeholder="Enter product weight"
                    type="number"
                    name="productWeight"
                    value={freshData.productWeight || ''}
                    required
                    onChange={handleInputChange}
                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>

                {/* Buyer Category */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Buyer Category</Form.Label>
                    <Form.Select
                        name="category"
                        value={freshData.category || ''}
                        onChange={handleInputChange}
                        required
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} pe-5`}
                    >
                        <option value="" disabled>Select Category</option>
                        <option value="Marketer">Marketer</option>
                        <option value="Customer">Customer</option>
                    </Form.Select>
                </Col>

                {/* Name of Customer */}
                <Col className="mb-4">
                    <Form.Group controlId="searchCustomer">
                    <Form.Label className="fw-semibold">Name</Form.Label>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Form.Control
                            type="text"
                            placeholder="Search Name..."
                            name="fullName"
                            value={freshData.fullName || ''}
                            onChange={handleSearchChange}
                            style={{ width: '100%' }}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} pe-5`}
                        />
                        {freshData.fullName && filteredCustomer.length > 0 && (
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

                {/* Quantity */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Quantity Of Fresh Fish</Form.Label>
                    <Form.Control
                    placeholder="Enter quantity"
                    type="number"
                    name="quantity"
                    value={freshData.quantity || ''}                                            
                    required
                    onChange={handleInputChange}
                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>

                {/* Discount */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Discount</Form.Label>
                    <div className={`${styles.inputContainer} position-relative`}>
                    <Form.Control
                        placeholder="Enter discount"
                        type="text"
                        name="discount"                                            
                        value={freshData.discount ? (new Intl.NumberFormat().format(freshData.discount)) : '' }                                                            
                        onChange={handleInputChange}
                        className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs} pe-5`}
                    />
                    <span className={`${styles.nairaSign} position-absolute end-0 top-50 translate-middle-y pe-2`}>₦</span>
                    </div>
                </Col>

                {/* Description */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Description</Form.Label>
                    <Form.Control
                    placeholder="Enter description"
                    as="textarea"
                    name="description"
                    value={freshData.description || ''}
                    onChange={handleInputChange}
                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>

                {/* Payment Type */}
                <Col className='mb-4'>
                    <Form.Label className="fw-semibold">Payment Type</Form.Label>
                    <Form.Select
                    name='paymentType'
                    value={freshData.paymentType || ''}
                    onChange={handleInputChange}
                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    >
                    <option value="" disabled>Select Payment Type</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Pos">Pos</option>
                    </Form.Select>
                </Col>  

                {/* Total Price */}
                <Col className="mb-4">
                    <Form.Label className="fw-semibold">Total Price</Form.Label>
                    <Form.Control
                    placeholder="Total price"
                    type="text"
                    name="totalPrice"
                    value={freshData.totalPrice ? `₦${new Intl.NumberFormat().format(freshData.totalPrice)}` : ''}
                    readOnly
                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                    />
                </Col>
            </Row>
            <div className='text-end'>
                <Button
                    variant='dark'
                    disabled={loader}
                    className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                    type='submit'
                >
                    {loader ? ' Adding Sale...' : 'Add Sale'}
                </Button>
            </div>
        </Form>
    );
};

export default FreshForm;

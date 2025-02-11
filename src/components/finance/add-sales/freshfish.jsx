import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button } from 'react-bootstrap';
import Api from '../../shared/api/apiLink'; // Adjust based on your API import path
import styles from '../finance.module.scss'; // Adjust the import as needed
import ReceiptModal from './receipt';

const FreshForm = ({ customers, stages, products }) => {
    const [freshData, setFreshData] = useState({
        productName: "",
        productWeight: 0,
        quantity: 0,
        description: "",
        category: '',
        fullName: '',
        discount: 0,
        amountPaid: null,
        batch_no: '',
        stageId_from: "",
        paymentType: '',
        basePrice: 0, // Add basePrice to the state
        totalPrice: 0 // Add totalPrice to the state
    });

    const [receiptData, setReceiptData] = useState({});
    const [showReceipt, setShowReceipt] = useState(false);
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
        setProduct(products);
    }, [customers, stages, products]);

    // Recalculate totalPrice whenever quantity or basePrice changes
    useEffect(() => {
        const { quantity, basePrice, discount } = freshData;
        const totalPrice = (basePrice || 0) * (quantity || 0) - (discount || 0);
        setFreshData(prevData => ({ ...prevData, totalPrice: Math.max(totalPrice, 0) }));
    }, [freshData.quantity, freshData.basePrice, freshData.discount]);

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
                setUnit(productData.unit);

                setFreshData(prevData => ({
                    ...prevData,
                    basePrice: productData.basePrice || 0,
                    productWeight: productData.productWeight,
                }));

                setProductDetails(productData); // Store the fetched product details
            } catch (error) {
                toast.error('Error fetching product details.');
            }
        }
    };

    // Handle input change for freshData
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numericValue = name === 'productWeight' || name === 'discount' || name === 'quantity' ? parseFloat(value) || 0 : value;

        if (name === 'stageId_from') {
            setFreshData(prevData => ({ ...prevData, stageId_from: value }));
            getQuantity(value);  // Pass stageId_from to getQuantity
        }

        setFreshData(prevData => ({
            ...prevData,
            [name]: numericValue,
        }));
    };

    // get batches available
    const getQuantity = async (stageId_from) => {
        setSelectedQuantity('loading...');
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

    const calculateDiscountedPrice = () => {
        let discountedPrice = freshData.totalPrice;
        if (freshData.category === 'Marketer') {
            discountedPrice -= (freshData.totalPrice * 0.1); // Apply 10% discount for Marketers
        } else {
            discountedPrice -= (freshData.discount || 0); // Apply fixed discount
        }
        return discountedPrice;
    };

    const calculateTotalBalance = () => {
        const discountedPrice = calculateDiscountedPrice();
        return discountedPrice - (freshData.amountPaid || 0);
    };

    const handleAddSales = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to add this sale?")) return;
    
        setLoader(true);
        
        // Toast for sale process
        const salesToast = toast.loading("Adding sale...", { className: 'dark-toast' });
    
        try {
            // 1. Create sale first
            const saleResponse = await Api.post('/sales-fresh-fish', freshData);
    
            if (saleResponse.status < 200 || saleResponse.status >= 300) {
                throw new Error(saleResponse.data?.message || "Sale failed!");
            }
    
            const transactionId = saleResponse.data?.transactionId;
    
            if (!transactionId) {
                toast.update(salesToast, {
                    render: "Transaction ID not found. Please try again.",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                    className: 'dark-toast'
                });
                setLoader(false);
                return;
            }
    
            // ✅ Sale success toast
            toast.update(salesToast, {
                render: "Sale added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
    
            // 2. Toast for fetching receipt
            const receiptToast = toast.loading("Fetching receipt...", { className: 'dark-toast' });
    
            // 3. Fetch receipt using transaction ID
            const receiptResponse = await Api.get(`/receipts/${transactionId}`);
    
            if (receiptResponse.status < 200 || receiptResponse.status >= 300) {
                throw new Error("Receipt could not be fetched.");
            }
    
            // 4. Update state with receipt data
            setReceiptData(receiptResponse.data);
    
            // ✅ Receipt success toast
            toast.update(receiptToast, {
                render: "Receipt fetched successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
    
            setShowReceipt(true); // Show receipt modal
    
            // 5. Reset form after showing receipt
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
                batch_no: '',
                basePrice: 0,
                totalPrice: 0
            });
    
        } catch (error) {
            console.error("Error in handleAddSales:", error);
    
            // Handle errors separately for sale and receipt
            toast.update(salesToast, {
                render: error.response?.data?.message || error.message || 'Sale failed!',
                type: "error",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
    
            toast.dismiss(); // Ensure no stale loading toasts remain
        } finally {
            setLoader(false);
        }
    };    

    return (
        <div>
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
                                .filter(stage => stage.title !== "Fingerlings") // Exclude "Fingerlings"
                                .map((stage, index) => (
                                    <option key={index} value={stage.id}>
                                    {stage.title || 'No Data Yet'} {freshData.stageId_from === stage.id ? `- (${stage.quantity || '0'})` : ''}
                                    </option>
                                ))}
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
                            <option value="" disabled>Select Fresh Fish Products</option>
                            {products
                                .filter(product => product.productName?.toLowerCase().includes('fresh'))
                                .map((product) => (
                                    <option key={product.id} value={product.productName} data-id={product.id}>
                                        {`${product.productName} - (₦${new Intl.NumberFormat().format(product.basePrice || 0)})`}
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
                            value={freshData.productWeight}
                            required
                            onChange={handleInputChange}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                        />
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

                    {/* Discount */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Discount</Form.Label>
                        <div className={`${styles.inputContainer} position-relative`}>
                            <Form.Control
                                placeholder="Enter discount"
                                type="text"
                                name="discount"
                                value={freshData.category === 'Marketer' ? '10%' : freshData.discount || ''}
                                onChange={(e) => setFreshData({ ...freshData, discount: e.target.value })}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                                readOnly={freshData.category === 'Marketer'}
                            />
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
                            onChange={(e) => {
                                const selectedPayment = e.target.value;
                                setFreshData((prev) => ({
                                    ...prev,
                                    paymentType: selectedPayment,
                                    amountPaid: selectedPayment !== "Credit" ?  calculateTotalBalance() : prev.amountPaid, // Ensure amountPaid matches totalBalance for non-credit
                                }));
                            }}
                            required
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                        >
                            <option value="" disabled>Select Payment Type</option>
                            <option value="Cash">Cash</option>
                            <option value="Credit">Credit</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Pos">Pos</option>
                        </Form.Select>
                    </Col>

                    {/* Amount Paid Input (Only for Credit Payment) */}
                    {freshData.paymentType === "Credit" && (
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
                            <Form.Control
                                placeholder="Enter amount paid"
                                type="text"
                                name="amountPaid"
                                value={freshData.amountPaid ? new Intl.NumberFormat().format(freshData.amountPaid) : ''}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, ''); // Remove commas for proper number parsing
                                    setFreshData({ ...freshData, amountPaid: value });
                                }}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />
                        </Col>
                    )}           

                    {/* Total Price (Readonly) */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Total Price (₦)</Form.Label>
                        <Form.Control
                            placeholder="Total price"
                            type="text"
                            name="totalPrice"
                            value={freshData.totalPrice ? `₦${new Intl.NumberFormat().format(freshData.totalPrice)}` : ''}
                            readOnly
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                        />
                    </Col>

                    {/* Discounted Price (Readonly) */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Total Balance (₦)</Form.Label>
                        <Form.Control
                            placeholder="Total balance"
                            type="text"
                            name="totalBalance"
                            value={new Intl.NumberFormat().format(calculateTotalBalance())}
                            readOnly
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
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

            {/* Receipt Modal */}
            <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt}/>
        </div>
    );
};

export default FreshForm;
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button } from 'react-bootstrap';
import Api from '../../shared/api/apiLink'; // Adjust based on your API import path
import styles from '../finance.module.scss'; // Adjust the import as needed
import ReceiptModal from './receipt'; // Adjust the import as needed

const FingerlingsForm = ({ customers, stages, products }) => {
    const [fingerlingsData, setFingerlingsData] = useState({
        productName: "",
        quantity: 0,
        category: '',
        fullName: '',
        description: "",
        discount: 0,
        salesType: '',
        stageId_from: "",
        paymentType: '',
        amountPaid: null,
        basePrice: 0, // Added basePrice to state
        totalPrice: 0 // Added totalPrice to state
    });

    const [receiptData, setReceiptData] = useState({}); // Store receipt details
    const [showReceipt, setShowReceipt] = useState(false);
    const [loader, setLoader] = useState(false);
    const [product, setProduct] = useState([]);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [productDetails, setProductDetails] = useState(null);
    const [unit, setUnit] = useState('');
    const [stage, setStage] = useState([]);
    const [customer, setCustomer] = useState([]);

    // Fetch products
    useEffect(() => {
        setCustomer(customers);
        setStage(stages);
        setProduct(products);
    }, [customers, stages, products]);

    // Recalculate totalPrice whenever quantity or basePrice changes
    useEffect(() => {
        const { quantity, basePrice, discount } = fingerlingsData;
        const totalPrice = (basePrice || 0) * (quantity || 0) - (discount || 0);
        setFingerlingsData(prevData => ({ ...prevData, totalPrice: Math.max(totalPrice, 0) }));
    }, [fingerlingsData.quantity, fingerlingsData.basePrice, fingerlingsData.discount]);

    // Product selection handler
    const handleProductSelect = async (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const selectedProductId = selectedOption?.getAttribute('data-id');
        const productName = e.target.value;

        setFingerlingsData(prevData => ({ ...prevData, productName }));

        if (selectedProductId) {
            try {
                const { data } = await Api.get(`/product/${selectedProductId}`);
                const productData = data.data;
                setUnit(productData.unit);

                setFingerlingsData(prevData => ({
                    ...prevData,
                    basePrice: productData.basePrice || 0,
                }));

                setProductDetails(productData); // Store the fetched product details
            } catch (error) {
                toast.error('Error fetching product details.');
            }
        }
    };

    // Handle input change for fingerlingsData
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numericValue = name === 'quantity' || name === 'discount' ? parseFloat(value) || 0 : value;
      
        if (name === 'stageId_from') {
          setFingerlingsData(prevData => ({ ...prevData, stageId_from: value }));
          getQuantity(value); // Pass stageId_from to getQuantity
        }
      
        setFingerlingsData(prevData => ({
          ...prevData,
          [name]: numericValue,
          salesType: 'fingerlings' // Automatically set salesType to 'fingerlings'
        }));
    };

    // Fetch quantity based on stageId_from
    const getQuantity = async (stageId_from) => {
        if (stageId_from) {
            try {
                const response = await Api.get(`/active-batch?stageId=${stageId_from}`);
                console.log('Fetched quantity:', response.data.data); // Log the fetched data
                // You can update the state or UI with the fetched quantity here
            } catch (error) {
                console.error('Failed to fetch quantity:', error);
                toast.error('Failed to fetch quantity.');
            }
        } else {
            console.error('Stage ID from is required.');
        }
    };

    const handleSearchChange = (e) => {
        const { value } = e.target;

        setFingerlingsData(prevData => ({ ...prevData, fullName: value }));

        const filtered = value
            ? customer.filter(c =>
                c.fullName?.toLowerCase().includes(value.toLowerCase()) && c.category === fingerlingsData.category
            )
            : customer.filter(c => c.category === fingerlingsData.category);

        setFilteredCustomer(filtered.length ? filtered : []);
    };

    // Handle customer selection
    const handleSelectCustomer = (name) => {
        setFingerlingsData(prevData => ({ ...prevData, fullName: name }));
        setFilteredCustomer([]); // Clear suggestions after selection
    };

    const calculateDiscountedPrice = () => {
        let discountedPrice = fingerlingsData.totalPrice;
        if (fingerlingsData.category === 'Marketer') {
            discountedPrice -= (fingerlingsData.totalPrice * 0.1); // Apply 10% discount for Marketers
        } else {
            discountedPrice -= (fingerlingsData.discount || 0); // Apply fixed discount
        }
        return discountedPrice;
    };

    const calculateTotalBalance = () => {
        const discountedPrice = calculateDiscountedPrice();
        if (fingerlingsData.paymentType === 'Credit') {
          return discountedPrice - (fingerlingsData.amountPaid || 0);
        }
        return discountedPrice;
    };

    const handleAddSales = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to add this sale?")) return;
      
        setLoader(true);
        const salesToast = toast.loading("Adding sale...", { className: 'dark-toast' });
      
        try {
          // 1. Create sale first
          const saleResponse = await Api.post('/sales-fingerlings', fingerlingsData);
          if (saleResponse.status < 200 || saleResponse.status >= 300) {
            throw new Error(saleResponse.data?.message || "Sale failed!");
          }
      
          const transactionId = saleResponse.data?.transactionId;
          const salesType = fingerlingsData.salesType;
    
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
          const receiptResponse = await Api.get(`/sales-receipts/${transactionId}`);
          if (receiptResponse.status < 200 || receiptResponse.status >= 300) {
            throw new Error("Receipt could not be fetched.");
          }
      
          // 4. Update state with receipt data
          setReceiptData(receiptResponse);
      
          // ✅ Receipt success toast
          toast.update(receiptToast, {
            render: "Receipt fetched successfully!",
            type: "success",
            isLoading: false,
            autoClose: 3000,
            className: 'dark-toast'
          });
      
          setShowReceipt(true);
      
          // Reset form after showing receipt
          setFingerlingsData({
            productName: "",
            quantity: 0,
            category: '',
            fullName: '',
            description: "",
            discount: 0,
            stageId_from: "",
            paymentType: '',
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
                    {/* Product Name */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Product Name</Form.Label>
                        <Form.Select
                            name="productName"
                            required
                            value={fingerlingsData.productName || ''}
                            onChange={handleProductSelect}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                        >
                            <option value="" disabled>Select Fingerlings Product</option>
                            {products
                                .filter(product => product.productName?.toLowerCase().includes('fingerlings'))
                                .map((product) => (
                                    <option key={product.id} value={product.productName} data-id={product.id}>
                                        {`${product.productName} - ( ₦${new Intl.NumberFormat().format(product.basePrice || 0)} for ${product.productWeight || '0'} ${product.unit || ''} )`}
                                    </option>
                                ))
                            }
                        </Form.Select>
                    </Col>

                    {/* Stage From */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Pond From</Form.Label>
                        <Form.Select
                            name="stageId_from"
                            required
                            value={fingerlingsData.stageId_from || ''}
                            onChange={handleInputChange}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                        >
                            <option value="" disabled>Select Pond</option>
                            {stages
                                .filter(stage => stage.title.toLowerCase().includes('fingerlings'))
                                .map((stage, index) => (
                                    <option key={index} value={stage.id}>
                                        {stage.title || 'No Data Yet'} {fingerlingsData.stageId_from === stage.id ? `- (${stage.quantity || '0'})` : ''}
                                    </option>
                                ))}
                        </Form.Select>
                    </Col>

                    {/* Quantity */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Quantity</Form.Label>
                        <Form.Control
                            placeholder="Enter quantity"
                            type="number"
                            name="quantity"
                            value={fingerlingsData.quantity || ''}
                            min="0"
                            required
                            onChange={handleInputChange}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                        />
                    </Col>

                    {/* Description */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Description</Form.Label>
                        <Form.Control
                            placeholder="Enter description"
                            as="textarea"
                            name="description"
                            value={fingerlingsData.description || ''}
                            onChange={handleInputChange}
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                        />
                    </Col>                    

                    {/* Buyer Category */}
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Buyer Category</Form.Label>
                        <Form.Select
                            name="category"
                            value={fingerlingsData.category || ''}
                            onChange={handleInputChange}
                            required
                            className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
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
                                    value={fingerlingsData.fullName || ''}
                                    onChange={handleSearchChange}
                                    style={{ width: '100%' }}
                                    className={`py-2 bg-light-subtle shadow-none  border-1 ${styles.inputs}`}
                                />
                                {fingerlingsData.fullName && filteredCustomer.length > 0 && (
                                    <div className={`${styles.suggestions_box}`}>
                                        <ul>
                                            {filteredCustomer.map((customer, index) => (
                                                <li key={index} onClick={() => handleSelectCustomer(customer.fullName)}>
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
                        <div className="position-relative">
                            <Form.Control
                                placeholder="Enter discount"
                                type="text"
                                name="discount"
                                value={fingerlingsData.category === 'Marketer' ? '10%' : fingerlingsData.discount || ''}
                                onChange={(e) => setFingerlingsData({ ...fingerlingsData, discount: e.target.value })}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                                readOnly={fingerlingsData.category === 'Marketer'}
                            />
                        </div>
                    </Col>                    

                    {/* Payment Type */}
                    <Col className='mb-4'>
                        <Form.Label className="fw-semibold">Payment Type</Form.Label>
                        <Form.Select
                            name='paymentType'
                            value={fingerlingsData.paymentType || ''}
                            onChange={(e) => {
                                const selectedPayment = e.target.value;
                                setFingerlingsData((prev) => ({
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
                    {fingerlingsData.paymentType === "Credit" && (
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
                            <Form.Control
                                placeholder="Enter amount paid"
                                type="text"
                                name="amountPaid"
                                value={fingerlingsData.amountPaid ? new Intl.NumberFormat().format(fingerlingsData.amountPaid) : ''}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, ''); // Remove commas for proper number parsing
                                    setFingerlingsData({ ...fingerlingsData , amountPaid: value });
                                }}
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                        />
                    </Col>)}
     
                    { /* Total Price (Readonly) */ }
                    <Col className="mb-4">
                        <Form.Label className="fw-semibold">Total Price (₦)</Form.Label>
                        <Form.Control
                            placeholder="Total price"
                            type="text"
                            name="totalPrice"
                            value={fingerlingsData.totalPrice ? `₦${new Intl.NumberFormat().format(fingerlingsData.totalPrice)}` : ''}
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

export default FingerlingsForm;
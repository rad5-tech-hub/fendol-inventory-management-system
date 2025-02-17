import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button, Table, Alert } from 'react-bootstrap';
import Api from '../../shared/api/apiLink'; // Adjust based on your API import path
import styles from '../finance.module.scss'; // Adjust the import as needed
import { BsExclamationTriangleFill } from 'react-icons/bs';
import ReceiptModal from './receipt'; // Import the ReceiptModal component

const SalesForm = ({ customers, stages, products }) => {
    const [dryData, setDryData] = useState({
        products: [],
        category: '',
        fullName: '',
        discount: 0,
        description: '',
        paymentType: '',
        amountPaid: 0
    });

    const [receiptData, setReceiptData] = useState({}); // Store receipt details
    const [showReceipt, setShowReceipt] = useState(false);
    const [checkedProducts, setCheckedProducts] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [loader, setLoader] = useState(false);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [formSubmitted, setFormSubmitted] = useState(false);

    useEffect(() => {
        setCustomer(customers);
    }, [customers]);

    useEffect(() => {
        const total = dryData.products.reduce((total, product) => {
            if (checkedProducts[product?.productName]) {
                const quantity = product?.quantity || 0;
                const basePrice = products.find(p => p?.productName === product?.productName)?.basePrice || 0;
                const isBrokenProduct = product?.productName?.toLowerCase().includes("broken");
                const quantityUsedToPack = product?.quantityUsedToPack || 0; // default to 0 if undefined
                let productTotal;
                if (isBrokenProduct) {
                    productTotal = quantityUsedToPack * basePrice;
                } else {
                    productTotal = quantity * basePrice;
                }
                return total + productTotal;
            }
            return total;
        }, 0);
        setTotalPrice(total);
    }, [dryData.products, checkedProducts, products]);

    const handleInputChange = (e, productName) => {
        const { name, value } = e.target;
        setDryData(prevState => {
            const updatedProducts = prevState.products.map(product =>
                product.productName === productName ? { ...product, [name]: value } : product
            );
            return { ...prevState, products: updatedProducts };
        });
    };

    const handleCheckChange = (e, productName) => {
        const { checked } = e.target;
        setCheckedProducts(prevState => ({
            ...prevState,
            [productName]: checked
        }));
        if (checked) {
            setDryData(prevState => ({
                ...prevState,
                products: [...prevState.products, { productName, quantity: 0, quantityUsedToPack: 0 }]
            }));
        } else {
            setDryData(prevState => ({
                ...prevState,
                products: prevState.products.filter(product => product.productName !== productName)
            }));
        }
    };

    const calculateSubtotal = (productName) => {
        const product = dryData.products.find(product => product.productName === productName);
        if (!product) {
            return 0; // Return 0 if product is undefined
        }

        const quantity = product?.quantity || 0;
        const quantityUsedToPack = product?.quantityUsedToPack || 0;
        const basePrice = products.find(p => p.productName === productName)?.basePrice || 0;
        const isBrokenProduct = product.productName?.toLowerCase().includes("broken");

        if (isBrokenProduct) {
            return quantityUsedToPack * basePrice;
        } else {
            return quantity * basePrice;
        }
    };


    const calculateDiscountedPrice = () => {
        let discountedPrice = totalPrice;
        if (dryData.category === 'Marketer') {
            discountedPrice -= (totalPrice * 0.1);
        } else {
            discountedPrice -= (dryData.discount || 0);
        }
        return discountedPrice;
    };

    const calculateTotalBalance = () => {
        const discountedPrice = calculateDiscountedPrice();
        return discountedPrice - (dryData.amountPaid || 0);
    };

    const handleNextStep = () => {
        setFormSubmitted(true);
        if (isNextButtonDisabled()) {
            toast.error("Please fill in all required fields for the selected products.", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 3000,
                className: 'dark-toast'
            });
        } else {
            setCurrentStep(2);
        }
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

    const handleSelectCustomer = (name) => {
        setDryData(prevData => ({ ...prevData, fullName: name }));
        setFilteredCustomer([]); // Clear suggestions after selection
    };

    const handleCategoryChange = (e) => {
        const { value } = e.target;
        setDryData(prevData => ({ ...prevData, category: value }));

        const filtered = customer.filter(c =>
            c.fullName?.toLowerCase().includes(dryData.fullName?.toLowerCase() || '') &&
            (!value || c.category === value)
        );

        setFilteredCustomer(filtered.length ? filtered : []);
    };

    const handleAddSales = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to add this sale?")) return;

        setLoader(true);

        // Toast for sale process
        const salesToast = toast.loading("Adding sale...", { className: 'dark-toast' });

        try {
            // 1. Create sale first
            const saleResponse = await Api.post('/sales', dryData);

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
            const receiptResponse = await Api.get(`/receipt/${transactionId}`);

            if (receiptResponse.status < 200 || saleResponse.status >= 300) {
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
            setDryData({
                products: [],
                category: '',
                fullName: '',
                discount: '',
                description: '',
                paymentType: '',
                amountPaid: ''
            });

            setCheckedProducts({});
            setCurrentStep(1);
            setFormSubmitted(false);

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

    const isNextButtonDisabled = () => {
        const hasCheckedProduct = Object.values(checkedProducts).some(checked => checked);
        if (!hasCheckedProduct) {
            return true;
        }
        return Object.keys(checkedProducts).some(productName => {
            if (checkedProducts[productName]) {
                const product = dryData.products.find(p => p.productName === productName);
                return !product || !product.quantity || !product.quantityUsedToPack;
            }
            return false;
        });
    };

    return (
        <div>
            {currentStep === 1 && (
                products.length > 0 ? (
                    <>
                        <Table variant="light" className={`bg-light px-2 ${styles.styled_table}`}>
                            <thead className={`rounded-2 px-2`}>
                                <tr>
                                    <th>PRODUCT</th>
                                    <th>PRODUCT WEIGHT</th>
                                    <th>PRICE</th>
                                    <th>QUANTITY</th>
                                    <th>QUANTITY USED TO PACK <br /> QUANTITY IN KG FOR BROKEN</th>
                                    <th>SUBTOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products
                                    .filter(product => {
                                        const lowerProductName = product.productName?.toLowerCase() || '';
                                        return (
                                            product.productName &&
                                            !lowerProductName.includes('fresh fish') &&
                                            !lowerProductName.includes('fingerlings fish')
                                        );
                                    })
                                    .map((product, index) => (
                                        <tr key={index}>
                                            <td className='ps-3'>
                                                <Form.Check
                                                    type="checkbox"
                                                    label={product.productName}
                                                    value={product.productName}
                                                    data-id={product.id}
                                                    className=" text-uppercase mt-2 fw-semibold"
                                                    onChange={(e) => handleCheckChange(e, product.productName)}
                                                    checked={checkedProducts[product.productName] || false}
                                                />
                                            </td>
                                            <td><p className='py-2'>{product.productWeight}{product.unit}</p></td>
                                            <td><p className='py-2'>₦ {new Intl.NumberFormat().format(product.basePrice)}</p></td>
                                            <td>
                                                <Form.Control
                                                    placeholder="Enter quantity"
                                                    type="number"
                                                    name="quantity"
                                                    value={dryData.products.find(p => p.productName === product.productName)?.quantity || ''}
                                                    required
                                                    min={1}
                                                    onChange={(e) => handleInputChange(e, product.productName)}
                                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                                    disabled={!checkedProducts[product.productName]}
                                                />
                                            </td>
                                            <td className='px-2'>
                                                <Form.Control
                                                    placeholder={!product.productName?.toLowerCase().includes("broken") ? `Enter quantity used to pack` : `Enter quantity in to Kg`}
                                                    type="number"
                                                    name="quantityUsedToPack"
                                                    value={dryData.products.find(p => p.productName === product.productName)?.quantityUsedToPack || ''}
                                                    min="0"
                                                    onChange={(e) => handleInputChange(e, product.productName)}
                                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                                    disabled={!checkedProducts[product.productName]}
                                                />
                                            </td>
                                            <td><p className="text-muted py-2">
                                                ₦ {new Intl.NumberFormat().format(calculateSubtotal(product.productName))}
                                            </p>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </Table>
                        <div className="mt-3">
                            <h5 className='fw-semibold mt-3'>Total Price: ₦ {new Intl.NumberFormat().format(totalPrice)}</h5>
                        </div>
                        <div className='text-end'>
                            <Button
                                onClick={handleNextStep}
                                variant='dark'
                                className={`border-0 btn btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                                disabled={isNextButtonDisabled()}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="d-flex justify-content-center">
                        <Alert variant="info" className="text-center w-50 py-5">
                            <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">No Product yet.</span>
                        </Alert>
                    </div>
                )
            )}
            {currentStep === 2 && (
                <Form onSubmit={handleAddSales}>
                    <Row xxl={2} xl={2} lg={2}>
                        {/* Buyer Category */}
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Buyer Category</Form.Label>
                            <Form.Select
                                name="category"
                                value={dryData.category || ''}
                                onChange={(e) => handleCategoryChange(e)}
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                                required
                            >
                                <option value="" disabled>Select Category</option>
                                {stages.map((stage) => (
                                    <option key={stage.category} value={stage.category}>
                                        {stage.category}
                                    </option>
                                ))}
                            </Form.Select>
                            {formSubmitted && !dryData.category && (
                                <Form.Text className="text-danger">Category is required.</Form.Text>
                            )}
                        </Col>

                        {/* Full Name */}
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="fullName"
                                value={dryData.fullName || ''}
                                onChange={handleSearchChange}
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                                required
                            />
                            {formSubmitted && !dryData.fullName && (
                                <Form.Text className="text-danger">Full Name is required.</Form.Text>
                            )}
                            {filteredCustomer.length > 0 && (
                                <div className="list-group position-absolute bg-light mt-1 shadow border">
                                    {filteredCustomer.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="list-group-item list-group-item-action"
                                            onClick={() => handleSelectCustomer(c.fullName)}
                                        >
                                            {c.fullName} ({c.category})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Col>
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Payment Type</Form.Label>
                            <Form.Select
                                name="paymentType"
                                value={dryData.paymentType || ''}
                                onChange={(e) => setDryData({ ...dryData, paymentType: e.target.value })}
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                                required
                            >
                                <option value="" disabled>Select Payment Type</option>
                                <option value="Cash">Cash</option>
                                <option value="Transfer">Transfer</option>
                                {/* Add other payment types as needed */}
                            </Form.Select>
                            {formSubmitted && !dryData.paymentType && (
                                <Form.Text className="text-danger">Payment Type is required.</Form.Text>
                            )}
                        </Col>

                        {/* Amount Paid */}
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Amount Paid</Form.Label>
                            <Form.Control
                                type="number"
                                name="amountPaid"
                                value={dryData.amountPaid || ''}
                                onChange={(e) => setDryData({ ...dryData, amountPaid: parseFloat(e.target.value) })}
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                                required
                                min={0}
                            />
                            {formSubmitted && !dryData.amountPaid && (
                                <Form.Text className="text-danger">Amount Paid is required.</Form.Text>
                            )}
                        </Col>
                    </Row>
                    <Row>
                        {/* Discount */}
                        <Col className="mb-4" lg={6}>
                            <Form.Label className="fw-semibold">Discount</Form.Label>
                            <Form.Control
                                type="number"
                                name="discount"
                                value={dryData.discount || ''}
                                onChange={(e) => setDryData({ ...dryData, discount: parseFloat(e.target.value) })}
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                                disabled={dryData.category === 'Marketer'}
                                min={0}
                            />
                        </Col>

                        {/* Total */}
                        <Col className="mb-4" lg={6}>
                            <Form.Label className="fw-semibold">Total Amount</Form.Label>
                            <Form.Control
                                type="text"
                                value={`₦ ${new Intl.NumberFormat().format(calculateDiscountedPrice())}`}
                                readOnly
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                            />
                        </Col>
                    </Row>
                    <Row>
                        {/* Balance */}
                        <Col className="mb-4" lg={6}>
                            <Form.Label className="fw-semibold">Balance</Form.Label>
                            <Form.Control
                                type="text"
                                value={`₦ ${new Intl.NumberFormat().format(calculateTotalBalance())}`}
                                readOnly
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                            />
                        </Col>
                        {/* Description */}
                        <Col className="mb-4" lg={6}>
                            <Form.Label className="fw-semibold">Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={dryData.description || ''}
                                onChange={(e) => setDryData({ ...dryData, description: e.target.value })}
                                className={`shadow-none bg-light-subtle ${styles.inputs}`}
                                rows={1}
                            />
                        </Col>
                    </Row>

                    <div className='text-end'>
                        <Button
                            variant="outline-secondary"
                            onClick={() => setCurrentStep(1)}
                            className="me-2 border-0 btn btn-light shadow py-2 px-5 fs-6 fw-semibold"
                        >
                            Previous
                        </Button>
                        <Button
                            type="submit"
                            variant="dark"
                            className={`border-0 btn btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
                            disabled={loader}
                        >
                            {loader ? 'Adding Sale...' : 'Add Sales'}
                        </Button>
                    </div>
                </Form>
            )}

            <ReceiptModal
                show={showReceipt}
                onHide={() => setShowReceipt(false)}
                receiptData={receiptData}
            />
        </div>
    );
};

export default SalesForm;

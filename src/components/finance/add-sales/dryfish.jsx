import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button, Table, Alert } from 'react-bootstrap';
import Api from '../../shared/api/apiLink';
import styles from '../finance.module.scss';
import { BsExclamationTriangleFill } from 'react-icons/bs';
import ReceiptModal from './receipt';

const SalesForm = ({ customers, stages, products }) => {
    const [dryData, setDryData] = useState({
        products: [],
        category: '',
        customerId: '',
        discount: 0,
        description: '',
        salesCategory: '',
        paymentType: '',
        fullName: '',
        amountPaid: null
    });

    const [receiptData, setReceiptData] = useState({});
    const [showReceipt, setShowReceipt] = useState(false);
    const [checkedProducts, setCheckedProducts] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [loader, setLoader] = useState(false);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [formSubmitted, setFormSubmitted] = useState(false);

    useEffect(() => {
        setCustomer(customers || []);
    }, [customers]);

    useEffect(() => {
        const total = dryData.products.reduce((total, product) => {
            if (checkedProducts[product?.id]) {
                const quantity = product?.quantity || 0;
                const basePrice = products.find(p => p?.id === product?.id)?.basePrice || 0;
                const isBrokenProduct = product?.productName?.toLowerCase().includes("broken");
                const quantityUsedToPack = product?.quantityUsedToPack || 0;
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

    const handleCheckChange = (e, productId) => {
        const { checked } = e.target;
        setCheckedProducts(prevState => ({
            ...prevState,
            [productId]: checked
        }));
        if (checked) {
            const product = products.find(p => p.id === productId);
            setDryData(prevState => ({
                ...prevState,
                products: [
                    ...prevState.products,
                    { 
                        id: productId, 
                        productName: product.productName, 
                        quantity: '', 
                        quantityUsedToPack: '' 
                    }
                ]
            }));
        } else {
            setDryData(prevState => ({
                ...prevState,
                products: prevState.products.filter(product => product.id !== productId)
            }));
        }
    };

    const handleInputChange = (e, productId) => {
        const { name, value } = e.target;

        setDryData(prevState => {
            const productExists = prevState.products.find(p => p.id === productId);
            let updatedProducts;

            if (productExists) {
                updatedProducts = prevState.products.map(product =>
                    product.id === productId
                        ? {
                            ...product,
                            [name]: value === '' ? '' : parseFloat(value) || 0
                        }
                        : product
                );
            } else {
                const productInfo = products.find(p => p.id === productId);
                updatedProducts = [
                    ...prevState.products,
                    {
                        id: productId,
                        productName: productInfo.productName,
                        quantity: name === 'quantity' ? (parseFloat(value) || 0) : '',
                        quantityUsedToPack: name === 'quantityUsedToPack' ? (parseFloat(value) || 0) : ''
                    }
                ];
            }

            return {
                ...prevState,
                products: updatedProducts,
                salesCategory: 'dry'
            };
        });
    };

    const calculateSubtotal = (productId) => {
        const product = dryData.products.find(product => product.id === productId);
        if (!product) return 0;

        const quantity = product?.quantity || 0;
        const quantityUsedToPack = product?.quantityUsedToPack || 0;
        const basePrice = products.find(p => p.id === productId)?.basePrice || 0;
        const isBrokenProduct = product.productName?.toLowerCase().includes("broken");

        return isBrokenProduct ? quantityUsedToPack * basePrice : quantity * basePrice;
    };

    const calculateDiscountedPrice = () => {
        let discountedPrice = totalPrice;
        if (dryData.category === 'Marketer') {
            discountedPrice -= (totalPrice * 0.1); // 10% discount for Marketers
        } else if (dryData.discount > 0) {
            discountedPrice -= parseFloat(dryData.discount) || 0; // Manual discount for Customers
        }
        return Math.max(discountedPrice, 0);
    };

    const calculateTotalBalance = () => {
        const discountedPrice = calculateDiscountedPrice();
        if (dryData.paymentType === 'Credit') {
            return discountedPrice - (dryData.amountPaid || 0);
        }
        return discountedPrice;
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

        const filtered = value
            ? customer.filter(c => c.fullName?.toLowerCase().includes(value.toLowerCase()))
            : customer;
        setFilteredCustomer(filtered.length ? filtered : []);
    };

    const handleSelectCustomer = (selectedCustomer) => {
        const discount = selectedCustomer.category === "Marketer" ? 10 : 0; // Set discount based on category
        setDryData(prevData => ({
            ...prevData,
            customerId: selectedCustomer.id,
            fullName: selectedCustomer.fullName,
            category: selectedCustomer.category,
            discount: discount
        }));
        setFilteredCustomer([]);
    };

    const handleFocus = (e, productId) => {
        if (!checkedProducts[productId]) {
            setCheckedProducts(prevState => ({
                ...prevState,
                [productId]: true
            }));
            const product = products.find(p => p.id === productId);
            setDryData(prevState => ({
                ...prevState,
                products: [
                    ...prevState.products,
                    {
                        id: productId,
                        productName: product.productName,
                        quantity: '',
                        quantityUsedToPack: ''
                    }
                ]
            }));
        }
    };

    const handleAddSales = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to add this sale?")) return;

        setLoader(true);
        const salesToast = toast.loading("Adding sale...", { className: 'dark-toast' });

        try {
            const saleResponse = await Api.post('/sales', dryData);

            if (saleResponse.status < 200 || saleResponse.status >= 300) {
                throw new Error(saleResponse.data?.message || "Sale failed!");
            }

            const transactionId = saleResponse.data.data?.transactionId;
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

            toast.update(salesToast, {
                render: "Sale added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            const receiptToast = toast.loading("Fetching receipt...", { className: 'dark-toast' });
            const receiptResponse = await Api.get(`/sales-receipts/${transactionId}`);

            if (receiptResponse.status < 200 || receiptResponse.status >= 300) {
                throw new Error("Receipt could not be fetched.");
            }

            setReceiptData(receiptResponse);
            toast.update(receiptToast, {
                render: "Receipt fetched successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });

            setShowReceipt(true);

            setDryData({
                products: [],
                category: '',
                customerId: '',
                discount: 0,
                description: '',
                paymentType: '',
                fullName: '',
                amountPaid: null
            });
            setCheckedProducts({});
            setCurrentStep(1);
            setFormSubmitted(false);

        } catch (error) {
            console.error("Error in handleAddSales:", error);
            toast.update(salesToast, {
                render: error.response?.data?.message || error.message || 'Sale failed!',
                type: "error",
                isLoading: false,
                autoClose: 6000,
                className: 'dark-toast'
            });
        } finally {
            setLoader(false);
        }
    };

    const isNextButtonDisabled = () => {
        const hasCheckedProduct = Object.values(checkedProducts).some(checked => checked);
        if (!hasCheckedProduct) return true;
        return Object.keys(checkedProducts).some(productId => {
            if (checkedProducts[productId]) {
                const product = dryData.products.find(p => p.id === productId);
                return !product || (!product.quantity && product.quantity !== 0) || (!product.quantityUsedToPack && product.quantityUsedToPack !== 0);
            }
            return false;
        });
    };

    return (
        <div>
            {currentStep === 1 && (
                products.length > 0 ? (
                    <>
                        <Table variant="light" className={`bg-light px-2 ${styles.styled_table}`} responsive>
                            <thead className={`rounded-2 px-2`}>
                                <tr>
                                    <th>PRODUCT</th>
                                    <th>PRODUCT WEIGHT</th>
                                    <th>PRICE</th>
                                    <th>QUANTITY</th>
                                    <th>QUANTITY USED TO PACK <br /> WEIGH IN KG FOR BROKEN</th>
                                    <th>SUBTOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products
                                    .filter(product => {
                                        const lowerProductName = product.productName?.toLowerCase() || '';
                                        return (
                                            product.productName &&
                                            !lowerProductName.includes('fresh') &&
                                            !lowerProductName.includes('fingerlings')
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
                                                    className="text-uppercase mt-2 fw-semibold"
                                                    onChange={(e) => handleCheckChange(e, product.id)}
                                                    checked={checkedProducts[product.id] || false}
                                                />
                                            </td>
                                            <td><p className='py-2'>{product.productWeight}{product.unit}</p></td>
                                            <td><p className='py-2'>₦ {new Intl.NumberFormat().format(product.basePrice)}</p></td>
                                            <td>
                                                <Form.Control
                                                    placeholder="Enter quantity"
                                                    type="number"
                                                    name="quantity"
                                                    value={dryData.products.find(p => p.id === product.id)?.quantity || ''}
                                                    required
                                                    min={1}
                                                    onChange={(e) => handleInputChange(e, product.id)}
                                                    onFocus={(e) => handleFocus(e, product.id)}
                                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                                />
                                            </td>
                                            <td className='px-2'>
                                                <Form.Control
                                                    placeholder={!product.productName?.toLowerCase().includes("broken") ? `Fishes in the ${product.productName}` : `Weigh in Kg`}
                                                    type="number"
                                                    name="quantityUsedToPack"
                                                    value={dryData.products.find(p => p.id === product.id)?.quantityUsedToPack || ''}
                                                    min="0"
                                                    onChange={(e) => handleInputChange(e, product.id)}
                                                    onFocus={(e) => handleFocus(e, product.id)}
                                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                                />
                                            </td>
                                            <td><p className="text-muted py-2">
                                                ₦ {new Intl.NumberFormat().format(calculateSubtotal(product.id))}
                                            </p></td>
                                        </tr>
                                    ))}
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
                    <Row xxl={2} xl={2} lg={2} md={1}>
                        {/* Customer Name with Suggestions */}
                        <Col className="mb-4">
                            <Form.Group controlId="searchCustomer">
                                <Form.Label className="fw-semibold">Customer Name</Form.Label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search Name..."
                                        name="fullName"
                                        value={dryData.fullName || ''}
                                        onChange={handleSearchChange}
                                        style={{ width: '100%' }}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                                        required
                                    />
                                    {dryData.fullName && filteredCustomer.length > 0 && (
                                        <div className={`${styles.suggestions_box}`}>
                                            <ul>
                                                {filteredCustomer.map((customer, index) => (
                                                    <li
                                                        key={index}
                                                        onClick={() => handleSelectCustomer(customer)}
                                                        style={{ cursor: 'pointer', padding: '8px' }}
                                                    >
                                                        {customer.fullName} ({customer.category})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </Form.Group>
                        </Col>

                        {/* Discount Input */}
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Discount</Form.Label>
                            <div className={`${styles.inputContainer} position-relative`}>
                                <Form.Control
                                    placeholder="Enter discount"
                                    type="text"
                                    name="discount"
                                    value={dryData.category === 'Marketer' ? '10%' : dryData.discount || ''}
                                    onChange={(e) => setDryData({ ...dryData, discount: parseFloat(e.target.value) || 0 })}
                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                                    readOnly={dryData.category === 'Marketer'}
                                />
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
                                onChange={(e) => setDryData({ ...dryData, description: e.target.value })}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />
                        </Col>

                        {/* Payment Type */}
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Payment Type</Form.Label>
                            <Form.Select
                                name="paymentType"
                                value={dryData.paymentType || ''}
                                onChange={(e) => {
                                    const selectedPayment = e.target.value;
                                    setDryData((prev) => ({
                                        ...prev,
                                        paymentType: selectedPayment,
                                        amountPaid: selectedPayment === "Credit" ? '' : prev.amountPaid || calculateTotalBalance(),
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
                        {dryData.paymentType === 'Credit' && (
                            <Col className="mb-4">
                                <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
                                <Form.Control
                                    placeholder="Enter amount paid"
                                    type="text"
                                    name="amountPaid"
                                    value={dryData.amountPaid !== null && dryData.amountPaid !== '' ? new Intl.NumberFormat().format(dryData.amountPaid) : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/,/g, '');
                                        setDryData({ ...dryData, amountPaid: value ? parseFloat(value) : '' });
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
                                value={new Intl.NumberFormat().format(totalPrice)}
                                readOnly
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />
                        </Col>

                        {/* Total Balance (Readonly) */}
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
                    <div className="d-flex justify-content-between">
                        <Button
                            variant="secondary"
                            className={`border-0 btn btn-secondary shadow py-2 px-5 fs-6 mb-5 fw-semibold`}
                            onClick={() => setCurrentStep(1)}
                        >
                            Back
                        </Button>
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
            )}
            <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
        </div>
    );
};

export default SalesForm;
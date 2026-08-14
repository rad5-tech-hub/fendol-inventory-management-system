import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import Api from '../../shared/api/apiLink';
import styles from '../finance.module.scss';
import EmptyState from "../../shared/empty-state/EmptyState";
import ReceiptModal from './receipt';
import { useConfirm } from '../../shared/confirm-modal';

const SalesForm = ({ customers, stages, products, siteId, productTypes }) => {
    const activeSite = useSelector((store) => store.activeSite);
    const user = useSelector((store) => store.user);
    const userTypes = useSelector((store) => store.user?.userTypes || []);
    const isSuperAdmin = userTypes.includes('super_admin');
    const resolvedSiteId = siteId || (isSuperAdmin ? activeSite?.id : (user?.siteId || user?.userSites?.[0] || ''));
    const [dryData, setDryData] = useState({
        products: [],
        category: '',
        customerId: '',
        discount: 0,
        description: '',
        paymentType: '',
        fullName: '',
        amountPaid: null
    });
    const dryFishTypeId = productTypes.find(t => {
        const n = t.name?.toLowerCase() || '';
        return n === 'dry' || n.includes('dry fish') || n.includes('dry');
    })?.id;

    const [receiptData, setReceiptData] = useState({});
    const [showReceipt, setShowReceipt] = useState(false);
    const [checkedProducts, setCheckedProducts] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [loader, setLoader] = useState(false);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [balance, setBalance] = useState();
    const [ConfirmDialog, confirm] = useConfirm();    

    useEffect(() => {
        setCustomer(customers || []);
    }, [customers]);
    
    // Fetch customers
    const fetchCustomers = async () => {
        try {
            const response = await Api.get('/customers');
            if (Array.isArray(response.data.data)) {
                setCustomer(response.data.data);
            } else {
                throw new Error('Expected an array of customers');
            }
        } catch (err) {
            console.log(err.response?.data?.message || 'Failed to fetch customers.');
        }
    };

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
        if (dryData.paymentType === 'customer_balance' || dryData.paymentType === 'Credit') {
            setDryData((prev) => ({ ...prev, amountPaid: 0 }));
        }
        setTotalPrice(total);
    }, [dryData.products, checkedProducts, products,dryData.paymentType]);

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
                products: updatedProducts
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

        const filtered = value
            ? customer.filter(c => c.fullName?.toLowerCase().includes(value.toLowerCase()))
            : customer;
        setFilteredCustomer(filtered.length ? filtered : []);
    };

    const handleSelectCustomer = (selectedCustomer) => {
        setDryData(prevData => ({
            ...prevData,
            customerId: selectedCustomer.id,
            fullName: selectedCustomer.fullName,
            category: selectedCustomer.category,
            discount: 0
        }));
        setFilteredCustomer([]);
        setBalance(selectedCustomer.balance)
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
        const ok = await confirm({ message: "Are you sure you want to add this sale?", title: "Confirm Sale", variant: "primary" }); if (!ok) return;

        if (!dryFishTypeId) {
            toast.error("Product type 'Dry Fish' not configured. Contact admin.", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 6000,
                className: 'dark-toast'
            });
            setLoader(false);
            return;
        }
    
        setLoader(true);
        const salesToast = toast.loading("Adding sale...", { className: 'dark-toast' });
    
        try {
            const payload = {
                products: dryData.products
                    .filter(p => checkedProducts[p.id])
                    .map(p => ({
                        id: p.id,
                        quantityCount: p.quantity || 0,
                        quantityWeight: p.quantityUsedToPack || 0,
                        packCount: p.quantity || 0
                    })),
                customerId: dryData.customerId,
                paymentType: dryData.paymentType?.toLowerCase(),
                discount: dryData.category === 'Marketer' ? 0 : (Number(dryData.discount) || 0),
                description: dryData.description,
                amountPaid: dryData.amountPaid,
                salesCategoryId: dryFishTypeId,
                siteId: resolvedSiteId
            };
            const saleResponse = await Api.post('/sales', payload);
    
            if (saleResponse.status < 200 || saleResponse.status >= 300) {
                throw new Error(saleResponse.data?.message || "Sale failed!");
            }
    
            const transactionId = saleResponse.data.data?.transactionId;
            if (!transactionId) {
                throw new Error("Transaction ID not found. Please try again.");
            }
    
            // Update sales toast to success
            toast.update(salesToast, {
                render: "Sale added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast'
            });
    
            // Step 2: Fetch receipt with separate toast and error handling
            const receiptToast = toast.loading("Fetching receipt...", { className: 'dark-toast' });
            try {
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
            } catch (receiptError) {
                console.error("Error fetching receipt:", receiptError);
                toast.update(receiptToast, {
                    render: receiptError.message || "Failed to fetch receipt!",
                    type: "error",
                    isLoading: false,
                    autoClose: 6000,
                    className: 'dark-toast'
                });
            }
    
            // Reset form after successful sale
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
            fetchCustomers();
        } catch (error) {
            console.error("Error in handleAddSales:", error);
            const data = error.response?.data;
            const backendErrors = data?.errors;
            const errorMsg = backendErrors
                ? backendErrors.join('. ')
                : (data?.response_message || data?.error?.message || data?.message || error.response?.message || 'Sale failed!');
            toast.update(salesToast, {
                render: errorMsg,
                type: "error",
                isLoading: false,
                autoClose: 8000,
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
                        <DataTable
                            className={`bg-light px-2 ${styles.styled_table}`}
                            columns={[
                                { key: 'productName', label: 'PRODUCT', render: (val, row) => (
                                    <Form.Check
                                        type="checkbox"
                                        label={val}
                                        value={val}
                                        data-id={row.id}
                                        className="text-uppercase mt-2 fw-semibold"
                                        onChange={(e) => handleCheckChange(e, row.id)}
                                        checked={checkedProducts[row.id] || false}
                                    />
                                )},
                                { key: 'productWeight', label: 'PRODUCT WEIGHT', render: (val, row) => <p className='py-2'>{val}{row.unit}</p> },
                                { key: 'basePrice', label: 'PRICE', render: (val) => <p className='py-2'>₦ {new Intl.NumberFormat().format(val)}</p> },
                                { key: 'id', label: 'NUMBER OF PACKS', render: (val) => (
                                    <Form.Control
                                        placeholder="Enter number of packs"
                                        type="number"
                                        name="quantity"
                                        value={dryData.products.find(p => p.id === val)?.quantity || ''}
                                        required
                                        min={1}
                                        onChange={(e) => handleInputChange(e, val)}
                                        onFocus={(e) => handleFocus(e, val)}
                                        className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                    />
                                )},
                                { key: 'id', label: <>WEIGHT IN KG <br /> FOR BROKEN</>, render: (val, row) => (
                                    <div className='px-2'>
                                        <Form.Control
                                            placeholder={!row.productName?.toLowerCase().includes("broken") ? `Fishes in the ${row.productName}` : `Weigh in Kg`}
                                            type="number"
                                            name="quantityUsedToPack"
                                            value={dryData.products.find(p => p.id === val)?.quantityUsedToPack || ''}
                                            min="0"
                                            onChange={(e) => handleInputChange(e, val)}
                                            onFocus={(e) => handleFocus(e, val)}
                                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                        />
                                    </div>
                                )},
                                { key: 'id', label: 'SUBTOTAL', render: (val) => <p className="text-muted py-2">₦ {new Intl.NumberFormat().format(calculateSubtotal(val))}</p> },
                            ]}
                            data={products.filter(product => {
                                const lowerProductName = product.productName?.toLowerCase() || '';
                                return product.productName && !lowerProductName.includes('fresh') && !lowerProductName.includes('fingerlings');
                            })}
                        />
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
                    <EmptyState title="No Product yet" description="Add dry fish products to get started." />
                )
            )}
            {currentStep === 2 && (
                <Form onSubmit={handleAddSales}>
                    <Row xxl={2} xl={2} lg={2} md={1} sm={1} xs={1}>
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
                                    />{balance !== undefined && balance !== null && balance !== 0 && dryData.customerId ? <p className="p-2" style={{ color: balance < 0 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>Balance: ₦{Math.abs(balance).toLocaleString()} {balance < 0 ? '(Debit)' : '(Credit)'}</p> : ''}
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
                                required
                                onChange={(e) => setDryData({ ...dryData, description: e.target.value })}
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />                        
                        </Col>

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

                        {/* Payment Type */}
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Payment Type</Form.Label>
                            <CustomDropdown
                                name="paymentType"
                                value={dryData.paymentType || ''}
                                onChange={(val) => {
                                    setDryData((prev) => ({
                                        ...prev,
                                paymentType: val,
                                amountPaid: null,
                                    }));
                                }}
                                required
                                placeholder="Select Payment Type"
                                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                options={[
                                    { value: 'Cash', label: 'Cash' },
                                    { value: 'Credit', label: 'Credit' },
                                    { value: 'Transfer', label: 'Transfer' },
                                    { value: 'Pos', label: 'Pos' },
                                    ...(balance > 0 ? [{ value: 'customer_balance', label: 'Customer Balance' }] : []),
                                ]}
                            />
                        </Col>   
                        
                       {/* Amount Paid Input (Only for Non-Credit and Non-Customer Balance Payments) */}
                        {["customer_balance", "Credit"].includes(dryData.paymentType) ? null : (
                        <Col className="mb-4">
                            <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
                            <Form.Control
                            placeholder="Enter amount paid"
                            type="text"
                            name="amountPaid"
                            value={
                                dryData.amountPaid !== null && dryData.amountPaid !== ""
                                ? new Intl.NumberFormat().format(dryData.amountPaid)
                                : ""
                            }
                            onChange={(e) => {
                                const value = e.target.value.replace(/,/g, "");
                                setDryData({
                                ...dryData,
                                amountPaid: value ? parseFloat(value) : null,
                                });
                            }}
                            className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                            />
                        </Col>
                        )}                                      
                                                
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
            <ConfirmDialog />
        </div>
    );
};

export default SalesForm;
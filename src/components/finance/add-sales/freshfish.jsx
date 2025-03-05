import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button } from 'react-bootstrap';
import Api from '../../shared/api/apiLink';
import styles from '../finance.module.scss';
import ReceiptModal from './receipt';

const FreshForm = ({ customers, stages, products }) => {
  const [freshData, setFreshData] = useState({
    products: [{ id: '', quantity: 0, productWeight: '' }], // Moved productWeight inside products object
    description: '',
    category: '',
    fullName: '',
    customerId: '',
    discount: 0,
    salesCategory: '',
    amountPaid: null,
    batch_no: '',
    pondId: '',
    paymentType: '',
    basePrice: 0,
    totalPrice: 0,
    pondQuantity: '', // New state to store the selected pond's quantity
  });

  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [loader, setLoader] = useState(false);
  const [productList, setProductList] = useState([]);
  const [filteredCustomer, setFilteredCustomer] = useState([]);
  const [unit, setUnit] = useState('');
  const [stage, setStage] = useState([]);
  const [customer, setCustomer] = useState([]);

  useEffect(() => {
    setCustomer(customers);
    setStage(stages);
    setProductList(products);
  }, [customers, stages, products]);

  // Recalculate totalPrice whenever productWeight, basePrice, or discount changes
  useEffect(() => {
    const { products, basePrice } = freshData; // Removed discount from dependency and calculation
    const productWeight = typeof products[0]?.productWeight === 'string' ? parseFloat(products[0]?.productWeight) || 0 : products[0]?.productWeight || 0;
    const totalPrice = (basePrice || 0) * productWeight;
    setFreshData(prevData => ({
      ...prevData,
      totalPrice: Math.max(totalPrice, 0), // Ensure totalPrice is never negative
    }));
  }, [freshData.products, freshData.basePrice]);

  const handleProductSelect = (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const selectedProductId = selectedOption?.getAttribute('data-id');

    if (selectedProductId) {
      // Find the product directly from the products prop instead of fetching via API
      const product = productList.find(p => p.id === selectedProductId);
      if (product) {
        setUnit(product.unit || ''); // Use unit from products prop
        setFreshData(prevData => ({
          ...prevData,
          products: [{ id: selectedProductId, quantity: prevData.products[0]?.quantity || 0, productWeight: '' }],
          basePrice: product.basePrice || 0, // Use basePrice from products prop
        }));
      } else {
        toast.error('Product not found in the provided list.');
      }
    }
  };

  const handlePondSelect = (e) => {
    const selectedPondId = e.target.value;

    if (selectedPondId) {
      // Find the pond directly from the stages prop instead of fetching via API
      const pond = stage.find(s => s.id === selectedPondId);
      if (pond) {
        setFreshData(prevData => ({
          ...prevData,
          pondId: selectedPondId,
          pondQuantity: pond.quantity || '0', // Store and display the pond's quantity
          salesCategory: 'fresh-fish',
        }));
      } else {
        toast.error('Pond not found in the provided list.');
      }
    } else {
      setFreshData(prevData => ({
        ...prevData,
        pondId: '',
        pondQuantity: '', // Reset quantity if no pond is selected
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFreshData(prevData => {
      const numericFields = ['discount', 'quantity', 'amountPaid'];
      const numericValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;

      let newState = {
        ...prevData,
        [name]: numericValue,
        salesCategory: 'fresh-fish',
      };

      if (name === 'category' && prevData.category !== value) {
        const isFullNameValid = prevData.fullName && filteredCustomer.some(
          customer => customer.fullName === prevData.fullName && customer.category === value
        );
        newState = {
          ...newState,
          category: value,
          fullName: isFullNameValid ? prevData.fullName : '',
          customerId: isFullNameValid ? prevData.customerId : '',
        };
      }

      if (name === 'quantity') {
        newState.products = [
          { ...prevData.products[0], quantity: numericValue, productWeight: prevData.products[0]?.productWeight || '' },
        ];
      }

      if (name === 'productWeight') {
        newState.products = [
          { ...prevData.products[0], productWeight: value }, // Allow manual entry of productWeight as a string
        ];
      }

      return newState;
    });
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

  const handleSelectCustomer = (name) => {
    setFreshData(prevData => ({
      ...prevData,
      fullName: name.fullName,
      customerId: name.id,
    }));
    setFilteredCustomer([]);
  };

  const calculateDiscountedPrice = () => {
    let discountedPrice = freshData.totalPrice;
    if (freshData.category === 'Marketer') {
      discountedPrice -= freshData.totalPrice * 0.1; // 10% discount for Marketers
    } else {
      discountedPrice -= freshData.discount || 0; // Fixed discount
    }
    return discountedPrice;
  };

  const calculateTotalBalance = () => {
    const discountedPrice = calculateDiscountedPrice(); // Apply discount here instead of in totalPrice
    if (freshData.paymentType === 'Credit') {
      return discountedPrice - (freshData.amountPaid || 0);
    }
    return discountedPrice;
  };

  const handleAddSales = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to add this sale?')) return;

    setLoader(true);
    const salesToast = toast.loading('Adding sale...', { className: 'dark-toast' });

    try {
      const saleResponse = await Api.post('/sales', freshData);
      if (saleResponse.status < 200 || saleResponse.status >= 300) {
        throw new Error(saleResponse.data?.message || 'Sale failed!');
      }

      const transactionId = saleResponse.data.data?.transactionId;

      if (!transactionId) {
        toast.update(salesToast, {
          render: 'Transaction ID not found. Please try again.',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast',
        });
        setLoader(false);
        return;
      }

      toast.update(salesToast, {
        render: 'Sale added successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });

      const receiptToast = toast.loading('Fetching receipt...', { className: 'dark-toast' });
      const receiptResponse = await Api.get(`/sales-receipts/${transactionId}`);
      if (receiptResponse.status < 200 || receiptResponse.status >= 300) {
        throw new Error('Receipt could not be fetched.');
      }

      setReceiptData(receiptResponse);
      toast.update(receiptToast, {
        render: 'Receipt fetched successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast',
      });

      setShowReceipt(true);

      setFreshData({
        products: [{ id: '', quantity: 0, productWeight: '' }], // Reset productWeight inside products
        description: '',
        category: '',
        fullName: '',
        customerId: '',
        discount: 0,
        salesCategory: '',
        amountPaid: null,
        batch_no: '',
        pondId: '',
        paymentType: '',
        basePrice: 0,
        totalPrice: 0,
        pondQuantity: '', // Reset pond quantity
      });
    } catch (error) {
      console.error('Error in handleAddSales:', error);
      toast.update(salesToast, {
        render: error.response?.data?.message || error.message || 'Sale failed!',
        type: 'error',
        isLoading: false,
        autoClose: 6000,
        className: 'dark-toast',
      });
      toast.dismiss();
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      <Form onSubmit={handleAddSales}>
        <Row xxl={2} xl={2} lg={2}>

          {/* Pond (No API call, use products prop directly) */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Pond From</Form.Label>
            <Form.Select
              name="pondId"
              required
              value={freshData.pondId || ""}
              onChange={handlePondSelect}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>Select Pond</option>
              {stages
                .filter(stage => !stage.title?.toLowerCase().includes("fingerling")) // Filters out "fingerling" in title
                .map((stage, index) => (
                  <option key={index} value={stage.id}>
                    {stage.title || "No Data Yet"} {freshData.pondId === stage.id ? `- (${stage.quantity || "0"})` : ""}
                  </option>
                ))}
            </Form.Select>
          </Col>
          
          {/* Product (No API call, use products prop directly) */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Product</Form.Label>
            <Form.Select
              name="id"
              required
              value={freshData.products[0]?.id || ''}
              onChange={handleProductSelect}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>Select Fresh Fish Products</option>
              {products
                .filter(product => product.productName?.toLowerCase().includes('fresh'))
                .map((product) => (
                  <option key={product.id} value={product.id} data-id={product.id}>
                    {`${product.productName} - (₦${new Intl.NumberFormat().format(product.basePrice || 0)} for ${product.productWeight || '0'} ${product.unit || ''})`}
                  </option>
                ))}
            </Form.Select>
          </Col>

          {/* Total Product Weight (Visible but empty when product is selected) */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Total Product Weight {`(${unit})`}</Form.Label>
            <Form.Control
              placeholder="Enter product weight"
              type="number"
              name="productWeight"
              value={freshData.products[0]?.productWeight || ''} // Access productWeight from products[0]
              onChange={handleInputChange}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            />
          </Col>

          {/* Quantity */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Quantity Of Fresh Fish</Form.Label>
            <Form.Control
              placeholder="Enter quantity"
              type="number"
              name="quantity"
              value={freshData.products[0]?.quantity || ''}
              required
              onChange={handleInputChange}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
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
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
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
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                />
                {freshData.fullName && filteredCustomer.length > 0 && (
                  <div className={`${styles.suggestions_box}`}>
                    <ul>
                      {filteredCustomer.map((customer, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelectCustomer(customer)}
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

          {/* Description */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Description</Form.Label>
            <Form.Control
              placeholder="Enter description"
              as="textarea"
              name="description"
              value={freshData.description || ''}
              onChange={handleInputChange}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
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
                value={freshData.category === 'Marketer' ? '10%' : freshData.discount || ''}
                onChange={(e) => setFreshData({ ...freshData, discount: parseFloat(e.target.value) || 0 })}
                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                readOnly={freshData.category === 'Marketer'}
              />
            </div>
          </Col>

          {/* Payment Type */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Payment Type</Form.Label>
            <Form.Select
              name="paymentType"
              value={freshData.paymentType || ''}
              onChange={(e) => {
                const selectedPayment = e.target.value;
                setFreshData(prev => ({
                  ...prev,
                  paymentType: selectedPayment,
                  amountPaid: selectedPayment === 'Credit' ? '' : prev.amountPaid || calculateTotalBalance(),
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

          {/* Amount Paid Input (Only for Credit Payment, empty on Credit selection) */}
          {(freshData.paymentType === 'Credit') && (
            <Col className="mb-4">
              <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
              <Form.Control
                placeholder="Enter amount paid"
                type="text"
                name="amountPaid"
                value={freshData.amountPaid !== null && freshData.amountPaid !== '' ? new Intl.NumberFormat().format(freshData.amountPaid) : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  setFreshData({ ...freshData, amountPaid: value ? parseFloat(value) : '' });
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

      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
    </div>
  );
};

export default FreshForm;
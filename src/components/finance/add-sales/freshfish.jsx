import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Form, Row, Col, Button } from 'react-bootstrap';
import Api from '../../shared/api/apiLink'; // Adjust based on your API import path
import styles from '../finance.module.scss'; // Adjust the import as needed
import ReceiptModal from './receipt';

const FreshForm = ({ customers, stages, products }) => {
  const [freshData, setFreshData] = useState({
    products: [{ id: '', quantity: 0 }],
    productWeight: 0,
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
  });

  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [loader, setLoader] = useState(false);
  const [productList, setProductList] = useState([]);
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
    setProductList(products);
  }, [customers, stages, products]);

  // Recalculate totalPrice whenever products.quantity, basePrice, or discount changes
  useEffect(() => {
    const { products, basePrice, discount } = freshData;
    const quantity = products[0]?.quantity || 0; // Assuming single product for now
    const totalPrice = (basePrice || 0) * quantity - (discount || 0);
    setFreshData(prevData => ({
      ...prevData,
      totalPrice: Math.max(totalPrice, 0),
    }));
  }, [freshData.products, freshData.basePrice, freshData.discount]);

  // Product selection handler
  const handleProductSelect = async (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const selectedProductId = selectedOption?.getAttribute('data-id');

    if (selectedProductId) {
      try {
        const { data } = await Api.get(`/product/${selectedProductId}`);
        const productData = data.data;
        setUnit(productData.unit);

        setFreshData(prevData => ({
          ...prevData,
          products: [{ id: selectedProductId, quantity: prevData.products[0]?.quantity || 0 }],
          basePrice: productData.basePrice || 0,
          productWeight: productData.productWeight || 0,
        }));

        setProductDetails(productData);
      } catch (error) {
        toast.error('Error fetching product details.');
      }
    }
  };

  // Handle input change for freshData
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFreshData(prevData => {
      const numericFields = ['productWeight', 'discount', 'quantity', 'amountPaid'];
      const numericValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;

      let newState = { 
        ...prevData, 
        [name]: numericValue, 
        salesCategory: 'fresh-fish',
      };

      // If category changes, check if fullName still belongs to the new category
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

      // Handle quantity inside products
      if (name === 'quantity') {
        newState.products = [
          { ...prevData.products[0], quantity: numericValue },
        ];
      }

      // Handle pondId separately to trigger getQuantity
      if (name === 'pondId') {
        newState.pondId = value;
        getQuantity(value);
      }

      return newState;
    });
  };

  // Get batches available
  const getQuantity = async (pondId) => {
    setSelectedQuantity('loading...');
    if (pondId) {
      try {
        const response = await Api.get(`/active-batch?stageId=${pondId}`);
        setFishType(response.data.data);
        setSelectedQuantity('');
      } catch (error) {
        console.error('Failed to fetch quantity:', error);
        setSelectedQuantity('Error getting quantity or empty pond');
      }
    } else {
      console.error('Stage ID from is required.');
      setSelectedQuantity('Stage ID is required');
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
    const discountedPrice = calculateDiscountedPrice();
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

    // Extract transactionId from response data
     const transactionId = saleResponse.data.data?.transactionId;
    
      console.log(transactionId);
      
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
        products: [{ id: '', quantity: 0 }],
        productWeight: 0,
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
          {/* Stage From */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Pond From</Form.Label>
            <Form.Select
              name="pondId"
              required
              value={freshData.pondId || ''}
              onChange={handleInputChange}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>Select Pond</option>
              {stages
                .filter(stage => stage.title !== 'Fingerlings')
                .map((stage, index) => (
                  <option key={index} value={stage.id}>
                    {stage.title || 'No Data Yet'} {freshData.pondId === stage.id ? `- (${stage.quantity || '0'})` : ''}
                  </option>
                ))}
            </Form.Select>
          </Col>

          {/* Product */}
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
                    {`${product.productName} - (₦${new Intl.NumberFormat().format(product.basePrice || 0)})`}
                  </option>
                ))}
            </Form.Select>
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

          {/* Total Product Weight */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Total Product Weight {`(${unit})`}</Form.Label>
            <Form.Control
              placeholder="Enter product weight"
              type="number"
              name="productWeight"
              value={freshData.productWeight || ''}
              readOnly
              onChange={handleInputChange}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            />
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
                  amountPaid: selectedPayment !== 'Credit' ? calculateTotalBalance() : prev.amountPaid,
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
          {freshData.paymentType === 'Credit' && (
            <Col className="mb-4">
              <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
              <Form.Control
                placeholder="Enter amount paid"
                type="text"
                name="amountPaid"
                value={freshData.amountPaid ? new Intl.NumberFormat().format(freshData.amountPaid) : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  setFreshData({ ...freshData, amountPaid: parseFloat(value) || 0 });
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

      {/* Receipt Modal */}
      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
    </div>
  );
};

export default FreshForm;
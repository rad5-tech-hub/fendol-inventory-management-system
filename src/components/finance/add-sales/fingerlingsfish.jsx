import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import Api from "../../shared/api/apiLink";
import styles from "../finance.module.scss";
import ReceiptModal from "./receipt";
import { useConfirm } from '../../shared/confirm-modal';

const FingerlingsForm = ({ customers, stages, products, siteId, productTypes }) => {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const resolvedSiteId = siteId || (isSuperAdmin ? activeSite?.id : user?.siteId);
  const [fingerlingsData, setFingerlingsData] = useState({
    products: [{ id: "", quantity: 0 }],
    category: "",
    fullName: "",
    customerId: "",
    description: "",
    discount: 0,
    pondId: "",
    paymentType: "",
    amountPaid: null,
    basePrice: 0,
    totalPrice: 0,
  });
  const fingerlingsTypeId = productTypes.find(t => {
      const n = t.name?.toLowerCase() || '';
      return n === 'fingerlings' || n.includes('fingerlings');
  })?.id;

  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [loader, setLoader] = useState(false);
  const [productList, setProductList] = useState([]);
  const [balance, setBalance] = useState();
  const [filteredCustomer, setFilteredCustomer] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [unit, setUnit] = useState("");
  const [stage, setStage] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [pondSearch, setPondSearch] = useState("");
  const [filteredPonds, setFilteredPonds] = useState([]);
  const [showPondDropdown, setShowPondDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm();

  // Initialize data from props
  useEffect(() => {
    console.log("Stages prop received:", stages); // Debug: Check incoming stages data
    const validStages = Array.isArray(stages) ? stages : [];
    setCustomer(customers || []);
    setStage(validStages); // Ensure stage is always an array
    setProductList(products || []);
    setFilteredPonds(validStages); // Initialize filteredPonds with stages
  }, [customers, stages, products]);

  // Recalculate totalPrice when quantity or basePrice changes
  useEffect(() => {
    const { products, basePrice } = fingerlingsData;
    const quantity = products[0]?.quantity || 0;
    const totalPrice = (basePrice || 0) * quantity;
    setFingerlingsData((prevData) => ({
      ...prevData,
      totalPrice: Math.max(totalPrice, 0),
    }));
    if (fingerlingsData.paymentType === "customer_balance" || fingerlingsData.paymentType === "Credit") {
      setFingerlingsData((prev) => ({ ...prev, amountPaid: 0 }));
    }
  }, [fingerlingsData.products, fingerlingsData.basePrice, fingerlingsData.paymentType]);

  // Handle product selection
  const handleProductSelect = async (selectedProductId) => {

    if (selectedProductId) {
      try {
        const { data } = await Api.get(`/product/${selectedProductId}`);
        const productData = data.data;
        setUnit(productData.unit || "");
        setFingerlingsData((prevData) => ({
          ...prevData,
          products: [{ id: selectedProductId, quantity: prevData.products[0]?.quantity || 0 }],
          basePrice: productData.basePrice || 0,
        }));
        setProductDetails(productData);
      } catch (error) {
        toast.error("Error fetching product details.");
      }
    }
  };

  const handlePondSearchChange = (e) => {
    const searchTerm = e.target.value;
    setPondSearch(searchTerm);
    const filtered = searchTerm
      ? stage.filter(
          (s) =>
            (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
            (parseFloat(s.quantity || 0) >= 1)
        )
      : stage.filter((s) => parseFloat(s.quantity || 0) >= 1);
    setFilteredPonds(filtered);
    setShowPondDropdown(true);
  };

  const handlePondSelect = (pond) => {
    if (pond && (parseFloat(pond.quantity || 0) >= 0)) {
      setFingerlingsData((prevData) => ({
        ...prevData,
        pondId: pond.id,
      }));
      const displayText = `${pond.title || "No Data Yet"} - (${pond.quantity !== undefined ? Number(pond.quantity).toLocaleString() : "0"})`;
      setPondSearch(displayText);
      setShowPondDropdown(false);
    } else {
      console.log("Pond not selected: Quantity less than 0 or invalid pond", pond);
    }
  };

  // Handle customer search input change
  const handleCustomerSearchChange = (e) => {
    const searchTerm = e.target.value;
    setCustomerSearch(searchTerm);
    setFingerlingsData((prevData) => ({ ...prevData, fullName: searchTerm }));

    const filtered = searchTerm
      ? customer.filter((c) => (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()))
      : customer;
    setFilteredCustomer(filtered);
    setShowCustomerDropdown(true);
  };

  // Handle customer selection
  const handleSelectCustomer = (selectedCustomer) => {
    const discount = selectedCustomer.category === "Marketer" ? 10 : 0;
    setFingerlingsData((prevData) => ({
      ...prevData,
      customerId: selectedCustomer.id,
      fullName: selectedCustomer.fullName,
      category: selectedCustomer.category,
      discount: discount,
    }));
    setBalance(selectedCustomer.balance);
    setCustomerSearch(`${selectedCustomer.fullName}`);
    setShowCustomerDropdown(false);
    setFilteredCustomer([]);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFingerlingsData((prevData) => {
      const numericFields = ["discount", "amountPaid", "quantity"];
      const updatedValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;

      let updatedData = {
        ...prevData,
        [name]: updatedValue,
      };

      if (name === "quantity") {
        updatedData.products = [{ ...prevData.products[0], quantity: updatedValue }];
      }

      return updatedData;
    });
  };

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    let discountedPrice = fingerlingsData.totalPrice;
    if (fingerlingsData.category === "Marketer") {
      discountedPrice -= fingerlingsData.totalPrice * 0.1; // 10% discount for Marketers
    } else if (fingerlingsData.discount > 0) {
      discountedPrice -= fingerlingsData.discount; // Fixed discount for Customers
    }
    return Math.max(discountedPrice, 0);
  };

  // Calculate total balance
  const calculateTotalBalance = () => {
    const discountedPrice = calculateDiscountedPrice();
    return discountedPrice - (fingerlingsData.amountPaid || 0);
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await Api.get("/customers");
      if (Array.isArray(response.data.data)) {
        setCustomer(response.data.data);
      } else {
        throw new Error("Expected an array of customers");
      }
    } catch (err) {
      console.log(err.response?.data?.message || "Failed to fetch customers.");
    }
  };

  // Handle form submission with separate toasts for sales and receipt
  const handleAddSales = async (e) => {
    e.preventDefault();
    const ok = await confirm({ message: "Are you sure you want to add this sale?", title: "Confirm Sale", variant: "primary" }); if (!ok) return;

    if (!fingerlingsTypeId) {
      toast.error("Product type 'Fingerlings' not configured. Contact admin.", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 6000,
          className: 'dark-toast'
      });
      setLoader(false);
      return;
    }

    setLoader(true);
    const salesToast = toast.loading("Adding sale...", { className: "dark-toast" });

    try {
      const payload = {
        products: [{
          id: fingerlingsData.products[0]?.id,
          quantityCount: fingerlingsData.products[0]?.quantity || 0,
          packCount: 0
        }],
        customerId: fingerlingsData.customerId,
        paymentType: fingerlingsData.paymentType?.toLowerCase(),
        discount: fingerlingsData.discount || 0,
        description: fingerlingsData.description,
        amountPaid: fingerlingsData.amountPaid,
        salesCategoryId: fingerlingsTypeId,
        pondId: fingerlingsData.pondId || undefined,
        siteId: resolvedSiteId
      };
      const saleResponse = await Api.post("/sales", payload);
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
        className: "dark-toast",
      });

      // Step 2: Fetch receipt with separate toast and error handling
      const receiptToast = toast.loading("Fetching receipt...", { className: "dark-toast" });
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
          className: "dark-toast",
        });
        setShowReceipt(true);
      } catch (receiptError) {
        console.error("Error fetching receipt:", receiptError);
        toast.update(receiptToast, {
          render: receiptError.message || "Failed to fetch receipt!",
          type: "error",
          isLoading: false,
          autoClose: 6000,
          className: "dark-toast",
        });
      }

      // Reset form after successful sale
      setFingerlingsData({
        products: [{ id: "", quantity: 0 }],
        category: "",
        fullName: "",
        customerId: "",
        description: "",
        discount: 0,
        pondId: "",
        paymentType: "",
        amountPaid: null,
        basePrice: 0,
        totalPrice: 0,
      });
      setPondSearch("");
      setCustomerSearch("");
      setFilteredPonds(stage);
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
        className: "dark-toast",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      <Form onSubmit={handleAddSales}>
        <Row xxl={2} xl={2} lg={2} md={1} sm={1} xs={1}>
          {/* Searchable Pond Input */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Pond From</Form.Label>
            <div style={{ position: "relative" }}>
              <Form.Control
                type="text"
                placeholder="Search Pond..."
                value={pondSearch}
                onChange={handlePondSearchChange}
                onFocus={() => setShowPondDropdown(true)}
                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              />
              {showPondDropdown && (
                <div className={`${styles.suggestions_box}`} style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {filteredPonds.length > 0 ? (
                      filteredPonds.map((pond, index) => (
                        <li
                          key={index}
                          onClick={() => handlePondSelect(pond)}
                          style={{ cursor: "pointer", padding: "8px", borderBottom: "1px solid #ddd" }}
                        >
                          {pond.title || "No Data Yet"} - (
                          {pond.quantity !== undefined ? Number(pond.quantity).toLocaleString() : "0"})
                        </li>
                      ))
                    ) : (
                      <li style={{ padding: "8px" }}>
                        {stage.length === 0 ? "Loading ponds..." : "No ponds found"}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Col>

          {/* Product Selection */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Product</Form.Label>
            <CustomDropdown
              name="id"
              required
              value={fingerlingsData.products[0]?.id || ""}
              onChange={handleProductSelect}
              placeholder="Select Fingerlings Product"
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              options={[
                { value: '', label: 'Select Fingerlings Product' },
                ...products.map(product => ({
                  value: product.id,
                  label: `${product.productName} - (₦${new Intl.NumberFormat().format(
                    product.basePrice || 0
                  )} for ${product.productWeight || "0"} ${product.unit || ""})`
                }))
              ]}
            />
          </Col>

          {/* Quantity */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Quantity</Form.Label>
            <Form.Control
              placeholder="Enter quantity"
              type="number"
              name="quantity"
              value={fingerlingsData.products[0]?.quantity || ""}
              min="0"
              required
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
              value={fingerlingsData.description || ""}
              required
              onChange={handleInputChange}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            />
          </Col>

          {/* Searchable Customer Input */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Customer Name</Form.Label>
            <div style={{ position: "relative" }}>
              <Form.Control
                type="text"
                placeholder="Search Customer..."
                value={customerSearch}
                onChange={handleCustomerSearchChange}
                onFocus={() => setShowCustomerDropdown(true)}
                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                required
              />
              {balance && balance > 0 && fingerlingsData.customerId ? (
                <p className="p-2">Balance: ₦{balance.toLocaleString()}</p>
              ) : (
                ""
              )}
              {showCustomerDropdown && filteredCustomer.length > 0 && (
                <div className={`${styles.suggestions_box}`} style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <ul style={{ listStyle: "none" }}>
                    {filteredCustomer.map((customer, index) => (
                      <li
                        key={index}
                        onClick={() => handleSelectCustomer(customer)}
                        style={{ cursor: "pointer", padding: "8px" }}
                      >
                        {customer.fullName} ({customer.category})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Col>

          {/* Discount */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Discount</Form.Label>
            <Form.Control
              placeholder="Enter discount"
              type="text"
              name="discount"
              value={fingerlingsData.category === "Marketer" ? "10%" : fingerlingsData.discount || ""}
              onChange={(e) =>
                setFingerlingsData({ ...fingerlingsData, discount: parseFloat(e.target.value) || 0 })
              }
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
              readOnly={fingerlingsData.category === "Marketer"}
            />
          </Col>

          {/* Total Price (Readonly) */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Total Price (₦)</Form.Label>
            <Form.Control
              placeholder="Total price"
              type="text"
              name="totalPrice"
              value={
                fingerlingsData.totalPrice ? `₦${new Intl.NumberFormat().format(fingerlingsData.totalPrice)}` : ""
              }
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
              value={fingerlingsData.paymentType || ""}
              onChange={(val) => {
                setFingerlingsData((prev) => ({
                  ...prev,
                  paymentType: val,
                  amountPaid: "",
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
          {["customer_balance", "Credit"].includes(fingerlingsData.paymentType) ? (
            ""
          ) : (
            <Col className="mb-4">
              <Form.Label className="fw-semibold">Amount Paid (₦)</Form.Label>
              <Form.Control
                placeholder="Enter amount paid"
                type="text"
                name="amountPaid"
                value={
                  fingerlingsData.amountPaid !== null && fingerlingsData.amountPaid !== ""
                    ? new Intl.NumberFormat().format(fingerlingsData.amountPaid)
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, "");
                  setFingerlingsData({
                    ...fingerlingsData,
                    amountPaid: value ? parseFloat(value) : "",
                  });
                }}
                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              />
            </Col>
          )}
        </Row>
        <div className="text-end">
          <Button
            variant="dark"
            disabled={loader}
            className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
            type="submit"
          >
            {loader ? "Adding Sale..." : "Add Sale"}
          </Button>
        </div>
      </Form>
      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
      <ConfirmDialog />
    </div>
  );
};

export default FingerlingsForm;
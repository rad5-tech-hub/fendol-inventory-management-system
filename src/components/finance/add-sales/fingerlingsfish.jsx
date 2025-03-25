import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Form, Row, Col, Button } from "react-bootstrap";
import Api from "../../shared/api/apiLink";
import styles from "../finance.module.scss";
import ReceiptModal from "./receipt";

const FingerlingsForm = ({ customers, stages, products }) => {
  const [fingerlingsData, setFingerlingsData] = useState({
    products: [{ id: "", quantity: 0 }],
    category: "",
    fullName: "",
    customerId: "",
    description: "",
    discount: 0,
    salesCategory: "",
    pondId: "",
    paymentType: "",
    amountPaid: null,
    basePrice: 0,
    totalPrice: 0,
  });

  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [loader, setLoader] = useState(false);
  const [productList, setProductList] = useState([]);
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

  // Initialize data from props
  useEffect(() => {
    console.log('Stages prop received:', stages); // Debug: Check incoming stages data
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
  }, [fingerlingsData.products, fingerlingsData.basePrice]);

  // Handle product selection
  const handleProductSelect = async (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const selectedProductId = selectedOption?.getAttribute("data-id");

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

  // Handle pond search input change
  const handlePondSearchChange = (e) => {
    const searchTerm = e.target.value;
    setPondSearch(searchTerm);
    const filtered = searchTerm
      ? stage.filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()))
      : stage;
    setFilteredPonds(filtered);
    setShowPondDropdown(true);
    console.log('Filtered ponds:', filtered); // Debug: Check filtered ponds with quantities
  };

  // Handle pond selection
  const handlePondSelect = (pond) => {
    if (pond) {
      setFingerlingsData((prevData) => ({
        ...prevData,
        pondId: pond.id,
        salesCategory: "fingerlings",
      }));
      const displayText = `${pond.title || "No Data Yet"} - (${pond.quantity !== undefined ? pond.quantity : "0"})`;
      setPondSearch(displayText);
      setShowPondDropdown(false);
      console.log('Selected pond:', pond); // Debug: Check selected pond data
    }
  };

  // Handle customer search input change
  const handleCustomerSearchChange = (e) => {
    const searchTerm = e.target.value;
    setCustomerSearch(searchTerm);
    setFingerlingsData((prevData) => ({ ...prevData, fullName: searchTerm }));

    const filtered = searchTerm
      ? customer.filter((c) => c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
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
        salesCategory: "fingerlings",
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

  // Handle form submission
  const handleAddSales = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to add this sale?")) return;

    setLoader(true);
    const salesToast = toast.loading("Adding sale...", { className: "dark-toast" });

    try {
      const saleResponse = await Api.post("/sales", fingerlingsData);
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
          className: "dark-toast",
        });
        setLoader(false);
        return;
      }

      toast.update(salesToast, {
        render: "Sale added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: "dark-toast",
      });

      const receiptToast = toast.loading("Fetching receipt...", { className: "dark-toast" });
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

      setFingerlingsData({
        products: [{ id: "", quantity: 0 }],
        category: "",
        fullName: "",
        customerId: "",
        description: "",
        discount: 0,
        salesCategory: "",
        pondId: "",
        paymentType: "",
        amountPaid: null,
        basePrice: 0,
        totalPrice: 0,
      });
      setPondSearch("");
      setCustomerSearch("");
      setFilteredPonds(stage);
    } catch (error) {
      console.error("Error in handleAddSales:", error);
      toast.update(salesToast, {
        render: error.response?.data?.message || error.message || "Sale failed!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
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
                          {pond.title || "No Data Yet"} - ({pond.quantity !== undefined ? pond.quantity : "0"})
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
            <Form.Select
              name="id"
              required
              value={fingerlingsData.products[0]?.id || ""}
              onChange={handleProductSelect}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>
                Select Fingerlings Product
              </option>
              {products
                .filter((product) => product.productName?.toLowerCase().includes("fingerlings"))
                .map((product) => (
                  <option key={product.id} value={product.id} data-id={product.id}>
                    {`${product.productName} - (₦${new Intl.NumberFormat().format(product.basePrice || 0)} for ${
                      product.productWeight || "0"
                    } ${product.unit || ""})`}
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
              onChange={(e) => setFingerlingsData({ ...fingerlingsData, discount: parseFloat(e.target.value) || 0 })}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
              readOnly={fingerlingsData.category === "Marketer"}
            />
          </Col>

          {/* Payment Type */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Payment Type</Form.Label>
            <Form.Select
              name="paymentType"
              value={fingerlingsData.paymentType || ""}
              onChange={(e) => {
                const selectedPayment = e.target.value;
                setFingerlingsData((prev) => ({
                  ...prev,
                  paymentType: selectedPayment,
                  amountPaid: "",
                }));
              }}
              required
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>
                Select Payment Type
              </option>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
              <option value="Transfer">Transfer</option>
              <option value="Pos">Pos</option>
            </Form.Select>
          </Col>

          {/* Amount Paid Input (Only for Credit Payment) */}
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
                  setFingerlingsData({ ...fingerlingsData, amountPaid: value ? parseFloat(value) : "" });
                }}
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
              value={fingerlingsData.totalPrice ? `₦${new Intl.NumberFormat().format(fingerlingsData.totalPrice)}` : ""}
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
    </div>
  );
};

export default FingerlingsForm;
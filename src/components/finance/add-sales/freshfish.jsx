import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Form, Row, Col, Button } from "react-bootstrap";
import Api from "../../shared/api/apiLink";
import styles from "../finance.module.scss";
import ReceiptModal from "./receipt";

const FreshForm = ({ customers, stages, products }) => {
  const [freshData, setFreshData] = useState({
    products: [{ id: "", quantity: 0, productWeight: "" }],
    description: "",
    category: "", // Will be set from selected customer
    fullName: "",
    customerId: "",
    discount: 0,
    salesCategory: "",
    amountPaid: null,
    batch_no: "",
    pondId: "",
    paymentType: "",
    basePrice: 0,
    totalPrice: 0,
    pondQuantity: "",
  });

  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [loader, setLoader] = useState(false);
  const [productList, setProductList] = useState([]);
  const [filteredCustomer, setFilteredCustomer] = useState([]);
  const [unit, setUnit] = useState("");
  const [stage, setStage] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [pondSearch, setPondSearch] = useState("");
  const [filteredPonds, setFilteredPonds] = useState([]);
  const [showPondDropdown, setShowPondDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState(""); // New state for customer search
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false); // Toggle customer dropdown

  useEffect(() => {
    setCustomer(customers);
    setStage(stages);
    setProductList(products);
    setFilteredPonds(stages);
  }, [customers, stages, products]);

  // Recalculate totalPrice whenever productWeight or basePrice changes
  useEffect(() => {
    const { products, basePrice } = freshData;
    const productWeight =
      typeof products[0]?.productWeight === "string"
        ? parseFloat(products[0]?.productWeight) || 0
        : products[0]?.productWeight || 0;
    const totalPrice = (basePrice || 0) * productWeight;
    setFreshData((prevData) => ({
      ...prevData,
      totalPrice: Math.max(totalPrice, 0),
    }));
  }, [freshData.products, freshData.basePrice]);

  const handleProductSelect = (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const selectedProductId = selectedOption?.getAttribute("data-id");

    if (selectedProductId) {
      const product = productList.find((p) => p.id === selectedProductId);
      if (product) {
        setUnit(product.unit || "");
        setFreshData((prevData) => ({
          ...prevData,
          products: [{ id: selectedProductId, quantity: prevData.products[0]?.quantity || 0, productWeight: "" }],
          basePrice: product.basePrice || 0,
        }));
      } else {
        toast.error("Product not found in the provided list.");
      }
    }
  };

  const handlePondSearchChange = (e) => {
    const searchTerm = e.target.value;
    setPondSearch(searchTerm);
    const filtered = searchTerm
      ? stage.filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()))
      : stage;
    setFilteredPonds(filtered);
    setShowPondDropdown(true);
  };

  const handlePondSelect = (pond) => {
    if (pond) {
      setFreshData((prevData) => ({
        ...prevData,
        pondId: pond.id,
        pondQuantity: pond.quantity || "0",
        salesCategory: "fresh-fish",
      }));
      setPondSearch(`${pond.title || "No Data Yet"} - (${pond.quantity || "0"})`);
      setShowPondDropdown(false);
    }
  };

  const handleCustomerSearchChange = (e) => {
    const searchTerm = e.target.value;
    setCustomerSearch(searchTerm);
    setFreshData((prevData) => ({ ...prevData, fullName: searchTerm }));

    const filtered = searchTerm
      ? customer.filter((c) => c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
      : customer;
    setFilteredCustomer(filtered);
    setShowCustomerDropdown(true);
  };

  const handleSelectCustomer = (selectedCustomer) => {
    const discount = selectedCustomer.category === "Marketer" ? 10 : 0; // 10% for Marketer, 0 for Customer
    setFreshData((prevData) => ({
      ...prevData,
      fullName: selectedCustomer.fullName,
      customerId: selectedCustomer.id,
      category: selectedCustomer.category,
      discount: discount,
    }));
    setCustomerSearch(`${selectedCustomer.fullName}`);
    setShowCustomerDropdown(false);
    setFilteredCustomer([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFreshData((prevData) => {
      const numericFields = ["discount", "quantity", "amountPaid"];
      const numericValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;

      let newState = {
        ...prevData,
        [name]: numericValue,
        salesCategory: "fresh-fish",
      };

      if (name === "quantity") {
        newState.products = [
          { ...prevData.products[0], quantity: numericValue, productWeight: prevData.products[0]?.productWeight || "" },
        ];
      }

      if (name === "productWeight") {
        newState.products = [{ ...prevData.products[0], productWeight: value }];
      }

      return newState;
    });
  };

  const calculateDiscountedPrice = () => {
    let discountedPrice = freshData.totalPrice;
    if (freshData.category === "Marketer") {
      discountedPrice -= freshData.totalPrice * 0.1; // 10% discount for Marketers
    } else if (freshData.discount > 0) {
      discountedPrice -= freshData.discount; // Fixed discount for Customers
    }
    return Math.max(discountedPrice, 0);
  };

  const calculateTotalBalance = () => {
    const discountedPrice = calculateDiscountedPrice();
    return discountedPrice - (freshData.amountPaid || 0);
  };

  const handleAddSales = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to add this sale?")) return;

    setLoader(true);
    const salesToast = toast.loading("Adding sale...", { className: "dark-toast" });

    try {
      const saleResponse = await Api.post("/sales", freshData);
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

      setFreshData({
        products: [{ id: "", quantity: 0, productWeight: "" }],
        description: "",
        category: "",
        fullName: "",
        customerId: "",
        discount: 0,
        salesCategory: "",
        amountPaid: null,
        batch_no: "",
        pondId: "",
        paymentType: "",
        basePrice: 0,
        totalPrice: 0,
        pondQuantity: "",
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
        autoClose: 6000,
        className: "dark-toast",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      <Form onSubmit={handleAddSales}>
        <Row xxl={2} xl={2} lg={2} md={1}>
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
                  <ul style={{ listStyle: "none" }}>
                    {filteredPonds.length > 0 ? (
                      filteredPonds.map((pond, index) => (
                        <li
                          key={index}
                          onClick={() => handlePondSelect(pond)}
                          style={{ cursor: "pointer", padding: "8px" }}
                        >
                          {pond.title || "No Data Yet"} - ({pond.quantity || "0"})
                        </li>
                      ))
                    ) : (
                      <li style={{ padding: "8px" }}>No ponds found</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Col>

          {/* Product */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Product</Form.Label>
            <Form.Select
              name="id"
              required
              value={freshData.products[0]?.id || ""}
              onChange={handleProductSelect}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>
                Select Fresh Fish Products
              </option>
              {products
                .filter((product) => product.productName?.toLowerCase().includes("fresh"))
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
            <Form.Label className="fw-semibold">Quantity Of Fresh Fish</Form.Label>
            <Form.Control
              placeholder="Enter quantity"
              type="number"
              name="quantity"
              value={freshData.products[0]?.quantity || ""}
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
              value={freshData.products[0]?.productWeight || ""}
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

          {/* Description */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Description</Form.Label>
            <Form.Control
              placeholder="Enter description"
              as="textarea"
              name="description"
              value={freshData.description || ""}
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
                value={freshData.category === "Marketer" ? "10%" : freshData.discount || ""}
                onChange={(e) => setFreshData({ ...freshData, discount: parseFloat(e.target.value) || 0 })}
                className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs} pe-5`}
                readOnly={freshData.category === "Marketer"}
              />
            </div>
          </Col>

          {/* Payment Type */}
          <Col className="mb-4">
            <Form.Label className="fw-semibold">Payment Type</Form.Label>
            <Form.Select
              name="paymentType"
              value={freshData.paymentType || ""}
              onChange={(e) => {
                const selectedPayment = e.target.value;
                setFreshData((prev) => ({
                  ...prev,
                  paymentType: selectedPayment,
                  amountPaid: ""
                }));
              }}
              required
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
            >
              <option value="" disabled>
                Select Payment Type
              </option>
              <option value="Cash">Cash</option>            
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
                freshData.amountPaid !== null && freshData.amountPaid !== ""
                  ? new Intl.NumberFormat().format(freshData.amountPaid)
                  : ""
              }
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, "");
                setFreshData({ ...freshData, amountPaid: value ? parseFloat(value) : "" });
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
              value={freshData.totalPrice ? `₦${new Intl.NumberFormat().format(freshData.totalPrice)}` : ""}
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
            {loader ? "Adding Sale..." : "Add Sale"}
          </Button>
        </div>
      </Form>

      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
    </div>
  );
};

export default FreshForm;
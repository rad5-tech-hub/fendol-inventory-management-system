import React, { useRef } from "react";
import styles from "../finance.module.scss";
import Logo from "../../../assests/logo.png";

const ReceiptModal = ({ receiptData, onClose, show }) => {
  const printRef = useRef();

  const handlePrint = () => {
    if (printRef.current) {
      const printContainer = document.createElement("div");
      printContainer.id = "printable-content";
      
      // Clone the content to print
      printContainer.innerHTML = printRef.current.innerHTML;
      document.body.appendChild(printContainer);
      
      // Trigger print and clean up
      setTimeout(() => {
        window.print();
        document.body.removeChild(printContainer);
      }, 100);
    }
  };

  if (!show) return null;

  if (!receiptData || !receiptData.data) {
    return (
      <div className="custom-receipt-overlay">
        <div className="custom-receipt-container">
          <div className="text-center p-3">
            <img src={Logo} alt="logo" style={{ maxWidth: "80px", margin: "0 auto 5px", display: "block" }} />
            <p>No receipt data available.</p>
            <button className="btn btn-danger px-4 py-2" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const receipt = receiptData.data.data;
  const formattedDate = new Date(receipt.date).toLocaleDateString("en-GB");

  return (
    <div className="custom-receipt-overlay">
      <div className="custom-receipt-container">
        <div ref={printRef} className="receipt-content">
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "5px" }}>
            <img src={Logo} alt="logo" style={{ maxWidth: "80px", margin: "0 auto", display: "block" }} />
            <p style={{ fontWeight: "bold", margin: "5px 0" }}>SALES RECEIPT</p>
          </div>

          {/* Company Info */}
          <div style={{ textAlign: "right", marginBottom: "5px" }}>
            <p style={{ margin: "0" }}>FACTORY/OFFICE:</p>
            <p style={{ margin: "0" }}>Kilometer 5 Osisioma</p>
            <p style={{ margin: "0" }}>Industry Layout, Aba</p>
            <p style={{ margin: "0" }}>Abia State</p>
            <p style={{ margin: "0" }}>Tel: 08170002853</p>
            <p style={{ margin: "0" }}>Email: fendolgroup@yahoo.com</p>
          </div>

          {/* Customer and Receipt Info */}
          <div style={{ marginBottom: "5px" }}>
            <p style={{ margin: "0" }}>
              <strong>{receipt.customerCategory} Name:</strong> {receipt.customerName}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Address:</strong> {receipt.customerAddress}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Served by:</strong> {receipt.servedBy}
            </p>
            <p style={{ margin: "0", fontStyle: "italic", textAlign: "right" }}>
              Receipt No: {receipt.transactionId}
            </p>
            <p style={{ margin: "0", textAlign: "right" }}>
              <strong>Date:</strong> {formattedDate}
            </p>
            <p style={{ margin: "0", textAlign: "right" }}>
              <strong>Time:</strong> {receipt.time}
            </p>
          </div>

          {/* Items Table */}
          <table className="table table-bordered" style={{ width: "100%", marginBottom: "5px" }}>
            <thead style={{ backgroundColor: "gray" }}>
              <tr>
                <th style={{ width: "40%", padding: "2px" }}>PROD</th>
                <th style={{ width: "15%", padding: "2px" }}>
                  {receipt.purchasedItems?.some(item => item.salesCategory === "fresh-fish") ? "WT" : "QTY"}
                </th>
                <th style={{ width: "20%", padding: "2px" }}>PRC(₦)</th>
                <th style={{ width: "25%", padding: "2px" }}>TOT(₦)</th>
              </tr>
            </thead>
            <tbody>
              {receipt.purchasedItems?.map((product, index) => (
                <tr key={index}>
                  <td style={{ padding: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {product.productName}
                  </td>
                  <td style={{ padding: "2px", textAlign: "center" }}>
                    {product.salesCategory === "fresh-fish"
                      ? product.weight
                      : product.productName?.toLowerCase().includes("broken")
                      ? product.quantityUsedToPack
                      : product.quantity}
                  </td>
                  <td style={{ padding: "2px", textAlign: "center" }}>
                    {product.unitPrice?.toLocaleString()}
                  </td>
                  <td style={{ padding: "2px", textAlign: "center" }}>
                    {product.totalPrice?.toLocaleString() || product.total?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ textAlign: "right", marginBottom: "5px" }}>
            <p style={{ margin: "0" }}>
              <strong>Grand Total:</strong> ₦{receipt.totalAmount?.toLocaleString()}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Paid:</strong> ₦{receipt.amountPaid?.toLocaleString()}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Amount Due:</strong> ₦{receipt.remainingBalance?.toLocaleString()}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Payment Type:</strong> {receipt.paymentMethod}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Your Total Savings:</strong> ₦{receipt.discount?.toLocaleString()}
            </p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "5px" }}>
            <hr style={{ border: "1px dashed black", margin: "5px 0" }} />
            <p style={{ margin: "0", fontSize: "10px" }}>Thanks For Your Kind Patronage!</p>
          </div>
        </div>

        {/* Buttons (not printed) */}
        <div className={`d-print-none d-flex justify-content-between ${styles.receiptButtons}`}>
          <button className="btn btn-danger px-4 py-2" onClick={onClose}>Close</button>
          <button className="btn btn-primary px-4 py-2" onClick={handlePrint}>Print</button>
        </div>
      </div>
    </div>
  );
};

// Inject custom styles
const customStyles = `
  .custom-receipt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .custom-receipt-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    padding: 10px;
    max-height: 80vh;
    overflow-y: auto;
    width: fit-content; /* Fit content width for modal display */
    min-width: 300px; /* Minimum width for readability */
    max-width: 90vw; /* Prevent overflow on small screens */
  }
  .receipt-content {
    font-size: 12px;
    line-height: 1.3;
  }
  @media print {
    /* Hide everything except the printable content */
    body > *:not(#printable-content) {
      display: none;
    }
    #printable-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 300px; /* 80mm width for thermal printer */
      background-color: white;
      color: black;
      padding: 5px;
      font-size: 12px;
      line-height: 1.3;
    }
    .d-print-none {
      display: none; /* Hide buttons during print */
    }
    /* Ensure table fits within 80mm */
    #printable-content table {
      width: 100%;
      table-layout: fixed;
    }
    #printable-content td, #printable-content th {
      word-break: break-all;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = customStyles;
document.head.appendChild(styleSheet);

export default ReceiptModal;
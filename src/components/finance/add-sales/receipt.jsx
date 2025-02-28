import React, { useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import styles from "../finance.module.scss";
import Logo from "../../../assests/logo.png";

const ReceiptModal = ({ receiptData, onClose, show }) => {
  const printRef = useRef();

  const handlePrint = () => {
    if (printRef.current) {
      const printContainer = document.createElement("div");
      printContainer.id = "printable-content";
      
      // Styles for 80mm thermal printer (approx 300px at 96 DPI)
      printContainer.style.position = "fixed";
      printContainer.style.top = "0";
      printContainer.style.left = "0";
      printContainer.style.width = "300px"; // 80mm ~= 300px
      printContainer.style.fontFamily = "monospace"; // Fixed-width font
      printContainer.style.fontSize = "12px"; // Small font for thermal printers
      printContainer.style.lineHeight = "1.2"; // Tight line spacing
      printContainer.style.backgroundColor = "white";
      printContainer.style.color = "black";
      printContainer.style.padding = "5px";
      printContainer.style.zIndex = "9999";

      printContainer.innerHTML = printRef.current.innerHTML;
      
      document.body.appendChild(printContainer);
      
      setTimeout(() => {
        window.print();
        document.body.removeChild(printContainer);
      }, 100);
    }
  };

  if (!receiptData || !receiptData.data) {
    return (
      <Modal show={show} centered size="sm">
        <Modal.Body className="text-center">
          <p>No receipt data available.</p>
          <Button variant="danger" onClick={onClose}>Close</Button>
        </Modal.Body>
      </Modal>
    );
  }

  const receipt = receiptData.data.data;
  const formattedDate = new Date(receipt.date).toLocaleDateString('en-GB');

  return (
    <Modal show={show} centered size="sm">
      <Modal.Body className={styles.receiptModal}>
        <div ref={printRef} style={{ width: "300px", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.2" }}>
          {/* Header */}
          <div style={{ textAlign: "center" }}>
            <img src={Logo} alt="logo" style={{ maxWidth: "80px", marginBottom: "5px" }} />
            <p style={{ fontSize: "14px", fontWeight: "bold", margin: "5px 0" }}>SALES RECEIPT</p>
          </div>

          {/* Company Info */}
          <div style={{ textAlign: "left", marginBottom: "5px" }}>
            <p style={{ margin: "0" }}>FACTORY/OFFICE:</p>
            <p style={{ margin: "0" }}>Kilometer 5 Osisioma</p>
            <p style={{ margin: "0" }}>Industry Layout, Aba</p>
            <p style={{ margin: "0" }}>Abia State</p>
            <p style={{ margin: "0" }}>Tel: 08170002853</p>
            <p style={{ margin: "0" }}>Email: fendolgroup@yahoo.com</p>
          </div>

          {/* Customer and Receipt Info */}
          <div style={{ marginBottom: "5px" }}>
            <p style={{ margin: "0" }}>{receipt.customerCategory} Name: {receipt.customerName}</p>
            <p style={{ margin: "0" }}>Address: {receipt.customerAddress}</p>
            <p style={{ margin: "0" }}>Served by: {receipt.servedBy}</p>
            <p style={{ margin: "0" }}>Receipt No: {receipt.receiptNumber}</p>
            <p style={{ margin: "0" }}>Date: {formattedDate}</p>
            <p style={{ margin: "0" }}>Time: {receipt.time}</p>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: "5px" }}>
            <div style={{ display: "flex", fontWeight: "bold", borderBottom: "1px dashed black" }}>
              <span style={{ width: "40%" }}>PROD</span>
              <span style={{ width: "15%" }}>QTY</span>
              <span style={{ width: "25%" }}>TOT(₦)</span>
              <span style={{ width: "20%" }}>PRC(₦)</span>
            </div>
            {receipt.purchasedItems && receipt.purchasedItems.map((product, index) => (
              <div key={index} style={{ display: "flex" }}>
                <span style={{ width: "40%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {product.productName}
                </span>
                <span style={{ width: "15%", textAlign: "center" }}>
                  {product.productName && product.productName.toLowerCase().includes("broken")
                    ? product.quantityUsedToPack
                    : product.quantity}
                </span>
                <span style={{ width: "25%", textAlign: "right" }}>
                  {product.totalPrice?.toLocaleString() || product.total?.toLocaleString()}
                </span>
                <span style={{ width: "20%", textAlign: "right" }}>
                  {product.unitPrice?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ textAlign: "right", marginBottom: "5px" }}>
            <p style={{ margin: "0" }}>Grand Total: ₦{receipt.totalAmount?.toLocaleString()}</p>
            <p style={{ margin: "0" }}>Paid: ₦{receipt.amountPaid?.toLocaleString()}</p>
            <p style={{ margin: "0" }}>Amount Due: ₦{receipt.remainingBalance?.toLocaleString()}</p>
            <p style={{ margin: "0" }}>Payment Type: {receipt.paymentMethod}</p>
            <p style={{ margin: "0" }}>Total Savings: ₦{receipt.discount?.toLocaleString()}</p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <hr style={{ border: "1px dashed black", margin: "5px 0" }} />
            <p style={{ margin: "0" }}>Thanks For Your Kind Patronage!</p>
          </div>
        </div>

        {/* Buttons (not printed) */}
        <div className={`d-print-none d-flex justify-content-between ${styles.receiptButtons}`}>
          <Button variant="danger" className="px-4 py-2" onClick={onClose}>Close</Button>
          <Button variant="primary" className="px-4 py-2" onClick={handlePrint}>Print</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ReceiptModal;
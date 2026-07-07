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
  const createdAt = new Date(receipt.createdAt || receipt.purchasedDate);
  const formattedDate = createdAt.toLocaleDateString("en-GB");
  const formattedTime = createdAt.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="custom-receipt-overlay">
      <div className="custom-receipt-container">
        <div ref={printRef} className="receipt-content">

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <img src={Logo} alt="logo" style={{ maxWidth: "64px", margin: "0 auto 8px", display: "block" }} />
            <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "1.5px", color: "#1A1C1E", margin: 0, textTransform: "uppercase" }}>
              Sales Receipt
            </p>
          </div>

          {/* ── Company Info ── */}
          <div style={{ textAlign: "right", marginBottom: "16px", fontSize: "11px", color: "#6B7280", lineHeight: 1.6 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>FENDOL FISH LIMITED</p>
            <p style={{ margin: 0 }}>Km 5 Osisioma Industry Layout, Aba</p>
            <p style={{ margin: 0 }}>Abia State</p>
            <p style={{ margin: 0 }}>Tel: 08170002853</p>
            <p style={{ margin: 0 }}>Email: fendolgroup@yahoo.com</p>
          </div>

          {/* ── Separator ── */}
          <div style={{ height: "1px", background: "#E5E7EB", marginBottom: "14px" }} />

          {/* ── Customer & Receipt Info ── */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ marginBottom: "8px" }}>
              <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Customer
              </p>
              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#1A1C1E" }}>
                {receipt.customer.fullName}
              </p>
              <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#6B7280" }}>
                {receipt.customer.address}
              </p>
              <p style={{ margin: "0", fontSize: "11px", color: "#9CA3AF" }}>
                Served by: {receiptData.data.serverBy || receipt.servedBy || '-'}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#9CA3AF" }}>
                Receipt: <span style={{ color: "#374151", fontWeight: 600 }}>{receipt.transactionId}</span>
              </p>
              <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#9CA3AF" }}>
                Date: <span style={{ color: "#374151" }}>{formattedDate}</span>
              </p>
              <p style={{ margin: "0", fontSize: "11px", color: "#9CA3AF" }}>
                Time: <span style={{ color: "#374151" }}>{formattedTime}</span>
              </p>
            </div>
          </div>

          {/* ── Items Table ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "6px 4px 6px 0", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Item
                </th>
                <th style={{ padding: "6px 4px", textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {receipt.salesCategory === "fresh-fish" ? "WT" : "QTY"}
                </th>
                <th style={{ padding: "6px 4px", textAlign: "right", fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ₦/Unit
                </th>
                <th style={{ padding: "6px 0 6px 4px", textAlign: "right", fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.salesItems?.map((product, index) => {
                const qty = Number(product.quantity) || 0;
                const wt = Number(product.productWeight) || 0;
                const tot = Number(product.totalPrice) || 0;
                const isFresh = receipt.salesCategory === "fresh-fish";
                const displayQty = isFresh ? wt.toLocaleString() : qty.toLocaleString();
                const unitPrice = (isFresh && wt ? tot / wt : qty ? tot / qty : tot).toLocaleString();
                return (
                  <tr key={index} style={{ borderBottom: index < receipt.salesItems.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: "6px 4px 6px 0", fontSize: "12px", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {product.productName}
                    </td>
                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: "12px", color: "#6B7280" }}>
                      {displayQty}
                    </td>
                    <td style={{ padding: "6px 4px", textAlign: "right", fontSize: "12px", color: "#6B7280" }}>
                      {unitPrice}
                    </td>
                    <td style={{ padding: "6px 0 6px 4px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#1A1C1E" }}>
                      {tot.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── Separator ── */}
          <div style={{ height: "1px", background: "#E5E7EB", marginBottom: "10px" }} />

          {/* ── Totals ── */}
          <div style={{ fontSize: "12px", lineHeight: 1.8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280" }}>Grand Total</span>
              <span style={{ fontWeight: 700, color: "#1A1C1E" }}>₦{Number(receipt.totalPrice).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280" }}>Paid</span>
              <span style={{ fontWeight: 600, color: "#16A34A" }}>₦{Number(receipt.totalPaid).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280" }}>Amount Due</span>
              <span style={{ fontWeight: 700, color: Number(receipt.remainingBalance) > 0 || (Number(receipt.totalPrice) > Number(receipt.totalPaid) && !receipt.remainingBalance) ? "#DC2626" : "#1A1C1E" }}>
                ₦{Math.max(0, Number(receipt.remainingBalance ?? (Number(receipt.totalPrice) - Number(receipt.totalPaid)))).toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280" }}>Payment</span>
              <span style={{ fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>{receipt.paymentType}</span>
            </div>
            {Number(receipt.discount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#6B7280" }}>Savings</span>
                <span style={{ fontWeight: 600, color: "#16A34A" }}>₦{Number(receipt.discount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #E5E7EB" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", letterSpacing: "0.3px" }}>
              Thank you for your patronage!
            </p>
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
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    padding: 24px;
    max-height: 85vh;
    overflow-y: auto;
    width: fit-content;
    min-width: 320px;
    max-width: 92vw;
  }
  .receipt-content {
    font-size: 12px;
    line-height: 1.5;
    color: #374151;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  @media print {
    body > *:not(#printable-content) {
      display: none;
    }
    #printable-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 300px;
      background-color: #ffffff;
      color: #374151;
      padding: 8px;
      font-size: 12px;
      line-height: 1.5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .d-print-none {
      display: none;
    }
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
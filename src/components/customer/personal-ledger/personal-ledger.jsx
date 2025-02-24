import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss'; 
import { BsExclamationTriangleFill, BsPrinter } from "react-icons/bs";
import { Spinner, Alert, Button, Form, Modal } from 'react-bootstrap';
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import ReceiptModal from "../../finance/add-sales/receipt";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PersonalLedger = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [balance, setBalance] = useState(0);
  const [receiptData, setReceiptData] = useState({}); // Store receipt details
  const [showReceipt, setShowReceipt] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [amountPaidB, setAmountPaidB] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLedgerData();
    }
  }, [id]);

  const fetchLedgerData = async () => {
    try {
      const response = await Api.get(`/customer/${id}`);
      
      if (Array.isArray(response.data.data)) {
        setLedgerData(response.data.data);
  
        if (response.data.data.length > 0) {
          setFullName(response.data.data[0].fullName);
          setCategory(response.data.data[0].category);
        } else {
          console.log("No data available");
        }
      } else {
        throw new Error('Expected an array of ledger data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
};

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB');
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const displayedLedgerData = ledgerData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (displayedLedgerData.length > 0) {
      setBalance(displayedLedgerData[0].balanceWithRollover);
    }
  }, [displayedLedgerData]);

  const handleEditAmount = (record) => {
    setEditingRecord(record.id);
    setAmountPaidB(record.amountPaid || "");
    setTransactionId(record.transactionId || "");
    setTotalAmount(record.balance); // Set total amount due
    setShowModal(true);
  };

  const handleAmountChange = (e) => {
    setAmountPaid(e.target.value);
  };

  const handleSubmitAmountPaid = async () => {
    const loadingToastId = toast.loading("Updating payment...", { position: "top-center" });
  
    try {
      const response = await Api.put(`/update-payment/${transactionId}`, {
        amountPaid,
      });
  
      if (response.status === 200) {
        toast.update(loadingToastId, {
          render: "Payment updated successfully!",
          type: "success",
          isLoading: false,
          position: "top-center",
          autoClose: 3000,
        });
  
        setEditingRecord(null);
        setAmountPaid("");
        setShowModal(false);
        // Force fetch ledger data after update
        fetchLedgerData();
      }
    } catch (error) {
      console.error("Error updating payment", error);
  
      toast.update(loadingToastId, {
        render: "Failed to update payment",
        type: "error",
        isLoading: false,
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleReceipt = async (record) => {
    // 2. Toast for fetching receipt
    const receiptToast = toast.loading("Fetching receipt...", { className: 'dark-toast' });
  
    try {           
      // 3. Fetch receipt using transaction ID
      const receiptResponse = await Api.get(`/sales-receipts/${record.transactionId}`);
  
      if (receiptResponse.status === 404) {
        throw new Error(receiptResponse.data.message || "Receipt not found.");
      }
  
      if (receiptResponse.status < 200 || receiptResponse.status >= 300) {
        throw new Error("Receipt could not be fetched.");
      }
  
      // 4. Update state with receipt data
      setReceiptData(receiptResponse);
  
      // ✅ Receipt success toast
      toast.update(receiptToast, {
        render: "Receipt fetched successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
  
      setShowReceipt(true); // Show receipt modal
    } catch (error) {
      // ❌ Receipt error toast
      toast.update(receiptToast, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
    }
  };
  
  return (
    <section className={`d-none d-lg-block ${styles.body}`}>
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar className={styles.sidebarItem} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form}>
            <div className="mt-3 mb-5">
              <h4>{fullName ?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</h4>
              <p className="fw-light">Category: {category}</p>
            </div>

            {loading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}

            {error && (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && displayedLedgerData.length > 0 && (
              <div className="table-responsive">
                <table className={styles.styled_tables}>
                  <thead className={`rounded-2 ${styles.theaders}`}>
                    <tr>
                      <th>DATE</th>
                      <th>NAME</th>
                      <th>CATEGORY</th>
                      <th>PRODUCT</th>
                      <th>QUANTITY</th>
                      <th>PAYMENT</th>
                      <th style={{ color: 'green' }}>CREDIT(₦)</th>
                      <th style={{ color: 'red' }}>DEBIT(₦)</th>
                      <th>BALANCE(₦)</th>                  
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLedgerData.map((record, index) => (
                      <tr key={index} className="text-start">
                        <td>{formatDate(record.date)}</td>
                        <td>{record.fullName}</td>
                        <td>{record.category}</td>
                        <td>{record.productName}</td>
                        <td>{record.quantity}</td>
                        <td>{record.paymentType}</td>
                        <td style={{ color: 'green' }}>{record.credit ? record.credit.toLocaleString() : '-'}</td>
                        <td style={{ color: 'red' }}>{record.debit ? record.debit.toLocaleString() : '-'}</td>
                        <td>
                          <div className="d-flex gap-3 align-items-center">
                            <span>{record.balance.toLocaleString()}</span>
                            <p
                              className={`badge p-2 mt-3 ${record.debit === 0 ? 'bg-success' : 'bg-danger'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={record.debit !== 0 ? () => handleEditAmount(record) : null}
                            >
                              {record.debit === 0 ? 'Paid' : 'Credit'}                            
                            </p>                      
                            <span className="bg-white p-2 rounded-circle badge ">
                              <BsPrinter style={{ cursor: 'pointer' }} onClick={() => handleReceipt(record)} className="text-primary" size={28} />
                            </span>
                          </div>
                        </td>                                                                    
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </section>
      </div>

      {/* Modal for Editing Payment */}
      <Modal show={showModal} size='sm' onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pay Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Amount Paid Before:</strong> ₦{amountPaidB || 0}</p>
          <p><strong>Balance:</strong> <span className="ps-1">{totalAmount} - {amountPaid || 0}</span> = ₦{(totalAmount - amountPaid).toLocaleString()} </p>
          <Form.Control
            type="number"
            value={amountPaid}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="mb-2"
          />
          <div className="text-end">
            <Button variant="primary" className="px-4" onClick={handleSubmitAmountPaid} block>
              PAY
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer />
      {/* Receipt Modal */}
      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt}/>
    </section>
  );
};

export default PersonalLedger;

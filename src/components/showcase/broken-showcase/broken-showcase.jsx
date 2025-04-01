import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../showcase.module.scss";
import { Spinner, Alert, Button, Modal, Form, Dropdown } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import ReactPaginate from "react-paginate";
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ViewBrokenHistory() {
  const [brokenQuantity, setBrokenQuantity] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loadingStages, setLoadingStages] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorStages, setErrorStages] = useState("");
  const [errorTable, setErrorTable] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [damageFishQuantity, setDamageFishQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const itemsPerPage = 10;

  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage.selected);
  };

  // Fetch current stock data for broken fish
  const fetchTableData = async () => {
    setLoadingStages(true);
    setErrorStages("");
    try {
      const response = await Api.get("/show-glass/broken");
      if (response.data?.success && response.data.data) {
        setBrokenQuantity(response.data.data.brokenFishQuantity|| 0); // Use wholeFishQuantity
      } else {
        throw new Error("Invalid data structure");
      }
    } catch (error) {
      setErrorStages(error.response?.data?.message || "Error getting broken fish quantity.");
    } finally {
      setLoadingStages(false);
    }
  };

  // Fetch history data for the table
  const fetchData = async () => {
    setLoadingTable(true);
    setErrorTable("");
    try {
      const response = await Api.get("/get-all-broken-histories");
      if (response.data && Array.isArray(response.data.data)) {
        const data = response.data.data;
        setTableData(data);
        setPageCount(Math.ceil(data.length / itemsPerPage));
      } else {
        throw new Error("Expected an array in data property");
      }
    } catch (error) {
      setErrorTable(error.response?.data?.message || "Error getting broken history data.");
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchTableData();
    fetchData();
  }, []);

  const handleShowModal = () => {
    setDamageFishQuantity("");
    setRemarks("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Moving...");

    const quantity = damageFishQuantity;
    if (!quantity || !remarks) {
      toast.update(loadingToast, {
        render: "Please fill in all fields.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: "dark-toast",
      });
      setLoading(false);
      return;
    }

    if (Number(damageFishQuantity) > Number(brokenQuantity)) {
      toast.update(loadingToast, {
        render: "Quantity cannot exceed available stock.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: "dark-toast",
      });
      setLoading(false);
      return;
    }

    try {
      const endpoint = "/move-broken-to-damage";
      const payload = { damagedFishQuantity: Number(damageFishQuantity), remarks };

      await Api.post(endpoint, payload);
      toast.update(loadingToast, {
        render: "OPERATION SUCCESSFUL!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: "dark-toast",
      });

      setDamageFishQuantity("");
      setRemarks("");
      await Promise.all([fetchTableData(), fetchData()]);
      handleCloseModal();
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "An error occurred while performing the action.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: "dark-toast",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const paginatedData = tableData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? "d-block" : "d-none"}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <h4 className="mt-3 mb-5">Broken Fish</h4>

            {/* Stock Card */}
            <div className="d-flex mb-5">
              {loadingStages ? (
                <div className="text-start w-25 shadow py-5 px-3">
                  <span className="text-muted">Loading...</span>
                </div>
              ) : errorStages ? (
                <div className="w-100">
                  <Alert variant="danger" className="text-center py-5">
                    <FaExclamationTriangle size={40} />
                    <span className="fw-semibold">{errorStages}</span>
                  </Alert>
                </div>
              ) : (
                <div className="w-50">
                  <div className="shadow w-50 px-3">
                    <div className="d-flex justify-content-between pt-2">
                      <p className="text-muted fw-semibold" style={{ fontSize: "12px" }}>
                        In Stock
                      </p>
                      <Dropdown>
                        <Dropdown.Toggle as="span" id="dropdown-custom-components">
                          <BsThreeDotsVertical
                            className="m-1 cursor-pointer"
                            style={{ cursor: "pointer" }}
                          />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item variant="light" onClick={handleShowModal}>
                            Move to Damage
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <p className="text-start text-muted fw-semibold" style={{ fontSize: "14px" }}>
                      Total Quantity
                    </p>
                    <div className="d-flex pb-3">
                      <h1>{brokenQuantity !== null ? brokenQuantity : "N/A"}</h1>
                      <p className="mt-3 fw-semibold" style={{ fontSize: "12px" }}>
                        pieces
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History Table */}
            {loadingTable ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : errorTable ? (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <FaExclamationTriangle size={40} />
                  <span className="fw-semibold">{errorTable}</span>
                </Alert>
              </div>
            ) : (
              <div className="table-responsive">
                <table className={`${styles.styled_table} table table-striped w-100`}>
                  <thead className={`rounded-2 ${styles.theader}`}>
                    <tr>
                      <th scope="col">DATE & TIME</th>
                      <th scope="col">DESCRIPTION</th>
                      <th scope="col" className="text-end pe-4">QUANTITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((data, index) => (
                        <tr key={index}>
                          <td>{formatDate(data.createdAt)}</td> {/* Assuming createdAt exists */}
                          <td title={data.description}>{data.description}</td>
                          <td className="text-end pe-4">{data.quantity}</td> {/* Adjust based on actual field */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No broken history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"<"}
                    nextLabel={">"}
                    breakLabel={"..."}
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageChange}
                    containerClassName={"pagination justify-content-center"}
                    pageClassName={"page-item"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    previousLinkClassName={"page-link"}
                    nextClassName={"page-item"}
                    nextLinkClassName={"page-link"}
                    breakClassName={"page-item disabled"}
                    breakLinkClassName={"page-link"}
                    activeClassName={"active-light"}
                  />
                </div>
              </div>
            )}
          </main>
        </section>

        <Modal show={showModal} onHide={handleCloseModal}>
          <ToastContainer />
          <Modal.Header closeButton className="border-0">
            <Modal.Title>Move to Damage</Modal.Title>
          </Modal.Header>
          <Modal.Body className="border-0">
            <h5 className="text-end fw-semibold">
              <span className="fs-6 fw-semibold">Total Quantity: </span>
              {brokenQuantity !== null ? brokenQuantity : "N/A"}
            </h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  value={damageFishQuantity}
                  onChange={(e) => setDamageFishQuantity(e.target.value)}
                  className="py-2 shadow-none border-secondary-subtle border-1"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="py-2 shadow-none border-secondary-subtle border-1"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="dark"
              className={`border-0 btn-dark shadow py-2 px-3 fs-6 fw-semibold ${styles.submit}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              Move
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </section>
  );
}
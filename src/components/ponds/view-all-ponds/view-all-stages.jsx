import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../product-stages.module.scss';
import { BsExclamationTriangleFill, BsPencilFill, BsTrash } from "react-icons/bs";
import { Form, Button, Spinner, Alert, Modal, Popover, OverlayTrigger } from 'react-bootstrap';
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';

const ViewAllStages = () => {
  const [stages, setStages] = useState([]);
  const [note, setNote] = useState([]);
  const [sampling, setSampling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteLoader, setNoteLoader] = useState(false); // Start as false, only true during fetch
  const [noteError, setNoteError] = useState('');
  const [samplingLoader, setSamplingLoader] = useState(false); // Start as false, only true during fetch
  const [samplingError, setSamplingError] = useState('');
  const [modaltype, setModaltype] = useState('view all note');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showMdModal, setShowMdModal] = useState(false);
  const [showSamplingModal, setShowSamplingModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const renderPopover = (note) => (
    <Popover id="popover-basic">
      <Popover.Header as="h5">Full Note</Popover.Header>
      <Popover.Body>{note}</Popover.Body>
    </Popover>
  );

  const fetchStages = async () => {
    try {
      const response = await Api.get('/fish-stages');
      if (Array.isArray(response.data.data)) {
        setStages(response.data.data);
      } else {
        throw new Error('Expected an array of stages');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

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

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const filteredStages = stages.filter(stage =>
    (stage.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleEditStage = (stage) => {
    setSelectedStage(stage);
    setShowModal(true);
    setModaltype('view all note'); // Default to notes view
    setNoteLoader(true); // Trigger note fetch
    fetchnote(stage.id);
  };

  const handleAddNote = () => {
    setShowMdModal(true);
  };

  const handleAddSampling = () => {
    setShowSamplingModal(true);
  };

  const handleSave = async () => {
    const saveToast = toast.loading('Saving changes...');
    try {
      await Api.put(`/fish-stage/${selectedStage.id}`, selectedStage);
      toast.update(saveToast, {
        render: 'Pond updated successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchStages(); // Refresh stages
      setShowModal(false);
    } catch (error) {
      toast.update(saveToast, {
        render: 'Failed to update pond. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const fetchnote = async (stageId) => {
    setNoteLoader(true);
    setNoteError(''); // Reset error before fetch
    try {
      const response = await Api.get(`/note/${stageId}`);
      if (Array.isArray(response.data.data)) {
        setNote(response.data.data);
      } else {
        throw new Error("Expected an array of notes");
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNoteError(err.response?.data?.message || "Failed to fetch notes. Please try again.");
    } finally {
      setNoteLoader(false);
    }
  };

  const handleAddNoteSubmit = async (note) => {
    const noteToast = toast.loading('Adding note...');
    try {
      await Api.post(`/note/${selectedStage.id}`, note);
      toast.update(noteToast, { render: 'Note added successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      setShowMdModal(false);
      fetchnote(selectedStage.id); // Fetch notes immediately after success
    } catch (err) {
      toast.update(noteToast, { render: 'Failed to add note. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const fetchSampling = async (stageId) => {
    setSamplingLoader(true);
    setSamplingError(''); // Reset error before fetch
    try {
      const response = await Api.get(`/sample/${stageId}`);
      if (Array.isArray(response.data.data)) {
        setSampling(response.data.data);
      } else {
        throw new Error("Expected an array of sampling data");
      }
    } catch (err) {
      console.error("Error fetching sampling data:", err);
      setSamplingError(err.response?.data?.message || "Failed to fetch sampling. Please try again.");
    } finally {
      setSamplingLoader(false);
    }
  };

  const handleAddSamplingSubmit = async (sampling) => {
    const samplingToast = toast.loading('Adding sampling...');
    try {
      await Api.post(`/sample/${selectedStage.id}`, sampling);
      toast.update(samplingToast, { render: 'Sampling added successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      setShowSamplingModal(false);
      fetchSampling(selectedStage.id); // Fetch sampling immediately after success
    } catch (err) {
      toast.update(samplingToast, { render: 'Failed to add sampling. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const DeletePond = async () => {
    const userConfirmed = window.confirm("Are you sure you want to delete this pond?");
    if (!userConfirmed) return;

    const loadingToast = toast.loading('Deleting pond...');
    try {
      await Api.delete(`/fish-stage/${selectedStage.id}`);
      toast.update(loadingToast, {
        render: 'Pond deleted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchStages();
      setShowModal(false);
    } catch (err) {
      toast.update(loadingToast, {
        render: err.response?.data?.message || 'Failed to delete pond. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const displayedStages = filteredStages.slice(startIndex, endIndex);

  useEffect(() => {
    if (modaltype === 'view all sampling' && selectedStage) {
      fetchSampling(selectedStage.id);
    } else if (modaltype === 'view all note' && selectedStage) {
      fetchnote(selectedStage.id);
    }
  }, [modaltype, selectedStage]);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.create_form}>
            <div className="d-flex justify-content-between flex-column flex-md-row align-items-md-center mb-3">
              <h4 className="mt-3 mb-3 mb-md-0">View Ponds</h4>
              <div className="w-50 w-md-25">
                <input
                  type="text"
                  className="form-control shadow-none border-secondary"
                  placeholder="Search by Pond...."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                <Alert variant="danger" className="text-center w-75 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredStages.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-75 py-5">
                  No available Pond
                </Alert>
              </div>
            )}

            {!loading && !error && displayedStages.length > 0 && (
              <>
                <table className={`${styles.styled_table} table-responsive`}>
                  <thead>
                    <tr>
                      <th>DATE CREATED</th>
                      <th>NAME</th>
                      <th>QUANTITY</th>
                      <th>DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStages.map((stage) => {
                      const formattedCreatedAt = formatDate(stage.createdAt);
                      return (
                        <tr
                          key={stage.id}
                          style={{ cursor: 'pointer' }}
                          title={`View ${stage.title}`}
                          onClick={() => handleEditStage(stage)}
                        >
                          <td>{formattedCreatedAt}</td>
                          <td>{stage.title}</td>
                          <td>{stage.quantity}</td>
                          <td>{stage.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"< "}
                    nextLabel={" >"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(filteredStages.length / itemsPerPage)}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageChange}
                    containerClassName={"pagination"}
                    pageClassName={"page-item"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    previousLinkClassName={"page-link"}
                    nextClassName={"page-item"}
                    nextLinkClassName={"page-link"}
                    breakClassName={"page-item"}
                    breakLinkClassName={"page-link"}
                    activeClassName={"active-light"}
                  />
                </div>
              </>
            )}
          </main>
        </section>
      </div>

      <ToastContainer />
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setModaltype('view all note');
          setNote([]); // Clear notes on close
          setSampling([]); // Clear sampling on close
          setNoteLoader(false);
          setSamplingLoader(false);
          setNoteError('');
          setSamplingError('');
        }}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton className="border-0 mb-4">
          <div className="row w-100 px-3">
            <div className="col-12 mb-2">
              <Modal.Title id="contained-modal-title-vcenter" className="fw-semibold">
                Name: {selectedStage?.title}
              </Modal.Title>
            </div>
            <div className="col-9 col-md-9">
              <p className="mb-0 fs-5 fw-semibold">Quantity: {selectedStage?.quantity}</p>
            </div>
            <div className="col-3 col-md-3 mb-2 text-end">
              <span className={`bg-light rounded-circle ${styles.action}`} title="Edit pond" onClick={() => setModaltype('edit pond')}>
                <BsPencilFill size={18} className="text-dark text-center" />
              </span>
              <span className={`bg-light rounded-circle ${styles.action}`} onClick={() => DeletePond()} title="Delete Pond">
                <BsTrash size={18} className="text-danger text-center" />
              </span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ height: '40vh', overflowX: 'auto', overflowY: 'auto' }} className="mx-4">
          <div className={`d-flex m-2 ${modaltype === 'edit pond' ? 'justify-content-end' : 'justify-content-start'}`}>
            {modaltype === 'edit pond' ? (
              <div className="d-flex gap-3">
                <span
                  onClick={() => setModaltype('view all note')}
                  style={{ cursor: "pointer" }}
                  className="text-muted text-decoration-underline fw-semibold"
                >
                  View Notes
                </span>
                <span
                  onClick={() => setModaltype('view all sampling')}
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                  className="text-muted text-decoration-underline fw-semibold"
                >
                  View Sampling
                </span>
              </div>
            ) : (
              <div className="d-flex gap-3">
                <h5
                  className={`fw-semibold text-dark ${modaltype === 'view all note' ? 'border-bottom border-danger-subtle' : ''}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setModaltype('view all note')}
                >
                  Notes
                </h5>
                <h5
                  className={`fw-semibold text-dark ${modaltype === 'view all sampling' ? 'border-bottom border-danger-subtle' : ''}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setModaltype('view all sampling')}
                >
                  Sampling
                </h5>
              </div>
            )}
          </div>

          <div>
            {modaltype === 'edit pond' && (
              <>
                {selectedStage && (
                  <Form>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={selectedStage.title}
                        onChange={(e) =>
                          setSelectedStage({ ...selectedStage, title: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-5">
                      <Form.Label className="fw-semibold">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={selectedStage.description}
                        onChange={(e) =>
                          setSelectedStage({
                            ...selectedStage,
                            description: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Form>
                )}
              </>
            )}

            {modaltype === 'view all note' && (
              <>
                {noteLoader && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}

                {!noteLoader && noteError && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-75 py-5">
                      <BsExclamationTriangleFill size={40} />{' '}
                      <span className="fw-semibold">{noteError}</span>
                    </Alert>
                  </div>
                )}

                {!noteLoader && !noteError && note.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-75 py-5">
                      No available notes
                    </Alert>
                  </div>
                )}

                {!noteLoader && !noteError && note.length > 0 && (
                  <table className={`${styles.styled_table} table-responsive`}>
                    <thead>
                      <tr>
                        <th>DATE CREATED</th>
                        <th className="text-center">FULL NAME</th>
                        <th className="text-end">NOTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note.map((stage) => {
                        const formattedCreatedAt = formatDate(stage.createdAt);
                        return (
                          <tr key={stage.id}>
                            <td>{formattedCreatedAt}</td>
                            <td className="text-center">{stage.fullName}</td>
                            <OverlayTrigger
                              trigger="click"
                              placement="right"
                              overlay={renderPopover(stage.note)}
                            >
                              <td
                                style={{ cursor: 'pointer' }}
                                className="text-end"
                                onClick={() => handleNoteClick(stage.note)}
                              >
                                {stage.note.length > 50 ? `${stage.note.substring(0, 50)}...` : stage.note}
                              </td>
                            </OverlayTrigger>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {modaltype === 'view all sampling' && (
              <>
                {samplingLoader && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}

                {!samplingLoader && samplingError && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-75 py-5">
                      <BsExclamationTriangleFill size={40} />{' '}
                      <span className="fw-semibold">{samplingError}</span>
                    </Alert>
                  </div>
                )}

                {!samplingLoader && !samplingError && sampling.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-75 py-5">
                      No available sampling data
                    </Alert>
                  </div>
                )}

                {!samplingLoader && !samplingError && sampling.length > 0 && (
                  <table className={`${styles.styled_table} table-responsive`}>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th className="text-center">SAMPLING DATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampling.map((sample) => {
                        const formattedDate = formatDate(sample.createdAt);
                        return (
                          <tr key={sample.id}>
                            <td>{formattedDate}</td>
                            <td className="text-center">{sample.sample_labeling}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 mx-4">
          {modaltype === 'view all note' ? (
            <Button
              variant="dark"
              onClick={handleAddNote}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
            >
              ADD NOTE
            </Button>
          ) : modaltype === 'view all sampling' ? (
            <Button
              variant="dark"
              onClick={handleAddSampling}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
            >
              ADD SAMPLING
            </Button>
          ) : (
            <Button
              variant="dark"
              onClick={handleSave}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}
            >
              Save Changes
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showMdModal} className="border-0" onHide={() => setShowMdModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Add Note</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const note = {
                fullName: formData.get('fullName'),
                note: formData.get('note'),
              };
              handleAddNoteSubmit(note);
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Note</Form.Label>
              <Form.Control as="textarea" name="note" placeholder="Write Note" rows={3} required />
            </Form.Group>
            <div className="text-end">
              <Button type="submit" className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}>
                ADD
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showSamplingModal} className="border-0" onHide={() => setShowSamplingModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Add Sampling</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const sampling = {
                sample_labeling: formData.get('sample_labeling'),
              };
              handleAddSamplingSubmit(sampling);
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Sampling Comment</Form.Label>
              <Form.Control as="textarea" name="sample_labeling" placeholder="Write sampling comment" rows={3} required />
            </Form.Group>
            <div className="text-end">
              <Button type="submit" className={`border-0 btn-dark shadow py-2 px-5 fs-6 fw-semibold ${styles.submit}`}>
                ADD
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default ViewAllStages;
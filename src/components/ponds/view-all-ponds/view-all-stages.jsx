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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loader, setLoader] = useState(true);
  const [errors, setErrors] = useState('')
  const [modaltype, setModaltype] = useState('view all note');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // Add state for search term
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showMdModal, setShowMdModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null); // Store the clicked note

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  // Define the popover content
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Filter stages based on the search term
  const filteredStages = stages.filter(stage => 
    (stage.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Handle stage edit
  const handleEditStage = (stage) => {      
      setSelectedStage(stage);
      setShowModal(true);       
  };
    // Handle stage edit
    const handleAddNote = () => {    
      setShowMdModal(true);
  };

  // save edit function
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
          fetchStages();
          setShowModal(false);
      } catch (error) {
          toast.update(saveToast, {
              render: 'Failed to update pond. Please try again.',
              type: 'error',
              isLoading: false,
              autoClose: 3000,
          });
      } finally {
      }
  };
  
  const fetchnote = async (stage) => {
    try {
      const response = await Api.get(`/note/${stage}`);  
      if (Array.isArray(response.data.data)) {
        setNote(response.data.data);
      } else {
        throw new Error("Expected an array of notes");
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setErrors(err.response?.data?.message || "Failed to fetch notes. Please try again.");
    } finally {
      setLoader(false);
    }
  };

  // save note function
  const handleAddNoteSubmit = async (note) => {
    const noteToast = toast.loading('Adding note...');
    try {
      await Api.post(`/note/${selectedStage.id}`, note);
      toast.update(noteToast, { render: 'Note added successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      setShowMdModal(false);
      fetchnote(selectedStage.id);
    } catch (err) {
      toast.update(noteToast, { render: 'Failed to add note. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  // delete pond function
  const DeletePond = async () => {
    const userConfirmed = window.confirm("Are you sure you want to delete this pond?");
    
    if (!userConfirmed) {
      return; // Exit if the user cancels the action
    }
    
    // Show loading toast
    const loadingToast = toast.loading('Deleting pond...'); // Shows loading toast

    try {
      const response = await Api.delete(`/fish-stage/${selectedStage.id}`);
      
      // Show success toast if the pond is successfully deleted
      toast.update(loadingToast, {
        render: 'Pond deleted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchStages();
      setShowModal(false);
    } catch (err) {      
      // Show error toast if there is an error
      toast.update(loadingToast, {
        render: err.response?.data?.message || 'Failed to delete pond. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false); // End loading
    }
  };

  // Get the stages to be displayed based on current page
  const displayedStages = filteredStages.slice(startIndex, endIndex);

  return (
    <section className={`d-none d-lg-block ${styles.body}`}>
      <div className="sticky-top">
        <Header />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar className={styles.sidebarItem} />
        </div>
        <section className={`${styles.content}`}>
          <main className={styles.create_form}>
            <div className="d-flex justify-content-between">
              <h4 className="mt-3 mb-5">View Ponds</h4>

              {/* Search input field */}
              <div className="w-50s">
              <input
                  type="text"
                  className="form-control mb-3 shadow-none border-secondary"
                  placeholder="Search by Pond...."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} // Update search term
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
                <Alert variant="danger" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredStages.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-5">
                  No available Pond
                </Alert>
              </div>
            )}

            {!loading && !error && displayedStages.length > 0 && (
              <>
                <table className={styles.styled_table}>
                  <thead>
                    <tr>
                      <th>DATE CREATED</th>
                      <th>NAME</th>
                      <th>QUANTITY</th>
                      <th>Description</th>                                     
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStages.map((stage) => {
                      const formattedCreatedAt = formatDate(stage.createdAt);
                      return (
                        <tr key={stage.id} style={{cursor: 'pointer'}} title={`View ${stage.title}`} onClick={()=>{handleEditStage(stage); fetchnote(stage.id)}}>
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
      {/* Edit Modal */}
      <ToastContainer/>
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
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
            <div className="col-9">
              <p className="mb-0 fs-5 fw-semibold">Quantity: {selectedStage?.quantity}</p>
            </div>
            <div  className="col-3 mb-2 text-end">
              <span className={`bg-light rounded-circle ${styles.action}`} title="Edit pond" onClick={() => setModaltype('edit pond')}>
                <BsPencilFill size={18} className="text-dark text-center"/>
              </span>
              <span className={`bg-light rounded-circle ${styles.action}`} onClick={()=>DeletePond()} title="Delete Pond">
                <BsTrash size={18} className="text-danger text-center" />
              </span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ height: '40vh', overflowX: 'auto', overflowY: 'auto' }} className="mx-4">

          {/* View Note base on  for Modal Type */}
          <div className={` d-flex m-2  ${modaltype === 'edit pond' ? 'justify-content-end' : 'justify-content-start '}`}>
            {modaltype === 'edit pond' ? (<span onClick={() => setModaltype('view all note')} style={{cursor:"pointer"}} className="text-muted text-decoration-underline  fw-semibold ">View Notes</span>) : (<h5 className="fw-semibold text-dark">Notes</h5>)
            }
          </div>

          {/* Conditional Rendering Based on Modal Type */}
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
                {/* Loading Spinner */}
                {loader && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}

                {/* Error Message */}
                {errors && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="danger" className="text-center w-50 py-5">
                      <BsExclamationTriangleFill size={40} />{' '}
                      <span className="fw-semibold">{errors}</span>
                    </Alert>
                  </div>
                )}

                {/* No Data Message */}
                {!loader && !errors && note.length === 0 && (
                  <div className="d-flex justify-content-center">
                    <Alert variant="info" className="text-center w-50 py-5">
                      No available data
                    </Alert>
                  </div>
                )}

                {/* Notes Table */}
                {!loader && !errors && note.length > 0 && (
                  <table className={styles.styled_table}>
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
                          <tr
                            key={stage.id}                            
                          >
                            <td >{formattedCreatedAt}</td>
                            <td className="text-center">{stage.fullName}</td>
                            {/* Use OverlayTrigger to display the popover */}
                            <OverlayTrigger
                              trigger="click" // Show the popover on click
                              placement="right" // Position the popover to the right
                              overlay={renderPopover(stage.note)} // Pass the full note as popover content
                            >
                              <td
                                style={{cursor: 'pointer'}}
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
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 mx-4">
          {modaltype === 'view all note' ? (
            <Button
              variant="dark"
              onClick={handleAddNote}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
            >
              ADD NOTE
            </Button>
          ) : (
            <Button
              variant="dark"
              onClick={handleSave}
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
            >
              Save Changes
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Add Note Modal */}
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
              <Button type="submit" className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}>
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

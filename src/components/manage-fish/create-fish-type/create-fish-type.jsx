import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { BsExclamationTriangleFill } from "react-icons/bs";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api from '../../shared/api/apiLink';
import { FaTrashAlt } from "react-icons/fa";
import styles from '../product-stages.module.scss'; // Adjust the import as needed

const AddSpecies = () => {
    const [formData, setFormData] = useState({
        speciesName: '',
        description: '',
    });
    const [loader, setLoader] = useState(false);
    const [view, setView] = useState(false);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStage, setSelectedStage] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Fetching the stages
    const fetchStages = async () => {
        setLoading(true);
        try {
            const response = await Api.get('/species');
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

    // Format date helper
    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle adding a species
    const handleAddSpecies = async (e) => {
        e.preventDefault();
        setLoader(true);
        const loadingToast = toast.loading("Adding species...", { className: 'dark-toast' });

        try {
            await Api.post('/species', formData);
            setFormData({ speciesName: '', description: '' });
            toast.update(loadingToast, {
                render: "Fish type added successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
                className: 'dark-toast',
            });
            fetchStages();
            setTimeout(()=>{
                setView(!view);
            }, 4500)
        } catch (error) {
            toast.update(loadingToast, {
                render: error.response?.data?.message || "Error adding fish Type. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
                className: 'dark-toast',
            });
        } finally {
            setLoader(false);
        }
    };

    // Handle editing a stage
    const handleEditStage = (stage) => {
        setSelectedStage(stage);
        setShowModal(true);
    };


    const handleSave = async () => {
        const saveToast = toast.loading('Saving changes...');
        try {
            await Api.put(`/specie/${selectedStage.id}`, selectedStage);
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

    // delete specie or fish type
    const handleDelete = async (stageId) => {
        const loadingToast = toast.loading("Deleting Fish Type...", {
            className: 'dark-toast'
        });
    
        if (window.confirm("Are you sure you want to delete this Fish Type?")) {
            try {
                await Api.delete(`/specie/${stageId}`);
                toast.update(loadingToast, {
                    render: "Fish Type deleted successfully!",
                    type: "success", // Success type
                    isLoading: false,
                    autoClose: 3000,
                    className: 'dark-toast'
                });
                fetchStages(); // Refresh the data after deletion
            } catch (error) {
                toast.update(loadingToast, {
                    render: "Failed to delete Fish Type. Please try again.",
                    type: "error", // Error type
                    isLoading: false,
                    autoClose: 3000,
                    className: 'dark-toast'
                });
            }
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
                    <main>
                        {view ? (
                            <div className={styles.create_form}>
                                <ToastContainer />
                                <div className="d-flex justify-content-between">
                                    <h4 className="mt-3 mb-5">View Fish Type</h4>
                                    <span
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setView(false)}
                                        className="text-decoration-underline mt-3 me-2 text-muted fw-semibold"
                                    >
                                        Add Fish Type
                                    </span>
                                </div>
                                {loading ? (
                                    <div className="text-center">
                                        <Spinner animation="border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                    </div>
                                ) : error ? (
                                    <div className="d-flex justify-content-center">
                                        <Alert variant="danger" className="text-center w-50 py-5">
                                            <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                                        </Alert>
                                    </div>
                                ) : stages.length === 0 ? (
                                    <div className="d-flex justify-content-center">
                                        <Alert variant="info" className="text-center w-50 py-5">
                                            No available data
                                        </Alert>
                                    </div>
                                ) : (
                                    <table className={styles.styled_table}>
                                        <thead>
                                            <tr>
                                                <th>DATE CREATED</th>
                                                <th>NAME</th>
                                                <th>DESCRIPTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stages.map((stage) => (
                                                <tr
                                                    key={stage.id}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleEditStage(stage)}
                                                >
                                                    <td>{formatDate(stage.createdAt)}</td>
                                                    <td>{stage.speciesName}</td>
                                                    <td className="d-flex justify-content-between"> 
                                                        <span >
                                                            {stage.description.length > 40
                                                            ? `${stage.description.slice(0, 40)}...`
                                                            : stage.description}
                                                        </span>
                                                        <span className={`p-2 bg-light rounded-circle shadow-sm ${styles.delete}`} onClick={(e) => {
                                                                e.stopPropagation(); // Prevent triggering `handleEdit` when clicking the delete icon
                                                                handleDelete(stage.id);
                                                            
                                                        }} title="Delete Process">
                                                        <FaTrashAlt
                                                            
                                                            style={{ cursor: "pointer", color: "red" }}
                                                            title="Delete Process"
                                                        />
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            <Form className={styles.create_form} onSubmit={handleAddSpecies}>
                                <ToastContainer />
                                <div className="d-flex justify-content-between">
                                    <h4 className="mt-3 mb-5">Add Fish Type</h4>
                                    <span
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setView(true)}
                                        className="mt-3 me-2 text-muted text-decoration-underline fw-semibold"
                                    >
                                        View Fish Type
                                    </span>
                                </div>
                                <Form.Label className="fw-semibold">Name</Form.Label>
                                <Form.Control
                                    placeholder="Enter fish type"
                                    type="text"
                                    name="speciesName"
                                    value={formData.speciesName}
                                    required
                                    onChange={handleInputChange}
                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                />
                                <Form.Label className="fw-semibold mt-3">Description</Form.Label>
                                <Form.Control
                                    placeholder="Enter description"
                                    as="textarea"
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    style={{ height: '200px' }}
                                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                                />
                                <div className="d-flex justify-content-end my-4">
                                    <Button
                                        className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                                        disabled={loader}
                                        type="submit"
                                    >
                                        {loader ? 'Adding...' : 'Add'}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </main>
                    {/* Edit Modal */}
                    <Modal show={showModal} onHide={() => setShowModal(false)}>
                        <Modal.Header closeButton className="border-0 mb-4">
                            <Modal.Title>Edit Fish Type</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {selectedStage && (
                                <Form>
                                    <Form.Group className="mb-4">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedStage.speciesName}
                                            onChange={(e) =>
                                                setSelectedStage({ ...selectedStage, speciesName: e.target.value })
                                            }
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-5">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            value={selectedStage.description}
                                            onChange={(e) =>
                                                setSelectedStage({ ...selectedStage, description: e.target.value })
                                            }
                                        />
                                    </Form.Group>
                                </Form>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="border-0">
                            <Button
                                variant="dark"
                                onClick={handleSave}
                                className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                            >
                                Save Changes
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </section>
            </div>
        </section>
    );
};

export default AddSpecies;

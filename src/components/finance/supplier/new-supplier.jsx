import React, { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../finance.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import Api, { ApiV2 } from '../../shared/api/apiLink';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NewSupplier() {
  const navigate = useNavigate();
  const location = useLocation();
  const editSupplier = location.state?.supplier || null;
  const isEditing = !!editSupplier;

  const [loader, setLoader] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [formData, setFormData] = useState({
    fullName: editSupplier?.name || "",
    phone: editSupplier?.phone || "",
    address: editSupplier?.address || "",
    supplierType: editSupplier?.supplierTypeId || "",
  });

  const [supplierTypes, setSupplierTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [newTypeName, setNewTypeName] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [dropdownMode, setDropdownMode] = useState('types');
  const [creatingType, setCreatingType] = useState(false);
  const typeRef = useRef(null);

  useEffect(() => {
    fetchSupplierTypes();
  }, []);

  const fetchSupplierTypes = async () => {
    setTypesLoading(true);
    try {
      const res = await ApiV2.get('/v2/supplier-type');
      const types = res.data?.data || [];
      setSupplierTypes(types);
    } catch {
      toast.error("Failed to load supplier types.", {
        className: 'dark-toast',
        autoClose: 5000,
      });
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateType = async () => {
    const name = newTypeName.trim();
    if (!name || creatingType) return;
    setCreatingType(true);
    try {
      const res = await ApiV2.post('/v2/supplier-type', { name });
      const created = res.data?.data;
      if (created?.id) {
        setSupplierTypes(prev => [...prev, { id: created.id, name: created.name }]);
        setFormData(prev => ({ ...prev, supplierType: created.id }));
        toast.success(res.data?.response_message || "Supplier type created!", {
          className: 'dark-toast',
          autoClose: 3000,
        });
      }
      setNewTypeName('');
      setShowTypeDropdown(false);
      setDropdownMode('types');
    } catch (error) {
      const msg = error.response?.data?.response_message || error.response?.data?.message || "Failed to create supplier type.";
      toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
    } finally {
      setCreatingType(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const loadingToast = toast.loading(isEditing ? "Updating Supplier..." : "Adding New Supplier...", {
      className: 'dark-toast'
    });

    try {
      const selectedType = supplierTypes.find(t => t.id === formData.supplierType);

      const payload = {
        name: formData.fullName,
        phone: formData.phone,
        supplierTypeId: selectedType?.id || formData.supplierType,
        address: formData.address,
      };

      if (isEditing) {
        await ApiV2.patch(`/v2/supplier/${editSupplier.id}`, payload);

        toast.update(loadingToast, {
          render: "Supplier updated successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      } else {
        await ApiV2.post('/v2/supplier', payload);

        toast.update(loadingToast, {
          render: "Supplier added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          className: 'dark-toast'
        });
      }

      navigate('/finance/supplier/view-all');
    } catch (error) {
      const errorMessage = error.response?.data?.response_message || error.response?.data?.message || "Something went wrong. Please try again.";
      toast.update(loadingToast, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 6000,
        className: 'dark-toast'
      });
    } finally {
      setLoader(false);
    }
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content}`}>
          <main>
            <ToastContainer />
            <Form className={styles.create_form} onSubmit={handleSubmit}>
              <h4 className="mt-3 mb-5">{isEditing ? 'Edit Supplier' : 'Add Supplier'}</h4>
              <Row xxl={2} xl={2} lg={2} md={1} sm={1} xs={1}>
                <Col className="mb-4">
                  <Form.Label className="fw-semibold">Full Name</Form.Label>
                  <Form.Control
                    placeholder="Enter Full Name"
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col className="mb-4">
                  <Form.Label className="fw-semibold">Phone</Form.Label>
                  <Form.Control
                    placeholder="Enter Phone Number"
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col className="mb-4">
                  <Form.Label className="fw-semibold">Supplier Type</Form.Label>
                  <div ref={typeRef} className="position-relative">
                    <div
                      className={`py-2 px-3 bg-light-subtle d-flex justify-content-between align-items-center ${styles.inputs}`}
                      style={{ borderRadius: '0.375rem', cursor: 'pointer', minHeight: '48px' }}
                      onClick={() => {
                        if (typesLoading) return;
                        if (!showTypeDropdown) setDropdownMode('types');
                        setShowTypeDropdown(!showTypeDropdown);
                      }}
                    >
                      <span style={{ opacity: formData.supplierType ? 1 : 0.5, color: formData.supplierType ? '#212529' : '#6c757d' }}>
                        {typesLoading
                          ? 'Loading types...'
                          : supplierTypes.find(t => t.id === formData.supplierType)?.name || 'Select Supplier Type'}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6c757d',
                        transition: 'transform 0.25s',
                        transform: showTypeDropdown ? 'rotate(180deg)' : 'none'
                      }}>▾</span>
                    </div>
                    {showTypeDropdown && (
                      <div
                        className="position-absolute w-100 bg-white shadow-sm"
                        style={{
                          zIndex: 1050,
                          borderRadius: '10px',
                          marginTop: '6px',
                          border: '1px solid #e0e0e0',
                          overflow: 'hidden',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        }}
                      >
                        {dropdownMode === 'types' ? (
                          <>
                            <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                              {supplierTypes.length === 0 ? (
                                <div style={{ padding: '16px', fontSize: '13px', color: '#8C949B', textAlign: 'center' }}>
                                  No supplier types available. Create one below.
                                </div>
                              ) : (
                                supplierTypes.map((t, i) => (
                                  <div
                                    key={t.id}
                                    style={{
                                      padding: '12px 16px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      fontWeight: formData.supplierType === t.id ? 600 : 400,
                                      color: formData.supplierType === t.id ? '#512728' : '#2E3135',
                                      backgroundColor: formData.supplierType === t.id ? '#fdf5f5' : 'transparent',
                                      borderBottom: i < supplierTypes.length - 1 ? '1px solid #f0f0f0' : 'none',
                                      transition: 'background-color 0.12s',
                                    }}
                                    onClick={() => {
                                      setFormData({ ...formData, supplierType: t.id });
                                      setShowTypeDropdown(false);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = formData.supplierType === t.id ? '#fdf5f5' : '#FAFCFF'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.supplierType === t.id ? '#fdf5f5' : 'transparent'}
                                  >
                                    {t.name}
                                  </div>
                                ))
                              )}
                            </div>
                            <div
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#512728',
                                borderTop: '1px solid #e8e8e8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'background-color 0.12s',
                              }}
                              onClick={() => {
                                setNewTypeName('');
                                setDropdownMode('create');
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFCFF'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: '#512728',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 400,
                                lineHeight: 1,
                              }}>+</span>
                              Create supplier type
                            </div>
                          </>
                        ) : (
                          <div style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#2E3135', marginBottom: '10px' }}>
                              New Supplier Type
                            </div>
                            <div className="d-flex gap-2">
                              <Form.Control
                                type="text"
                                placeholder="Enter supplier type name"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                style={{
                                  fontSize: '14px',
                                  border: '1px solid #d0d6db',
                                  boxShadow: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateType();
                                }}
                              />
                              <Button
                                size="sm"
                                style={{
                                  backgroundColor: '#512728',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                                onClick={handleCreateType}
                                disabled={creatingType || !newTypeName.trim()}
                              >
                                {creatingType ? 'Adding...' : 'Add'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                style={{
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  fontSize: '13px',
                                  border: '1px solid #d0d6db',
                                  color: '#6c757d',
                                  whiteSpace: 'nowrap',
                                }}
                                onClick={() => {
                                  setNewTypeName('');
                                  setDropdownMode('types');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Col>
                <Col className="mb-4">
                  <Form.Label className="fw-semibold">Address</Form.Label>
                  <Form.Control
                    placeholder="Enter Address"
                    className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </Col>
              </Row>
              <div className="d-flex justify-content-end my-5">
                <Button
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                  disabled={loader || typesLoading}
                  type="submit"
                >
                  {loader ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Add')}
                </Button>
              </div>
            </Form>
          </main>
        </section>
      </div>
    </section>
  );
}

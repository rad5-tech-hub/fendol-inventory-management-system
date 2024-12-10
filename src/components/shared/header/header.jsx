import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, Form, Dropdown, ButtonGroup } from 'react-bootstrap';
import { FaSearch } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from '../../../assests/logo.png';
import styles from './header.module.scss';

export default function Header() {
    const navigate = useNavigate();

    return (
        <header>
            <div className={`shadow-sm sticky-top py-1 ${styles.header}`}>
                <Row className="align-items-center g-0 px-3">
                    {/* Logo Section */}
                    <Col xs={6} lg={2} className={`d-flex align-items-center ${styles.brand}`}>
                        <img src={Logo} alt="logo" />
                    </Col>

                    {/* Search Section */}
                    <Col lg={7} className={`d-none d-lg-block px-4 ${styles.search}`}>
                        <Form className="d-flex align-items-center">
                            <div className="position-relative w-100">
                                <Form.Control
                                    aria-label="Search"
                                    placeholder="Search..."
                                    readOnly
                                    id={styles.input}
                                    className="ps-5 border-1 shadow-none rounded-pill"
                                />
                                <FaSearch
                                    className="position-absolute top-50 translate-middle-y ms-3 text-secondary"
                                    style={{ pointerEvents: 'none' }}
                                />
                            </div>
                        </Form>
                    </Col>

                    {/* Icons Section */}
                    <Col xs={6} lg={3} className="d-flex align-items-center justify-content-end pe-lg-4">
                        <IoMdNotifications size={25} className={`me-3 ${styles.icons}`} />
                        <Dropdown as={ButtonGroup}>
                            <Dropdown.Toggle className="bg-transparent text-dark border-0" id="dropdown-basic">
                                <FaRegUserCircle size={32} className={`me-1 ${styles.icons}`} />
                                <span className="d-none d-lg-inline fw-semibold">
                                    {sessionStorage.getItem('role')
                                        ?.replace(/_/g, ' ') // Replace underscores with spaces
                                        .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letters
                                    }
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border border-secondary bg-light-subtle">
                                <Dropdown.Item
                                    className="fw-semibold"
                                    onClick={() => {
                                        sessionStorage.clear();
                                        navigate('/');
                                    }}
                                >
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>
            </div>
        </header>
    );
}

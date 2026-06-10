import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaExchangeAlt } from 'react-icons/fa';
import SideBar from '../../../shared/sidebar/sidebar';
import Header from '../../../shared/header/header';
import Api from '../../../shared/api/apiLink';
import styles from '../../hatchery.module.scss';

export default function TransferHistory() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content} flex-grow-1`}>
          <main className={styles.page}>
            <div className={styles.breadcrumb}>
              <span>Hatchery</span>
              <span className={styles.separator}>&gt;</span>
              <span>Transfers</span>
              <span className={styles.separator}>&gt;</span>
              <span className={styles.breadcrumbActive}>Transfer History</span>
            </div>

            <div className={styles.pageHeader}>
              <h4>Transfer History</h4>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#8C949B', marginBottom: 24 }}>
              View all fry transfer records from hatchery to nursery ponds.
            </p>

            <div className={styles.comingSoonCard}>
              <FaExchangeAlt size={64} color="#E5E7EB" />
              <h5 className={styles.comingSoonHeading}>We're working on this</h5>
              <p className={styles.comingSoonText}>
                The Transfer History page is currently being designed. Check back soon.
              </p>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { BsExclamationTriangleFill } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import styles from '../site-management.module.scss';

const SitePerformance = () => {
  const [showSidebar, setShowSidebar] = useState(false);
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
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
              <div className="text-center">
                <BsExclamationTriangleFill size={48} className="text-muted mb-3" />
                <h4 className="fw-semibold text-muted">Site Performance</h4>
                <p className="text-muted">This dashboard is coming soon. Site performance analytics will appear here.</p>
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
};

export default SitePerformance;

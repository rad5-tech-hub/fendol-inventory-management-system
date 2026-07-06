import React, { useState } from 'react';
import { BsExclamationTriangleFill } from 'react-icons/bs';
import SideBar from '../../shared/sidebar/sidebar';
import Header from '../../shared/header/header';
import styles from '../hatchery.module.scss';

export default function HatcheryDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
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
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
              <div className="text-center">
                <BsExclamationTriangleFill size={48} className="text-muted mb-3" />
                <h4 className="fw-semibold text-muted">Hatchery Dashboard</h4>
                <p className="text-muted">This dashboard is coming soon. Real-time hatchery analytics will appear here.</p>
              </div>
            </div>
          </main>
        </section>
      </div>
    </section>
  );
}

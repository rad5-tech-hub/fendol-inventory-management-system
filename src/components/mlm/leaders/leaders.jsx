import React, { useState } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function MlmLeaders() {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <section className="d-flex flex-column min-vh-100">
      <div className="sticky-top">
        <Header toggleSidebar={() => setShowSidebar(!showSidebar)} />
      </div>
      <div className="d-flex gap-2 flex-grow-1">
        <div className={`d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar show={showSidebar} handleClose={() => setShowSidebar(false)} />
        </div>
        <section className="flex-grow-1 p-4">
          <h1>Leaders, Downlines & Commissions</h1>
          <p className="text-muted">Coming soon.</p>
        </section>
      </div>
    </section>
  );
}

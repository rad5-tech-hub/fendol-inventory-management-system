import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CreateSite from './create-site/create-site';
import ViewAllSites from './view-all/view-all';
import SitePerformance from './site-performance/site-performance';

const SiteManagementNavigations = () => {
  return (
    <Routes>
      <Route path='create' element={<CreateSite />} />
      <Route path='view-all' element={<ViewAllSites />} />
      <Route path='site-performance' element={<SitePerformance />} />
    </Routes>
  );
};

export default SiteManagementNavigations;

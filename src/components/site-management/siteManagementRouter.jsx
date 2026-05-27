import React from 'react';
import { Routes, Route} from 'react-router-dom';
import CreateSite from './create-site/create-site';
import ViewAllSites from './view-all/view-all';

const SiteManagementNavigations = () => {
  return (
    <Routes>
      <Route path='create' element={<CreateSite/>}/>
      <Route path='view-all' element={<ViewAllSites/>}/>
    </Routes>
  );
};

export default SiteManagementNavigations;

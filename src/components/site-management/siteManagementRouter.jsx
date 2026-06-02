import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import CreateSite from './create-site/create-site';
import ViewAllSites from './view-all/view-all';
import { hasAccess } from '../shared/permissions';

const SiteManagementNavigations = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(sessionStorage.getItem('role'));
  }, []);

  if (role === null) return <div>Loading...</div>;

  return (
    <Routes>
      {hasAccess(role, 'site-management', 'create') && <Route path='create' element={<CreateSite/>}/>}
      <Route path='view-all' element={<ViewAllSites/>}/>
    </Routes>
  );
};

export default SiteManagementNavigations;

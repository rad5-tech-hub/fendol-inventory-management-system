import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import CreateSite from './create-site/create-site';
import ViewAllSites from './view-all/view-all';

const SiteManagementNavigations = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = sessionStorage.getItem('role');
    setRole(storedRole);
  }, []);

  if (role === null) {
    return <div>Loading...</div>;
  }

  if (role !== 'super_admin' && role !== 'farm_manager') {
    return null;
  }

  return (
    <Routes>
      {role === 'super_admin' && <Route path='create' element={<CreateSite/>}/>}
      <Route path='view-all' element={<ViewAllSites/>}/>
    </Routes>
  );
};

export default SiteManagementNavigations;

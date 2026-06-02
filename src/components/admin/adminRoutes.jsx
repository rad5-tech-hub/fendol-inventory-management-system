import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import ViewAll from './view-all/view-all';
import AddNew from './add-new-admin/add-new';
import { hasAccess } from '../shared/permissions';

const AdminNavigations = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(sessionStorage.getItem('role'));
  }, []);

  if (role === null) return <div>Loading...</div>;

  return (
    <Routes>
      {hasAccess(role, 'admin', 'create') && <Route path="add-new-admin" element={<AddNew />} />}
      <Route path="view-all" element={<ViewAll />} />
    </Routes>
  );
};

export default AdminNavigations;

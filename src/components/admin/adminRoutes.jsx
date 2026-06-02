import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ViewAll from './view-all/view-all';
import AddNew from './add-new-admin/add-new';

const AdminNavigations = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = sessionStorage.getItem('role');
    setRole(storedRole);
  }, []);

  // If role is not loaded yet, show a loader
  if (role === null) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {role === 'super_admin' && <Route path="add-new-admin" element={<AddNew />} />}
      <Route path="view-all" element={<ViewAll />} />
    </Routes>
  );
};

export default AdminNavigations;

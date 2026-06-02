import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ViewAll from './view-all/view-all';
import AddNew from './add-new-admin/add-new';

const AdminNavigations = () => {
  return (
    <Routes>
      <Route path="add-new-admin" element={<AddNew />} />
      <Route path="view-all" element={<ViewAll />} />
    </Routes>
  );
};

export default AdminNavigations;

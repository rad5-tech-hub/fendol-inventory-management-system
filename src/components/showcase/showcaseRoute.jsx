import React from 'react';
import { Routes, Route} from 'react-router-dom';
import ViewBorkenHistory from './broken-showcase/broken-showcase';
import ViewWholeHistory from './whole-showcase/whole-showcase';

const ShowcaseNavigations = () => {
    
  return (
    <Routes>
      <Route path='broken-showcase' element={<ViewBorkenHistory/>}/>
      <Route path='whole-showcase' element={<ViewWholeHistory/>}/>
    </Routes>
  );
};

export default ShowcaseNavigations;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ReferralDashboard from './dashboard/dashboard';
import ReferralAgents from './agents/agents';
import ReferralPayouts from './payouts/payouts';

const ReferralNavigations = () => {
  return (
    <Routes>
      <Route path='dashboard' element={<ReferralDashboard />} />
      <Route path='agents' element={<ReferralAgents />} />
      <Route path='payouts' element={<ReferralPayouts />} />
    </Routes>
  );
};

export default ReferralNavigations;

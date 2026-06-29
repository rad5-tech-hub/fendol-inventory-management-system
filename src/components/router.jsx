import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LogIn from "./shared/login/login";
import ProtectedRoute from "./protect-routes";
import { Provider } from "react-redux";
import store from "./shared/reduxForProtectingRoute/store";
import { hasPermission } from "./shared/permissions/permissions";
import AdminNavigations from "./admin/adminRoutes";
import CustomerNavigations from "./customer/customerRoute";
import FeedNavigations from "./feed/feedRouter";
import ProcessNavigations from "./fish-processes/processRouter";
import ProductNavigations from "./products/productRouter";
import ProductStagesNavigations from "./ponds/productStagesRouter";
import StoreNavigations from "./store/storeRouter";
import FinanceNavigations from "./finance/financeRouter";
import DamageLoss from "./damage-loss/damges";
import Complaints from "./complaints/complaints";
import AllComplaints from "./complaints/all-complaints";
import ShowcaseNavigations from "./showcase/showcaseRoute";
import SiteManagementNavigations from "./site-management/siteManagementRouter";
import ManageNavigations from "./manage-fish/manageRoute";
import BatchDashboardNavigations from "./batch-dashboard/batchDashboardRouter";
import HatcheryNavigations from "./hatchery/hatcheryRouter";
import ReferralNavigations from "./referral/referralRouter";
import MlmNavigations from "./mlm/mlmRouter";
import { ToastContainer } from "react-toastify";
import Dashboard from "./dashboard/dashbord";

/**
 * Role-protected route wrapper.
 * Checks both authentication (ProtectedRoute) AND role-based access.
 * Redirects unauthorised users to their default landing page.
 */
const RoleRoute = ({ children, resource }) => {
  const userTypes = useSelector((state) => state.user?.userTypes || []);

  if (!hasPermission(userTypes, resource)) {
    const defaultRoute = hasPermission(userTypes, 'dashboard')
      ? '/dashboard'
      : hasPermission(userTypes, 'customer')
        ? '/customer/view-all'
        : hasPermission(userTypes, 'store')
          ? '/store/view-all'
          : hasPermission(userTypes, 'finance:add-sales')
            ? '/finance/add-sales'
            : hasPermission(userTypes, 'showcase')
              ? '/showcase/broken-showcase'
              : '/';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default function RouterSwitch() {
  return (
    <Provider store={store}>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<LogIn />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute resource="dashboard">
                  <Dashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="admin">
                  <AdminNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="customer/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="customer">
                  <CustomerNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="ponds/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="ponds">
                  <ProductStagesNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="manage-fish/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="manage-fish">
                  <ManageNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="fish-processes/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="fish-processes">
                  <ProcessNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="products/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="products">
                  <ProductNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="feed/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="feed">
                  <FeedNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="store/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="store">
                  <StoreNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="damage-loss"
            element={
              <ProtectedRoute>
                <RoleRoute resource="damage-loss">
                  <DamageLoss />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="complaints"
            element={
              <ProtectedRoute>
                <RoleRoute resource="complaints">
                  <Complaints />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="complaints/all"
            element={
              <ProtectedRoute>
                <RoleRoute resource="complaints:view-all">
                  <AllComplaints />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="finance:add-sales">
                  <FinanceNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="showcase/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="showcase">
                  <ShowcaseNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="site-management/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="site-management">
                  <SiteManagementNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="batch-dashboard/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="batch-dashboard">
                  <BatchDashboardNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="hatchery/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="hatchery">
                  <HatcheryNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="referral/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="referral">
                  <ReferralNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="mlm/*"
            element={
              <ProtectedRoute>
                <RoleRoute resource="mlm">
                  <MlmNavigations />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </Provider>
  );
}

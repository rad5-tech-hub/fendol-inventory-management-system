import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LogIn from "./shared/login/login";
import ForgotPassword from "./shared/forgot-password/forgot-password";
import ResetPassword from "./shared/reset-password/reset-password";
import ProtectedRoute from "./protect-routes";
import { Provider } from "react-redux";
import store from "./shared/reduxForProtectingRoute/store";
import { hasPermission } from "./shared/permissions/permissions";
import { ToastContainer } from "react-toastify";

const AdminNavigations = lazy(() => import("./admin/adminRoutes"));
const CustomerNavigations = lazy(() => import("./customer/customerRoute"));
const FeedNavigations = lazy(() => import("./feed/feedRouter"));
const ProcessNavigations = lazy(() => import("./fish-processes/processRouter"));
const ProductNavigations = lazy(() => import("./products/productRouter"));
const ProductStagesNavigations = lazy(() => import("./ponds/productStagesRouter"));
const StoreNavigations = lazy(() => import("./store/storeRouter"));
const FinanceNavigations = lazy(() => import("./finance/financeRouter"));
const DamageLoss = lazy(() => import("./damage-loss/damges"));
const Complaints = lazy(() => import("./complaints/complaints"));
const AllComplaints = lazy(() => import("./complaints/all-complaints"));
const ShowcaseNavigations = lazy(() => import("./showcase/showcaseRoute"));
const SiteManagementNavigations = lazy(() => import("./site-management/siteManagementRouter"));
const ManageNavigations = lazy(() => import("./manage-fish/manageRoute"));
const BatchDashboardNavigations = lazy(() => import("./batch-dashboard/batchDashboardRouter"));
const HatcheryNavigations = lazy(() => import("./hatchery/hatcheryRouter"));
const ReferralNavigations = lazy(() => import("./referral/referralRouter"));
const MlmNavigations = lazy(() => import("./mlm/mlmRouter"));
const Dashboard = lazy(() => import("./dashboard/dashbord"));

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

const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default function RouterSwitch() {
  return (
    <Provider store={store}>
      <Router>
        <ToastContainer />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LogIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
        </Suspense>
      </Router>
    </Provider>
  );
}

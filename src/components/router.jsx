import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogIn from "./shared/login/login";
import ProtectedRoute from "./protect-routes";
import { Provider } from "react-redux";
import store from "./shared/reduxForProtectingRoute/store";
import AdminNavigations from "./admin/adminRoutes";
import CustomerNavigations from "./customer/customerRoute";
import FeedNavigations from "./feed/feedRouter";
import ProcessNavigations from "./fish-processes/processRouter";
import ProductNavigations from "./products/productRouter";
import ProductStagesNavigations from "./ponds/productStagesRouter";
import StoreNavigations from "./store/storeRouter";
import FinanceNavigations from "./finance/financeRouter";
import DamageLoss from "./damage-loss/damges";
import ShowcaseNavigations from "./showcase/showcaseRoute";
import ManageNavigations from "./manage-fish/manageRoute";
import { ToastContainer } from "react-toastify";
import Dashboard from "./dashboard/dashbord";

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
                  <Dashboard/>
                </ProtectedRoute>
              }
          />   
          <Route
              path="admin/*"
              element={
                <ProtectedRoute>
                  <AdminNavigations/>
                </ProtectedRoute>
              }
          />        
          
          <Route
            path="customer/*"
            element={
              <ProtectedRoute>
                <CustomerNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="ponds/*"
            element={
              <ProtectedRoute>
                <ProductStagesNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="manage-fish/*"
            element={
              <ProtectedRoute>
                <ManageNavigations/>
              </ProtectedRoute>
            }
          />
          <Route
            path="fish-processes/*"
            element={
              <ProtectedRoute>
                <ProcessNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/*"
            element={
              <ProtectedRoute>
                <ProductNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="feed/*"
            element={
              <ProtectedRoute>
                <FeedNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="store/*"
            element={
              <ProtectedRoute>
                <StoreNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="damage-loss"
            element={
              <ProtectedRoute>
                <DamageLoss />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/*"
            element={
              <ProtectedRoute>
                <FinanceNavigations />
              </ProtectedRoute>
            }
          />
          <Route
            path="showcase/*"
            element={
              <ProtectedRoute>
                <ShowcaseNavigations />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </Provider>
  );
}

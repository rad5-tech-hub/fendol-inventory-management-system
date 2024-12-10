import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const auth = useSelector((store) => store.authenticated);
  const token = sessionStorage.getItem('authToken');

  // Check if the token exists and if it's expired
  useEffect(() => {
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decoding JWT
      const currentTime = Date.now() / 1000; // Current time in seconds

      // If the token is expired
      if (decodedToken.exp < currentTime) {
        sessionStorage.removeItem('authToken'); // Remove expired token
        sessionStorage.removeItem('role'); // Remove role if token is expired
        return <Navigate to="/" />; // Redirect to login page
      }
    }
  }, [token]);

  if (!auth || !token) {
    sessionStorage.removeItem('authToken'); // Clear authToken when navigating to login
    sessionStorage.removeItem('role'); // Clear role if no token
    return <Navigate to="/" />; // Redirect to login page
  }

  return children;
};

export default ProtectedRoute;

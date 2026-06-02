import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector((store) => store.authenticated);
  const user = useSelector((store) => store.user);
  const token = sessionStorage.getItem("authToken");
  const navigate = useNavigate();
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Function to check token expiration
  const checkTokenExpiration = () => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        const currentTime = Date.now() / 1000; // Current time in seconds

        if (decodedToken.exp < currentTime) {
          // Token has expired
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("role");
          setIsTokenValid(false);
          navigate("/"); // Navigate to login page
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error decoding token:", error);
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("role");
        setIsTokenValid(false);
        navigate("/");
        return false;
      }
    }
    return false; // No token present
  };

  // Check token on mount and when it changes
  useEffect(() => {
    if (!token || !isAuth) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("role");
      setIsTokenValid(false);
      navigate("/");
      return;
    }

    const isValid = checkTokenExpiration();
    setIsTokenValid(isValid);

    // Optional: Set up an interval to periodically check token expiration
    const interval = setInterval(() => {
      if (!checkTokenExpiration()) {
        clearInterval(interval); // Stop checking once expired
      }
    }, 60000); // Check every minute

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [token, isAuth, navigate]);

  // If no token, not authenticated, or token is invalid, redirect to login
  if (!token || !isAuth || !isTokenValid) {
    return <Navigate to="/" replace />;
  }

  // Render children if token is valid
  return children;
};

export default ProtectedRoute;
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Correct named import
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Toastify CSS

// Function to check if the token is expired
const isTokenExpired = (token) => {
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        const currentTime = Date.now() / 1000; // Get the current time in seconds
        return decodedToken.exp < currentTime; // Check if token is expired
    } catch (error) {
        return true; // If there is an error decoding, assume the token is invalid
    }
};

// Request interceptor to add Authorization header and handle token expiration
const Api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

Api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('authToken');
        if (token) {
            if (isTokenExpired(token)) {
                console.warn("Token is expired, redirecting to login page.");
                
                // Display a toast notification
                toast.error("Your session has expired. Please re-login.", {
                    position: toast.POSITION.TOP_CENTER,
                    autoClose: 5000, // Close after 5 seconds
                    onClose: () => {
                        window.location.href = '/'; // Redirect after toast closes
                    }
                });
                
                return Promise.reject(new Error("Token expired")); // Cancel the request
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default Api;

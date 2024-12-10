import { LOGIN_USER, LOGOUT_USER } from './types';

export const loginUser = (token) => {
  sessionStorage.setItem('authToken', token); // Save token to local storage
  return {
    type: LOGIN_USER,
  };
};

export const logoutUser = () => {
  sessionStorage.clear('authToken'); // Remove token from local storage
  return {
    type: LOGOUT_USER,
  };
};

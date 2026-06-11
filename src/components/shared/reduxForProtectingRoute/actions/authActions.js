import { LOGIN_USER, LOGOUT_USER, SET_ACTIVE_SITE } from './types';
import { jwtDecode } from 'jwt-decode';
import { extractUserTypes } from '../../permissions/permissions';

export const loginUser = (token) => {
  sessionStorage.setItem('authToken', token); // Save token to session storage
  const decoded = (() => {
    try {
      return jwtDecode(token);
    } catch (error) {
      return {};
    }
  })();

  const userTypes = extractUserTypes(decoded);
  const userSites = decoded.sites || decoded.userSites || decoded.assignedSites || [];

  return {
    type: LOGIN_USER,
    payload: {
      user: {
        ...decoded,
        userTypes,
        userSites: Array.isArray(userSites) ? userSites : [],
      },
    },
  };
};

export const logoutUser = () => {
  sessionStorage.removeItem('authToken'); // Remove token from session storage
  return {
    type: LOGOUT_USER,
  };
};

export const setActiveSite = (site) => ({
  type: SET_ACTIVE_SITE,
  payload: site,
});

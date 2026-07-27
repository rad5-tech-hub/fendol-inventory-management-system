import { LOGIN_USER, LOGOUT_USER, SET_ACTIVE_SITE } from './types';
import { jwtDecode } from 'jwt-decode';
import { extractUserTypes } from '../../permissions/permissions';

const extractFirstSiteId = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  return first?.id || (typeof first === 'string' ? first : null);
};

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
  const userSites = decoded.sites || decoded.userSites || decoded.assignedSites || decoded.siteIds || [];
  const sitesArr = Array.isArray(userSites) ? userSites : [];

  return {
    type: LOGIN_USER,
    payload: {
      user: {
        ...decoded,
        siteId: decoded.siteId || extractFirstSiteId(sitesArr),
        userTypes,
        userSites: sitesArr,
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

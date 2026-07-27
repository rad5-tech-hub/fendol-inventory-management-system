import { LOGIN_USER, LOGOUT_USER, SET_ACTIVE_SITE } from '../actions/types';
import { jwtDecode } from 'jwt-decode';
import { extractUserTypes } from '../../permissions/permissions';

const LS_KEY = 'fendol_active_site';

const loadActiveSite = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const extractFirstSiteId = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  return first?.id || (typeof first === 'string' ? first : null);
};

const token = sessionStorage.getItem('authToken');
const getInitialUser = () => {
  if (!token) return { userTypes: [], userSites: [] };

  try {
    const decoded = jwtDecode(token);
    const userSites = decoded.sites || decoded.userSites || decoded.assignedSites || decoded.siteIds || [];
    const sitesArr = Array.isArray(userSites) ? userSites : [];
    console.log('[getInitialUser] decoded JWT fields:', { sites: decoded.sites, userSites: decoded.userSites, assignedSites: decoded.assignedSites, siteIds: decoded.siteIds });
    console.log('[getInitialUser] resolved sitesArr:', sitesArr);
    console.log('[getInitialUser] extractFirstSiteId result:', extractFirstSiteId(sitesArr));
    return {
      ...decoded,
      siteId: decoded.siteId || extractFirstSiteId(sitesArr),
      userTypes: extractUserTypes(decoded),
      userSites: sitesArr,
    };
  } catch {
    return { userTypes: [], userSites: [] };
  }
};

const initialState = {
  authenticated: !!token,
  user: getInitialUser(),
  activeSite: loadActiveSite(),
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        authenticated: true,
        user: action.payload?.user || { userTypes: [] },
        activeSite: loadActiveSite(),
      };
    case LOGOUT_USER:
      localStorage.removeItem(LS_KEY);
      return {
        ...state,
        authenticated: false,
        user: { userTypes: [] },
        activeSite: null,
      };
    case SET_ACTIVE_SITE:
      if (action.payload) {
        localStorage.setItem(LS_KEY, JSON.stringify(action.payload));
      } else {
        localStorage.removeItem(LS_KEY);
      }
      return {
        ...state,
        activeSite: action.payload,
      };
    default:
      return state;
  }
};

export default authReducer;

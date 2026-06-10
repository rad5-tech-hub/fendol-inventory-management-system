import { LOGIN_USER, LOGOUT_USER } from '../actions/types';
import { jwtDecode } from 'jwt-decode';
import { extractUserTypes } from '../../permissions/permissions';


const token = sessionStorage.getItem('authToken');
const getInitialUser = () => {
  if (!token) return { userTypes: [], userSites: [] };

  try {
    const decoded = jwtDecode(token);
    const userSites = decoded.sites || decoded.userSites || decoded.assignedSites || [];
    return {
      ...decoded,
      userTypes: extractUserTypes(decoded),
      userSites: Array.isArray(userSites) ? userSites : [],
    };
  } catch {
    return { userTypes: [], userSites: [] };
  }
};

const initialState = {
  authenticated: !!token,
  user: getInitialUser(),
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        authenticated: true,
        user: action.payload?.user || { userTypes: [] },
      };
    case LOGOUT_USER:
      return {
        ...state,
        authenticated: false,
        user: { userTypes: [] },
      };
    default:
      return state;
  }
};

export default authReducer;

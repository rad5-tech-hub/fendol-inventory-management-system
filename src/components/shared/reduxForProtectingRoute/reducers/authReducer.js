import { LOGIN_USER, LOGOUT_USER } from '../actions/types';
import { jwtDecode } from 'jwt-decode';
import { extractUserTypes } from '../../permissions/permissions';


const token = sessionStorage.getItem('authToken');
const getInitialUser = () => {
  if (!token) return { userTypes: [] };

  try {
    const decoded = jwtDecode(token);
    return {
      ...decoded,
      userTypes: extractUserTypes(decoded),
    };
  } catch {
    return { userTypes: [] };
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

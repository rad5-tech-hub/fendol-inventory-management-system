import { LOGIN_USER, LOGOUT_USER } from '../actions/types';

const initialState = {
  authenticated: !! sessionStorage.getItem('authToken'), // Check localStorage for the token
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return { ...state, authenticated: true };
    case LOGOUT_USER:
      return { ...state, authenticated: false };
    default:
      return state;
  }
};

export default authReducer;

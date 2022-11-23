import {
  SET_THEME,
  SET_ACTIVE_LINK,
  SET_ALERT,
  REMOVE_ALERT,
} from "../actions/types";

const initialState = {
  activeLink: "home",
  alert: null,
  theme: localStorage.getItem("theme"),
};

const layoutReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    case SET_ACTIVE_LINK:
      return {
        ...state,
        activeLink: action.payload,
      };
    case SET_ALERT:
      return {
        ...state,
        alert: action.payload,
      };
    case REMOVE_ALERT:
      return {
        ...state,
        alert: null,
      };
    default:
      return state;
  }
};

export default layoutReducer;

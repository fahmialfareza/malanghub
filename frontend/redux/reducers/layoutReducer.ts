import { PayloadAction } from "@reduxjs/toolkit";
import {
  SET_THEME,
  SET_ACTIVE_LINK,
  SET_ALERT,
  REMOVE_ALERT,
} from "../actions/types";
import { LayoutReducerState } from "../types";

const initialState: LayoutReducerState = {
  activeLink: "home",
  alert: null,
  theme: typeof window !== "undefined" ? localStorage.getItem("theme") : null,
};

const layoutReducer = (state = initialState, action: PayloadAction<any>) => {
  switch (action.type) {
    case SET_THEME:
      document.documentElement.setAttribute("data-theme", action.payload);
      localStorage.setItem("theme", action.payload);
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

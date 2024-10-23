import { Dispatch } from "@reduxjs/toolkit";
import { SET_THEME, SET_ACTIVE_LINK, SET_ALERT, REMOVE_ALERT } from "./types";

// Set Theme
export const setTheme = (theme: string) => (dispatch: Dispatch) => {
  dispatch({
    type: SET_THEME,
    payload: theme,
  });
};

export const setActiveLink = (link: string) => (dispatch: Dispatch) => {
  dispatch({
    type: SET_ACTIVE_LINK,
    payload: link,
  });
};

export const setAlert =
  (message: string, type: string) => (dispatch: Dispatch) => {
    dispatch({
      type: SET_ALERT,
      payload: { message, type },
    });

    setTimeout(() => {
      dispatch({
        type: REMOVE_ALERT,
      });
    }, 5000);
  };

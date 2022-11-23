import { SET_THEME, SET_ACTIVE_LINK, SET_ALERT, REMOVE_ALERT } from "./types";

// Set Theme
export const setTheme = (theme) => (dispatch) => {
  dispatch({
    type: SET_THEME,
    payload: theme,
  });
};

export const setActiveLink = (link) => (dispatch) => {
  dispatch({
    type: SET_ACTIVE_LINK,
    payload: link,
  });
};

export const setAlert = (message, type) => (dispatch) => {
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

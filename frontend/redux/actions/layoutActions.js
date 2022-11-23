import { SET_THEME, SET_ACTIVE_LINK, SET_ALERT, REMOVE_ALERT } from "./types";

// Set Theme
export const setTheme = () => (dispatch) => {
  if (localStorage.getItem("theme") === "dark") {
    dispatch({
      type: SET_THEME,
      payload: "light",
    });
  } else if (localStorage.getItem("theme") === "light") {
    dispatch({
      type: SET_THEME,
      payload: "dark",
    });
  }
};

export const setThemeLocal = (theme) => (dispatch) => {
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

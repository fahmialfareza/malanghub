import {
  USER_SIGNUP_SUCCESS,
  USER_SIGNUP_FAIL,
  USER_LOADED,
  USER_GET_PROFILE,
  USER_GET_PROFILE_ERROR,
  USER_AUTH_ERROR,
  USER_SIGNIN_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_LOGOUT,
  USER_CLEAR_ERRORS,
  USER_UPDATE_PROFILE,
  USER_UPDATE_PROFILE_ERRORS,
  SET_LOADING,
} from "./types";
import { request, setAuthToken } from "../../utils/axiosCreate";
import { requestNextApi } from "../../utils/axiosNextApi";

// Load User
export const loadUser = () => async (dispatch) => {
  setLoading();

  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }

  try {
    const res = await request.get("/api/users");

    dispatch({
      type: USER_LOADED,
      payload: res.data.data,
    });
  } catch (e) {
    localStorage.removeItem("token");
    dispatch({
      type: USER_AUTH_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: USER_CLEAR_ERRORS,
      });
    }, 5000);
  }
};

export const getUserProfile = (data) => async (dispatch) => {
  dispatch({
    type: USER_GET_PROFILE,
    payload: data,
  });
};

export const getUser = (id) => async (dispatch) => {
  setLoading();

  let config = {
    method: "get",
    url: `/api/users/${id}`,
  };

  try {
    const res = await request(config);

    dispatch({
      type: USER_GET_PROFILE,
      payload: res.data.data,
    });
  } catch (e) {
    dispatch({
      type: USER_GET_PROFILE_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: USER_CLEAR_ERRORS,
      });
    }, 5000);
  }
};

// Update Profile
export const updateProfile = (formData) => async (dispatch) => {
  setLoading();

  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }

  let data = new FormData();
  data.append("name", formData.name);
  if (formData.photo) data.append("photo", formData.photo, formData.photoName);
  if (formData.motto) data.append("motto", formData.motto);
  if (formData.bio) data.append("bio", formData.bio);
  if (formData.instagram) data.append("instagram", formData.instagram);
  if (formData.facebook) data.append("facebook", formData.facebook);
  if (formData.twitter) data.append("twitter", formData.twitter);
  if (formData.tiktok) data.append("tiktok", formData.tiktok);
  if (formData.linkedin) data.append("linkedin", formData.linkedin);

  var config = {
    method: "put",
    url: "/api/users",
    data: data,
  };

  try {
    const res = await request(config);

    dispatch({
      type: USER_UPDATE_PROFILE,
      payload: res.data.data,
    });
  } catch (e) {
    dispatch({
      type: USER_UPDATE_PROFILE_ERRORS,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: USER_CLEAR_ERRORS,
      });
    }, 5000);
  }
};

// Sign Up
export const signUp = (formData) => async (dispatch) => {
  setLoading();

  const config = {
    method: "post",
    url: "/api/signup",
    data: formData,
  };

  try {
    const res = await requestNextApi(config);

    localStorage.setItem("token", res.data.token);

    dispatch({
      type: USER_SIGNUP_SUCCESS,
      payload: res.data,
    });

    loadUser();
  } catch (e) {
    localStorage.removeItem("token");
    dispatch({
      type: USER_SIGNUP_FAIL,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: USER_CLEAR_ERRORS,
      });
    }, 5000);
  }
};

// Login user
export const signIn = (formData) => async (dispatch) => {
  setLoading();

  const config = {
    method: "post",
    url: "/api/signin",
    data: formData,
  };

  try {
    const res = await requestNextApi(config);

    localStorage.setItem("token", res.data.token);

    dispatch({
      type: USER_SIGNIN_SUCCESS,
      payload: res.data,
    });

    loadUser();
  } catch (e) {
    localStorage.removeItem("token");
    dispatch({
      type: USER_SIGNIN_FAIL,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: USER_CLEAR_ERRORS,
      });
    }, 5000);
  }
};

// Logout
export const logout = () => async (dispatch) => {
  try {
    localStorage.removeItem("token");

    var config = {
      method: "post",
      url: "/api/signout",
      headers: {},
    };

    await requestNextApi(config);

    dispatch({ type: USER_LOGOUT });
  } catch (e) {
    localStorage.removeItem("token");
    dispatch({
      type: USER_SIGNIN_FAIL,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: USER_CLEAR_ERRORS,
      });
    }, 5000);
  }
};

// Set loading to true
export const setLoading = () => {
  return {
    type: SET_LOADING,
  };
};

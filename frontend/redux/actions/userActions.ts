import * as Sentry from "@sentry/nextjs";
import { Dispatch } from "@reduxjs/toolkit";
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
import { AxiosError } from "axios";
import { Response } from "../../models/axios";
import { UserProfile } from "../../models/user";
import {
  AuthResponse,
  GoogleLoginRequest,
  SignInRequest,
  SignUpRequest,
  UpdateProfileRequest,
} from "./types/user";

// Load User
export const loadUser = () => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "userActions.loadUser" }, async () => {
    setLoading();

    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }

    try {
      const res = await request.get<Response<UserProfile>>("/api/users");

      dispatch({
        type: USER_LOADED,
        payload: res.data.data,
      });
    } catch (e) {
      Sentry.captureException(e);
      localStorage.removeItem("token");

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: USER_AUTH_ERROR,
          payload: error.response?.data.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: USER_CLEAR_ERRORS,
        });
      }, 5000);
    }
  });
};

export const getUserProfile =
  (data: UserProfile) => async (dispatch: Dispatch) => {
    dispatch({
      type: USER_GET_PROFILE,
      payload: data,
    });
  };

export const getUser = (id: string) => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "userActions.getUser" }, async () => {
    setLoading();

    let config = {
      method: "get",
      url: `/api/users/${id}`,
    };

    try {
      const res = await request<Response<UserProfile>>(config);

      dispatch({
        type: USER_GET_PROFILE,
        payload: res.data.data,
      });
    } catch (e) {
      Sentry.captureException(e);

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: USER_GET_PROFILE_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: USER_CLEAR_ERRORS,
        });
      }, 5000);
    }
  });
};

// Update Profile
export const updateProfile =
  (formData: UpdateProfileRequest) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "userActions.updateProfile" }, async () => {
      setLoading();

      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token);
      }

      let data = new FormData();
      data.append("name", formData.name);
      if (formData.photo)
        data.append("photo", formData.photo, formData.photoName);
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
        const res = await request<Response<UserProfile>>(config);

        dispatch({
          type: USER_UPDATE_PROFILE,
          payload: res.data.data,
        });
      } catch (e) {
        Sentry.captureException(e);

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: USER_UPDATE_PROFILE_ERRORS,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: USER_CLEAR_ERRORS,
          });
        }, 5000);
      }
    });
  };

// Sign Up
export const signUp =
  (formData: SignUpRequest) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "userActions.signUp" }, async () => {
      setLoading();

      const config = {
        method: "post",
        url: "/api/signup",
        data: formData,
      };

      try {
        const res = await requestNextApi<AuthResponse>(config);

        localStorage.setItem("token", res.data.token);

        dispatch({
          type: USER_SIGNUP_SUCCESS,
          payload: res.data,
        });

        loadUser();
      } catch (e) {
        Sentry.captureException(e);
        localStorage.removeItem("token");

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: USER_SIGNUP_FAIL,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: USER_CLEAR_ERRORS,
          });
        }, 5000);
      }
    });
  };

// Login user
export const signIn =
  (formData: SignInRequest) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "userActions.signIn" }, async () => {
      setLoading();

      const config = {
        method: "post",
        url: "/api/signin",
        data: formData,
      };

      try {
        const res = await requestNextApi<AuthResponse>(config);

        localStorage.setItem("token", res.data.token);

        dispatch({
          type: USER_SIGNIN_SUCCESS,
          payload: res.data,
        });

        loadUser();
      } catch (e) {
        Sentry.captureException(e);
        localStorage.removeItem("token");

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: USER_SIGNIN_FAIL,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: USER_CLEAR_ERRORS,
          });
        }, 5000);
      }
    });
  };

// Google Login
export const googleLogin =
  (formData: GoogleLoginRequest) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "userActions.googleLogin" }, async () => {
      setLoading();

      const config = {
        method: "post",
        url: "/api/google",
        data: formData,
      };

      try {
        const res = await requestNextApi<AuthResponse>(config);

        localStorage.setItem("token", res.data.token);

        dispatch({
          type: USER_SIGNIN_SUCCESS,
          payload: res.data,
        });

        loadUser();
      } catch (e) {
        Sentry.captureException(e);
        localStorage.removeItem("token");

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: USER_SIGNIN_FAIL,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: USER_CLEAR_ERRORS,
          });
        }, 5000);
      }
    });
  };

// Logout
export const logout = () => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "userActions.logout" }, async () => {
    try {
      localStorage.removeItem("token");

      var config = {
        method: "post",
        url: "/api/signout",
        headers: {},
      };

      await requestNextApi<Response<any>>(config);

      dispatch({ type: USER_LOGOUT });
    } catch (e) {
      Sentry.captureException(e);
      localStorage.removeItem("token");

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: USER_SIGNIN_FAIL,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: USER_CLEAR_ERRORS,
        });
      }, 5000);
    }
  });
};

// Set loading to true
export const setLoading = () => {
  return {
    type: SET_LOADING,
  };
};

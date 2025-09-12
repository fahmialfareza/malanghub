import { PayloadAction } from "@reduxjs/toolkit";
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
} from "../actions/types";
import { UserReducerState } from "../types";

const initialState: UserReducerState = {
  isAuthenticated: false,
  loading: false,
  userProfile: null,
  user: null,
  error: null,
  token: null,
};

const userReducer = (state = initialState, action: PayloadAction<any>) => {
  switch (action.type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
      };
    case USER_GET_PROFILE:
      return {
        ...state,
        loading: false,
        userProfile: action.payload,
      };
    case USER_SIGNUP_SUCCESS:
    case USER_SIGNIN_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false,
        token: action.payload.token,
      };
    case USER_UPDATE_PROFILE:
      return {
        ...state,
        loading: false,
        user: action.payload,
      };
    case USER_UPDATE_PROFILE_ERRORS:
    case USER_GET_PROFILE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case USER_SIGNUP_FAIL:
    case USER_AUTH_ERROR:
    case USER_SIGNIN_FAIL:
    case USER_LOGOUT:
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload,
      };
    case USER_CLEAR_ERRORS:
      return {
        ...state,
        loading: false,
        error: null,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
};

export default userReducer;

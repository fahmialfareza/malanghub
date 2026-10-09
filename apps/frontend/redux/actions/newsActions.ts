import {
  GET_MY_NEWS,
  GET_ONE_NEWS,
  NEWS_ERROR,
  NEWS_CLEAR_ERROR,
  SET_LOADING,
} from "./types";
import { request, setAuthToken } from "../../utils/axiosCreate";
import * as Sentry from "@sentry/nextjs";
import { Dispatch } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Response } from "../../models/axios";

export const getMyNews = () => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsActions.getMyNews" }, async () => {
    setLoading();

    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }

    let config = {
      method: "get",
      url: "/api/news/myNews",
    };

    try {
      const res = await request(config);

      dispatch({
        type: GET_MY_NEWS,
        payload: res.data.data,
      });
    } catch (e) {
      Sentry.captureException(e);

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

// Get One
export const getOne = (id: string) => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsActions.getOne" }, async () => {
    setLoading();

    let config = {
      method: "get",
      url: `/api/news/${id}`,
    };

    try {
      const res = await request(config);

      dispatch({
        type: GET_ONE_NEWS,
        payload: res.data.data,
      });
    } catch (e) {
      Sentry.captureException(e);

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_CLEAR_ERROR,
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

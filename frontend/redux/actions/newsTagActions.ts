import {
  GET_ALL_NEWS_TAGS,
  ADD_NEWS_TAG,
  SELECT_NEWS_TAG,
  UPDATE_NEWS_TAG,
  DELETE_NEWS_TAG,
  CLEAR_ALL_NEWS_TAGS,
  NEWS_TAGS_ERROR,
  NEWS_TAGS_CLEAR_ERROR,
  SET_LOADING,
} from "./types";
import { request, setAuthToken } from "../../utils/axiosCreate";
import * as Sentry from "@sentry/nextjs";
import { Dispatch } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Response } from "../../models/axios";
import { CreateUpdateNewsTag } from "./types/newsTag";
import { NewsTag } from "../../models/news";

// Get All News Tag
export const getNewsTags = () => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsTagActions.getNewsTags" }, async () => {
    setLoading();

    let config = {
      method: "get",
      url: "/api/newsTags",
      headers: {},
    };

    try {
      let response = await request(config);
      let data = await response.data.data;

      dispatch({
        type: GET_ALL_NEWS_TAGS,
        payload: data,
      });
    } catch (e) {
      Sentry.captureException(e);

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_TAGS_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_TAGS_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

export const createNewsTag =
  (formData: CreateUpdateNewsTag) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsTagActions.createNewsTag" }, async () => {
      setLoading();

      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token);
      }

      let config = {
        method: "post",
        url: "/api/newsTags",
        data: formData,
      };

      try {
        const res = await request(config);

        dispatch({
          type: ADD_NEWS_TAG,
          payload: res.data.data,
        });
      } catch (e) {
        Sentry.captureException(e);

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: NEWS_TAGS_ERROR,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: NEWS_TAGS_CLEAR_ERROR,
          });
        }, 5000);
      }
    });
  };

export const selectNewsTag =
  (newsTag: NewsTag) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsTagActions.selectNewsTag" }, () => {
      try {
        dispatch({
          type: SELECT_NEWS_TAG,
          payload: newsTag,
        });
      } catch (e) {
        Sentry.captureException(e);
        dispatch({
          type: NEWS_TAGS_ERROR,
          payload: e,
        });

        setTimeout(() => {
          dispatch({
            type: NEWS_TAGS_CLEAR_ERROR,
          });
        }, 5000);
      }
    });
  };

export const updateNewsTag =
  (formData: CreateUpdateNewsTag, id: string) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsTagActions.updateNewsTag" }, async () => {
      setLoading();

      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token);
      }

      let config = {
        method: "put",
        url: `/api/newsTags/${id}`,
        data: formData,
      };

      try {
        const res = await request(config);

        dispatch({
          type: UPDATE_NEWS_TAG,
          payload: res.data.data,
        });
      } catch (e) {
        Sentry.captureException(e);

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: NEWS_TAGS_ERROR,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: NEWS_TAGS_CLEAR_ERROR,
          });
        }, 5000);
      }
    });
  };

export const deleteNewsTag = (id: string) => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsTagActions.deleteNewsTag" }, async () => {
    setLoading();

    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }

    let config = {
      method: "delete",
      url: `/api/newsTags/${id}`,
    };

    try {
      await request(config);

      dispatch({
        type: DELETE_NEWS_TAG,
        payload: id,
      });
    } catch (e) {
      Sentry.captureException(e);

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_TAGS_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_TAGS_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

export const clearNewsTags = () => {
  return {
    type: CLEAR_ALL_NEWS_TAGS,
  };
};

// Set loading to true
export const setLoading = () => {
  return {
    type: SET_LOADING,
  };
};

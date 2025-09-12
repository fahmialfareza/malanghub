import {
  GET_ALL_NEWS,
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

// Get All News
export const getAllNews = (page: number) => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsActions.getAllNews" }, async () => {
    setLoading();

    let configAll = {
      method: "get",
      url: `/api/news?page=${page}&sort=-created_at&limit=5`,
    };

    try {
      let response = await Promise.all([request(configAll)]);

      let dataAll = response[0].data;

      dispatch({
        type: GET_ALL_NEWS,
        payload: {
          allNews: dataAll,
        },
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

// Search News
export const getNewsBySearch =
  (search: string, page: number) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsActions.getNewsBySearch" }, async () => {
      setLoading();

      let configSearch = {
        method: "get",
        url: `/api/news/search?page=${page}&sort=-vews&limit=5&search=${search}`,
      };

      try {
        let response = await Promise.all([request(configSearch)]);

        let dataSearch = response[0].data;

        dispatch({
          type: GET_ALL_NEWS,
          payload: {
            newsBySearch: dataSearch,
          },
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

// Get News by Category
export const getNewsByCategory =
  (id: string, page: number) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsActions.getNewsByCategory" }, async () => {
      setLoading();

      let configCategory = {
        method: "get",
        url: `/api/news?page=${page}&sort=-created_at&limit=5&category=${id}`,
      };

      try {
        let response = await Promise.all([request(configCategory)]);

        let dataCategory = response[0].data;

        dispatch({
          type: GET_ALL_NEWS,
          payload: {
            newsByCategory: dataCategory,
          },
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

export const getNewsByTag =
  (id: string, page: number) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsActions.getNewsByTag" }, async () => {
      setLoading();

      let configTag = {
        method: "get",
        url: `/api/news?page=${page}&sort=-created_at&limit=5&tags=${id}`,
        headers: {},
      };

      try {
        let response = await Promise.all([request(configTag)]);

        let dataTag = response[0].data;

        dispatch({
          type: GET_ALL_NEWS,
          payload: {
            newsByTag: dataTag,
          },
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

// Get News by User
export const getNewsByUser =
  (userQuery: string, page: number) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsActions.getNewsByUser" }, async () => {
      setLoading();

      let configUser = {
        method: "get",
        url: `/api/news?page=${page}&sort=-created_at&limit=4&user=${userQuery}`,
      };

      try {
        let response = await Promise.all([request(configUser)]);

        let dataUser = response[0].data;

        dispatch({
          type: GET_ALL_NEWS,
          payload: {
            newsByUser: dataUser,
          },
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

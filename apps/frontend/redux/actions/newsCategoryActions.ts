import {
  GET_ALL_NEWS_CATEGORIES,
  ADD_NEWS_CATEGORY,
  SELECT_NEWS_CATEGORY,
  UPDATE_NEWS_CATEGORY,
  DELETE_NEWS_CATEGORY,
  NEWS_CATEGORIES_ERROR,
  NEWS_CATEGORIES_CLEAR_ERROR,
  SET_LOADING,
} from "./types";
import { request, setAuthToken } from "../../utils/axiosCreate";
import * as Sentry from "@sentry/nextjs";
import { Dispatch } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Response } from "../../models/axios";
import { CreateUpdateNewsCategory } from "./types/newsCategory";
import { NewsCategory } from "../../models/news";

// Get All News Category
export const getNewsCategories = () => async (dispatch: Dispatch) => {
  Sentry.startSpan(
    { name: "newsCategoryActions.getNewsCategories" },
    async () => {
      setLoading();

      let config = {
        method: "get",
        url: `/api/newsCategories`,
      };
      try {
        let response = await request(config);

        dispatch({
          type: GET_ALL_NEWS_CATEGORIES,
          payload: response.data.data,
        });
      } catch (e) {
        Sentry.captureException(e);

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: NEWS_CATEGORIES_ERROR,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: NEWS_CATEGORIES_CLEAR_ERROR,
          });
        }, 5000);
      }
    }
  );
};

export const createNewsCategory =
  (formData: CreateUpdateNewsCategory) => async (dispatch: Dispatch) => {
    Sentry.startSpan(
      { name: "newsCategoryActions.createNewsCategory" },
      async () => {
        setLoading();

        const token = localStorage.getItem("token");
        if (token) {
          setAuthToken(token);
        }

        let data = formData;

        let config = {
          method: "post",
          url: "/api/newsCategories",
          data: data,
        };

        try {
          const res = await request(config);

          dispatch({
            type: ADD_NEWS_CATEGORY,
            payload: res.data.data,
          });
        } catch (e) {
          Sentry.captureException(e);

          if (e instanceof AxiosError) {
            const error = e as AxiosError<Response<any>>;
            dispatch({
              type: NEWS_CATEGORIES_ERROR,
              payload: error?.response?.data?.message,
            });
          }

          setTimeout(() => {
            dispatch({
              type: NEWS_CATEGORIES_CLEAR_ERROR,
            });
          }, 5000);
        }
      }
    );
  };

export const selectNewsCategory =
  (newsCategory: NewsCategory) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsCategoryActions.selectNewsCategory" }, () => {
      try {
        dispatch({
          type: SELECT_NEWS_CATEGORY,
          payload: newsCategory,
        });
      } catch (e) {
        Sentry.captureException(e);
        dispatch({
          type: NEWS_CATEGORIES_ERROR,
          payload: e,
        });

        setTimeout(() => {
          dispatch({
            type: NEWS_CATEGORIES_CLEAR_ERROR,
          });
        }, 5000);
      }
    });
  };

export const updateNewsCategory =
  (formData: CreateUpdateNewsCategory, id: string) =>
  async (dispatch: Dispatch) => {
    Sentry.startSpan(
      { name: "newsCategoryActions.updateNewsCategory" },
      async () => {
        setLoading();

        const token = localStorage.getItem("token");
        if (token) {
          setAuthToken(token);
        }

        let config = {
          method: "put",
          url: `/api/newsCategories/${id}`,
          data: formData,
        };

        try {
          const res = await request(config);

          dispatch({
            type: UPDATE_NEWS_CATEGORY,
            payload: res.data.data,
          });
        } catch (e) {
          Sentry.captureException(e);

          if (e instanceof AxiosError) {
            const error = e as AxiosError<Response<any>>;
            dispatch({
              type: NEWS_CATEGORIES_ERROR,
              payload: error?.response?.data?.message,
            });
          }

          setTimeout(() => {
            dispatch({
              type: NEWS_CATEGORIES_CLEAR_ERROR,
            });
          }, 5000);
        }
      }
    );
  };

export const deleteNewsCategory =
  (id: string) => async (dispatch: Dispatch) => {
    Sentry.startSpan(
      { name: "newsCategoryActions.deleteNewsCategory" },
      async () => {
        setLoading();

        const token = localStorage.getItem("token");
        if (token) {
          setAuthToken(token);
        }

        let config = {
          method: "delete",
          url: `/api/newsCategories/${id}`,
        };

        try {
          await request(config);

          dispatch({
            type: DELETE_NEWS_CATEGORY,
            payload: id,
          });
        } catch (e) {
          Sentry.captureException(e);

          if (e instanceof AxiosError) {
            const error = e as AxiosError<Response<any>>;
            dispatch({
              type: NEWS_CATEGORIES_ERROR,
              payload: error?.response?.data?.message,
            });
          }

          setTimeout(() => {
            dispatch({
              type: NEWS_CATEGORIES_CLEAR_ERROR,
            });
          }, 5000);
        }
      }
    );
  };

// Set loading to true
export const setLoading = () => {
  return {
    type: SET_LOADING,
  };
};

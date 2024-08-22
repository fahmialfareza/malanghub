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

// Get All News Category
export const getNewsCategories = () => async (dispatch) => {
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
        dispatch({
          type: NEWS_CATEGORIES_ERROR,
          payload: e?.response?.data?.message,
        });

        setTimeout(() => {
          dispatch({
            type: NEWS_CATEGORIES_CLEAR_ERROR,
          });
        }, 5000);
      }
    }
  );
};

export const createNewsCategory = (formData) => async (dispatch) => {
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
        dispatch({
          type: NEWS_CATEGORIES_ERROR,
          payload: e?.response?.data?.message,
        });

        setTimeout(() => {
          dispatch({
            type: NEWS_CATEGORIES_CLEAR_ERROR,
          });
        }, 5000);
      }
    }
  );
};

export const selectNewsCategory = (newsCategory) => async (dispatch) => {
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

export const updateNewsCategory = (formData, id) => async (dispatch) => {
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
        dispatch({
          type: NEWS_CATEGORIES_ERROR,
          payload: e?.response?.data?.message,
        });

        setTimeout(() => {
          dispatch({
            type: NEWS_CATEGORIES_CLEAR_ERROR,
          });
        }, 5000);
      }
    }
  );
};

export const deleteNewsCategory = (id) => async (dispatch) => {
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
        dispatch({
          type: NEWS_CATEGORIES_ERROR,
          payload: e?.response?.data?.message,
        });

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

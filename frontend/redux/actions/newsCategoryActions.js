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
import Sentry from "@sentry/nextjs";

// Get All News Category
export const getNewsCategories = () => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCategoryActions.getNewsCategories",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

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
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_CATEGORIES_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const createNewsCategory = (formData) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCategoryActions.createNewsCategory",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

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
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_CATEGORIES_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const selectNewsCategory = (newsCategory) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCategoryActions.selectNewsCategory",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

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
  } finally {
    transaction.finish();
  }
};

export const updateNewsCategory = (formData, id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCategoryActions.updateNewsCategory",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

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
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_CATEGORIES_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const deleteNewsCategory = (id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCategoryActions.deleteNewsCategory",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

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
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_CATEGORIES_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

// Set loading to true
export const setLoading = () => {
  return {
    type: SET_LOADING,
  };
};

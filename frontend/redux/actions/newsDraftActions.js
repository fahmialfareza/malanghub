import {
  GET_ALL_NEWS_DRAFTS,
  GET_MY_DRAFTS,
  ADD_NEWS_DRAFT,
  SELECT_NEWS_DRAFT,
  UPDATE_NEWS_DRAFT,
  UPDATE_NEWS_DRAFT_APPROVED,
  DELETE_NEWS_DRAFT,
  NEWS_DRAFTS_ERROR,
  NEWS_DRAFTS_CLEAR_ERROR,
  SET_LOADING,
} from "./types";
import { request, setAuthToken } from "../../utils/axiosCreate";
import * as Sentry from "@sentry/nextjs";

export const getAllNewsDrafts = () => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.getAllNewsDrafts",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  var config = {
    method: "get",
    url: "/api/newsDrafts",
    headers: {},
  };

  try {
    const res = await request(config);

    dispatch({
      type: GET_ALL_NEWS_DRAFTS,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const getMyNewsDrafts = () => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.getMyNewsDrafts",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }

  var config = {
    method: "get",
    url: "/api/newsDrafts/myDrafts",
  };

  try {
    const res = await request(config);

    dispatch({
      type: GET_MY_DRAFTS,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const getOneByUser = (id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.getOneByUser",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  var config = {
    method: "get",
    url: `/api/newsDrafts/${id}`,
  };

  try {
    const res = await request(config);

    dispatch({
      type: SELECT_NEWS_DRAFT,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const createNewsDraft = (formData) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.createNewsDraft",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }

  let data = new FormData();
  data.append("title", formData.title);
  data.append("category", formData.category);
  data.append("mainImage", formData.mainImage);
  data.append("content", formData.content);
  data.append("tags", formData.tags);

  let config = {
    method: "post",
    url: "/api/newsDrafts",
    data: data,
  };

  try {
    const res = await request(config);

    dispatch({
      type: ADD_NEWS_DRAFT,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const updateNewsDraft = (formData, id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.updateNewsDraft",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }

  let data = new FormData();
  data.append("title", formData.title);
  data.append("category", formData.category);
  if (formData.mainImage) data.append("mainImage", formData.mainImage);
  data.append("content", formData.content);
  data.append("tags", formData.tags);

  let config = {
    method: "put",
    url: `/api/newsDrafts/${id}`,
    data: data,
  };

  try {
    const res = await request(config);

    dispatch({
      type: UPDATE_NEWS_DRAFT,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const updateNewsDraftApproved = (formData, id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.updateNewsDraftApproved",
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
    url: `/api/news/${id}`,
    data: formData,
  };

  try {
    const res = await request(config);

    dispatch({
      type: UPDATE_NEWS_DRAFT_APPROVED,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const selectNewsDraft = (newsDraft) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.selectNewsDraft",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  try {
    dispatch({
      type: SELECT_NEWS_DRAFT,
      payload: newsDraft,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const deleteNewsDraft = (id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsDraftActions.deleteNewsDraft",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }

  var config = {
    method: "delete",
    url: `/api/newsDrafts/${id}`,
  };

  try {
    await request(config);

    dispatch({
      type: DELETE_NEWS_DRAFT,
      payload: id,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
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

import {
  GET_NEWS_COMMENTS_BY_NEWS,
  CREATE_NEWS_COMMENT,
  SELECT_NEWS_COMMENT,
  CREATE_NEWS_COMMENT_BY_COMMENT,
  NEWS_COMMENT_ERROR,
  NEWS_COMMENT_CLEAR_ERROR,
  SET_LOADING,
} from "./types";
import { request, setAuthToken } from "../../utils/axiosCreate";
import * as Sentry from "@sentry/nextjs";

// Get Comment By News
export const getCommentByNews = (id) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCommentActions.getCommentByNews",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  setLoading();

  let config = {
    method: "get",
    url: `/api/newsComments/${id}`,
  };

  try {
    const res = await request(config);

    dispatch({
      type: GET_NEWS_COMMENTS_BY_NEWS,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_COMMENT_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_COMMENT_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const createComment = (id, comment) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCommentActions.createComment",
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
    method: "post",
    url: `/api/newsComments/${id}`,
    data: { comment },
  };

  try {
    const res = await request(config);

    dispatch({
      type: CREATE_NEWS_COMMENT,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_COMMENT_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_COMMENT_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const selectNewsComment = (newsComment) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCommentActions.selectNewsComment",
  });

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  try {
    dispatch({
      type: SELECT_NEWS_COMMENT,
      payload: newsComment,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_COMMENT_ERROR,
      payload: e,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_COMMENT_CLEAR_ERROR,
      });
    }, 5000);
  } finally {
    transaction.finish();
  }
};

export const createCommentByComment = (id, comment) => async (dispatch) => {
  const transaction = Sentry.startTransaction({
    name: "newsCommentActions.createCommentByComment",
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
    method: "post",
    url: `/api/newsComments/commentReply/${id}`,
    data: { comment },
  };

  try {
    const res = await request(config);

    dispatch({
      type: CREATE_NEWS_COMMENT_BY_COMMENT,
      payload: res.data.data,
    });
  } catch (e) {
    Sentry.captureException(e);

    dispatch({
      type: NEWS_COMMENT_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_COMMENT_CLEAR_ERROR,
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

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

// Get All News Tag
export const getNewsTags = () => async (dispatch) => {
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
    dispatch({
      type: NEWS_TAGS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_TAGS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const createNewsTag = (formData) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_TAGS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_TAGS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const selectNewsTag = (newsTag) => async (dispatch) => {
  try {
    dispatch({
      type: SELECT_NEWS_TAG,
      payload: newsTag,
    });
  } catch (e) {
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
};

export const updateNewsTag = (formData, id) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_TAGS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_TAGS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const deleteNewsTag = (id) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_TAGS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_TAGS_CLEAR_ERROR,
      });
    }, 5000);
  }
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

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

export const getAllNewsDrafts = () => async (dispatch) => {
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const getMyNewsDrafts = () => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const getOneByUser = (id) => async (dispatch) => {
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const createNewsDraft = (formData) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const updateNewsDraft = (formData, id) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const updateNewsDraftApproved = (formData, id) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const selectNewsDraft = (newsDraft) => async (dispatch) => {
  try {
    dispatch({
      type: SELECT_NEWS_DRAFT,
      payload: newsDraft,
    });
  } catch (e) {
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

export const deleteNewsDraft = (id) => async (dispatch) => {
  setLoading();

  if (localStorage.token) {
    setAuthToken(localStorage.token);
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
    dispatch({
      type: NEWS_DRAFTS_ERROR,
      payload: e.response.data.message,
    });

    setTimeout(() => {
      dispatch({
        type: NEWS_DRAFTS_CLEAR_ERROR,
      });
    }, 5000);
  }
};

// Set loading to true
export const setLoading = () => {
  return {
    type: SET_LOADING,
  };
};

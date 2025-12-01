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
import { Dispatch } from "@reduxjs/toolkit";
import { setAlert } from "./layoutActions";
import { AxiosError } from "axios";
import { Response } from "../../models/axios";
import {
  CreateUpdateNewsDraft,
  UpdateNewsDraftApproved,
} from "./types/newsDraft";
import { News } from "../../models/news";

export const getAllNewsDrafts = () => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsDraftActions.getAllNewsDrafts" }, async () => {
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

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_DRAFTS_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_DRAFTS_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

export const getMyNewsDrafts = () => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsDraftActions.getMyNewsDrafts" }, async () => {
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

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_DRAFTS_ERROR,
          payload: e?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_DRAFTS_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

export const getOneByUser = (id: string) => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "newsDraftActions.getOneByUser" }, async () => {
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

      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        dispatch({
          type: NEWS_DRAFTS_ERROR,
          payload: error?.response?.data?.message,
        });
      }

      setTimeout(() => {
        dispatch({
          type: NEWS_DRAFTS_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

export const createNewsDraft =
  (formData: CreateUpdateNewsDraft) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsDraftActions.createNewsDraft" }, async () => {
      setLoading();

      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token);
      }

      let data = new FormData();
      data.append("title", formData.title);
      data.append("category", formData.category);
      data.append("mainImage", formData.mainImage!);
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

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: NEWS_DRAFTS_ERROR,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: NEWS_DRAFTS_CLEAR_ERROR,
          });
        }, 5000);
      }
    });
  };

export const updateNewsDraft =
  (formData: CreateUpdateNewsDraft, id: string) =>
  async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsDraftActions.updateNewsDraft" }, async () => {
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

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: NEWS_DRAFTS_ERROR,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: NEWS_DRAFTS_CLEAR_ERROR,
          });
        }, 5000);
      }
    });
  };

export const updateNewsDraftApproved =
  (formData: UpdateNewsDraftApproved, id: string) =>
  async (dispatch: Dispatch) => {
    Sentry.startSpan(
      { name: "newsDraftActions.updateNewsDraftApproved" },
      async () => {
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

          if (e instanceof AxiosError) {
            const error = e as AxiosError<Response<any>>;
            dispatch({
              type: NEWS_DRAFTS_ERROR,
              payload: error?.response?.data?.message,
            });
          }

          setTimeout(() => {
            dispatch({
              type: NEWS_DRAFTS_CLEAR_ERROR,
            });
          }, 5000);
        }
      }
    );
  };

export const selectNewsDraft =
  (newsDraft: News) => async (dispatch: Dispatch) => {
    Sentry.startSpan({ name: "newsDraftActions.selectNewsDraft" }, () => {
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
      }
    });
  };

export const deleteNewsDraft =
  (id: string) => async (dispatch: Dispatch<any>) => {
    Sentry.startSpan({ name: "newsDraftActions.deleteNewsDraft" }, async () => {
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

        dispatch(getAllNewsDrafts());
        dispatch(getMyNewsDrafts());
        dispatch(setAlert("Berita berhasil dihapus!", "success"));
      } catch (e) {
        console.log(e);
        Sentry.captureException(e);

        if (e instanceof AxiosError) {
          const error = e as AxiosError<Response<any>>;
          dispatch({
            type: NEWS_DRAFTS_ERROR,
            payload: error?.response?.data?.message,
          });
        }

        setTimeout(() => {
          dispatch({
            type: NEWS_DRAFTS_CLEAR_ERROR,
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

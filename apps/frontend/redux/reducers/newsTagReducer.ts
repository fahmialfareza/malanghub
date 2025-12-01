import { PayloadAction } from "@reduxjs/toolkit";
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
} from "../actions/types";
import { NewsTagReducerState } from "../types";

const initialState: NewsTagReducerState = {
  newsTags: [],
  currentNewsTag: {
    _id: "",
    id: "",
    created_at: new Date(),
    name: "",
    slug: "",
    updated_at: new Date(),
  },
  loading: false,
  error: null,
};

const newsTagReducer = (state = initialState, action: PayloadAction<any>) => {
  switch (action.type) {
    case GET_ALL_NEWS_TAGS: {
      return {
        ...state,
        loading: false,
        newsTags: action.payload,
      };
    }
    case ADD_NEWS_TAG:
      return {
        ...state,
        loading: false,
        newsTags: [...state.newsTags, action.payload],
      };
    case SELECT_NEWS_TAG:
      return {
        ...state,
        loading: false,
        currentNewsTag: action.payload,
      };
    case UPDATE_NEWS_TAG:
      return {
        ...state,
        loading: false,
        currentNewsTag: { name: "" },
        newsTags: state.newsTags.map((tag) =>
          tag.id === action.payload.id ? action.payload : tag
        ),
      };
    case DELETE_NEWS_TAG:
      return {
        ...state,
        loading: false,
        currentNewsTag: { name: "" },
        newsTags: state.newsTags.filter((tag) => tag.id !== action.payload),
      };
    case CLEAR_ALL_NEWS_TAGS:
      return {
        ...state,
        newsTags: null,
      };
    case NEWS_TAGS_ERROR:
      return {
        ...state,
        error: action.payload,
        currentNewsTag: { name: "" },
        loading: false,
      };
    case NEWS_TAGS_CLEAR_ERROR:
      return {
        ...state,
        loading: false,
        error: null,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
};

export default newsTagReducer;

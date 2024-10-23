import { PayloadAction } from "@reduxjs/toolkit";
import {
  GET_ALL_NEWS_CATEGORIES,
  ADD_NEWS_CATEGORY,
  SELECT_NEWS_CATEGORY,
  UPDATE_NEWS_CATEGORY,
  DELETE_NEWS_CATEGORY,
  NEWS_CATEGORIES_ERROR,
  NEWS_CATEGORIES_CLEAR_ERROR,
  SET_LOADING,
} from "../actions/types";
import { NewsCategoryReducerState } from "../types";

const initialState: NewsCategoryReducerState = {
  newsCategories: [],
  currentNewsCategory: null,
  loading: false,
  error: null,
};

const newsCategoryReducer = (
  state = initialState,
  action: PayloadAction<any>
) => {
  switch (action.type) {
    case GET_ALL_NEWS_CATEGORIES: {
      return {
        ...state,
        loading: false,
        newsCategories: action.payload,
      };
    }
    case ADD_NEWS_CATEGORY:
      return {
        ...state,
        loading: false,
        newsCategories: [...state.newsCategories, action.payload],
      };
    case SELECT_NEWS_CATEGORY:
      return {
        ...state,
        loading: false,
        currentNewsCategory: action.payload,
      };
    case UPDATE_NEWS_CATEGORY:
      return {
        ...state,
        loading: false,
        currentNewsCategory: { name: "" },
        newsCategories: state.newsCategories.map((category) =>
          category._id === action.payload._id ? action.payload : category
        ),
      };
    case DELETE_NEWS_CATEGORY:
      return {
        ...state,
        loading: false,
        currentNewsCategory: { name: "" },
        newsCategories: state.newsCategories.filter(
          (category) => category._id !== action.payload
        ),
      };
    case NEWS_CATEGORIES_ERROR:
      return {
        ...state,
        error: action.payload,
        currentNewsCategory: { name: "" },
        loading: false,
      };
    case NEWS_CATEGORIES_CLEAR_ERROR:
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

export default newsCategoryReducer;

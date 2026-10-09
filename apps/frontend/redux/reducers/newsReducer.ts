import { PayloadAction } from "@reduxjs/toolkit";
import {
  GET_RELATED_NEWS,
  GET_MY_NEWS,
  GET_ONE_NEWS,
  NEWS_ERROR,
  NEWS_CLEAR_ERROR,
  SET_LOADING,
} from "../actions/types";
import { NewsReducerState } from "../types";

const initialState: NewsReducerState = {
  relatedNews: [],
  myNews: [],
  currentNews: null,
  loading: false,
  error: null,
};

const newsReducer = (state = initialState, action: PayloadAction<any>) => {
  switch (action.type) {
    case GET_RELATED_NEWS:
      return {
        ...state,
        loading: false,
        relatedNews: action.payload,
      };
    case GET_MY_NEWS:
      return {
        ...state,
        loading: false,
        myNews: action.payload,
      };
    case GET_ONE_NEWS:
      return {
        ...state,
        loading: false,
        currentNews: action.payload,
      };
    case NEWS_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case NEWS_CLEAR_ERROR:
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

export default newsReducer;

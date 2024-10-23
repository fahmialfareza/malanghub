import { PayloadAction } from "@reduxjs/toolkit";
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
} from "../actions/types";
import { NewsDraftReducerState } from "../types";

const initialState: NewsDraftReducerState = {
  allNewsDrafts: [],
  myNewsDrafts: [],
  currentNewsDraft: null,
  loading: false,
  error: null,
};

const newsDraftReducer = (state = initialState, action: PayloadAction<any>) => {
  switch (action.type) {
    case GET_ALL_NEWS_DRAFTS:
      return {
        ...state,
        allNewsDrafts: action.payload,
        loading: false,
      };
    case GET_MY_DRAFTS:
      return {
        ...state,
        myNewsDrafts: action.payload,
        loading: false,
      };
    case ADD_NEWS_DRAFT:
      return {
        ...state,
        loading: false,
        myNewsDrafts: [action.payload, ...state.myNewsDrafts],
      };
    case SELECT_NEWS_DRAFT:
      return {
        ...state,
        loading: false,
        currentNewsDraft: action.payload,
      };
    case UPDATE_NEWS_DRAFT:
      return {
        ...state,
        loading: false,
        myNewsDrafts: state.myNewsDrafts.map((draft) =>
          draft._id === action.payload._id ? action.payload : draft
        ),
        allNewsDrafts: state.allNewsDrafts.map((draft) =>
          draft._id === action.payload._id ? action.payload : draft
        ),
      };
    case UPDATE_NEWS_DRAFT_APPROVED:
      return {
        ...state,
        loading: false,
        myNewsDrafts: action.payload.approved
          ? state.myNewsDrafts.filter(
              (draft) => draft._id !== action.payload._id
            )
          : state.myNewsDrafts.map((draft) =>
              draft._id === action.payload._id ? action.payload : draft
            ),
        allNewsDrafts: action.payload.approved
          ? state.allNewsDrafts.filter(
              (draft) => draft._id !== action.payload._id
            )
          : state.allNewsDrafts.map((draft) =>
              draft._id === action.payload._id ? action.payload : draft
            ),
      };
    case DELETE_NEWS_DRAFT:
      return {
        ...state,
        loading: false,
        myNewsDrafts: state.myNewsDrafts.filter(
          (draft) => draft._id !== action.payload
        ),
      };
    case NEWS_DRAFTS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case NEWS_DRAFTS_CLEAR_ERROR:
      return {
        ...state,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

export default newsDraftReducer;

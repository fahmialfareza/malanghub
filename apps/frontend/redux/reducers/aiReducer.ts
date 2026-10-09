import { PayloadAction } from "@reduxjs/toolkit";
import {
  ASK_AI,
  ASK_AI_LOADING,
  ASK_AI_ERROR,
  ASK_AI_CLEAR_ERROR,
} from "../actions/types";
import { AiReducerState } from "../types";

const initialState: AiReducerState = {
  question: "",
  result: null,
  loading: false,
  error: null,
};

const aiReducer = (state = initialState, action: PayloadAction<any>) => {
  switch (action.type) {
    case ASK_AI_LOADING:
      return {
        ...state,
        loading: true,
        error: null,
        question: action.payload,
        result: null,
      };
    case ASK_AI:
      return {
        ...state,
        loading: false,
        result: action.payload,
      };
    case ASK_AI_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case ASK_AI_CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export default aiReducer;

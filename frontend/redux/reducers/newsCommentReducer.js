import {
  GET_NEWS_COMMENTS_BY_NEWS,
  CREATE_NEWS_COMMENT,
  SELECT_NEWS_COMMENT,
  CREATE_NEWS_COMMENT_BY_COMMENT,
  NEWS_COMMENT_ERROR,
  NEWS_COMMENT_CLEAR_ERROR,
} from "../actions/types";

const initialState = {
  newsComments: null,
  currentComment: null,
  error: null,
  loading: false,
};

const newsCommentReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_NEWS_COMMENTS_BY_NEWS:
      return {
        ...state,
        loading: false,
        newsComments: action.payload,
      };
    case CREATE_NEWS_COMMENT:
      return {
        ...state,
        loading: false,
        newsComments: [action.payload, ...state.newsComments],
      };
    case SELECT_NEWS_COMMENT:
      return {
        ...state,
        loading: false,
        currentComment: action.payload,
      };
    case CREATE_NEWS_COMMENT_BY_COMMENT:
      return {
        ...state,
        loading: false,
        newsComments: state.newsComments.map((comment) =>
          comment._id === action.payload._id ? action.payload : comment
        ),
      };
    case NEWS_COMMENT_ERROR:
      return {
        ...state,
        error: action.payload,
        newsComments: null,
        currentComment: null,
        loading: false,
      };
    case NEWS_COMMENT_CLEAR_ERROR:
      return {
        ...state,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

export default newsCommentReducer;

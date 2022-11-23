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

const initialState = {
  newsTags: null,
  currentNewsTag: { name: "" },
  news: null,
  loading: false,
  error: null,
};

const newsTagReducer = (state = initialState, action) => {
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
          tag._id === action.payload._id ? action.payload : tag
        ),
      };
    case DELETE_NEWS_TAG:
      return {
        ...state,
        loading: false,
        currentNewsTag: { name: "" },
        newsTags: state.newsTags.filter((tag) => tag._id !== action.payload),
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
        news: null,
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

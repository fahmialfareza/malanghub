import {
  GET_ALL_NEWS,
  GET_RELATED_NEWS,
  GET_MY_NEWS,
  GET_ONE_NEWS,
  NEWS_ERROR,
  NEWS_CLEAR_ERROR,
  SET_LOADING,
} from "../actions/types";

const initialState = {
  allNews: null,
  relatedNews: null,
  newsByCategory: null,
  newsByTag: null,
  newsByUser: null,
  newsBySearch: null,
  myNews: null,
  currentNews: null,
  loading: false,
  error: null,
};

const newsReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_ALL_NEWS:
      return {
        ...state,
        loading: false,
        allNews: action.payload.allNews
          ? action.payload.allNews
          : state.allNews,
        newsBySearch: action.payload.newsBySearch
          ? action.payload.newsBySearch
          : state.newsBySearch,
        newsByCategory: action.payload.newsByCategory
          ? action.payload.newsByCategory
          : state.newsByCategory,
        newsByTag: action.payload.newsByTag
          ? action.payload.newsByTag
          : state.newsByTag,
        newsByUser: action.payload.newsByUser
          ? action.payload.newsByUser
          : state.newsByUser,
      };
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

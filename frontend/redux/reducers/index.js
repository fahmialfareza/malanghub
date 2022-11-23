import { combineReducers } from "redux";
import newsCategoryReducer from "./newsCategoryReducer";
import newsTagReducer from "./newsTagReducer";
import newsDraftReducer from "./newsDraftReducer";
import newsReducer from "./newsReducer";
import newsCommentReducer from "./newsCommentReducer";
import userReducer from "./userReducer";
import layoutReducer from "./layoutReducer";

export default combineReducers({
  newsCategory: newsCategoryReducer,
  newsTag: newsTagReducer,
  newsDraft: newsDraftReducer,
  news: newsReducer,
  newsComment: newsCommentReducer,
  user: userReducer,
  layout: layoutReducer,
});

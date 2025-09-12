import { combineReducers } from "redux";
import newsCategoryReducer from "./newsCategoryReducer";
import newsTagReducer from "./newsTagReducer";
import newsDraftReducer from "./newsDraftReducer";
import newsReducer from "./newsReducer";
import userReducer from "./userReducer";
import layoutReducer from "./layoutReducer";

export default combineReducers({
  newsCategory: newsCategoryReducer,
  newsTag: newsTagReducer,
  newsDraft: newsDraftReducer,
  news: newsReducer,
  user: userReducer,
  layout: layoutReducer,
});

import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import { createWrapper } from "next-redux-wrapper";
import rootReducer from "./reducers";

const initialState = {};

const middleware = [thunk];

const devTools =
  process.env.NODE_ENV === "production"
    ? applyMiddleware(...middleware)
    : composeWithDevTools(applyMiddleware(...middleware));

const makeStore = () => createStore(rootReducer, initialState, devTools);

export const wrapper = createWrapper(makeStore);

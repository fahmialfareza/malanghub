import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import { useDispatch } from "react-redux";
import rootReducer from "./reducers"; // Update this if using createSlice

const store = () =>
  configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== "production",
  });

const state = store().getState;
const dispatch = store().dispatch;

export const wrapper = createWrapper(store);
export type RootState = ReturnType<typeof state>;
export type AppDispatch = typeof dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

import {
  ASK_AI,
  ASK_AI_LOADING,
  ASK_AI_ERROR,
  ASK_AI_CLEAR_ERROR,
} from "./types";
import { request } from "../../utils/axiosCreate";
import * as Sentry from "@sentry/nextjs";
import { Dispatch } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { Response } from "../../models/axios";
import { AiAnswer } from "../../models/ai";

// Ask AI about Malang Raya
export const askAi = (question: string) => async (dispatch: Dispatch) => {
  Sentry.startSpan({ name: "aiActions.askAi" }, async () => {
    dispatch({ type: ASK_AI_LOADING, payload: question });

    try {
      const response = await request({
        method: "post",
        url: "/api/ai/ask",
        data: { question },
      });

      const data: Response<AiAnswer> = response.data;

      dispatch({
        type: ASK_AI,
        payload: data.data,
      });
    } catch (e) {
      let message = "Terjadi kesalahan. Silakan coba lagi.";
      if (e instanceof AxiosError) {
        const error = e as AxiosError<Response<any>>;
        message = error?.response?.data?.message || message;
        if (error?.response?.status !== 429) {
          Sentry.captureException(e);
        }
      } else {
        Sentry.captureException(e);
      }

      dispatch({
        type: ASK_AI_ERROR,
        payload: message,
      });

      setTimeout(() => {
        dispatch({
          type: ASK_AI_CLEAR_ERROR,
        });
      }, 5000);
    }
  });
};

import axios from "axios";

export const request = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ADDRESS,
});

export const setAuthToken = (token) => {
  if (token) {
    request.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete request.defaults.headers.common["Authorization"];
  }
};

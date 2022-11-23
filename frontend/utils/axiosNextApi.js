import axios from "axios";

export const requestNextApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEXT_API_ADDRESS,
});

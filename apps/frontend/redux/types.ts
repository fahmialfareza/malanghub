import {
  News,
  NewsCategory,
  NewsCategoryFull,
  NewsTag,
  NewsWithPagination,
} from "../models/news";
import { UserProfile } from "../models/user";

export interface UserReducerState {
  isAuthenticated: boolean;
  loading: boolean;
  userProfile: UserProfile | null;
  user: UserProfile | null;
  error: string | null;
  token: string | null;
}

export interface LayoutReducerState {
  activeLink: string;
  alert: null | string;
  theme: string | null;
}

export interface NewsCategoryReducerState {
  newsCategories: NewsCategoryFull[];
  currentNewsCategory: NewsCategory | null;
  loading: boolean;
  error: string | null;
}

export interface NewsTagReducerState {
  newsTags: NewsTag[];
  currentNewsTag: NewsTag | null;
  loading: boolean;
  error: string | null;
}

export interface NewsDraftReducerState {
  allNewsDrafts: News[];
  myNewsDrafts: News[];
  currentNewsDraft: News | null;
  loading: boolean;
  error: string | null;
}

export interface NewsReducerState {
  allNews: NewsWithPagination | null;
  relatedNews: News[];
  newsByCategory: NewsWithPagination | null;
  newsByTag: NewsWithPagination | null;
  newsByUser: NewsWithPagination | null;
  newsBySearch: NewsWithPagination | null;
  myNews: News[];
  currentNews: News | null;
  loading: boolean;
  error: string | null;
}

import { User } from "./user";

export interface News {
  _id: string;
  id?: string;
  user: User;
  slug: string;
  title: string;
  // category may be populated object or just an id string depending on API
  category: NewsCategory | string | any;
  time_read: number;
  mainImage: string;
  content: string;
  // tags may be array of objects or array of id strings
  tags: NewsTag[] | string[] | any[];
  views: number;
  status: string;
  message?: string;
  approved: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface NewsWithPagination {
  // older endpoints use `meta`, some components expect `pagination`.
  meta?: {
    limit: number;
    page: number;
    total: number;
  };
  data: News[];
}

export interface NewsCategory {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewsCategoryFull extends NewsCategory {
  news: News[];
}

export interface NewsCommentReply {
  _id: string;
  id?: string;
  user: string;
  comment: string;
}

export interface NewsTag {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  created_at?: Date;
  updated_at?: Date;
}

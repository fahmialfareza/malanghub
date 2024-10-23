import { User } from "./user";

export interface News {
  _id: string;
  id?: string;
  user: User;
  slug: string;
  title: string;
  category: NewsCategory;
  time_read: number;
  mainImage: string;
  content: string;
  tags: NewsTag[];
  views: number;
  status: string;
  message?: string;
  approved: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface NewsWithPagination {
  count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    next: {
      page: number;
      limit: number;
    };
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
  _id: string;
  id?: string;
  name: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

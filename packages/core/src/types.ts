export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  message?: string;
}

export interface AuthResponse {
  token: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  photo?: string;
  motto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface UserProfile extends User {
  news?: News[];
}

export interface NewsCategory {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface NewsCategoryFull extends NewsCategory {
  news?: News[];
}

export interface NewsTag {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface News {
  _id: string;
  id?: string;
  user: User;
  slug: string;
  title: string;
  category: NewsCategory | string | null;
  time_read: number;
  mainImage: string;
  content: string;
  tags: NewsTag[] | string[];
  views: number;
  status: string;
  message?: string;
  approved: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface CategoryWithNews {
  category: NewsCategoryFull;
  news?: News[];
}

export interface TagWithNews {
  tag: NewsTag;
  news?: News[];
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
}

export interface GoogleLoginRequest {
  access_token?: string;
  id_token?: string;
}

export interface UpdateProfileRequest {
  name: string;
  photo?: Blob;
  photoName?: string;
  motto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface CreateUpdateTaxonomyRequest {
  name: string;
  slug?: string;
}

export interface CreateUpdateNewsDraftRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  mainImage?: Blob | string;
  mainImageName?: string;
  approved?: boolean;
  message?: string;
}

export interface ApproveNewsDraftRequest {
  title: string;
  content: string;
  approved: boolean;
  message: string;
}

export interface NewsListParams {
  page?: number;
  sort?: string;
  limit?: number;
  category?: string;
  tags?: string;
  user?: string;
  search?: string;
  createdAfter?: string;
  excludeId?: string;
}

export interface NewsComment {
  _id: string;
  id?: string;
  user: User | string;
  comment: string;
  replies?: NewsCommentReply[];
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface NewsCommentReply {
  _id: string;
  id?: string;
  user: User | string;
  comment: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

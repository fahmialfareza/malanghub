import type {
  ApiEnvelope,
  ApproveNewsDraftRequest,
  AuthResponse,
  CategoryWithNews,
  CreateUpdateNewsDraftRequest,
  CreateUpdateTaxonomyRequest,
  GoogleLoginRequest,
  News,
  NewsCategoryFull,
  NewsComment,
  NewsListParams,
  NewsTag,
  PaginatedResponse,
  SignInRequest,
  SignUpRequest,
  TagWithNews,
  UpdateProfileRequest,
  UserProfile,
} from "./types";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void | Promise<void>;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null;
  query?: Record<string, string | number | boolean | null | undefined>;
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  auth: {
    signIn(data: SignInRequest): Promise<AuthResponse>;
    signUp(data: SignUpRequest): Promise<AuthResponse>;
    google(data: GoogleLoginRequest): Promise<AuthResponse>;
  };
  users: {
    me(): Promise<ApiEnvelope<UserProfile>>;
    get(id: string): Promise<ApiEnvelope<UserProfile>>;
    update(data: UpdateProfileRequest): Promise<ApiEnvelope<UserProfile>>;
    deleteAccount(): Promise<void>;
  };
  news: {
    list(params?: NewsListParams): Promise<PaginatedResponse<News>>;
    search(search: string, page?: number): Promise<PaginatedResponse<News>>;
    recent(limit?: number): Promise<PaginatedResponse<News>>;
    trending(limit?: number): Promise<PaginatedResponse<News>>;
    bySlug(slug: string): Promise<ApiEnvelope<News>>;
    related(news: News, limit?: number): Promise<PaginatedResponse<News>>;
    myNews(): Promise<ApiEnvelope<News[]>>;
    create(data: CreateUpdateNewsDraftRequest): Promise<ApiEnvelope<News>>;
    update(id: string, data: CreateUpdateNewsDraftRequest): Promise<ApiEnvelope<News>>;
    approve(id: string, data: ApproveNewsDraftRequest): Promise<ApiEnvelope<News>>;
    delete(id: string): Promise<ApiEnvelope<Record<string, never>>>;
  };
  categories: {
    list(): Promise<ApiEnvelope<NewsCategoryFull[]>>;
    bySlug(slug: string): Promise<ApiEnvelope<CategoryWithNews>>;
    create(data: CreateUpdateTaxonomyRequest): Promise<ApiEnvelope<NewsCategoryFull>>;
    update(id: string, data: CreateUpdateTaxonomyRequest): Promise<ApiEnvelope<NewsCategoryFull>>;
    delete(id: string): Promise<ApiEnvelope<Record<string, never>>>;
  };
  tags: {
    list(): Promise<ApiEnvelope<NewsTag[]>>;
    bySlug(slug: string): Promise<ApiEnvelope<TagWithNews>>;
    create(data: CreateUpdateTaxonomyRequest): Promise<ApiEnvelope<NewsTag>>;
    update(id: string, data: CreateUpdateTaxonomyRequest): Promise<ApiEnvelope<NewsTag>>;
    delete(id: string): Promise<ApiEnvelope<Record<string, never>>>;
  };
  drafts: {
    list(page?: number): Promise<PaginatedResponse<News>>;
    mine(): Promise<ApiEnvelope<News[]>>;
    bySlug(slug: string): Promise<ApiEnvelope<News>>;
    create(data: CreateUpdateNewsDraftRequest): Promise<ApiEnvelope<News>>;
    update(id: string, data: CreateUpdateNewsDraftRequest): Promise<ApiEnvelope<News>>;
    delete(id: string): Promise<ApiEnvelope<Record<string, never>>>;
  };
  uploads: {
    image(file: Blob, fileName?: string): Promise<{ uploaded: boolean; location: string }>;
  };
  comments: {
    byNews(newsId: string): Promise<ApiEnvelope<NewsComment[]>>;
    create(newsId: string, comment: string): Promise<ApiEnvelope<NewsComment>>;
    reply(commentId: string, comment: string): Promise<ApiEnvelope<NewsComment>>;
  };
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const buildQuery = (
  query?: Record<string, string | number | boolean | null | undefined>
) => {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const newsListQuery = (params: NewsListParams = {}) => ({
  page: params.page ?? 1,
  sort: params.sort ?? "-created_at",
  limit: params.limit ?? 5,
  category: params.category,
  tags: params.tags,
  user: params.user,
  search: params.search,
  "created_at[gte]": params.createdAfter,
  "_id[ne]": params.excludeId,
});

const createFormData = (data: Record<string, unknown>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
};

const createDraftFormData = (data: CreateUpdateNewsDraftRequest) => {
  const formData = createFormData({
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags,
    approved: data.approved,
    message: data.message,
  });

  if (data.mainImage instanceof Blob) {
    formData.append("mainImage", data.mainImage, data.mainImageName);
  } else if (data.mainImage) {
    formData.append("mainImage", data.mainImage);
  }

  return formData;
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createTaxonomyPayload = (data: CreateUpdateTaxonomyRequest) => {
  const name = data.name.trim();

  return {
    ...data,
    name,
    slug: data.slug ? slugify(data.slug) : slugify(name),
  };
};

const parseResponsePayload = (text: string, contentType: string | null) => {
  if (!text) return {};

  const trimmed = text.trim();
  const shouldParseJson =
    contentType?.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!shouldParseJson) return text;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const getPayloadMessage = (payload: unknown) => {
  if (typeof payload === "string") return payload;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message = record.message ?? record.error;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return undefined;
};

export const createApiClient = ({
  baseUrl,
  getToken,
  onUnauthorized,
}: ApiClientOptions): ApiClient => {
  const root = trimTrailingSlash(baseUrl);

  const request = async <T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> => {
    const headers = new Headers(options.headers);
    const token = await getToken?.();
    let body = options.body;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (
      body &&
      typeof body === "object" &&
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      !(body instanceof URLSearchParams)
    ) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const response = await fetch(`${root}${path}${buildQuery(options.query)}`, {
      ...options,
      headers,
      body: body as BodyInit | null | undefined,
    });

    const text = await response.text();
    const payload = parseResponsePayload(
      text,
      response.headers.get("content-type")
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await onUnauthorized?.();
      }

      throw new ApiError(
        response.status,
        getPayloadMessage(payload) ??
          response.statusText ??
          `Request failed with status ${response.status}`,
        payload
      );
    }

    if (typeof payload === "string") {
      throw new ApiError(
        response.status,
        "Unexpected non-JSON response from API",
        payload
      );
    }

    return payload as T;
  };

  return {
    request,
    auth: {
      signIn: (data) =>
        request<AuthResponse>("/api/users/signin", {
          method: "POST",
          body: data,
        }),
      signUp: (data) =>
        request<AuthResponse>("/api/users/signup", {
          method: "POST",
          body: data,
        }),
      google: (data) =>
        request<AuthResponse>("/api/users/google", {
          method: "POST",
          body: data,
        }),
    },
    users: {
      me: () => request<ApiEnvelope<UserProfile>>("/api/users"),
      get: (id) => request<ApiEnvelope<UserProfile>>(`/api/users/${id}`),
      update: (data) => {
        const formData = createFormData({
          name: data.name,
          motto: data.motto,
          bio: data.bio,
          instagram: data.instagram,
          facebook: data.facebook,
          twitter: data.twitter,
          tiktok: data.tiktok,
          linkedin: data.linkedin,
        });

        if (data.photo instanceof Blob) {
          formData.append("photo", data.photo, data.photoName);
        }

        return request<ApiEnvelope<UserProfile>>("/api/users", {
          method: "PUT",
          body: formData,
        });
      },
      deleteAccount: () =>
        request<void>("/api/users", { method: "DELETE" }),
    },
    news: {
      list: (params) =>
        request<PaginatedResponse<News>>("/api/news", {
          query: newsListQuery(params),
        }),
      search: (search, page = 1) =>
        request<PaginatedResponse<News>>("/api/news/search", {
          query: newsListQuery({ page, search }),
        }),
      recent: (limit = 4) =>
        request<PaginatedResponse<News>>("/api/news", {
          query: newsListQuery({ page: 1, limit, sort: "-created_at" }),
        }),
      trending: (limit = 4) => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        return request<PaginatedResponse<News>>("/api/news", {
          query: newsListQuery({
            page: 1,
            limit,
            sort: "-views",
            createdAfter: oneMonthAgo.toISOString(),
          }),
        });
      },
      bySlug: (slug) => request<ApiEnvelope<News>>(`/api/news/${slug}`),
      related: (news, limit = 4) =>
        request<PaginatedResponse<News>>("/api/news", {
          query: newsListQuery({
            page: 1,
            limit,
            sort: "-views",
            category:
              typeof news.category === "string"
                ? news.category
                : news.category?._id,
            excludeId: news._id,
          }),
        }),
      myNews: () => request<ApiEnvelope<News[]>>("/api/news/myNews"),
      create: (data) =>
        request<ApiEnvelope<News>>("/api/news", {
          method: "POST",
          body: createDraftFormData(data),
        }),
      update: (id, data) =>
        request<ApiEnvelope<News>>(`/api/news/${id}`, {
          method: "PUT",
          body: createDraftFormData(data),
        }),
      approve: (id, data) =>
        request<ApiEnvelope<News>>(`/api/news/${id}`, {
          method: "PUT",
          body: data,
        }),
      delete: (id) =>
        request<ApiEnvelope<Record<string, never>>>(`/api/news/${id}`, {
          method: "DELETE",
        }),
    },
    categories: {
      list: () => request<ApiEnvelope<NewsCategoryFull[]>>("/api/newsCategories"),
      bySlug: (slug) =>
        request<ApiEnvelope<CategoryWithNews>>(`/api/newsCategories/${slug}`),
      create: (data) =>
        request<ApiEnvelope<NewsCategoryFull>>("/api/newsCategories", {
          method: "POST",
          body: createTaxonomyPayload(data),
        }),
      update: (id, data) =>
        request<ApiEnvelope<NewsCategoryFull>>(`/api/newsCategories/${id}`, {
          method: "PUT",
          body: createTaxonomyPayload(data),
        }),
      delete: (id) =>
        request<ApiEnvelope<Record<string, never>>>(`/api/newsCategories/${id}`, {
          method: "DELETE",
        }),
    },
    tags: {
      list: () => request<ApiEnvelope<NewsTag[]>>("/api/newsTags"),
      bySlug: (slug) => request<ApiEnvelope<TagWithNews>>(`/api/newsTags/${slug}`),
      create: (data) =>
        request<ApiEnvelope<NewsTag>>("/api/newsTags", {
          method: "POST",
          body: createTaxonomyPayload(data),
        }),
      update: (id, data) =>
        request<ApiEnvelope<NewsTag>>(`/api/newsTags/${id}`, {
          method: "PUT",
          body: createTaxonomyPayload(data),
        }),
      delete: (id) =>
        request<ApiEnvelope<Record<string, never>>>(`/api/newsTags/${id}`, {
          method: "DELETE",
        }),
    },
    drafts: {
      list: (page = 1) =>
        request<PaginatedResponse<News>>("/api/newsDrafts", {
          query: { page, sort: "-created_at", limit: 10 },
        }),
      mine: () => request<ApiEnvelope<News[]>>("/api/newsDrafts/myDrafts"),
      bySlug: (slug) => request<ApiEnvelope<News>>(`/api/newsDrafts/${slug}`),
      create: (data) =>
        request<ApiEnvelope<News>>("/api/newsDrafts", {
          method: "POST",
          body: createDraftFormData(data),
        }),
      update: (id, data) =>
        request<ApiEnvelope<News>>(`/api/newsDrafts/${id}`, {
          method: "PUT",
          body: createDraftFormData(data),
        }),
      delete: (id) =>
        request<ApiEnvelope<Record<string, never>>>(`/api/newsDrafts/${id}`, {
          method: "DELETE",
        }),
    },
    uploads: {
      image: (file, fileName) => {
        const formData = new FormData();
        formData.append("file", file, fileName);
        return request<{ uploaded: boolean; location: string }>("/api/upload", {
          method: "POST",
          body: formData,
        });
      },
    },
    comments: {
      byNews: (newsId) =>
        request<ApiEnvelope<NewsComment[]>>(`/api/newsComments/${newsId}`),
      create: (newsId, comment) =>
        request<ApiEnvelope<NewsComment>>(`/api/newsComments/${newsId}`, {
          method: "POST",
          body: { comment },
        }),
      reply: (commentId, comment) =>
        request<ApiEnvelope<NewsComment>>(
          `/api/newsComments/commentReply/${commentId}`,
          {
            method: "POST",
            body: { comment },
          }
        ),
    },
  };
};

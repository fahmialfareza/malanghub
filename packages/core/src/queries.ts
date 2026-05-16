import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiClient,
  ApproveNewsDraftRequest,
  AuthResponse,
  CategoryWithNews,
  CreateUpdateNewsDraftRequest,
  CreateUpdateTaxonomyRequest,
  News,
  NewsListParams,
  SignInRequest,
  SignUpRequest,
  TagWithNews,
  UpdateProfileRequest,
  UserProfile,
} from "./index";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  news: {
    all: ["news"] as const,
    list: (params?: NewsListParams) => ["news", "list", params ?? {}] as const,
    recent: (limit?: number) => ["news", "recent", limit ?? 4] as const,
    trending: (limit?: number) => ["news", "trending", limit ?? 4] as const,
    detail: (slug?: string) => ["news", "detail", slug] as const,
    related: (id?: string) => ["news", "related", id] as const,
    search: (search?: string, page?: number) =>
      ["news", "search", search, page ?? 1] as const,
    myNews: ["news", "mine"] as const,
  },
  categories: {
    all: ["categories"] as const,
    detail: (slug?: string) => ["categories", "detail", slug] as const,
  },
  tags: {
    all: ["tags"] as const,
    detail: (slug?: string) => ["tags", "detail", slug] as const,
  },
  drafts: {
    all: ["drafts"] as const,
    mine: ["drafts", "mine"] as const,
    detail: (slug?: string) => ["drafts", "detail", slug] as const,
  },
};

export const useCurrentUser = (api: ApiClient, enabled: boolean) =>
  useQuery<UserProfile>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => (await api.users.me()).data,
    enabled,
    retry: false,
  });

export const useUserProfile = (api: ApiClient, id: string | undefined) =>
  useQuery<UserProfile>({
    queryKey: ["users", "profile", id],
    queryFn: async () => (await api.users.get(id ?? "")).data,
    enabled: Boolean(id),
    retry: 1,
  });

export const useRecentNews = (api: ApiClient, limit = 4) =>
  useQuery({
    queryKey: queryKeys.news.recent(limit),
    queryFn: () => api.news.recent(limit),
  });

export const useTrendingNews = (api: ApiClient, limit = 4) =>
  useQuery({
    queryKey: queryKeys.news.trending(limit),
    queryFn: () => api.news.trending(limit),
  });

export const useNewsList = (api: ApiClient, params?: NewsListParams) =>
  useQuery({
    queryKey: queryKeys.news.list(params),
    queryFn: () => api.news.list(params),
  });

export const useNewsSearch = (
  api: ApiClient,
  search: string | undefined,
  page = 1
) =>
  useQuery({
    queryKey: queryKeys.news.search(search, page),
    queryFn: () => api.news.search(search ?? "", page),
    enabled: Boolean(search),
  });

export const useNewsDetail = (api: ApiClient, slug: string | undefined) =>
  useQuery<News>({
    queryKey: queryKeys.news.detail(slug),
    queryFn: async () => (await api.news.bySlug(slug ?? "")).data,
    enabled: Boolean(slug),
  });

export const useRelatedNews = (api: ApiClient, news: News | undefined) =>
  useQuery({
    queryKey: queryKeys.news.related(news?._id),
    queryFn: () => api.news.related(news as News),
    enabled: Boolean(news),
  });

export const useCategories = (api: ApiClient) =>
  useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => (await api.categories.list()).data,
  });

export const useCategoryDetail = (
  api: ApiClient,
  slug: string | undefined
) =>
  useQuery<CategoryWithNews>({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: async () => (await api.categories.bySlug(slug ?? "")).data,
    enabled: Boolean(slug),
  });

export const useTags = (api: ApiClient) =>
  useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: async () => (await api.tags.list()).data,
  });

export const useTagDetail = (api: ApiClient, slug: string | undefined) =>
  useQuery<TagWithNews>({
    queryKey: queryKeys.tags.detail(slug),
    queryFn: async () => (await api.tags.bySlug(slug ?? "")).data,
    enabled: Boolean(slug),
  });

export const useMyNews = (api: ApiClient, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.news.myNews,
    queryFn: async () => (await api.news.myNews()).data,
    enabled,
  });

export const useMyDrafts = (api: ApiClient, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.drafts.mine,
    queryFn: async () => (await api.drafts.mine()).data,
    enabled,
  });

export const useAllDrafts = (api: ApiClient, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.drafts.all,
    queryFn: async () => (await api.drafts.list()).data,
    enabled,
  });

export const useDraftDetail = (api: ApiClient, slug: string | undefined) =>
  useQuery<News>({
    queryKey: queryKeys.drafts.detail(slug),
    queryFn: async () => (await api.drafts.bySlug(slug ?? "")).data,
    enabled: Boolean(slug),
  });

export const useSignInMutation = (
  api: ApiClient,
  onSuccess: (data: AuthResponse) => void
) =>
  useMutation({
    mutationFn: (data: SignInRequest) => api.auth.signIn(data),
    onSuccess,
  });

export const useSignUpMutation = (
  api: ApiClient,
  onSuccess: (data: AuthResponse) => void
) =>
  useMutation({
    mutationFn: (data: SignUpRequest) => api.auth.signUp(data),
    onSuccess,
  });

export const useUpdateProfileMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.users.update(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
};

export const useDeleteAccountMutation = (api: ApiClient) =>
  useMutation({
    mutationFn: () => api.users.deleteAccount(),
  });

export const useCreateCategoryMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUpdateTaxonomyRequest) => api.categories.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useUpdateCategoryMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateUpdateTaxonomyRequest;
    }) => api.categories.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useDeleteCategoryMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useCreateTagMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUpdateTaxonomyRequest) => api.tags.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
};

export const useUpdateTagMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateUpdateTaxonomyRequest;
    }) => api.tags.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
};

export const useDeleteTagMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tags.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
};

export const useCreateDraftMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUpdateNewsDraftRequest) => api.drafts.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.mine });
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
};

export const useUpdateDraftMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateUpdateNewsDraftRequest;
    }) => api.drafts.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.mine });
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
};

export const useApproveDraftMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ApproveNewsDraftRequest;
    }) => api.news.approve(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.mine });
      void queryClient.invalidateQueries({ queryKey: queryKeys.news.myNews });
      void queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    },
  });
};

export const useDeleteDraftMutation = (api: ApiClient) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.drafts.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.mine });
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
};

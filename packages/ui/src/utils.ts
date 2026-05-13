import type { News, NewsCategory } from "@malanghub/core";

export const siteUrl = "https://www.malanghub.com";

export const stripHtml = (value: string = "") =>
  value.replace(/<(.|\n)*?>/g, "").trim();

export const excerpt = (value: string = "", max = 155) => {
  const text = stripHtml(value);
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
};

export const formatDate = (value?: string | Date) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export const getCategory = (news: News): NewsCategory | null =>
  news.category && typeof news.category !== "string" ? news.category : null;

export const getCategoryName = (news: News) =>
  getCategory(news)?.name ?? (typeof news.category === "string" ? news.category : "Kategori");

export const getCategoryHref = (news: News) => {
  const category = getCategory(news);
  return category?.slug ? `/newsCategories/${category.slug}` : "/news";
};

export const getAuthorHref = (news: News) =>
  news.user?._id ? `/users/${news.user._id}` : "/news";

export const readingTime = (news: News) =>
  `${Math.max(Math.ceil((news.time_read ?? 0) / 10), 1)} menit`;

export const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

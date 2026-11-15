// Build-time data for the news listings (all news, categories, tags). Page 1
// lives at the base path and pages 2..N at `${basePath}/page/N`; both routes
// load their props here.
import moment from "moment";
import { News, NewsCategoryFull, NewsTag } from "../models/news";
import { fetchList } from "./apiList";
import { fetchJson, fetchNewsPage, pageCountOf } from "./pagination";

export const LISTING_LIMIT = 5;

const api = (path: string) => `${process.env.API_ADDRESS}${path}`;

export interface ListingPage {
  trendingNews: News[];
  news: News[];
  page: number;
  pageCount: number;
}

// Hundreds of listing pages are built per run; share identical requests.
const memo = new Map<string, Promise<unknown>>();
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!memo.has(key)) {
    const promise = load();
    // Don't keep a failed request: the next page retries it.
    promise.catch(() => memo.delete(key));
    memo.set(key, promise);
  }
  return memo.get(key) as Promise<T>;
}

const TRENDING_PATH = "/api/news?page=1&sort=-views&limit=4&excerpt=1";
// One cutoff for the whole build, so every tag page shares one request.
const TAG_TRENDING_PATH = `/api/news?page=1&sort=-views&limit=4&excerpt=1&created_at[gte]=${moment()
  .subtract(1, "months")
  .toISOString()}`;

const trending = (path: string) =>
  once(path, () =>
    fetchJson<{ data?: News[] }>(api(path)).then((json) => json.data ?? []),
  );

const listPage = (path: string) => once(path, () => fetchNewsPage(path));

async function loadListing(
  trendingPath: string,
  listPath: string,
  page: number,
): Promise<ListingPage> {
  const [trendingNews, list] = await Promise.all([
    trending(trendingPath),
    listPage(listPath),
  ]);
  return {
    trendingNews,
    news: list.data,
    page,
    pageCount: pageCountOf(list.meta),
  };
}

/** `getStaticPaths` entries for pages 2..pageCount. */
export const laterPages = (pageCount: number) =>
  Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => String(i + 2));

// ------------------------------------------------------------- all news

const allNewsPath = (page: number) =>
  `/api/news?page=${page}&sort=-created_at&limit=${LISTING_LIMIT}&excerpt=1`;

export const loadAllNews = (page: number) =>
  loadListing(TRENDING_PATH, allNewsPath(page), page);

// ----------------------------------------------------------- categories

export interface CategoryListingPage extends ListingPage {
  oneNewsCategory: { category: NewsCategoryFull };
}

const categoryDetail = (slug: string) =>
  once(`category:${slug}`, () =>
    fetchJson<{ data: { category: NewsCategoryFull } }>(
      api(`/api/newsCategories/${encodeURIComponent(slug)}`),
    ).then((json) => json.data),
  );

export async function loadCategory(
  slug: string,
  page: number,
): Promise<CategoryListingPage> {
  const oneNewsCategory = await categoryDetail(slug);
  const listing = await loadListing(
    TRENDING_PATH,
    `/api/news?page=${page}&sort=-created_at&limit=${LISTING_LIMIT}&category=${oneNewsCategory.category.id}&excerpt=1`,
    page,
  );
  return { ...listing, oneNewsCategory };
}

export const categorySlugs = () =>
  fetchList<{ slug?: string }>("/api/newsCategories").then((items) =>
    items.map((item) => item.slug).filter((slug): slug is string => !!slug),
  );

// ----------------------------------------------------------------- tags

export interface TagListingPage extends ListingPage {
  oneNewsTag: { tag: NewsTag };
}

const tagDetail = (slug: string) =>
  once(`tag:${slug}`, () =>
    fetchJson<{ data: { tag: NewsTag } }>(
      api(`/api/newsTags/${encodeURIComponent(slug)}`),
    ).then((json) => json.data),
  );

export async function loadTag(
  slug: string,
  page: number,
): Promise<TagListingPage> {
  const oneNewsTag = await tagDetail(slug);
  const listing = await loadListing(
    TAG_TRENDING_PATH,
    `/api/news?page=${page}&sort=-created_at&limit=${LISTING_LIMIT}&tags=${oneNewsTag.tag.id}&excerpt=1`,
    page,
  );
  return { ...listing, oneNewsTag };
}

export const tagSlugs = () =>
  fetchList<{ slug?: string }>("/api/newsTags").then((items) =>
    items.map((item) => item.slug).filter((slug): slug is string => !!slug),
  );

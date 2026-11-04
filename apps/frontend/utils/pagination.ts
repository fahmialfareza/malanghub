import { pageHref } from "@malanghub/ui";
import { News, NewsWithPagination } from "../models/news";
import { fetchWithRetry } from "./seo";

export type PageMeta = NonNullable<NewsWithPagination["meta"]>;

/**
 * Reads `?page=N`.
 * - missing → 1
 * - `?page=1`, non-integer, < 1 or repeated → `null` (redirect to the clean URL)
 */
export const parsePage = (
  raw: string | string[] | undefined,
): number | null => {
  if (raw === undefined) return 1;
  if (typeof raw !== "string" || !/^[0-9]+$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 2 ? page : null;
};

export const pageCountOf = (meta?: PageMeta | null) =>
  meta && meta.limit > 0 ? Math.ceil((meta.total || 0) / meta.limit) : 0;

/** The API answered 404. */
export class ApiNotFoundError extends Error {}

/**
 * GET a URL and return its JSON body. Retries transient failures; throws
 * ApiNotFoundError on 404 and Error on any other non-2xx response.
 */
export const fetchJson = async <T = any>(url: string): Promise<T> => {
  const response = await fetchWithRetry(url);
  if (response.status === 404) {
    throw new ApiNotFoundError(`Not found: ${url}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.json();
};

/** GET `${API_ADDRESS}${path}` and return the `{ meta, data }` list payload. */
export const fetchNewsPage = async (
  path: string,
): Promise<{ meta: PageMeta | null; data: News[] }> => {
  const json = await fetchJson<NewsWithPagination>(
    `${process.env.API_ADDRESS}${path}`,
  );
  return { meta: json.meta ?? null, data: json.data ?? [] };
};

export { pageHref };

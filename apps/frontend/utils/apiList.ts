// Build-time API reads for getStaticPaths and scripts/generate-seo-files.mts.
// Every failure throws: a failed build keeps the previous deploy live, while
// a partial list would drop pages (or sitemap URLs) from the site.
//
// Imports use the `.ts` extension so Node can run this file directly.
import { fetchWithRetry } from "./seo.ts";

// The API caps `limit` at 100 (apps/backend/pkg/middleware/pagination.go).
const PAGE_LIMIT = 100;

const apiUrl = (path: string) => `${process.env.API_ADDRESS}${path}`;

/** GET a list endpoint and return its `data` array. */
export async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetchWithRetry(apiUrl(path));
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  const json = await res.json();
  return json.data || [];
}

/** Every published news item, paging through `/api/news?{query}`. */
export async function fetchAllNews<T>(query: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const path = `/api/news?page=${page}&limit=${PAGE_LIMIT}&${query}`;
    const res = await fetchWithRetry(apiUrl(path));
    if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
    const json = await res.json();
    items.push(...(json.data || []));
    totalPages = Math.ceil((json.meta?.total || 0) / PAGE_LIMIT);
    page++;
  } while (page <= totalPages);

  return items;
}

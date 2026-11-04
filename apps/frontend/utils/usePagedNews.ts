import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { News } from "../models/news";
import { fetchJson, pageCountOf, PageMeta, parsePage } from "./pagination";
import { pageHref } from "@malanghub/ui";

export interface PagedNews {
  page: number;
  news: News[];
  pageCount: number;
  /** A later page is being fetched. */
  loading: boolean;
  /** `?page=N` is past the last page. */
  notFound: boolean;
}

/**
 * Page 1 of a listing is prerendered at build time; `?page=N` can't be
 * (static export has no query strings), so later pages are fetched in the
 * browser from the public API once the router knows the query.
 *
 * `listPath(page)` is the API path for a page, e.g.
 * `/api/news?page=${page}&limit=5`.
 */
export function usePagedNews(
  basePath: string,
  firstPage: { news: News[]; pageCount: number },
  listPath: (page: number) => string,
): PagedNews {
  const router = useRouter();
  const [state, setState] = useState<PagedNews>({
    page: 1,
    ...firstPage,
    loading: false,
    notFound: false,
  });

  const rawPage = router.isReady ? router.query.page : undefined;
  const listKey = listPath(1);

  useEffect(() => {
    if (!router.isReady) return;

    const page = parsePage(rawPage);
    if (page === null) {
      // `?page=1` or junk: same clean URL the server used to redirect to.
      router.replace(pageHref(basePath, 1));
      return;
    }
    if (page === 1) {
      setState({ page: 1, ...firstPage, loading: false, notFound: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, page, loading: true, notFound: false }));
    fetchJson<{ meta?: PageMeta; data?: News[] }>(
      `${process.env.NEXT_PUBLIC_API_ADDRESS}${listPath(page)}`,
    )
      .then((json) => {
        if (cancelled) return;
        const pageCount = pageCountOf(json.meta);
        setState({
          page,
          news: json.data ?? [],
          pageCount,
          loading: false,
          notFound: page > Math.max(pageCount, 1),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, news: [], loading: false, notFound: true }));
      });

    return () => {
      cancelled = true;
    };
    // listKey identifies the listing (category, tag, author) for listPath.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, rawPage, basePath, listKey, firstPage.news]);

  return state;
}

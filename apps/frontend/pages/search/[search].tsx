import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { NewsGrid } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import { LoadingBlock } from "@malanghub/ui";
import { News } from "../../models/news";
import {
  fetchJson,
  pageCountOf,
  PageMeta,
  pageHref,
  parsePage,
} from "../../utils/pagination";

const LIMIT = 5;

const searchBasePath = (search: string) =>
  `/search/${encodeURIComponent(search)}`;

interface SearchNewsProps {
  setActiveLink: (link: string) => void;
}

interface SearchState {
  trendingNews: News[];
  news: News[];
  page: number;
  pageCount: number;
  loading: boolean;
}

const API_ADDRESS = process.env.NEXT_PUBLIC_API_ADDRESS;

// Search terms are unbounded, so this page is a static shell (noindex) that
// loads its results in the browser; public/_redirects serves it for every
// /search/* URL.
const SearchNews = ({ setActiveLink }: SearchNewsProps) => {
  const router = useRouter();
  const search =
    router.isReady && typeof router.query.search === "string"
      ? router.query.search
      : "";
  const rawPage = router.isReady ? router.query.page : undefined;

  const [{ trendingNews, news, page, pageCount, loading }, setState] =
    useState<SearchState>({
      trendingNews: [],
      news: [],
      page: 1,
      pageCount: 0,
      loading: true,
    });

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const page = parsePage(rawPage);
    if (page === null) {
      router.replace(pageHref(searchBasePath(search), 1));
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, page, loading: true }));

    // A failing request degrades to an empty section.
    Promise.all([
      fetchJson<{ data?: News[] }>(
        `${API_ADDRESS}/api/news?page=1&sort=-views&limit=4&excerpt=1`,
      )
        .then((json) => json.data ?? [])
        .catch(() => [] as News[]),
      fetchJson<{ meta?: PageMeta; data?: News[] }>(
        `${API_ADDRESS}/api/news/search?page=${page}&sort=-views&limit=${LIMIT}&search=${encodeURIComponent(search)}&excerpt=1`,
      ).catch(() => ({ meta: undefined, data: [] as News[] })),
    ]).then(([trendingNews, list]) => {
      if (cancelled) return;
      setState({
        trendingNews,
        news: list.data ?? [],
        page,
        pageCount: pageCountOf(list.meta),
        loading: false,
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, search, rawPage]);

  const basePath = searchBasePath(search);
  const title = `Malanghub - Cari Berita - ${search}`;

  return (
    <>
      <ListingSeo
        title={title}
        description={`${title} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        collectionName={`Pencarian "${search}" - Malanghub`}
        basePath={basePath}
        page={page}
        pageCount={pageCount}
        limit={LIMIT}
        news={news}
        noindex
      />

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Pencarian" },
          { label: search },
        ]}
        title={`Pencarian "${search}"`}
        trendingNews={trendingNews}
      >
        {loading ? (
          <LoadingBlock />
        ) : news.length > 0 ? (
          <NewsGrid
            news={news}
            page={page}
            pageCount={pageCount}
            basePath={basePath}
          />
        ) : (
          <EmptyNews>Berita Tidak Ditemukan</EmptyNews>
        )}
      </NewsListingLayout>
    </>
  );
};

export default connect(null, { setActiveLink })(SearchNews);

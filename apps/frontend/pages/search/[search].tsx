import { useEffect } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { NewsGrid } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import * as Sentry from "@sentry/nextjs";
import { GetServerSidePropsContext } from "next";
import { News } from "../../models/news";
import {
  fetchJson,
  fetchNewsPage,
  firstPageRedirect,
  isPageOutOfRange,
  pageCountOf,
  parsePage,
} from "../../utils/pagination";

const LIMIT = 5;

const searchBasePath = (search: string) =>
  `/search/${encodeURIComponent(search)}`;

interface SearchNewsProps {
  trendingNews: News[];
  search: string;
  news: News[];
  page: number;
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const SearchNews = ({
  trendingNews,
  search,
  news,
  page,
  pageCount,
  setActiveLink,
}: SearchNewsProps) => {
  useEffect(() => {
    setActiveLink("news");
  }, []);

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
        {news.length > 0 ? (
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

export async function getServerSideProps({
  params,
  query,
}: GetServerSidePropsContext<{ search: string }>) {
  const search = params?.search ?? "";
  const page = parsePage(query.page);
  if (page === null) return firstPageRedirect(searchBasePath(search));

  const result = await Sentry.startSpan(
    {
      name: "search.[search].getServerSideProps",
    },
    async () => {
      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;

      // A failing request degrades to an empty section instead of a 404.
      const [trendingNews, list] = await Promise.all([
        fetchJson(trendingNewsUrl)
          .then((json) => json.data ?? [])
          .catch((e) => {
            Sentry.captureException(e);
            return [];
          }),
        fetchNewsPage(
          `/api/news/search?page=${page}&sort=-views&limit=${LIMIT}&search=${encodeURIComponent(search)}`,
        ).catch((e) => {
          Sentry.captureException(e);
          return { meta: null, data: [] as News[] };
        }),
      ]);

      if (isPageOutOfRange(page, list.meta)) {
        return { notFound: true as const };
      }

      return {
        props: {
          trendingNews,
          search,
          news: list.data,
          page,
          pageCount: pageCountOf(list.meta),
        },
      };
    },
  );

  return result;
}

export default connect(null, { setActiveLink })(SearchNews);

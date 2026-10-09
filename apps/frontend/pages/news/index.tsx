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
import { News as NewsInterface } from "../../models/news";
import {
  fetchJson,
  fetchNewsPage,
  firstPageRedirect,
  isPageOutOfRange,
  pageCountOf,
  parsePage,
} from "../../utils/pagination";

const BASE_PATH = "/news";
const LIMIT = 5;

interface NewsProps {
  trendingNews: NewsInterface[];
  news: NewsInterface[];
  page: number;
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const News = ({
  trendingNews,
  news,
  page,
  pageCount,
  setActiveLink,
}: NewsProps) => {
  useEffect(() => {
    setActiveLink("news");
  }, []);

  return (
    <>
      <ListingSeo
        title="Malanghub - Semua Berita"
        description="Malanghub - Semua Berita - Situs yang menyediakan informasi sekitar Malang Raya!"
        collectionName="Semua Berita - Malanghub"
        collectionDescription="Kumpulan seluruh berita terbaru seputar Malang Raya dari Malanghub."
        basePath={BASE_PATH}
        page={page}
        pageCount={pageCount}
        limit={LIMIT}
        news={news}
      />

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Semua Berita" },
        ]}
        title="Semua Berita"
        trendingNews={trendingNews}
      >
        {news.length > 0 ? (
          <NewsGrid
            news={news}
            page={page}
            pageCount={pageCount}
            basePath={BASE_PATH}
          />
        ) : (
          <EmptyNews>Belum Ada Berita</EmptyNews>
        )}
      </NewsListingLayout>
    </>
  );
};

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  const page = parsePage(query.page);
  if (page === null) return firstPageRedirect(BASE_PATH);

  const result = await Sentry.startSpan(
    {
      name: "news.index.getServerSideProps",
    },
    async () => {
      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;

      try {
        const [trendingJson, list] = await Promise.all([
          fetchJson(trendingNewsUrl),
          fetchNewsPage(
            `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}`,
          ),
        ]);

        if (isPageOutOfRange(page, list.meta)) {
          return { notFound: true as const };
        }

        return {
          props: {
            trendingNews: trendingJson.data,
            news: list.data,
            page,
            pageCount: pageCountOf(list.meta),
          },
        };
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true as const,
        };
      }
    },
  );

  return result;
}

export default connect(null, { setActiveLink })(News);

import { useEffect } from "react";
import { connect } from "react-redux";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { NewsGrid } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import { News as NewsInterface } from "../../models/news";
import {
  fetchJson,
  fetchNewsPage,
  pageCountOf,
} from "../../utils/pagination";
import { usePagedNews } from "../../utils/usePagedNews";
import { LoadingBlock } from "@malanghub/ui";

const BASE_PATH = "/news";
const LIMIT = 5;

const listPath = (page: number) =>
  `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}&excerpt=1`;

interface NewsProps {
  trendingNews: NewsInterface[];
  news: NewsInterface[];
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const News = ({ trendingNews, setActiveLink, ...firstPage }: NewsProps) => {
  const { page, news, pageCount, loading, notFound } = usePagedNews(
    BASE_PATH,
    firstPage,
    listPath,
  );

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
        noindex={notFound}
      />

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Semua Berita" },
        ]}
        title="Semua Berita"
        trendingNews={trendingNews}
      >
        {loading ? (
          <LoadingBlock />
        ) : notFound ? (
          <EmptyNews>Halaman Tidak Ditemukan</EmptyNews>
        ) : news.length > 0 ? (
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

// Page 1 is prerendered; later pages load in the browser (usePagedNews).
export async function getStaticProps() {
  const [trendingJson, list] = await Promise.all([
    fetchJson(
      `${process.env.API_ADDRESS}/api/news?page=1&sort=-views&limit=4&excerpt=1`,
    ),
    fetchNewsPage(listPath(1)),
  ]);

  return {
    props: {
      trendingNews: trendingJson.data,
      news: list.data,
      pageCount: pageCountOf(list.meta),
    },
  };
}

export default connect(null, { setActiveLink })(News);

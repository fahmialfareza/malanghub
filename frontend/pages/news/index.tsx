import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import moment from "moment";
import { getAllNews } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import Spinner from "../../components/layouts/Spinner";
import AllNewsItem from "../../components/news/AllNewsItem";
import TrendingNews from "../../components/news/TrendingNews";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../../redux/store";
import { News as NewsInterface, NewsWithPagination } from "../../models/news";
import { NewsReducerState } from "../../redux/types";

interface NewsProps {
  trendingNews: NewsInterface[];
  news: NewsReducerState;
  getAllNews: (page: number) => void;
  setActiveLink: (link: string) => void;
}

const News = ({
  trendingNews,
  news: { allNews, loading: newsLoading },
  getAllNews,
  setActiveLink,
}: NewsProps) => {
  useEffect(() => {
    setActiveLink("news");
    getAllNews(1);
  }, []);

  return (
    <>
      <Head>
        <title>Malanghub - Semua Berita</title>
        <meta name="title" content="Malanghub - Semua Berita" />
        <meta
          name="description"
          content="Malanghub - Semua Berita - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/news" />
        <meta property="og:title" content="Malanghub - Semua Berita" />
        <meta
          property="og:description"
          content="Malanghub - Semua Berita - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.malanghub.com/news" />
        <meta property="twitter:title" content="Malanghub - Semua Berita" />
        <meta
          property="twitter:description"
          content="Malanghub - Semua Berita - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /
          <span className="breadcrumb_last" aria-current="page">
            Semua Berita
          </span>
        </div>
      </nav>
      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left">Semua Berita</h3>

              {newsLoading || allNews === null ? (
                <Spinner />
              ) : !newsLoading && allNews?.data?.length > 0 ? (
                <AllNewsItem news={allNews} />
              ) : (
                <h1>Belum Ada Berita</h1>
              )}
            </div>

            <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
              <div className="pos-sticky">
                <h3 className="section-title-left">Trending </h3>

                {newsLoading || trendingNews === null ? (
                  <Spinner />
                ) : !newsLoading && trendingNews?.length > 0 ? (
                  trendingNews.map((news, index) => {
                    return (
                      <TrendingNews key={news._id} index={index} news={news} />
                    );
                  })
                ) : (
                  <h1>Belum Ada Berita</h1>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps() {
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

      let dataTrending = {};

      try {
        const response = await fetch(trendingNewsUrl);

        if (!response.ok) {
          throw new Error("Failed to fetch trending news");
        }

        const jsonData = await response.json();
        dataTrending = jsonData.data;
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true,
        };
      }

      return { props: { trendingNews: dataTrending } };
    }
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, { getAllNews, setActiveLink })(News);

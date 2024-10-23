import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import moment from "moment";
import { setActiveLink } from "../redux/actions/layoutActions";
import Spinner from "../components/layouts/Spinner";
import TrendingNews from "../components/news/TrendingNews";
import NewsItem from "../components/news/NewsItem";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../redux/store";
import { News } from "../models/news";
import { NewsReducerState } from "../redux/types";

interface HomeProps {
  recentNews: News[];
  trendingNews: News[];
  news: NewsReducerState;
  setActiveLink: (link: string) => void;
}

const Home = ({
  recentNews,
  trendingNews,
  news: { loading: newsLoading },
  setActiveLink,
}: HomeProps) => {
  useEffect(() => {
    setActiveLink("home");
  }, []);

  return (
    <>
      <Head>
        <title>Malanghub - Beranda</title>
        <meta name="title" content="Malanghub - Beranda" />
        <meta
          name="description"
          content="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/" />
        <meta property="og:title" content="Malanghub - Beranda" />
        <meta
          property="og:description"
          content="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.malanghub.com/" />
        <meta property="twitter:title" content="Malanghub - Beranda" />
        <meta
          property="twitter:description"
          content="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <div className="w3l-homeblock1 py-5">
        <div className="container pt-lg-5 pt-md-4">
          <div className="row">
            <div className="col-lg-9">
              <h3 className="section-title-left">Berita Terbaru </h3>
              {newsLoading || recentNews === null ? (
                <Spinner />
              ) : !newsLoading && recentNews?.length > 0 ? (
                <NewsItem news={recentNews} />
              ) : (
                <h1>Belum Ada Berita</h1>
              )}
            </div>

            <div className="col-lg-3 trending mt-lg-0 mt-5">
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
    </>
  );
};

export async function getServerSideProps() {
  const result = await Sentry.startSpan(
    { name: "index.getServerSideProps" },
    async () => {
      const configTrendingUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;
      const configRecentUrl = `${process.env.API_ADDRESS}/api/news?page=1&sort=-created_at&limit=4`;

      let dataRecent = {};
      let dataTrending = {};

      try {
        const [responseRecent, responseTrending] = await Promise.all([
          fetch(configRecentUrl),
          fetch(configTrendingUrl),
        ]);

        if (!responseRecent.ok || !responseTrending.ok) {
          throw new Error("Failed to fetch data");
        }

        const recentNewsJson = await responseRecent.json();
        const trendingNewsJson = await responseTrending.json();

        dataRecent = recentNewsJson.data;
        dataTrending = trendingNewsJson.data;
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true,
        };
      }

      return { props: { recentNews: dataRecent, trendingNews: dataTrending } };
    }
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, { setActiveLink })(Home);

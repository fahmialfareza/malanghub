import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import axios from "axios";
import moment from "moment";
import { setActiveLink } from "../redux/actions/layoutActions";
import Spinner from "../components/layouts/Spinner";
import TrendingNews from "../components/news/TrendingNews";
import NewsItem from "../components/news/NewsItem";

const Home = ({
  recentNews,
  trendingNews,
  news: { loading: newsLoading },
  getHomeNews,
  setActiveLink,
}) => {
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
  let configTrending = {
    method: "get",
    url: `${
      process.env.API_ADDRESS
    }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment().subtract(
      1,
      "months"
    )}`,
  };

  let configRecent = {
    method: "get",
    url: `${process.env.API_ADDRESS}/api/news?page=1&sort=-created_at&limit=4`,
  };

  let dataRecent = {};
  let dataTrending = {};

  try {
    let response = await Promise.all([
      axios(configRecent),
      axios(configTrending),
    ]);

    dataRecent = response[0].data.data;
    dataTrending = response[1].data.data;
  } catch (e) {
    console.log(e);
    return {
      notFound: true,
    };
  }

  return { props: { recentNews: dataRecent, trendingNews: dataTrending } };
}

const mapStateToProps = (state) => ({
  news: state.news,
});

export default connect(mapStateToProps, { setActiveLink })(Home);

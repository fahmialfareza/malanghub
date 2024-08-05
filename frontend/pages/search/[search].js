import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import Link from "next/link";
import axios from "axios";
import moment from "moment";
import { getNewsBySearch } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import Spinner from "../../components/layouts/Spinner";
import SearchNewsItem from "../../components/news/SearchNewsItem";
import TrendingNews from "../../components/news/TrendingNews";
import * as Sentry from "@sentry/nextjs";

const SearchNews = ({
  trendingNews,
  news: { newsBySearch, loading: newsLoading },
  getNewsBySearch,
  setActiveLink,
}) => {
  const router = useRouter();

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    getNewsBySearch(router.query.search, 1);
  }, [router.query.search]);

  return (
    <>
      <Head>
        <title>Malanghub - Cari Berita - {router?.query?.search}</title>
        <meta
          name="title"
          content={`Malanghub - Cari Berita - ${router?.query?.search}`}
        />
        <meta
          name="description"
          content={`Malanghub - Cari Berita - ${router?.query?.search} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/search/${router?.query?.search}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Cari Berita - ${router?.query?.search}`}
        />
        <meta
          property="og:description"
          content={`Malanghub - Cari Berita - ${router?.query?.search} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/search/${router?.query?.search}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Cari Berita - ${router?.query?.search}`}
        />
        <meta
          property="twitter:description"
          content={`Malanghub - Cari Berita - ${router?.query?.search} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> / Pencarian /
          <span className="breadcrumb_last" aria-current="page">
            {router.query.search}
          </span>
        </div>
      </nav>
      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left">
                Pencarian "{router.query.search}"
              </h3>

              {newsLoading || newsBySearch === null ? (
                <Spinner />
              ) : !newsLoading && newsBySearch?.data?.length > 0 ? (
                <SearchNewsItem
                  news={newsBySearch}
                  search={router.query.search}
                />
              ) : (
                <h1>Berita Tidak Ditemukan</h1>
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

export async function getServerSideProps({ params }) {
  const result = await Sentry.startSpan(
    {
      name: "search.[search].getServerSideProps",
    },
    async () => {
      const { slug } = params;

      let config = {
        method: "get",
        url: `${
          process.env.API_ADDRESS
        }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment().subtract(
          1,
          "months"
        )}`,
      };

      let data = {};
      try {
        const res = await axios(config);

        data = res.data.data;
      } catch (e) {
        Sentry.captureException(e);
        return { trendingNews: data };
      }

      return { props: { trendingNews: data } };
    }
  );

  return result;
}

const mapStateToProps = (state) => ({
  news: state.news,
});

export default connect(mapStateToProps, { getNewsBySearch, setActiveLink })(
  SearchNews
);

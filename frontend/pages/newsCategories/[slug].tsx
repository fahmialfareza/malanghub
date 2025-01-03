import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import { getNewsByCategory } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import Spinner from "../../components/layouts/Spinner";
import NewsByCategoryItem from "../../components/news/NewsByCategoryItem";
import TrendingNews from "../../components/news/TrendingNews";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../../redux/store";
import { GetServerSidePropsContext } from "next";
import { News, NewsCategoryFull as NewsCtg } from "../../models/news";
import { NewsReducerState } from "../../redux/types";

interface NewsCategoryProps {
  trendingNews: News[];
  oneNewsCategory: NewsCtg;
  news: NewsReducerState;
  getNewsByCategory: (id: string, page: number) => void;
  setActiveLink: (link: string) => void;
}

const NewsCategory = ({
  trendingNews,
  oneNewsCategory,
  news: { newsByCategory, loading: newsLoading },
  getNewsByCategory,
  setActiveLink,
}: NewsCategoryProps) => {
  const router = useRouter();

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    getNewsByCategory(oneNewsCategory?._id, 1);
  }, [oneNewsCategory]);

  return (
    <>
      <Head>
        <title>Malanghub - Kategori Berita - {oneNewsCategory?.name}</title>
        <meta
          name="title"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.name}`}
        />
        <meta
          name="description"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/newsCategories/${oneNewsCategory?.slug}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.name}`}
        />
        <meta
          property="og:description"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/newsCategories/${oneNewsCategory?.slug}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.name}`}
        />
        <meta
          property="twitter:description"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> / Kategori Berita /
          <span className="breadcrumb_last" aria-current="page">
            {!newsLoading && oneNewsCategory?.name}
          </span>
        </div>
      </nav>
      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left">
                {!newsLoading && oneNewsCategory?.name}
              </h3>

              {newsLoading || newsByCategory === null ? (
                <Spinner />
              ) : !newsLoading && newsByCategory?.data?.length > 0 ? (
                <NewsByCategoryItem
                  news={newsByCategory}
                  paramsId={oneNewsCategory?._id}
                />
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

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext<{ slug: string }>) {
  const result = await Sentry.startSpan(
    {
      name: "newsCategories.[slug].getServerSideProps",
    },
    async () => {
      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;
      const newsCategoryUrl = `${process.env.API_ADDRESS}/api/newsCategories/${params?.slug}`;

      let dataTrending = {};
      let dataNewsCategory = {};

      try {
        // Fetch both trending news and news category data concurrently
        const [trendingNewsResponse, newsCategoryResponse] = await Promise.all([
          fetch(trendingNewsUrl),
          fetch(newsCategoryUrl),
        ]);

        // Check if both responses are successful
        if (!trendingNewsResponse.ok || !newsCategoryResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const trendingNewsJson = await trendingNewsResponse.json();
        const newsCategoryJson = await newsCategoryResponse.json();

        dataTrending = trendingNewsJson.data;
        dataNewsCategory = newsCategoryJson.data;
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true,
        };
      }

      return {
        props: {
          trendingNews: dataTrending,
          oneNewsCategory: dataNewsCategory,
        },
      };
    }
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, {
  getNewsByCategory,
  setActiveLink,
})(NewsCategory);

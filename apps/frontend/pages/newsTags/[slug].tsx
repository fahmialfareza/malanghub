import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import { getNewsByTag } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import Spinner from "../../components/layouts/Spinner";
import NewsByTagItem from "../../components/news/NewsByTagItem";
import TrendingNews from "../../components/news/TrendingNews";
import * as Sentry from "@sentry/nextjs";
import { GetStaticPropsContext } from "next";
import { RootState } from "../../redux/store";
import { News, NewsTag as NewsTg } from "../../models/news";
import { NewsReducerState } from "../../redux/types";

interface NewsTagProps {
  trendingNews: News[];
  oneNewsTag: NewsTg;
  news: NewsReducerState;
  getNewsByTag: (id: string, page: number) => void;
  setActiveLink: (link: string) => void;
}

const NewsTag = ({
  trendingNews,
  oneNewsTag,
  news: { newsByTag, loading: newsLoading },
  getNewsByTag,
  setActiveLink,
}: NewsTagProps) => {
  const router = useRouter();

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    getNewsByTag(oneNewsTag?._id, 1);
  }, [oneNewsTag]);

  return (
    <>
      <Head>
        <title>Malanghub - Tag Berita - {oneNewsTag?.name}</title>
        <meta
          name="title"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.name}`}
        />
        <meta
          name="description"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/newsTags/${oneNewsTag?.slug}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.name}`}
        />
        <meta
          property="og:description"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/newsTags/${oneNewsTag?.slug}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.name}`}
        />
        <meta
          property="twitter:description"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> / Tag Berita /
          <span className="breadcrumb_last" aria-current="page">
            {oneNewsTag && oneNewsTag.name}
          </span>
        </div>
      </nav>
      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left">
                {oneNewsTag && oneNewsTag.name}
              </h3>

              {newsLoading || newsByTag === null ? (
                <Spinner />
              ) : !newsLoading &&
                newsByTag &&
                newsByTag.data &&
                newsByTag.data.length > 0 ? (
                <NewsByTagItem paramsId={oneNewsTag?._id} news={newsByTag} />
              ) : (
                <h1>Belum Ada Berita</h1>
              )}
            </div>

            <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
              <div className="pos-sticky">
                <h3 className="section-title-left">Trending </h3>

                {newsLoading || trendingNews === null ? (
                  <Spinner />
                ) : !newsLoading && trendingNews && trendingNews.length > 0 ? (
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
}: GetStaticPropsContext<{ slug: string }>) {
  const result = await Sentry.startSpan(
    {
      name: "newsTags.[slug].getServerSideProps",
    },
    async () => {
      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;
      const newsTagUrl = `${process.env.API_ADDRESS}/api/newsTags/${params?.slug}`;

      let dataTrending = {};
      let dataNewsTag = {};

      try {
        // Fetch both trending news and news tag data concurrently
        const [trendingNewsResponse, newsTagResponse] = await Promise.all([
          fetch(trendingNewsUrl),
          fetch(newsTagUrl),
        ]);

        // Check if both responses are successful
        if (!trendingNewsResponse.ok || !newsTagResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const trendingNewsJson = await trendingNewsResponse.json();
        const newsTagJson = await newsTagResponse.json();

        dataTrending = trendingNewsJson.data;
        dataNewsTag = newsTagJson.data;
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true,
        };
      }

      return { props: { trendingNews: dataTrending, oneNewsTag: dataNewsTag } };
    }
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
  newsTag: state.newsTag,
});

export default connect(mapStateToProps, {
  getNewsByTag,
  setActiveLink,
})(NewsTag);

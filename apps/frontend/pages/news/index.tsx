import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import moment from "moment";
import { getAllNews } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import AllNewsItem from "../../components/news/AllNewsItem";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { LoadingBlock } from "@malanghub/ui";
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
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />

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

        <link rel="canonical" href="https://www.malanghub.com/news" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Semua Berita - Malanghub",
              description:
                "Kumpulan seluruh berita terbaru seputar Malang Raya dari Malanghub.",
              url: "https://www.malanghub.com/news",
              inLanguage: "id-ID",
              isPartOf: {
                "@type": "WebSite",
                "@id": "https://www.malanghub.com/#website",
              },
            }),
          }}
        />
      </Head>

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Semua Berita" },
        ]}
        title="Semua Berita"
        trendingNews={trendingNews}
        trendingLoading={newsLoading}
      >
        {newsLoading || allNews === null ? (
          <LoadingBlock />
        ) : allNews?.data?.length > 0 ? (
          <AllNewsItem news={allNews} />
        ) : (
          <EmptyNews>Belum Ada Berita</EmptyNews>
        )}
      </NewsListingLayout>
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
    },
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, { getAllNews, setActiveLink })(News);

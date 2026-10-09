import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import { useRouter } from "next/router";
import moment from "moment";
import { getNewsByTag } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsByTagItem from "../../components/news/NewsByTagItem";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { LoadingBlock } from "@malanghub/ui";
import * as Sentry from "@sentry/nextjs";
import { GetStaticPropsContext } from "next";
import { RootState } from "../../redux/store";
import { News, NewsTag as NewsTg } from "../../models/news";
import { NewsReducerState } from "../../redux/types";

interface NewsTagProps {
  trendingNews: News[];
  oneNewsTag: { tag: NewsTg };
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
    getNewsByTag(oneNewsTag?.tag.id || "", 1);
  }, [oneNewsTag]);

  return (
    <>
      <Head>
        <title>Malanghub - Tag Berita - {oneNewsTag?.tag.name}</title>
        <meta
          name="title"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.tag.name}`}
        />
        <meta
          name="description"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.tag.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/newsTags/${oneNewsTag?.tag.slug}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.tag.name}`}
        />
        <meta
          property="og:description"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.tag.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/newsTags/${oneNewsTag?.tag.slug}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.tag.name}`}
        />
        <meta
          property="twitter:description"
          content={`Malanghub - Tag Berita - ${oneNewsTag?.tag.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <link
          rel="canonical"
          href={`https://www.malanghub.com/newsTags/${oneNewsTag?.tag.slug}`}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Beranda",
                  item: "https://www.malanghub.com/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Tag Berita",
                  item: "https://www.malanghub.com/news",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: oneNewsTag?.tag.name,
                  item: `https://www.malanghub.com/newsTags/${oneNewsTag?.tag.slug}`,
                },
              ],
            }),
          }}
        />
      </Head>

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Tag Berita" },
          { label: oneNewsTag?.tag?.name ?? "" },
        ]}
        title={
          <>
            <span className="tw:text-muted">#</span>
            {oneNewsTag?.tag?.name}
          </>
        }
        trendingNews={trendingNews}
        trendingLoading={newsLoading}
      >
        {newsLoading || newsByTag === null ? (
          <LoadingBlock />
        ) : newsByTag?.data?.length > 0 ? (
          <NewsByTagItem
            paramsId={oneNewsTag?.tag?.id || ""}
            news={newsByTag}
          />
        ) : (
          <EmptyNews>Belum Ada Berita</EmptyNews>
        )}
      </NewsListingLayout>
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
    },
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

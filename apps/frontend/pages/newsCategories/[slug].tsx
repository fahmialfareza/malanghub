import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import { useRouter } from "next/router";
import moment from "moment";
import { getNewsByCategory } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsByCategoryItem from "../../components/news/NewsByCategoryItem";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { LoadingBlock } from "@malanghub/ui";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../../redux/store";
import { GetServerSidePropsContext } from "next";
import { News, NewsCategoryFull as NewsCtg } from "../../models/news";
import { NewsReducerState } from "../../redux/types";

interface NewsCategoryProps {
  trendingNews: News[];
  oneNewsCategory: { category: NewsCtg };
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
    getNewsByCategory(oneNewsCategory?.category?.id || "", 1);
  }, [oneNewsCategory]);

  return (
    <>
      <Head>
        <title>
          Malanghub - Kategori Berita - {oneNewsCategory?.category?.name}
        </title>
        <meta
          name="title"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.category?.name}`}
        />
        <meta
          name="description"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.category?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/newsCategories/${oneNewsCategory?.category?.slug}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.category?.name}`}
        />
        <meta
          property="og:description"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.category?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
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
          content={`https://www.malanghub.com/newsCategories/${oneNewsCategory?.category?.slug}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.category?.name}`}
        />
        <meta
          property="twitter:description"
          content={`Malanghub - Kategori Berita - ${oneNewsCategory?.category?.name} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <link
          rel="canonical"
          href={`https://www.malanghub.com/newsCategories/${oneNewsCategory?.category?.slug}`}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${oneNewsCategory?.category?.name} - Malanghub`,
              description: `Berita kategori ${oneNewsCategory?.category?.name} dari Malanghub.`,
              url: `https://www.malanghub.com/newsCategories/${oneNewsCategory?.category?.slug}`,
              inLanguage: "id-ID",
            }),
          }}
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
                  name: "Kategori Berita",
                  item: "https://www.malanghub.com/news",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: oneNewsCategory?.category?.name,
                  item: `https://www.malanghub.com/newsCategories/${oneNewsCategory?.category?.slug}`,
                },
              ],
            }),
          }}
        />
      </Head>

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Kategori Berita" },
          { label: oneNewsCategory?.category?.name ?? "" },
        ]}
        title={oneNewsCategory?.category?.name}
        trendingNews={trendingNews}
        trendingLoading={newsLoading}
      >
        {newsLoading || newsByCategory === null ? (
          <LoadingBlock />
        ) : newsByCategory?.data?.length > 0 ? (
          <NewsByCategoryItem
            news={newsByCategory}
            paramsId={oneNewsCategory?.category?.id || ""}
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
    },
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

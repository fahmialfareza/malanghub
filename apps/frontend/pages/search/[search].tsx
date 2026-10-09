import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import moment from "moment";
import { getNewsBySearch } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import SearchNewsItem from "../../components/news/SearchNewsItem";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { LoadingBlock } from "@malanghub/ui";
import * as Sentry from "@sentry/nextjs";
import { GetStaticPropsContext } from "next";
import { RootState } from "../../redux/store";
import { News } from "../../models/news";
import { NewsReducerState } from "../../redux/types";

interface SearchNewsProps {
  trendingNews: News[];
  news: NewsReducerState;
  getNewsBySearch: (search: string, page: number) => void;
  setActiveLink: (link: string) => void;
}

const SearchNews = ({
  trendingNews,
  news: { newsBySearch, loading: newsLoading },
  getNewsBySearch,
  setActiveLink,
}: SearchNewsProps) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    if (router.query) {
      const searchQuery = Array.isArray(router.query.search)
        ? router.query.search[0] // If it's an array, use the first element
        : router.query.search || "";

      if (searchQuery) {
        setSearchQuery(searchQuery);
        getNewsBySearch(searchQuery, 1); // Now searchQuery is guaranteed to be a string
      }
    }
  }, [router.query.search]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,follow" />
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

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Pencarian" },
          { label: router.query.search },
        ]}
        title={`Pencarian "${router.query.search ?? ""}"`}
        trendingNews={trendingNews}
        trendingLoading={newsLoading}
      >
        {newsLoading || newsBySearch === null ? (
          <LoadingBlock />
        ) : newsBySearch?.data?.length > 0 ? (
          <SearchNewsItem news={newsBySearch} search={searchQuery} />
        ) : (
          <EmptyNews>Berita Tidak Ditemukan</EmptyNews>
        )}
      </NewsListingLayout>
    </>
  );
};

export async function getServerSideProps({ params }: GetStaticPropsContext) {
  const result = await Sentry.startSpan(
    {
      name: "search.[search].getServerSideProps",
    },
    async () => {
      const url = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;

      let data = {};
      try {
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch trending news");
        }

        const jsonData = await res.json();
        data = jsonData.data;
      } catch (e) {
        Sentry.captureException(e);
        return { props: { trendingNews: data } }; // Return empty or partial data if an error occurs
      }

      return { props: { trendingNews: data } };
    },
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, { getNewsBySearch, setActiveLink })(
  SearchNews,
);

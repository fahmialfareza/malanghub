import { useEffect } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { NewsGrid } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import * as Sentry from "@sentry/nextjs";
import { GetServerSidePropsContext } from "next";
import { News, NewsCategoryFull as NewsCtg } from "../../models/news";
import {
  fetchJson,
  fetchNewsPage,
  firstPageRedirect,
  isPageOutOfRange,
  pageCountOf,
  parsePage,
} from "../../utils/pagination";
import { SITE_URL } from "../../utils/seo";

const LIMIT = 5;

interface NewsCategoryProps {
  trendingNews: News[];
  oneNewsCategory: { category: NewsCtg };
  news: News[];
  page: number;
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const NewsCategory = ({
  trendingNews,
  oneNewsCategory,
  news,
  page,
  pageCount,
  setActiveLink,
}: NewsCategoryProps) => {
  useEffect(() => {
    setActiveLink("news");
  }, []);

  const category = oneNewsCategory?.category;
  const basePath = `/newsCategories/${category?.slug}`;
  const title = `Malanghub - Kategori Berita - ${category?.name}`;

  return (
    <>
      <ListingSeo
        title={title}
        description={`${title} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        collectionName={`${category?.name} - Malanghub`}
        collectionDescription={`Berita kategori ${category?.name} dari Malanghub.`}
        basePath={basePath}
        page={page}
        pageCount={pageCount}
        limit={LIMIT}
        news={news}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Beranda",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Kategori Berita",
                item: `${SITE_URL}/news`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: category?.name,
                item: `${SITE_URL}${basePath}`,
              },
            ],
          },
        ]}
      />

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Kategori Berita" },
          { label: category?.name ?? "" },
        ]}
        title={category?.name}
        trendingNews={trendingNews}
      >
        {news.length > 0 ? (
          <NewsGrid
            news={news}
            page={page}
            pageCount={pageCount}
            basePath={basePath}
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
  query,
}: GetServerSidePropsContext<{ slug: string }>) {
  const slug = params?.slug ?? "";
  const page = parsePage(query.page);
  if (page === null) {
    return firstPageRedirect(`/newsCategories/${encodeURIComponent(slug)}`);
  }

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
      const newsCategoryUrl = `${process.env.API_ADDRESS}/api/newsCategories/${encodeURIComponent(slug)}`;

      try {
        // Trending and the category load concurrently; the list starts as
        // soon as the category id is known.
        const categoryPromise = fetchJson(newsCategoryUrl);
        const [trendingNewsJson, newsCategoryJson, list] = await Promise.all([
          fetchJson(trendingNewsUrl),
          categoryPromise,
          categoryPromise.then((json) => {
            const id = json?.data?.category?.id;
            if (!id) throw new Error("News category not found");
            return fetchNewsPage(
              `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}&category=${id}`,
            );
          }),
        ]);

        if (isPageOutOfRange(page, list.meta)) {
          return { notFound: true as const };
        }

        return {
          props: {
            trendingNews: trendingNewsJson.data,
            oneNewsCategory: newsCategoryJson.data,
            news: list.data,
            page,
            pageCount: pageCountOf(list.meta),
          },
        };
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true as const,
        };
      }
    },
  );

  return result;
}

export default connect(null, { setActiveLink })(NewsCategory);

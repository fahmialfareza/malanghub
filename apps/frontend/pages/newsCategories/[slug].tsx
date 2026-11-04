import { useEffect } from "react";
import { connect } from "react-redux";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { NewsGrid } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import { GetStaticPropsContext } from "next";
import { News, NewsCategoryFull as NewsCtg } from "../../models/news";
import {
  fetchJson,
  fetchNewsPage,
  pageCountOf,
} from "../../utils/pagination";
import { fetchList } from "../../utils/apiList";
import { usePagedNews } from "../../utils/usePagedNews";
import { LoadingBlock } from "@malanghub/ui";
import { SITE_URL } from "../../utils/seo";

const LIMIT = 5;

const listPath = (categoryId: string) => (page: number) =>
  `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}&category=${categoryId}&excerpt=1`;

interface NewsCategoryProps {
  trendingNews: News[];
  oneNewsCategory: { category: NewsCtg };
  news: News[];
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const NewsCategory = ({
  trendingNews,
  oneNewsCategory,
  setActiveLink,
  ...firstPage
}: NewsCategoryProps) => {
  useEffect(() => {
    setActiveLink("news");
  }, []);

  const category = oneNewsCategory?.category;
  const basePath = `/newsCategories/${category?.slug}`;
  const { page, news, pageCount, loading, notFound } = usePagedNews(
    basePath,
    firstPage,
    listPath(category?.id ?? ""),
  );
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
        noindex={notFound}
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
        {loading ? (
          <LoadingBlock />
        ) : notFound ? (
          <EmptyNews>Halaman Tidak Ditemukan</EmptyNews>
        ) : news.length > 0 ? (
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

export async function getStaticPaths() {
  const categories = await fetchList<{ slug?: string }>("/api/newsCategories");
  return {
    paths: categories
      .filter((category) => category.slug)
      .map((category) => ({ params: { slug: category.slug! } })),
    fallback: false,
  };
}

// Page 1 is prerendered; later pages load in the browser (usePagedNews).
export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ slug: string }>) {
  const slug = params!.slug;
  const [trendingNewsJson, newsCategoryJson] = await Promise.all([
    fetchJson(
      `${process.env.API_ADDRESS}/api/news?page=1&sort=-views&limit=4&excerpt=1`,
    ),
    fetchJson(
      `${process.env.API_ADDRESS}/api/newsCategories/${encodeURIComponent(slug)}`,
    ),
  ]);
  const list = await fetchNewsPage(
    listPath(newsCategoryJson.data.category.id)(1),
  );

  return {
    props: {
      trendingNews: trendingNewsJson.data,
      oneNewsCategory: newsCategoryJson.data,
      news: list.data,
      pageCount: pageCountOf(list.meta),
    },
  };
}

export default connect(null, { setActiveLink })(NewsCategory);

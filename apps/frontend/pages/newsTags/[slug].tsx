import { useEffect } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, {
  EmptyNews,
} from "../../components/news/NewsListingLayout";
import { NewsGrid } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import { GetStaticPropsContext } from "next";
import { News, NewsTag as NewsTg } from "../../models/news";
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

const listPath = (tagId: string) => (page: number) =>
  `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}&tags=${tagId}`;

// One cutoff for the whole build, so every tag page shares one cached
// trending request.
const TRENDING_SINCE = moment().subtract(1, "months").toISOString();

interface NewsTagProps {
  trendingNews: News[];
  oneNewsTag: { tag: NewsTg };
  news: News[];
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const NewsTag = ({
  trendingNews,
  oneNewsTag,
  setActiveLink,
  ...firstPage
}: NewsTagProps) => {
  useEffect(() => {
    setActiveLink("news");
  }, []);

  const tag = oneNewsTag?.tag;
  const basePath = `/newsTags/${tag?.slug}`;
  const { page, news, pageCount, loading, notFound } = usePagedNews(
    basePath,
    firstPage,
    listPath(tag?.id ?? ""),
  );
  const title = `Malanghub - Tag Berita - ${tag?.name}`;

  return (
    <>
      <ListingSeo
        title={title}
        description={`${title} - Situs yang menyediakan informasi sekitar Malang Raya!`}
        collectionName={`#${tag?.name} - Malanghub`}
        collectionDescription={`Berita dengan tag ${tag?.name} dari Malanghub.`}
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
                name: "Tag Berita",
                item: `${SITE_URL}/news`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: tag?.name,
                item: `${SITE_URL}${basePath}`,
              },
            ],
          },
        ]}
      />

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Tag Berita" },
          { label: tag?.name ?? "" },
        ]}
        title={
          <>
            <span className="text-muted">#</span>
            {tag?.name}
          </>
        }
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
  const tags = await fetchList<{ slug?: string }>("/api/newsTags");
  return {
    paths: tags
      .filter((tag) => tag.slug)
      .map((tag) => ({ params: { slug: tag.slug! } })),
    fallback: false,
  };
}

// Page 1 is prerendered; later pages load in the browser (usePagedNews).
export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ slug: string }>) {
  const slug = params!.slug;
  const [trendingNewsJson, newsTagJson] = await Promise.all([
    fetchJson(
      `${process.env.API_ADDRESS}/api/news?page=1&sort=-views&limit=4&created_at[gte]=${TRENDING_SINCE}`,
    ),
    fetchJson(
      `${process.env.API_ADDRESS}/api/newsTags/${encodeURIComponent(slug)}`,
    ),
  ]);
  const list = await fetchNewsPage(listPath(newsTagJson.data.tag.id)(1));

  return {
    props: {
      trendingNews: trendingNewsJson.data,
      oneNewsTag: newsTagJson.data,
      news: list.data,
      pageCount: pageCountOf(list.meta),
    },
  };
}

export default connect(null, { setActiveLink })(NewsTag);

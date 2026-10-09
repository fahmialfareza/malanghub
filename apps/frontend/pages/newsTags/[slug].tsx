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
import { News, NewsTag as NewsTg } from "../../models/news";
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

interface NewsTagProps {
  trendingNews: News[];
  oneNewsTag: { tag: NewsTg };
  news: News[];
  page: number;
  pageCount: number;
  setActiveLink: (link: string) => void;
}

const NewsTag = ({
  trendingNews,
  oneNewsTag,
  news,
  page,
  pageCount,
  setActiveLink,
}: NewsTagProps) => {
  useEffect(() => {
    setActiveLink("news");
  }, []);

  const tag = oneNewsTag?.tag;
  const basePath = `/newsTags/${tag?.slug}`;
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
    return firstPageRedirect(`/newsTags/${encodeURIComponent(slug)}`);
  }

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
      const newsTagUrl = `${process.env.API_ADDRESS}/api/newsTags/${encodeURIComponent(slug)}`;

      try {
        // Trending and the tag load concurrently; the list starts as soon
        // as the tag id is known.
        const tagPromise = fetchJson(newsTagUrl);
        const [trendingNewsJson, newsTagJson, list] = await Promise.all([
          fetchJson(trendingNewsUrl),
          tagPromise,
          tagPromise.then((json) => {
            const id = json?.data?.tag?.id;
            if (!id) throw new Error("News tag not found");
            return fetchNewsPage(
              `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}&tags=${id}`,
            );
          }),
        ]);

        if (isPageOutOfRange(page, list.meta)) {
          return { notFound: true as const };
        }

        return {
          props: {
            trendingNews: trendingNewsJson.data,
            oneNewsTag: newsTagJson.data,
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

export default connect(null, { setActiveLink })(NewsTag);

import { useEffect } from "react";
import { connect } from "react-redux";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, { EmptyNews } from "./NewsListingLayout";
import { NewsGrid } from "./NewsCard";
import ListingSeo from "../seo/ListingSeo";
import { LISTING_LIMIT, TagListingPage } from "../../utils/listings";
import { listingHref } from "../../utils/pagination";
import { useLegacyPageRedirect } from "../../utils/useLegacyPageRedirect";
import { SITE_URL } from "../../utils/seo";

interface TagListingProps extends TagListingPage {
  setActiveLink: (link: string) => void;
}

/** `/newsTags/:slug` and `.../page/N`: every page is prerendered. */
const TagListing = ({
  trendingNews,
  oneNewsTag,
  news,
  page,
  pageCount,
  setActiveLink,
}: TagListingProps) => {
  const tag = oneNewsTag?.tag;
  const basePath = `/newsTags/${tag?.slug}`;
  const hrefFor = (target: number) => listingHref(basePath, target);
  const title = `Malanghub - Tag Berita - ${tag?.name}`;

  useLegacyPageRedirect(basePath, page === 1);

  useEffect(() => {
    setActiveLink("news");
  }, []);

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
        limit={LISTING_LIMIT}
        news={news}
        hrefFor={hrefFor}
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
            hrefFor={hrefFor}
          />
        ) : (
          <EmptyNews>Belum Ada Berita</EmptyNews>
        )}
      </NewsListingLayout>
    </>
  );
};

export default connect(null, { setActiveLink })(TagListing);

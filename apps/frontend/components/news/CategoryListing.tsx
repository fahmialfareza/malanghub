import { useEffect } from "react";
import { connect } from "react-redux";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, { EmptyNews } from "./NewsListingLayout";
import { NewsGrid } from "./NewsCard";
import ListingSeo from "../seo/ListingSeo";
import { LISTING_LIMIT, CategoryListingPage } from "../../utils/listings";
import { listingHref } from "../../utils/pagination";
import { useLegacyPageRedirect } from "../../utils/useLegacyPageRedirect";
import { SITE_URL } from "../../utils/seo";

interface CategoryListingProps extends CategoryListingPage {
  setActiveLink: (link: string) => void;
}

/** `/newsCategories/:slug` and `.../page/N`: every page is prerendered. */
const CategoryListing = ({
  trendingNews,
  oneNewsCategory,
  news,
  page,
  pageCount,
  setActiveLink,
}: CategoryListingProps) => {
  const category = oneNewsCategory?.category;
  const basePath = `/newsCategories/${category?.slug}`;
  const hrefFor = (target: number) => listingHref(basePath, target);
  const title = `Malanghub - Kategori Berita - ${category?.name}`;

  useLegacyPageRedirect(basePath, page === 1);

  useEffect(() => {
    setActiveLink("news");
  }, []);

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
            hrefFor={hrefFor}
          />
        ) : (
          <EmptyNews>Belum Ada Berita</EmptyNews>
        )}
      </NewsListingLayout>
    </>
  );
};

export default connect(null, { setActiveLink })(CategoryListing);

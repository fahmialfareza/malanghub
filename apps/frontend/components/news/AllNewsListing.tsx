import { useEffect } from "react";
import { connect } from "react-redux";
import { setActiveLink } from "../../redux/actions/layoutActions";
import NewsListingLayout, { EmptyNews } from "./NewsListingLayout";
import { NewsGrid } from "./NewsCard";
import ListingSeo from "../seo/ListingSeo";
import { LISTING_LIMIT, ListingPage } from "../../utils/listings";
import { listingHref } from "../../utils/pagination";
import { useLegacyPageRedirect } from "../../utils/useLegacyPageRedirect";

const BASE_PATH = "/news";
const hrefFor = (page: number) => listingHref(BASE_PATH, page);

interface AllNewsListingProps extends ListingPage {
  setActiveLink: (link: string) => void;
}

/** `/news` and `/news/page/N`: every page is prerendered. */
const AllNewsListing = ({
  trendingNews,
  news,
  page,
  pageCount,
  setActiveLink,
}: AllNewsListingProps) => {
  useLegacyPageRedirect(BASE_PATH, page === 1);

  useEffect(() => {
    setActiveLink("news");
  }, []);

  return (
    <>
      <ListingSeo
        title="Malanghub - Semua Berita"
        description="Malanghub - Semua Berita - Situs yang menyediakan informasi sekitar Malang Raya!"
        collectionName="Semua Berita - Malanghub"
        collectionDescription="Kumpulan seluruh berita terbaru seputar Malang Raya dari Malanghub."
        basePath={BASE_PATH}
        page={page}
        pageCount={pageCount}
        limit={LISTING_LIMIT}
        news={news}
        hrefFor={hrefFor}
      />

      <NewsListingLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Semua Berita" },
        ]}
        title="Semua Berita"
        trendingNews={trendingNews}
      >
        {news.length > 0 ? (
          <NewsGrid
            news={news}
            page={page}
            pageCount={pageCount}
            basePath={BASE_PATH}
            hrefFor={hrefFor}
          />
        ) : (
          <EmptyNews>Belum Ada Berita</EmptyNews>
        )}
      </NewsListingLayout>
    </>
  );
};

export default connect(null, { setActiveLink })(AllNewsListing);

import Head from "next/head";
import { pageHref } from "@malanghub/ui";
import { News } from "../../models/news";
import { SITE_URL } from "../../utils/seo";

const DEFAULT_IMAGE = `${SITE_URL}/malanghub-meta.png`;

interface ListingSeoProps {
  /** Page-1 title, e.g. "Malanghub - Semua Berita". */
  title: string;
  description: string;
  /** Listing path without `?page`, e.g. `/news`. */
  basePath: string;
  page: number;
  pageCount: number;
  /** Page size, used to number the ItemList across pages. */
  limit: number;
  news: News[];
  /** Defaults to the Malanghub share image. */
  image?: string;
  /** CollectionPage name/description (defaults to title/description). */
  collectionName?: string;
  collectionDescription?: string;
  /** Adds `noindex, follow` (e.g. search results). */
  noindex?: boolean;
  /** Extra JSON-LD objects (breadcrumbs, Person, ...). */
  jsonLd?: object[];
}

/**
 * Head tags for a paginated news listing: page-aware title, self-referencing
 * canonical, prev/next links and a CollectionPage + ItemList of the articles.
 */
const ListingSeo = ({
  title,
  description,
  basePath,
  page,
  pageCount,
  limit,
  news,
  image,
  collectionName,
  collectionDescription,
  noindex,
  jsonLd = [],
}: ListingSeoProps) => {
  const pageTitle = page > 1 ? `${title} - Halaman ${page}` : title;
  const canonical = `${SITE_URL}${pageHref(basePath, page)}`;
  const prev = page > 1 ? `${SITE_URL}${pageHref(basePath, page - 1)}` : null;
  const next =
    page < pageCount ? `${SITE_URL}${pageHref(basePath, page + 1)}` : null;
  const shareImage = image || DEFAULT_IMAGE;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      page > 1
        ? `${collectionName ?? title} - Halaman ${page}`
        : (collectionName ?? title),
    description: collectionDescription ?? description,
    url: canonical,
    inLanguage: "id-ID",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: news.length,
      itemListElement: news.map((item, index) => ({
        "@type": "ListItem",
        position: (page - 1) * limit + index + 1,
        url: `${SITE_URL}/news/${item.slug}`,
        name: item.title,
      })),
    },
  };

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={shareImage} />
      {!image && <meta property="og:image:width" content="1200" />}
      {!image && <meta property="og:image:height" content="628" />}

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={shareImage} />

      <link rel="canonical" href={canonical} />
      {prev && <link rel="prev" href={prev} />}
      {next && <link rel="next" href={next} />}

      {[collectionPage, ...jsonLd].map((data, index) => (
        <script
          key={`ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape "<" so article titles can't close the script tag.
            __html: JSON.stringify(data).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </Head>
  );
};

export default ListingSeo;

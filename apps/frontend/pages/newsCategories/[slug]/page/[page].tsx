import { GetStaticPropsContext } from "next";
import CategoryListing from "../../../../components/news/CategoryListing";
import {
  categorySlugs,
  laterPages,
  loadCategory,
} from "../../../../utils/listings";

// `/newsCategories/:slug/page/N`: category pages 2..N as static files.
export async function getStaticPaths() {
  const slugs = await categorySlugs();
  const paths = await Promise.all(
    slugs.map(async (slug) => {
      const { pageCount } = await loadCategory(slug, 1);
      return laterPages(pageCount).map((page) => ({ params: { slug, page } }));
    }),
  );
  return { paths: paths.flat(), fallback: false };
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ slug: string; page: string }>) {
  return { props: await loadCategory(params!.slug, Number(params!.page)) };
}

export default CategoryListing;

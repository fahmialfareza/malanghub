import { GetStaticPropsContext } from "next";
import CategoryListing from "../../components/news/CategoryListing";
import { categorySlugs, loadCategory } from "../../utils/listings";

export async function getStaticPaths() {
  const slugs = await categorySlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ slug: string }>) {
  return { props: await loadCategory(params!.slug, 1) };
}

export default CategoryListing;

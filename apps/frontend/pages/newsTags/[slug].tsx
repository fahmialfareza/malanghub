import { GetStaticPropsContext } from "next";
import TagListing from "../../components/news/TagListing";
import { loadTag, tagSlugs } from "../../utils/listings";

export async function getStaticPaths() {
  const slugs = await tagSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ slug: string }>) {
  return { props: await loadTag(params!.slug, 1) };
}

export default TagListing;

import { GetStaticPropsContext } from "next";
import TagListing from "../../../../components/news/TagListing";
import { laterPages, loadTag, tagSlugs } from "../../../../utils/listings";

// `/newsTags/:slug/page/N`: tag pages 2..N as static files.
export async function getStaticPaths() {
  const slugs = await tagSlugs();
  const paths = await Promise.all(
    slugs.map(async (slug) => {
      const { pageCount } = await loadTag(slug, 1);
      return laterPages(pageCount).map((page) => ({ params: { slug, page } }));
    }),
  );
  return { paths: paths.flat(), fallback: false };
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ slug: string; page: string }>) {
  return { props: await loadTag(params!.slug, Number(params!.page)) };
}

export default TagListing;

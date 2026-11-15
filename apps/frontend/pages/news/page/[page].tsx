import { GetStaticPropsContext } from "next";
import AllNewsListing from "../../../components/news/AllNewsListing";
import { laterPages, loadAllNews } from "../../../utils/listings";

// `/news/page/N`: listing pages 2..N as static files, so crawlers can reach
// every article through plain links.
export async function getStaticPaths() {
  const { pageCount } = await loadAllNews(1);
  return {
    paths: laterPages(pageCount).map((page) => ({ params: { page } })),
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ page: string }>) {
  return { props: await loadAllNews(Number(params!.page)) };
}

export default AllNewsListing;

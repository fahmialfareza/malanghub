import AllNewsListing from "../../components/news/AllNewsListing";
import { loadAllNews } from "../../utils/listings";

export async function getStaticProps() {
  return { props: await loadAllNews(1) };
}

export default AllNewsListing;

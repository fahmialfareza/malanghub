import { GetStaticPropsContext } from "next";
import { fetchJson, fetchNewsPage, pageCountOf } from "../../utils/pagination";
import { fetchAllNews } from "../../utils/apiList";
import { userNewsPath } from "../../components/users/UserProfile";

export { default } from "../../components/users/UserProfile";

// Every author with a published article gets a prerendered profile; page 1
// of their articles is in the HTML, later pages load in the browser. Other
// users are served by pages/404.tsx, which loads the profile client-side.
export async function getStaticPaths() {
  const items = await fetchAllNews<{ user?: { _id?: string } }>("select=user");
  const ids = new Set(
    items.map((item) => item.user?._id).filter((id): id is string => !!id),
  );
  return {
    paths: Array.from(ids).map((id) => ({ params: { id } })),
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: GetStaticPropsContext<{ id: string }>) {
  const id = params!.id;
  const [trendingNewsJson, userJson, list] = await Promise.all([
    fetchJson(
      `${process.env.API_ADDRESS}/api/news?page=1&sort=-views&limit=4&user=${id}&excerpt=1`,
    ),
    fetchJson(`${process.env.API_ADDRESS}/api/users/${id}`),
    fetchNewsPage(userNewsPath(id)(1)),
  ]);

  return {
    props: {
      userId: id,
      trendingNewsByUser: trendingNewsJson.data,
      userProfile: userJson.data,
      userNews: list.data,
      pageCount: pageCountOf(list.meta),
    },
  };
}

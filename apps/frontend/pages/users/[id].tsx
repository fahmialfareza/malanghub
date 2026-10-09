import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import moment from "moment";
import { setActiveLink } from "../../redux/actions/layoutActions";
import {
  Badge,
  Breadcrumbs,
  Card,
  Container,
  Spinner,
  badgeClass,
} from "@malanghub/ui";
import assetsPath from "../../components/layouts/Assets";
import { NewsPagination } from "../../components/news/NewsCard";
import ListingSeo from "../../components/seo/ListingSeo";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../../redux/store";
import { GetServerSidePropsContext } from "next";
import { News } from "../../models/news";
import { UserProfile } from "../../models/user";
import { UserReducerState } from "../../redux/types";
import {
  fetchJson,
  fetchNewsPage,
  firstPageRedirect,
  isPageOutOfRange,
  pageCountOf,
  parsePage,
} from "../../utils/pagination";
import { SITE_URL } from "../../utils/seo";

const LIMIT = 4;

interface GetUserProfileProps {
  userId: string;
  trendingNewsByUser: News[];
  setActiveLink: (link: string) => void;
  userProfile: UserProfile;
  user: UserReducerState;
  userNews: News[];
  page: number;
  pageCount: number;
}

const GetUserProfile = ({
  userId,
  trendingNewsByUser,
  setActiveLink,
  userProfile,
  user: { loading: userLoading },
  userNews,
  page,
  pageCount,
}: GetUserProfileProps) => {
  useEffect(() => {
    setActiveLink("");
  }, []);

  const basePath = `/users/${userProfile?._id ?? userId}`;
  const bioText = userProfile?.bio?.replace(/<(.|\n)*?>/g, "") ?? "";

  const socialLinks = userProfile
    ? [
        userProfile.facebook && {
          key: "facebook",
          label: "Facebook",
          icon: "fab fa-facebook",
          href: userProfile.facebook,
        },
        userProfile.twitter && {
          key: "twitter",
          label: "Twitter",
          icon: "fab fa-twitter",
          href: `https://twitter.com/${userProfile.twitter}`,
        },
        userProfile.instagram && {
          key: "instagram",
          label: "Instagram",
          icon: "fab fa-instagram",
          href: `https://instagram.com/${userProfile.instagram}`,
        },
        userProfile.linkedin && {
          key: "linkedin",
          label: "Linkedin",
          icon: "fab fa-linkedin",
          href: userProfile.linkedin,
        },
        userProfile.tiktok && {
          key: "tiktok",
          label: "Tiktok",
          icon: "fab fa-tiktok",
          href: `https://www.tiktok.com/@${userProfile.tiktok}`,
        },
      ].filter(
        (
          link,
        ): link is { key: string; label: string; icon: string; href: string } =>
          !!link,
      )
    : [];

  return (
    <>
      <ListingSeo
        title={`Malanghub - Pengguna - ${userProfile?.name}`}
        description={bioText.slice(0, 255)}
        collectionName={`Berita dari ${userProfile?.name} - Malanghub`}
        basePath={basePath}
        page={page}
        pageCount={pageCount}
        limit={LIMIT}
        news={userNews}
        image={userProfile?.photo}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: userProfile?.name,
            url: `${SITE_URL}${basePath}`,
            image: userProfile?.photo,
            description: userProfile?.bio
              ? userProfile.bio.replace(/<(.|\n)*?>/g, "").trim()
              : undefined,
            sameAs: [
              userProfile?.instagram
                ? `https://www.instagram.com/${userProfile.instagram}`
                : null,
              userProfile?.facebook
                ? `https://www.facebook.com/${userProfile.facebook}`
                : null,
              userProfile?.twitter
                ? `https://www.twitter.com/${userProfile.twitter}`
                : null,
              userProfile?.tiktok
                ? `https://www.tiktok.com/@${userProfile.tiktok}`
                : null,
              userProfile?.linkedin
                ? `https://www.linkedin.com/in/${userProfile.linkedin}`
                : null,
            ].filter(Boolean),
          },
        ]}
      />
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Pengguna" },
          {
            label: userLoading ? (
              <Spinner size="sm" />
            ) : (
              userProfile && userProfile.name
            ),
          },
        ]}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />
      <section className="bg-bg py-8 sm:py-12">
        <Container>
          <Card className="p-6 sm:p-8">
            {userLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                <div className="relative size-32 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface-2 shadow-card ring-1 ring-line sm:size-40">
                  <Image
                    src={
                      userProfile && userProfile.photo
                        ? userProfile.photo
                        : assetsPath("images/author.jpg")
                    }
                    alt={
                      userProfile?.name ? `Foto profil ${userProfile.name}` : ""
                    }
                    className="object-cover"
                    sizes="160px"
                    fill
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {userProfile && userProfile.motto && (
                    <Badge className="mb-3">{userProfile.motto}</Badge>
                  )}
                  <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
                    {userProfile && userProfile.name}
                  </h1>
                  {userProfile && userProfile.bio && (
                    <div className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-body [&_p]:mb-2 [&_p]:text-body">
                      {parse(userProfile.bio)}
                    </div>
                  )}
                  {socialLinks.length > 0 && (
                    <ul className="m-0 mt-5 flex list-none flex-wrap justify-center gap-2 p-0 md:justify-start">
                      {socialLinks.map((link) => (
                        <li key={link.key}>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={link.href}
                            aria-label={link.label}
                            className="flex size-10 items-center justify-center rounded-full border border-line bg-surface-2 font-normal text-body no-underline transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                          >
                            <span
                              className={link.icon}
                              aria-hidden="true"
                            ></span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>
        </Container>
      </section>
      <div
        className="display-ad"
        style={{ margin: "8px auto", display: "block", textAlign: "center" }}
      ></div>
      <section className="bg-bg pb-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <h2 className="mt-0 mb-5 font-heading text-xl font-semibold text-fg sm:text-2xl">
                Pengguna Terbaru dari{" "}
                {userLoading ? (
                  <Spinner size="sm" />
                ) : (
                  userProfile && userProfile.name
                )}
              </h2>
              <div className="flex flex-col gap-4">
                {userNews.length > 0 &&
                  userNews.map((news) => (
                    <Card
                      key={news._id}
                      className="group flex flex-col-reverse gap-4 p-4 sm:flex-row sm:items-start sm:p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <span className={badgeClass("brand", "mb-2")}>
                          {news && news.category.name}
                        </span>
                        <Link
                          href={`/news/${news.slug}`}
                          className="block font-heading text-lg leading-snug font-bold text-fg no-underline hover:text-brand"
                        >
                          {news && news.title}
                        </Link>
                        <div className="mt-2 line-clamp-2 text-sm text-body">
                          {parse(news.content.replace(/<(.|\n)*?>/g, ""))}
                        </div>
                        <div className="mt-3 text-sm text-muted">
                          {news.user && news.user._id ? (
                            <Link
                              href={`/users/${news.user._id}`}
                              className="font-semibold text-fg no-underline hover:text-brand"
                            >
                              {news.user.name ?? "Penulis"}
                            </Link>
                          ) : (
                            <span className="font-semibold text-fg">
                              {news.user?.name ?? "Penulis"}
                            </span>
                          )}{" "}
                          di{" "}
                          {news.category && news.category.slug ? (
                            <Link
                              href={`/newsCategories/${news.category.slug}`}
                              className="font-semibold text-fg no-underline hover:text-brand"
                            >
                              {news.category.name ?? "Kategori"}
                            </Link>
                          ) : (
                            <span className="font-semibold text-fg">
                              {news.category?.name ?? "Kategori"}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span>
                            <i
                              className="fa fa-calendar mr-1"
                              aria-hidden="true"
                            ></i>
                            <Moment format="dddd, Do MMMM YYYY">
                              {news.created_at}
                            </Moment>
                          </span>
                          <span>
                            <i
                              className="fa fa-clock-o mr-1"
                              aria-hidden="true"
                            ></i>
                            {Math.ceil(news.time_read / 10)} menit
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/news/${news.slug}`}
                        className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:aspect-square sm:w-36"
                      >
                        <Image
                          src={news.mainImage}
                          alt=""
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(min-width: 640px) 144px, 100vw"
                          fill
                        />
                      </Link>
                    </Card>
                  ))}
              </div>

              <NewsPagination
                page={page}
                pageCount={pageCount}
                basePath={basePath}
              />
            </div>

            <aside className="min-w-0">
              <div className="lg:sticky lg:top-24">
                <Card className="p-5">
                  <h2 className="mt-0 mb-4 font-heading text-lg font-semibold text-fg">
                    Trending oleh {userProfile && userProfile.name}
                  </h2>

                  <ol className="m-0 flex list-none flex-col divide-y divide-line p-0">
                    {trendingNewsByUser &&
                      trendingNewsByUser.length > 0 &&
                      trendingNewsByUser?.map((news, index) => (
                        <li
                          key={news._id}
                          className="flex gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span className="font-heading text-2xl leading-none font-bold text-brand/60">
                            {index + 1}.
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/news/${news.slug}`}
                              className="block text-[0.95rem] leading-snug font-semibold text-fg no-underline hover:text-brand"
                            >
                              {news.title}
                            </Link>
                            <div className="mt-1.5 text-xs text-muted">
                              {news.user && news.user._id ? (
                                <Link
                                  href={`/users/${news.user._id}`}
                                  className="font-semibold text-body no-underline hover:text-brand"
                                >
                                  {news.user.name ?? "Penulis"}
                                </Link>
                              ) : (
                                <span className="font-semibold text-body">
                                  {news.user?.name ?? "Penulis"}
                                </span>
                              )}{" "}
                              di{" "}
                              <Link
                                href={`/newsCategories/${news.category.slug}`}
                                className="font-semibold text-body no-underline hover:text-brand"
                              >
                                {news.category.name}
                              </Link>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                              <Moment format="dddd, Do MMMM YYYY">
                                {news.created_at}
                              </Moment>
                              <span>
                                {Math.ceil(news.time_read / 10)} menit
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ol>
                </Card>
              </div>
            </aside>
          </div>
        </Container>
      </section>
      <div
        className="display-ad"
        style={{ margin: "8px auto", display: "block", textAlign: "center" }}
      ></div>
    </>
  );
};

export async function getServerSideProps({
  params,
  query,
}: GetServerSidePropsContext<{ id: string }>) {
  const id = params?.id;
  if (!id || id === "undefined" || id === "-" || id.length < 8) {
    return { notFound: true };
  }

  const page = parsePage(query.page);
  if (page === null) return firstPageRedirect(`/users/${id}`);

  const result = await Sentry.startSpan(
    {
      name: "users.[id].getServerSideProps",
    },
    async () => {
      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&user=${id}&created_at[gte]=${moment()
        .subtract(3, "months")
        .toISOString()}`;
      const userUrl = `${process.env.API_ADDRESS}/api/users/${id}`;

      try {
        // Trending news, the profile and the requested page load concurrently.
        const [trendingNewsJson, userJson, list] = await Promise.all([
          fetchJson(trendingNewsUrl),
          fetchJson(userUrl),
          fetchNewsPage(
            `/api/news?page=${page}&sort=-created_at&limit=${LIMIT}&user=${id}`,
          ),
        ]);

        if (isPageOutOfRange(page, list.meta)) {
          return { notFound: true as const };
        }

        return {
          props: {
            userId: id,
            trendingNewsByUser: trendingNewsJson.data,
            userProfile: userJson.data,
            userNews: list.data,
            page,
            pageCount: pageCountOf(list.meta),
          },
        };
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true as const,
        };
      }
    },
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, {
  setActiveLink,
})(GetUserProfile);

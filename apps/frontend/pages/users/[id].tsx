import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { getNewsByUser } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import {
  Badge,
  Breadcrumbs,
  Card,
  Container,
  LoadingBlock,
  Spinner,
  badgeClass,
  paginationClasses,
} from "@malanghub/ui";
import assetsPath from "../../components/layouts/Assets";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../../redux/store";
import { GetServerSidePropsContext } from "next";
import { News } from "../../models/news";
import { UserProfile } from "../../models/user";
import { NewsReducerState, UserReducerState } from "../../redux/types";

interface GetUserProfileProps {
  getNewsByUser: (id: string, page: number) => void;
  trendingNewsByUser: News[];
  setActiveLink: (link: string) => void;
  userProfile: UserProfile;
  user: UserReducerState;
  news: NewsReducerState;
}

const GetUserProfile = ({
  getNewsByUser,
  trendingNewsByUser,
  setActiveLink,
  userProfile,
  user: { loading: userLoading },
  news: { newsByUser, loading: newsLoading },
}: GetUserProfileProps) => {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const id = Array.isArray(router.query.id)
      ? router.query.id[0] // If it's an array, use the first element
      : router.query.id || "";

    getNewsByUser(id, 1);
    setActiveLink("");
  }, []);

  const handlePageClick = (data: { selected: number }) => {
    const id = Array.isArray(router.query.id)
      ? router.query.id[0] // If it's an array, use the first element
      : router.query.id || "";

    let selected = data.selected + 1;

    if (id) {
      getNewsByUser(id, selected);
    }
  };

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
      <Head>
        <title>Malanghub - Pengguna - {userProfile?.name}</title>
        <meta
          name="title"
          content={`Malanghub - Pengguna - ${userProfile?.name}`}
        />
        <meta
          name="description"
          content={userProfile?.bio?.replace(/<(.|\n)*?>/g, "").slice(0, 255)}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/users/${userProfile?._id}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Pengguna - ${userProfile?.name}`}
        />
        <meta
          property="og:description"
          content={userProfile?.bio?.replace(/<(.|\n)*?>/g, "").slice(0, 255)}
        />
        <meta property="og:image" content={userProfile?.photo} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/users/${userProfile?._id}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Pengguna - ${userProfile?.name}`}
        />
        <meta
          property="twitter:description"
          content={userProfile?.bio?.replace(/<(.|\n)*?>/g, "").slice(0, 255)}
        />
        <meta property="twitter:image" content={userProfile?.photo} />

        <link
          rel="canonical"
          href={`https://www.malanghub.com/users/${userProfile?._id}`}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: userProfile?.name,
              url: `https://www.malanghub.com/users/${userProfile?._id}`,
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
            }),
          }}
        />
      </Head>
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
      <section className="tw:bg-bg tw:py-8 tw:sm:py-12">
        <Container>
          <Card className="tw:p-6 tw:sm:p-8">
            {userLoading ? (
              <div className="tw:flex tw:justify-center tw:py-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-6 tw:text-center tw:md:flex-row tw:md:text-left">
                <div className="tw:relative tw:size-32 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:border-4 tw:border-surface tw:bg-surface-2 tw:shadow-card tw:ring-1 tw:ring-line tw:sm:size-40">
                  <Image
                    src={
                      userProfile && userProfile.photo
                        ? userProfile.photo
                        : assetsPath("images/author.jpg")
                    }
                    alt={
                      userProfile?.name ? `Foto profil ${userProfile.name}` : ""
                    }
                    className="tw:object-cover"
                    sizes="160px"
                    fill
                  />
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  {userProfile && userProfile.motto && (
                    <Badge className="tw:mb-3">{userProfile.motto}</Badge>
                  )}
                  <h1 className="tw:m-0 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg tw:sm:text-3xl">
                    {userProfile && userProfile.name}
                  </h1>
                  {userProfile && userProfile.bio && (
                    <div className="tw:mt-3 tw:max-w-2xl tw:text-[0.95rem] tw:leading-relaxed tw:text-body tw:[&_p]:mb-2 tw:[&_p]:text-body">
                      {parse(userProfile.bio)}
                    </div>
                  )}
                  {socialLinks.length > 0 && (
                    <ul className="tw:m-0 tw:mt-5 tw:flex tw:list-none tw:flex-wrap tw:justify-center tw:gap-2 tw:p-0 tw:md:justify-start">
                      {socialLinks.map((link) => (
                        <li key={link.key}>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={link.href}
                            aria-label={link.label}
                            className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface-2 tw:font-normal tw:text-body tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:bg-brand-soft tw:hover:text-brand"
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
      <section className="tw:bg-bg tw:pb-16">
        <Container>
          <div className="tw:grid tw:gap-8 tw:lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="tw:min-w-0">
              <h2 className="tw:mt-0 tw:mb-5 tw:font-heading tw:text-xl tw:font-semibold tw:text-fg tw:sm:text-2xl">
                Pengguna Terbaru dari{" "}
                {userLoading ? (
                  <Spinner size="sm" />
                ) : (
                  userProfile && userProfile.name
                )}
              </h2>
              {newsLoading ? (
                <LoadingBlock />
              ) : (
                <div className="tw:flex tw:flex-col tw:gap-4">
                  {newsByUser &&
                    newsByUser.data &&
                    newsByUser.data.length > 0 &&
                    newsByUser.data.map((news) => (
                      <Card
                        key={news._id}
                        className="tw:group tw:flex tw:flex-col-reverse tw:gap-4 tw:p-4 tw:sm:flex-row tw:sm:items-start tw:sm:p-5"
                      >
                        <div className="tw:min-w-0 tw:flex-1">
                          <span className={badgeClass("brand", "tw:mb-2")}>
                            {news && news.category.name}
                          </span>
                          <Link
                            href={`/news/${news.slug}`}
                            className="tw:block tw:font-heading tw:text-lg tw:leading-snug tw:font-bold tw:text-fg tw:no-underline tw:hover:text-brand"
                          >
                            {news && news.title}
                          </Link>
                          <div className="tw:mt-2 tw:line-clamp-2 tw:text-sm tw:text-body">
                            {parse(news.content.replace(/<(.|\n)*?>/g, ""))}
                          </div>
                          <div className="tw:mt-3 tw:text-sm tw:text-muted">
                            {news.user && news.user._id ? (
                              <Link
                                href={`/users/${news.user._id}`}
                                className="tw:font-semibold tw:text-fg tw:no-underline tw:hover:text-brand"
                              >
                                {news.user.name ?? "Penulis"}
                              </Link>
                            ) : (
                              <span className="tw:font-semibold tw:text-fg">
                                {news.user?.name ?? "Penulis"}
                              </span>
                            )}{" "}
                            di{" "}
                            {news.category && news.category.slug ? (
                              <Link
                                href={`/newsCategories/${news.category.slug}`}
                                className="tw:font-semibold tw:text-fg tw:no-underline tw:hover:text-brand"
                              >
                                {news.category.name ?? "Kategori"}
                              </Link>
                            ) : (
                              <span className="tw:font-semibold tw:text-fg">
                                {news.category?.name ?? "Kategori"}
                              </span>
                            )}
                          </div>
                          <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-xs tw:text-muted">
                            <span>
                              <i
                                className="fa fa-calendar tw:mr-1"
                                aria-hidden="true"
                              ></i>
                              <Moment format="dddd, Do MMMM YYYY">
                                {news.created_at}
                              </Moment>
                            </span>
                            <span>
                              <i
                                className="fa fa-clock-o tw:mr-1"
                                aria-hidden="true"
                              ></i>
                              {Math.ceil(news.time_read / 10)} menit
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/news/${news.slug}`}
                          className="tw:relative tw:block tw:aspect-video tw:w-full tw:shrink-0 tw:overflow-hidden tw:rounded-lg tw:bg-surface-2 tw:sm:aspect-square tw:sm:w-36"
                        >
                          <Image
                            src={news.mainImage}
                            alt=""
                            className="tw:object-cover tw:transition-transform tw:duration-300 tw:group-hover:scale-105"
                            sizes="(min-width: 640px) 144px, 100vw"
                            fill
                          />
                        </Link>
                      </Card>
                    ))}
                </div>
              )}

              {newsLoading ? null : newsByUser && newsByUser.meta ? (
                <ReactPaginate
                  previousLabel={"<"}
                  nextLabel={">"}
                  breakLabel={"..."}
                  initialPage={(newsByUser.meta?.page || 1) - 1}
                  pageCount={Math.ceil(
                    (newsByUser.meta?.total || 0) /
                      (newsByUser.meta?.limit || 10),
                  )}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={handlePageClick}
                  {...paginationClasses}
                />
              ) : null}
            </div>

            <aside className="tw:min-w-0">
              <div className="tw:lg:sticky tw:lg:top-24">
                <Card className="tw:p-5">
                  <h2 className="tw:mt-0 tw:mb-4 tw:font-heading tw:text-lg tw:font-semibold tw:text-fg">
                    Trending oleh {userProfile && userProfile.name}
                  </h2>

                  {newsLoading ? (
                    <LoadingBlock />
                  ) : (
                    <ol className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:divide-y tw:divide-line tw:p-0">
                      {trendingNewsByUser &&
                        trendingNewsByUser.length > 0 &&
                        trendingNewsByUser?.map((news, index) => (
                          <li
                            key={news._id}
                            className="tw:flex tw:gap-3 tw:py-3 tw:first:pt-0 tw:last:pb-0"
                          >
                            <span className="tw:font-heading tw:text-2xl tw:leading-none tw:font-bold tw:text-brand/60">
                              {index + 1}.
                            </span>
                            <div className="tw:min-w-0">
                              <Link
                                href={`/news/${news.slug}`}
                                className="tw:block tw:text-[0.95rem] tw:leading-snug tw:font-semibold tw:text-fg tw:no-underline tw:hover:text-brand"
                              >
                                {news.title}
                              </Link>
                              <div className="tw:mt-1.5 tw:text-xs tw:text-muted">
                                {news.user && news.user._id ? (
                                  <Link
                                    href={`/users/${news.user._id}`}
                                    className="tw:font-semibold tw:text-body tw:no-underline tw:hover:text-brand"
                                  >
                                    {news.user.name ?? "Penulis"}
                                  </Link>
                                ) : (
                                  <span className="tw:font-semibold tw:text-body">
                                    {news.user?.name ?? "Penulis"}
                                  </span>
                                )}{" "}
                                di{" "}
                                <Link
                                  href={`/newsCategories/${news.category.slug}`}
                                  className="tw:font-semibold tw:text-body tw:no-underline tw:hover:text-brand"
                                >
                                  {news.category.name}
                                </Link>
                              </div>
                              <div className="tw:mt-1 tw:flex tw:flex-wrap tw:gap-x-3 tw:text-xs tw:text-muted">
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
                  )}
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
}: GetServerSidePropsContext<{ id: string }>) {
  const id = params?.id;
  if (!id || id === "undefined" || id === "-" || id.length < 8) {
    return { notFound: true };
  }

  const result = await Sentry.startSpan(
    {
      name: "users.[id].getServerSideProps",
    },
    async () => {
      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&user=${
        params?.id
      }&created_at[gte]=${moment().subtract(3, "months").toISOString()}`;
      const userUrl = `${process.env.API_ADDRESS}/api/users/${params?.id}`;

      let dataTrending = {};
      let dataUser = {};

      try {
        // Fetch both trending news by user and user profile data concurrently
        const [trendingNewsResponse, userResponse] = await Promise.all([
          fetch(trendingNewsUrl),
          fetch(userUrl),
        ]);

        // Check if both responses are successful
        if (!trendingNewsResponse.ok || !userResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const trendingNewsJson = await trendingNewsResponse.json();
        const userJson = await userResponse.json();

        dataTrending = trendingNewsJson.data;
        dataUser = userJson.data;
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true,
        };
      }

      return {
        props: { trendingNewsByUser: dataTrending, userProfile: dataUser },
      };
    },
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  user: state.user,
  news: state.news,
});

export default connect(mapStateToProps, {
  getNewsByUser,
  setActiveLink,
})(GetUserProfile);

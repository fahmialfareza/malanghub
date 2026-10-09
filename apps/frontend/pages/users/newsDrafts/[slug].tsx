import { useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import * as cookie from "cookie";
import { loadUser } from "../../../redux/actions/userActions";
import { setActiveLink } from "../../../redux/actions/layoutActions";
import * as Sentry from "@sentry/nextjs";
import {
  Badge,
  Breadcrumbs,
  Card,
  Container,
  LoadingBlock,
  Spinner,
  badgeClass,
  buttonClass,
} from "@malanghub/ui";
import { RootState } from "../../../redux/store";
import { GetServerSidePropsContext } from "next";
import { NewsDraftReducerState, UserReducerState } from "../../../redux/types";
import { News } from "../../../models/news";

const socialClass =
  "tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface tw:text-body tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:text-brand";

interface NewsDraftProps {
  user: UserReducerState;
  loadUser: () => void;
  currentNewsDraft: News;
  newsDraft: NewsDraftReducerState;
}

const NewsDraft = ({
  user: { user },
  loadUser,
  currentNewsDraft,
  newsDraft: { loading: newsDraftLoading },
}: NewsDraftProps) => {
  const router = useRouter();

  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
    }

    if (!user && !token) {
      router.push("/signin");
    }

    setActiveLink("");
  }, [router.isReady]); // Only depend on router.isReady, not user or loadUser

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.querySelectorAll("*").forEach(function (node) {
        node.removeAttribute("style");
      });
    }
  }, [contentRef, currentNewsDraft]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <title>
          Malanghub - Antrian Berita -{" "}
          {currentNewsDraft && currentNewsDraft.title}
        </title>
        <meta
          name="title"
          content={`Malanghub - Antrian Berita - ${currentNewsDraft?.title}`}
        />
        <meta
          name="description"
          content={
            currentNewsDraft &&
            currentNewsDraft.content &&
            currentNewsDraft?.content?.replace(/<(.|\n)*?>/g, "").slice(0, 255)
          }
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={
            currentNewsDraft &&
            currentNewsDraft.slug &&
            `https://www.malanghub.com/users/newsDrafts/${currentNewsDraft?.slug}`
          }
        />
        <meta
          property="og:title"
          content={`Malanghub - Antrian Berita - ${currentNewsDraft?.title}`}
        />
        <meta
          property="og:description"
          content={
            currentNewsDraft &&
            currentNewsDraft.content &&
            currentNewsDraft?.content?.replace(/<(.|\n)*?>/g, "").slice(0, 255)
          }
        />
        <meta property="og:image" content={currentNewsDraft?.mainImage} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={
            currentNewsDraft &&
            currentNewsDraft.slug &&
            `https://www.malanghub.com/users/newsDrafts/${currentNewsDraft?.slug}`
          }
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Antrian Berita - ${currentNewsDraft?.title}`}
        />
        <meta
          property="twitter:description"
          content={
            currentNewsDraft &&
            currentNewsDraft.content &&
            currentNewsDraft.content?.replace(/<(.|\n)*?>/g, "").slice(0, 255)
          }
        />
        <meta property="twitter:image" content={currentNewsDraft?.mainImage} />
      </Head>
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Antrian Berita" },
          {
            label: newsDraftLoading ? (
              <Spinner size="sm" />
            ) : (
              currentNewsDraft && currentNewsDraft.title
            ),
          },
        ]}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />
      <div className="tw:bg-bg tw:py-10 tw:lg:py-14">
        <Container>
          <div className="tw:grid tw:gap-10 tw:lg:grid-cols-3">
            <article className="tw:min-w-0 tw:lg:col-span-2">
              {newsDraftLoading ? (
                <LoadingBlock />
              ) : (
                <>
                  <header className="tw:mb-8 tw:text-center">
                    <Badge tone="warning" className="tw:mb-4">
                      Pratinjau Antrian Berita
                    </Badge>
                    <h1 className="tw:mt-0 tw:mb-5 tw:font-heading tw:text-3xl tw:leading-tight tw:font-bold tw:text-fg tw:md:text-4xl">
                      {currentNewsDraft && currentNewsDraft.title}
                    </h1>
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-3 tw:text-sm tw:text-muted">
                      {currentNewsDraft && currentNewsDraft.user && (
                        <Link
                          href={`/users/${currentNewsDraft.user.id || currentNewsDraft.user._id}`}
                          className="tw:relative tw:block tw:size-10 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-surface-2"
                          aria-label={currentNewsDraft.user.name}
                        >
                          {currentNewsDraft.user.photo && (
                            <Image
                              src={currentNewsDraft.user.photo}
                              alt=""
                              className="tw:object-cover"
                              sizes="40px"
                              fill
                            />
                          )}
                        </Link>
                      )}
                      <span>
                        {currentNewsDraft && currentNewsDraft.user && (
                          <Link
                            href={`/users/${currentNewsDraft.user.id || currentNewsDraft.user._id}`}
                            className="tw:font-semibold tw:text-fg tw:no-underline tw:hover:text-brand"
                          >
                            {currentNewsDraft.user.name}
                          </Link>
                        )}{" "}
                        di{" "}
                        {currentNewsDraft &&
                          currentNewsDraft.category &&
                          (currentNewsDraft.category.id ||
                            currentNewsDraft.category._id) && (
                            <Link
                              href={`/newsCategories/${currentNewsDraft.category.id || currentNewsDraft.category._id}`}
                              className="tw:font-semibold tw:text-brand tw:no-underline tw:hover:underline"
                            >
                              {currentNewsDraft.category.name}
                            </Link>
                          )}
                      </span>
                      <span aria-hidden className="tw:text-line-strong">
                        &bull;
                      </span>
                      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
                        <i className="fa fa-calendar" aria-hidden="true"></i>
                        <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                          {currentNewsDraft && currentNewsDraft.created_at}
                        </Moment>
                      </span>
                      <span aria-hidden className="tw:text-line-strong">
                        &bull;
                      </span>
                      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
                        <i className="fa fa-clock-o" aria-hidden="true"></i>
                        {currentNewsDraft &&
                          currentNewsDraft.time_read &&
                          Math.ceil(currentNewsDraft.time_read / 10)}{" "}
                        menit
                      </span>
                    </div>
                  </header>

                  {currentNewsDraft && currentNewsDraft.mainImage && (
                    <div className="tw:relative tw:mb-8 tw:aspect-[4/3] tw:overflow-hidden tw:rounded-2xl tw:bg-surface-2 tw:shadow-card">
                      <Image
                        src={currentNewsDraft.mainImage}
                        className="tw:object-cover"
                        sizes="(min-width: 1024px) 66vw, 100vw"
                        alt=""
                        fill
                      />
                    </div>
                  )}

                  {currentNewsDraft && currentNewsDraft.content && (
                    <div
                      ref={contentRef}
                      className="tw:text-justify tw:text-body tw:[&_p]:mb-4 tw:[&_p]:leading-relaxed tw:[&_img]:mx-auto tw:[&_img]:my-4 tw:[&_img]:h-auto tw:[&_img]:max-w-full tw:[&_img]:rounded-xl tw:[&_a]:text-brand tw:[&_h2]:mt-8 tw:[&_h2]:mb-3 tw:[&_h2]:font-heading tw:[&_h2]:text-fg tw:[&_h3]:mt-6 tw:[&_h3]:mb-3 tw:[&_h3]:font-heading tw:[&_h3]:text-fg tw:[&_ul]:mb-4 tw:[&_ul]:pl-6 tw:[&_ol]:mb-4 tw:[&_ol]:pl-6 tw:[&_blockquote]:my-6 tw:[&_blockquote]:border-l-4 tw:[&_blockquote]:border-brand tw:[&_blockquote]:pl-4 tw:[&_blockquote]:italic"
                    >
                      {parse(currentNewsDraft.content)}
                    </div>
                  )}

                  <div className="tw:mt-10 tw:flex tw:flex-col tw:gap-6 tw:border-t tw:border-line tw:pt-6 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
                    <div>
                      <h2 className="tw:mt-0 tw:mb-3 tw:text-sm tw:font-semibold tw:tracking-wide tw:text-muted tw:uppercase">
                        Tags :
                      </h2>
                      <div className="tw:flex tw:flex-wrap tw:gap-2">
                        {currentNewsDraft &&
                          currentNewsDraft.tags &&
                          currentNewsDraft.tags.length > 0 &&
                          currentNewsDraft.tags.map((tag) => (
                            <Link
                              key={tag.id || tag._id}
                              href={`/newsTags/${tag.slug}`}
                              className={badgeClass(
                                "brand",
                                "tw:px-3 tw:py-1 tw:text-sm tw:hover:bg-brand tw:hover:text-brand-fg"
                              )}
                            >
                              {tag.name}
                            </Link>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="tw:mt-0 tw:mb-3 tw:text-sm tw:font-semibold tw:tracking-wide tw:text-muted tw:uppercase">
                        Share :
                      </h2>
                      <div className="tw:flex tw:gap-2">
                        <a
                          href="#blog-share"
                          aria-label="Facebook"
                          className={socialClass}
                        >
                          <span
                            className="fa fa-facebook"
                            aria-hidden="true"
                          ></span>
                        </a>
                        <a
                          href="#blog-share"
                          aria-label="Twitter"
                          className={socialClass}
                        >
                          <span
                            className="fa fa-twitter"
                            aria-hidden="true"
                          ></span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {currentNewsDraft && currentNewsDraft.user && (
                    <Card className="tw:mt-10 tw:flex tw:flex-col tw:gap-5 tw:p-6 tw:sm:flex-row tw:sm:items-center">
                      <div className="tw:relative tw:size-24 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-surface-2">
                        {currentNewsDraft.user.photo && (
                          <Image
                            src={currentNewsDraft.user.photo}
                            alt=""
                            className="tw:object-cover"
                            sizes="96px"
                            fill
                          />
                        )}
                      </div>
                      <div className="tw:min-w-0">
                        <h3 className="tw:mt-0 tw:mb-2 tw:font-heading tw:text-xl tw:font-semibold tw:text-fg">
                          {currentNewsDraft.user.name}
                        </h3>
                        {currentNewsDraft.user.bio && (
                          <p className="tw:mb-4 tw:text-body">
                            {currentNewsDraft.user.bio}
                          </p>
                        )}
                        <ul className="tw:m-0 tw:flex tw:list-none tw:gap-2 tw:p-0">
                          {currentNewsDraft.user.facebook && (
                            <li>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Facebook"
                                className={socialClass}
                                href={currentNewsDraft.user.facebook}
                              >
                                <span
                                  className="fab fa-facebook"
                                  aria-hidden="true"
                                ></span>
                              </a>
                            </li>
                          )}
                          {currentNewsDraft.user.twitter && (
                            <li>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Twitter"
                                className={socialClass}
                                href={`https://twitter.com/${currentNewsDraft.user.twitter}`}
                              >
                                <span
                                  className="fab fa-twitter"
                                  aria-hidden="true"
                                ></span>
                              </a>
                            </li>
                          )}
                          {currentNewsDraft.user.instagram && (
                            <li>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                                className={socialClass}
                                href={`https://instagram.com/${currentNewsDraft.user.instagram}`}
                              >
                                <span
                                  className="fab fa-instagram"
                                  aria-hidden="true"
                                ></span>
                              </a>
                            </li>
                          )}
                          {currentNewsDraft.user.linkedin && (
                            <li>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn"
                                className={socialClass}
                                href={currentNewsDraft.user.linkedin}
                              >
                                <span
                                  className="fab fa-linkedin"
                                  aria-hidden="true"
                                ></span>
                              </a>
                            </li>
                          )}
                          {currentNewsDraft.user.tiktok && (
                            <li>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                aria-label="TikTok"
                                className={socialClass}
                                href={`https://www.tiktok.com/@${currentNewsDraft.user.tiktok}`}
                              >
                                <span
                                  className="fab fa-tiktok"
                                  aria-hidden="true"
                                ></span>
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    </Card>
                  )}
                </>
              )}

              <Link
                href="/users"
                className={buttonClass({
                  variant: "secondary",
                  block: true,
                  className: "tw:mt-10",
                })}
              >
                Kembali
              </Link>
            </article>

            <aside className="tw:lg:col-span-1">
              <div className="tw:lg:sticky tw:lg:top-24">
                <Card className="tw:p-6">
                  <h2 className="tw:mt-0 tw:mb-3 tw:font-heading tw:text-lg tw:font-semibold tw:text-fg">
                    Mungkin Anda Tertarik
                  </h2>
                  <p className="tw:m-0 tw:text-muted">
                    Halaman Pratinjau Tidak Dapat Menampilkan Berita Terkait
                  </p>
                </Card>
              </div>
            </aside>
          </div>
        </Container>
      </div>
      <div
        className="display-ad"
        style={{ margin: "8px auto", display: "block", textAlign: "center" }}
      ></div>
    </>
  );
};

export async function getServerSideProps({
  req,
  params,
}: GetServerSidePropsContext<{ slug: string }>) {
  const result = await Sentry.startSpan(
    {
      name: "newsDrafts.[slug].getServerSideProps",
    },
    async () => {
      if (!req.headers.cookie) {
        return {
          redirect: {
            permanent: false,
            destination: "/signin",
          },
          props: {},
        };
      }

      const { token } = cookie.parse(req.headers.cookie);

      // Fetch user information using the token
      const userUrl = `${process.env.API_ADDRESS}/api/users`;
      try {
        const userResponse = await fetch(userUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        // If user is authenticated, fetch the news draft
        const newsDraftUrl = `${process.env.API_ADDRESS}/api/newsDrafts/${params?.slug}`;
        let data = {};

        try {
          const draftResponse = await fetch(newsDraftUrl);

          if (!draftResponse.ok) {
            throw new Error("Failed to fetch news draft");
          }

          const draftJson = await draftResponse.json();
          data = draftJson.data;
        } catch (e) {
          Sentry.captureException(e);
          return {
            notFound: true,
          };
        }

        return { props: { currentNewsDraft: data } };
      } catch (e) {
        Sentry.captureException(e);
        return {
          redirect: {
            permanent: false,
            destination: "/signin",
          },
          props: {},
        };
      }
    }
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  newsDraft: state.newsDraft,
  user: state.user,
});

export default connect(mapStateToProps, { loadUser })(NewsDraft);

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
  "flex size-9 items-center justify-center rounded-full border border-line bg-surface text-body no-underline transition-colors hover:border-brand hover:text-brand";

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
      <div className="bg-bg py-10 lg:py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            <article className="min-w-0 lg:col-span-2">
              {newsDraftLoading ? (
                <LoadingBlock />
              ) : (
                <>
                  <header className="mb-8 text-center">
                    <Badge tone="warning" className="mb-4">
                      Pratinjau Antrian Berita
                    </Badge>
                    <h1 className="mt-0 mb-5 font-heading text-3xl leading-tight font-bold text-fg md:text-4xl">
                      {currentNewsDraft && currentNewsDraft.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
                      {currentNewsDraft && currentNewsDraft.user && (
                        <Link
                          href={`/users/${currentNewsDraft.user.id || currentNewsDraft.user._id}`}
                          className="relative block size-10 shrink-0 overflow-hidden rounded-full bg-surface-2"
                          aria-label={currentNewsDraft.user.name}
                        >
                          {currentNewsDraft.user.photo && (
                            <Image
                              src={currentNewsDraft.user.photo}
                              alt=""
                              className="object-cover"
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
                            className="font-semibold text-fg no-underline hover:text-brand"
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
                              className="font-semibold text-brand no-underline hover:underline"
                            >
                              {currentNewsDraft.category.name}
                            </Link>
                          )}
                      </span>
                      <span aria-hidden className="text-line-strong">
                        &bull;
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <i className="fa fa-calendar" aria-hidden="true"></i>
                        <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                          {currentNewsDraft && currentNewsDraft.created_at}
                        </Moment>
                      </span>
                      <span aria-hidden className="text-line-strong">
                        &bull;
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <i className="fa fa-clock-o" aria-hidden="true"></i>
                        {currentNewsDraft &&
                          currentNewsDraft.time_read &&
                          Math.ceil(currentNewsDraft.time_read / 10)}{" "}
                        menit
                      </span>
                    </div>
                  </header>

                  {currentNewsDraft && currentNewsDraft.mainImage && (
                    <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-2xl bg-surface-2 shadow-card">
                      <Image
                        src={currentNewsDraft.mainImage}
                        className="object-cover"
                        sizes="(min-width: 1024px) 66vw, 100vw"
                        alt=""
                        fill
                      />
                    </div>
                  )}

                  {currentNewsDraft && currentNewsDraft.content && (
                    <div
                      ref={contentRef}
                      className="text-justify text-body [&_p]:mb-4 [&_p]:leading-relaxed [&_img]:mx-auto [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_a]:text-brand [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-fg [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic"
                    >
                      {parse(currentNewsDraft.content)}
                    </div>
                  )}

                  <div className="mt-10 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="mt-0 mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
                        Tags :
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {currentNewsDraft &&
                          currentNewsDraft.tags &&
                          currentNewsDraft.tags.length > 0 &&
                          currentNewsDraft.tags.map((tag) => (
                            <Link
                              key={tag.id || tag._id}
                              href={`/newsTags/${tag.slug}`}
                              className={badgeClass(
                                "brand",
                                "px-3 py-1 text-sm hover:bg-brand hover:text-brand-fg"
                              )}
                            >
                              {tag.name}
                            </Link>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="mt-0 mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
                        Share :
                      </h2>
                      <div className="flex gap-2">
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
                    <Card className="mt-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-surface-2">
                        {currentNewsDraft.user.photo && (
                          <Image
                            src={currentNewsDraft.user.photo}
                            alt=""
                            className="object-cover"
                            sizes="96px"
                            fill
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="mt-0 mb-2 font-heading text-xl font-semibold text-fg">
                          {currentNewsDraft.user.name}
                        </h3>
                        {currentNewsDraft.user.bio && (
                          <p className="mb-4 text-body">
                            {currentNewsDraft.user.bio}
                          </p>
                        )}
                        <ul className="m-0 flex list-none gap-2 p-0">
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
                  className: "mt-10",
                })}
              >
                Kembali
              </Link>
            </article>

            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Card className="p-6">
                  <h2 className="mt-0 mb-3 font-heading text-lg font-semibold text-fg">
                    Mungkin Anda Tertarik
                  </h2>
                  <p className="m-0 text-muted">
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

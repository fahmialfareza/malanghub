import { useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import cookie from "cookie";
import { loadUser } from "../../../redux/actions/userActions";
import { setActiveLink } from "../../../redux/actions/layoutActions";
import Spinner from "../../../components/layouts/Spinner";
import * as Sentry from "@sentry/nextjs";

const NewsDraft = ({
  user: { user, loading: userLoading },
  loadUser,
  currentNewsDraft,
  newsDraft: { loading: newsDraftLoading },
}) => {
  const router = useRouter();

  const contentRef = useRef();

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
  }, [user, router.isReady]);

  useEffect(() => {
    if (contentRef) {
      contentRef.current.querySelectorAll("*").forEach(function (node) {
        node.removeAttribute("style");
      });
    }
  }, [contentRef, currentNewsDraft]);

  return (
    <>
      <Head>
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

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> / Antrian Berita /{" "}
          <span className="breadcrumb_last" aria-current="page">
            {newsDraftLoading ? (
              <Spinner />
            ) : (
              currentNewsDraft && currentNewsDraft.title
            )}
          </span>
        </div>
      </nav>

      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <div className="pb-5 w3l-homeblock1 text-center">
                <div className="container mt-md-3">
                  <h3 className="blog-desc-big text-center mb-4">
                    {newsDraftLoading ? (
                      <Spinner />
                    ) : (
                      currentNewsDraft && currentNewsDraft.title
                    )}
                  </h3>
                  <div className="blog-post-align">
                    <div className="blog-post-img embed-responsive embed-responsive-1by1">
                      {newsDraftLoading ? (
                        <Spinner />
                      ) : (
                        currentNewsDraft &&
                        currentNewsDraft.user && (
                          <Link
                            href={`/users/${currentNewsDraft.user._id}`}
                            legacyBehavior
                          >
                            <img
                              src={
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.photo
                              }
                              alt=""
                              className="rounded-circle img-fluid embed-responsive-item"
                              style={{ objectFit: "cover" }}
                            />
                          </Link>
                        )
                      )}
                    </div>
                    <div className="blog-post-info">
                      <div className="author align-items-center mb-1">
                        {newsDraftLoading ? (
                          <Spinner />
                        ) : (
                          currentNewsDraft &&
                          currentNewsDraft.user && (
                            <Link
                              href={`/users/${currentNewsDraft.user._id}`}
                              legacyBehavior
                            >
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.name
                              )}
                            </Link>
                          )
                        )}{" "}
                        in{" "}
                        {currentNewsDraft &&
                          currentNewsDraft.category &&
                          currentNewsDraft.category._id && (
                            <Link
                              href={`/newsCategories/${currentNewsDraft.category._id}`}
                              legacyBehavior
                            >
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.category &&
                                currentNewsDraft.category.name
                              )}
                            </Link>
                          )}
                      </div>
                      <ul className="blog-meta">
                        <li className="meta-item blog-lesson">
                          <span className="meta-value">
                            {" "}
                            <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.created_at &&
                                currentNewsDraft.created_at
                              )}
                            </Moment>{" "}
                          </span>
                        </li>
                        <li className="meta-item blog-students">
                          <span className="meta-value">
                            {" "}
                            {newsDraftLoading ? (
                              <Spinner />
                            ) : (
                              currentNewsDraft &&
                              currentNewsDraft.time_read &&
                              Math.ceil(currentNewsDraft.time_read / 10)
                            )}
                            menit
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <section className="blog-post-main w3l-homeblock1">
                <div className="blog-content-inf pb-5">
                  <div className="container pb-lg-4">
                    <div className="single-post-image">
                      <div className="post-content embed-responsive embed-responsive-4by3">
                        <img
                          src={
                            newsDraftLoading ? (
                              <Spinner />
                            ) : (
                              currentNewsDraft && currentNewsDraft.mainImage
                            )
                          }
                          className="radius-image img-fluid pb-5 embed-responsive-item"
                          style={{ objectFit: "cover" }}
                          alt=""
                        />
                      </div>
                    </div>

                    <div className="single-post-content text-justify">
                      {newsDraftLoading ? (
                        <Spinner />
                      ) : (
                        currentNewsDraft &&
                        currentNewsDraft.content && (
                          <div ref={contentRef}>
                            {parse(currentNewsDraft.content)}
                          </div>
                        )
                      )}

                      <div className="d-grid left-right mt-5 pb-md-5">
                        <div className="buttons-singles tags">
                          <h4>Tags :</h4>
                          {newsDraftLoading ? (
                            <Spinner />
                          ) : (
                            currentNewsDraft &&
                            currentNewsDraft.tags &&
                            currentNewsDraft.tags.length > 0 &&
                            currentNewsDraft.tags.map((tag) => (
                              <Link
                                key={tag._id}
                                href={`/newsTags/${tag._id}`}
                                legacyBehavior
                              >
                                {tag.name}
                              </Link>
                            ))
                          )}
                        </div>
                        <div className="buttons-singles">
                          <h4>Share :</h4>
                          <a href="#blog-share">
                            <span
                              className="fa fa-facebook"
                              aria-hidden="true"
                            ></span>
                          </a>
                          <a href="#blog-share">
                            <span
                              className="fa fa-twitter"
                              aria-hidden="true"
                            ></span>
                          </a>
                        </div>
                      </div>

                      <div className="author-card mt-5">
                        <div className="row align-items-center">
                          <div className="col-sm-3 col-6">
                            <div className="embed-responsive embed-responsive-1by1">
                              <img
                                src={
                                  currentNewsDraft &&
                                  currentNewsDraft.user &&
                                  currentNewsDraft.user.photo
                                }
                                alt=""
                                className="rounded-circle img-fluid embed-responsive-item"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          </div>
                          <div className="col-sm-9 mt-sm-0 mt-3">
                            <h3 className="mb-3 title">
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.name
                              )}
                            </h3>
                            <p>
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.bio
                              )}
                            </p>
                            <ul className="author-icons mt-4">
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.facebook && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="facebook"
                                      href={currentNewsDraft.user.facebook}
                                    >
                                      <span
                                        className="fab fa-facebook"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.twitter && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="twitter"
                                      href={`https://twitter.com/${currentNewsDraft.user.twitter}`}
                                    >
                                      <span
                                        className="fab fa-twitter"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.instagram && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="instagram"
                                      href={`https://instagram.com/${currentNewsDraft.user.instagram}`}
                                    >
                                      <span
                                        className="fab fa-instagram"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.linkedin && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="linkedin"
                                      href={currentNewsDraft.user.linkedin}
                                    >
                                      <span
                                        className="fab fa-linkedin"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsDraftLoading ? (
                                <Spinner />
                              ) : (
                                currentNewsDraft &&
                                currentNewsDraft.user &&
                                currentNewsDraft.user.tiktok && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="tiktok"
                                      href={`https://www.tiktok.com/@${currentNewsDraft.user.tiktok}`}
                                    >
                                      <span
                                        className="fab fa-tiktok"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row mt-5">
                      <div className="col">
                        <Link
                          href="/users"
                          className="btn btn-outline-primary btn-block"
                        >
                          Kembali
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
              <div className="pos-sticky">
                <h3 className="section-title-left">Mungkin Anda Tertarik </h3>

                <h1>
                  Halaman Pratinjau Tidak Dapat Menampilkan Berita Terkait
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="display-ad"
        style={{ margin: "8px auto", display: "block", textAlign: "center" }}
      ></div>
    </>
  );
};

export async function getServerSideProps({ req, params }) {
  const result = await Sentry.startSpan(
    {
      name: "newsDrafts.[slug].getServerSideProps",
    },
    async () => {
      // Check if there is a cookie present
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
        const { slug } = params;
        const newsDraftUrl = `${process.env.API_ADDRESS}/api/newsDrafts/${slug}`;
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

const mapStateToProps = (state) => ({
  newsDraft: state.newsDraft,
  user: state.user,
});

export default connect(mapStateToProps, { loadUser })(NewsDraft);

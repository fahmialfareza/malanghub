import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import axios from "axios";
import {
  getCommentByNews,
  createComment,
  selectNewsComment,
} from "../../redux/actions/newsCommentActions";
import { setAlert, setActiveLink } from "../../redux/actions/layoutActions";
import RelatedNews from "../../components/news/RelatedNews";
import * as Sentry from "@sentry/nextjs";

const SingleNews = ({
  currentNews,
  relatedNews,
  newsComment: { newsComments, error },
  user: { isAuthenticated, token, user },
  getCommentByNews,
  createComment,
  selectNewsComment,
  setActiveLink,
}) => {
  const router = useRouter();
  const { slug } = router.query;

  const [comment, setComment] = useState("");
  const contentRef = useRef();

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    if (currentNews) {
      getCommentByNews(currentNews._id);
    }
  }, [currentNews]);

  const onComment = (event) => {
    event.preventDefault();

    createComment(currentNews?._id, comment);

    if (error) {
      setAlert(error, "danger");
    }

    setComment("");
  };

  useEffect(() => {
    if (contentRef) {
      contentRef.current.querySelectorAll("*").forEach(function (node) {
        node.removeAttribute("style");
      });
    }
  }, [contentRef, currentNews]);

  return (
    <>
      <Head>
        <title>Malanghub - Berita - {currentNews?.title}</title>
        <meta
          name="title"
          content={`Malanghub - Berita - ${currentNews?.title}`}
        />
        <meta
          name="description"
          content={currentNews?.content
            ?.replace(/<(.|\n)*?>/g, "")
            .slice(0, 255)}
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/news/${currentNews?.slug}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Berita - ${currentNews?.title}`}
        />
        <meta
          property="og:description"
          content={currentNews?.content
            ?.replace(/<(.|\n)*?>/g, "")
            .slice(0, 255)}
        />
        <meta property="og:image" content={currentNews?.mainImage} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/news/${currentNews?.slug}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Berita - ${currentNews?.title}`}
        />
        <meta
          property="twitter:description"
          content={currentNews?.content
            ?.replace(/<(.|\n)*?>/g, "")
            .slice(0, 255)}
        />
        <meta property="twitter:image" content={currentNews?.mainImage} />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> / Berita /{" "}
          <span className="breadcrumb_last" aria-current="page">
            {currentNews && currentNews.title}
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
                    {currentNews?.title}
                  </h3>
                  <div className="blog-post-align">
                    <div className="blog-post-img embed-responsive embed-responsive-1by1">
                      {currentNews?.user && (
                        <Link
                          href={`/users/${currentNews.user._id}`}
                          legacyBehavior
                        >
                          <img
                            src={
                              currentNews &&
                              currentNews.user &&
                              currentNews.user.photo
                            }
                            alt=""
                            className="rounded-circle img-fluid embed-responsive-item"
                            style={{ objectFit: "cover" }}
                          />
                        </Link>
                      )}
                    </div>
                    <div className="blog-post-info">
                      <div className="author align-items-center mb-1">
                        {currentNews?.user && (
                          <Link
                            href={`/users/${currentNews.user._id}`}
                            legacyBehavior
                          >
                            {currentNews?.user?.name}
                          </Link>
                        )}{" "}
                        in{" "}
                        {currentNews?.category && (
                          <Link
                            href={`/newsCategories/${currentNews?.category?.slug}`}
                            legacyBehavior
                          >
                            {currentNews?.category?.name}
                          </Link>
                        )}
                      </div>
                      <ul className="blog-meta">
                        <li className="meta-item blog-lesson">
                          <span className="meta-value">
                            {" "}
                            <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                              {currentNews?.created_at}
                            </Moment>{" "}
                          </span>
                        </li>
                        <li className="meta-item blog-students">
                          <span className="meta-value">
                            {" "}
                            {currentNews &&
                              Math.ceil(currentNews.time_read / 10)}
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
                          src={currentNews?.mainImage}
                          className="radius-image img-fluid pb-5 embed-responsive-item"
                          style={{ objectFit: "cover" }}
                          alt=""
                        />
                      </div>
                    </div>

                    <div className="single-post-content text-justify">
                      {currentNews && currentNews.content && (
                        <div ref={contentRef}>{parse(currentNews.content)}</div>
                      )}

                      <div className="d-grid left-right mt-5 pb-md-5">
                        <div className="buttons-singles tags">
                          <h4>Tag :</h4>
                          {currentNews?.tags &&
                            currentNews.tags.map((tag) => (
                              <Link
                                key={tag._id}
                                href={`/newsTags/${tag.slug}`}
                                legacyBehavior
                              >
                                {tag.name}
                              </Link>
                            ))}
                        </div>
                        <div className="buttons-singles">
                          <h4>Bagikan :</h4>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://www.facebook.com/share.php?u=https://www.malanghub.com/news/${slug}`}
                          >
                            <span
                              className="fa fa-facebook"
                              aria-hidden="true"
                            ></span>
                          </a>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://twitter.com/intent/tweet?text=https://www.malanghub.com/news/${slug}`}
                          >
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
                                src={currentNews?.user?.photo}
                                alt=""
                                className="rounded-circle img-fluid embed-responsive-item"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          </div>
                          <div className="col-sm-9 mt-sm-0 mt-3">
                            <h3 className="mb-3 title">
                              {currentNews?.user?.name}
                            </h3>
                            <p>{currentNews?.user?.bio}</p>
                            <ul className="author-icons mt-4">
                              {currentNews?.user?.facebook && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="facebook"
                                    href={currentNews?.user?.facebook}
                                  >
                                    <span
                                      className="fab fa-facebook"
                                      aria-hidden="true"
                                    ></span>
                                  </a>
                                </li>
                              )}
                              {currentNews?.user?.twitter && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="twitter"
                                    href={`https://twitter.com/${currentNews?.user?.twitter}`}
                                  >
                                    <span
                                      className="fab fa-twitter"
                                      aria-hidden="true"
                                    ></span>
                                  </a>
                                </li>
                              )}
                              {currentNews?.user?.instagram && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="instagram"
                                    href={`https://instagram.com/${currentNews?.user?.instagram}`}
                                  >
                                    <span
                                      className="fab fa-instagram"
                                      aria-hidden="true"
                                    ></span>
                                  </a>
                                </li>
                              )}
                              {currentNews?.user?.linkedin && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="linkedin"
                                    href={currentNews?.user?.linkedin}
                                  >
                                    <span
                                      className="fab fa-linkedin"
                                      aria-hidden="true"
                                    ></span>
                                  </a>
                                </li>
                              )}
                              {currentNews?.user?.tiktok && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="tiktok"
                                    href={`https://www.tiktok.com/@${currentNews?.user?.tiktok}`}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
              <div className="pos-sticky">
                <h3 className="section-title-left">Mungkin Anda Tertarik </h3>

                {relatedNews?.length > 0 ? (
                  relatedNews.map((news, index) => {
                    return (
                      <RelatedNews key={news._id} index={index} news={news} />
                    );
                  })
                ) : (
                  <h1>Belum Ada Berita</h1>
                )}
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

export async function getServerSideProps({ params }) {
  const result = await Sentry.startSpan(
    {
      name: "news.[slug].getServerSideProps",
    },
    async () => {
      const { slug } = params;

      let config = {
        method: "get",
        url: `${process.env.API_ADDRESS}/api/news/${slug}`,
      };

      let data = [];
      try {
        let res = await axios(config);

        data.push(res.data.data);

        config = {
          method: "get",
          url: `${process.env.API_ADDRESS}/api/news?page=1&sort=-views&limit=4&category=${data[0].category._id}&_id[ne]=${data[0]._id}`,
        };

        try {
          res = await axios(config);

          data.push(res.data.data);
        } catch (e) {
          Sentry.captureException(e);
          console.log(e);
          return { props: { currentNews: data[0], relatedNews: null } };
        }
      } catch (e) {
        Sentry.captureException(e);
        console.log(e);
        return {
          notFound: true,
        };
      }

      return { props: { currentNews: data[0], relatedNews: data[1] } };
    }
  );

  return result;
}

const mapStateToProps = (state) => ({
  news: state.news,
  newsComment: state.newsComment,
  user: state.user,
});

export default connect(mapStateToProps, {
  getCommentByNews,
  createComment,
  selectNewsComment,
  setActiveLink,
})(SingleNews);

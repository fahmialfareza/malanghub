import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import axios from "axios";
import { getRelatedNewsByCategory } from "../../redux/actions/newsActions";
import {
  getCommentByNews,
  createComment,
  selectNewsComment,
} from "../../redux/actions/newsCommentActions";
import { setAlert, setActiveLink } from "../../redux/actions/layoutActions";
import RelatedNews from "../../components/news/RelatedNews";
import Spinner from "../../components/layouts/Spinner";
import AddComment from "../../components/news/comments/AddComment";
import Alert from "../../components/layouts/Alert";

const SingleNews = ({
  currentNews,
  news: { relatedNews, loading: newsLoading },
  newsComment: {
    newsComments,
    currentComment,
    loading: newsCommentLoading,
    error,
  },
  user: { isAuthenticated, token, user },
  getRelatedNewsByCategory,
  getCommentByNews,
  createComment,
  selectNewsComment,
  setActiveLink,
}) => {
  const router = useRouter();
  const { slug } = router.query;

  const [comment, setComment] = useState("");

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    if (currentNews) {
      getRelatedNewsByCategory(currentNews.category._id, currentNews._id);
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
            {newsLoading ? <Spinner /> : currentNews && currentNews.title}
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
                    {newsLoading ? <Spinner /> : currentNews?.title}
                  </h3>
                  <div className="blog-post-align">
                    <div className="blog-post-img embed-responsive embed-responsive-1by1">
                      {newsLoading ? (
                        <Spinner />
                      ) : (
                        currentNews?.user && (
                          <Link href={`/users/${currentNews.user._id}`}>
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
                        )
                      )}
                    </div>
                    <div className="blog-post-info">
                      <div className="author align-items-center mb-1">
                        {newsLoading ? (
                          <Spinner />
                        ) : (
                          currentNews?.user && (
                            <Link href={`/users/${currentNews.user._id}`}>
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.name
                              )}
                            </Link>
                          )
                        )}{" "}
                        in{" "}
                        {newsLoading ? (
                          <Spinner />
                        ) : (
                          currentNews?.category && (
                            <Link
                              href={`/newsCategories/${currentNews?.category?.slug}`}
                            >
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.category?.name
                              )}
                            </Link>
                          )
                        )}
                      </div>
                      <ul className="blog-meta">
                        <li className="meta-item blog-lesson">
                          <span className="meta-value">
                            {" "}
                            <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.created_at
                              )}
                            </Moment>{" "}
                          </span>
                        </li>
                        <li className="meta-item blog-students">
                          <span className="meta-value">
                            {" "}
                            {newsLoading ? (
                              <Spinner />
                            ) : (
                              currentNews && Math.ceil(currentNews.time_read)
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
                            newsLoading ? <Spinner /> : currentNews?.mainImage
                          }
                          className="radius-image img-fluid pb-5 embed-responsive-item"
                          style={{ objectFit: "cover" }}
                          alt=""
                        />
                      </div>
                    </div>

                    <div className="single-post-content text-justify">
                      {newsLoading ? (
                        <Spinner />
                      ) : (
                        currentNews &&
                        currentNews.content &&
                        parse(currentNews.content)
                      )}

                      <div className="d-grid left-right mt-5 pb-md-5">
                        <div className="buttons-singles tags">
                          <h4>Tag :</h4>
                          {newsLoading ? (
                            <Spinner />
                          ) : (
                            currentNews?.tags &&
                            currentNews.tags.map((tag) => (
                              <Link
                                key={tag._id}
                                href={`/newsTags/${tag.slug}`}
                              >
                                {tag.name}
                              </Link>
                            ))
                          )}
                        </div>
                        <div className="buttons-singles">
                          <h4>Bagikan :</h4>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://www.facebook.com/share.php?u=https://malanghub.com/${slug}`}
                          >
                            <span
                              className="fa fa-facebook"
                              aria-hidden="true"
                            ></span>
                          </a>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://twitter.com/intent/tweet?text=https://malanghub.com/${slug}`}
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
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.name
                              )}
                            </h3>
                            <p>
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.bio
                              )}
                            </p>
                            <ul className="author-icons mt-4">
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.facebook && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="facebook"
                                      href={
                                        newsLoading ? (
                                          <Spinner />
                                        ) : (
                                          currentNews?.user?.facebook
                                        )
                                      }
                                    >
                                      <span
                                        className="fab fa-facebook"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.twitter && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="twitter"
                                      href={`https://twitter.com/${
                                        newsLoading ? (
                                          <Spinner />
                                        ) : (
                                          currentNews?.user?.twitter
                                        )
                                      }`}
                                    >
                                      <span
                                        className="fab fa-twitter"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.instagram && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="instagram"
                                      href={`https://instagram.com/${
                                        newsLoading ? (
                                          <Spinner />
                                        ) : (
                                          currentNews?.user?.instagram
                                        )
                                      }`}
                                    >
                                      <span
                                        className="fab fa-instagram"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.linkedin && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="linkedin"
                                      href={
                                        newsLoading ? (
                                          <Spinner />
                                        ) : (
                                          currentNews?.user?.linkedin
                                        )
                                      }
                                    >
                                      <span
                                        className="fab fa-linkedin"
                                        aria-hidden="true"
                                      ></span>
                                    </a>
                                  </li>
                                )
                              )}
                              {newsLoading ? (
                                <Spinner />
                              ) : (
                                currentNews?.user?.tiktok && (
                                  <li>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      className="tiktok"
                                      href={`https://www.tiktok.com/@${
                                        newsLoading ? (
                                          <Spinner />
                                        ) : (
                                          currentNews?.user?.tiktok
                                        )
                                      }`}
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

                      <div className="comments mt-5">
                        <Alert />
                        <h4 className="side-title mb-4">
                          Komentar (
                          {newsLoading ? (
                            <Spinner />
                          ) : newsComments?.length > 0 ? (
                            newsComments?.length
                          ) : (
                            "0"
                          )}
                          )
                        </h4>

                        {isAuthenticated && token && user && (
                          <div className="leave-comment-form mt-5" id="reply">
                            <h4 className="side-title mb-2">Komentar</h4>
                            <form onSubmit={onComment}>
                              <div className="form-group">
                                <textarea
                                  name="Comment"
                                  className="form-control"
                                  placeholder="Komentarmu *"
                                  required=""
                                  spellcheck="false"
                                  value={comment}
                                  onChange={(event) =>
                                    setComment(event.target.value)
                                  }
                                ></textarea>
                              </div>

                              <div className="submit text-right">
                                <button className="btn btn-style btn-primary">
                                  Kirim{" "}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {newsLoading ? (
                          <Spinner />
                        ) : (
                          newsComments?.length > 0 &&
                          newsComments.map((newsComment) => (
                            <div key={newsComment._id} className="media">
                              <div className="img-circle">
                                <img
                                  src={newsComment?.user?.photo}
                                  className="img-fluid"
                                  alt="..."
                                />
                              </div>
                              <div className="media-body">
                                <ul className="time-rply mb-2">
                                  <li>
                                    <Link
                                      href={`/users/${newsComment?.user?._id}`}
                                    >
                                      <a className="name mt-0 mb-2 d-block">
                                        {newsComment?.user?.name}
                                      </a>
                                    </Link>
                                    <Moment format="dddd, Do MMMM YYYY">
                                      {newsComment?.created_at}
                                    </Moment>{" "}
                                    -{" "}
                                    <Moment format="HH:mm">
                                      {newsComment?.created_at}
                                    </Moment>
                                  </li>
                                  {isAuthenticated && (
                                    <li className="reply-last">
                                      <a
                                        href="#"
                                        className="reply"
                                        data-toggle="modal"
                                        data-target="#addCommentModal"
                                        onClick={(event) => {
                                          event.preventDefault();

                                          selectNewsComment(newsComment);

                                          window
                                            .$("#addCommentModal")
                                            .modal("toggle");
                                        }}
                                      >
                                        Balas
                                      </a>
                                    </li>
                                  )}
                                </ul>
                                <p>{newsComment?.comment}</p>
                                {newsComment?.commentReplies?.length > 0 &&
                                  newsComment?.commentReplies.map(
                                    (commentReply, index) => (
                                      <div
                                        key={index}
                                        className="media second mt-4 p-0 pt-2"
                                      >
                                        <a
                                          className="img-circle img-circle-sm"
                                          href="#url"
                                        >
                                          <img
                                            src={commentReply?.user?.photo}
                                            className="img-fluid"
                                            alt="..."
                                          />
                                        </a>
                                        <div className="media-body">
                                          <ul className="time-rply mb-2">
                                            <li>
                                              <a
                                                href="#URL"
                                                className="name mt-0 mb-2 d-block"
                                              >
                                                {commentReply?.user?.name}
                                              </a>
                                              <Moment format="dddd, Do MMMM YYYY">
                                                {commentReply?.created_at}
                                              </Moment>{" "}
                                              -{" "}
                                              <Moment format="HH:mm">
                                                {commentReply?.created_at}
                                              </Moment>
                                            </li>
                                            {isAuthenticated && (
                                              <li className="reply-last">
                                                <a
                                                  href="#reply"
                                                  className="reply"
                                                  data-toggle="modal"
                                                  data-target="#addCommentModal"
                                                  onClick={(event) => {
                                                    event.preventDefault();

                                                    selectNewsComment(
                                                      newsComment
                                                    );

                                                    window
                                                      .$("#addCommentModal")
                                                      .modal("toggle");
                                                  }}
                                                >
                                                  {" "}
                                                  Balas
                                                </a>
                                              </li>
                                            )}
                                          </ul>
                                          <p>{commentReply?.comment}</p>
                                        </div>
                                      </div>
                                    )
                                  )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <AddComment />
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
              <div className="pos-sticky">
                <h3 className="section-title-left">Mungkin Anda Tertarik </h3>

                {newsLoading || relatedNews === null ? (
                  <Spinner />
                ) : !newsLoading && relatedNews?.length > 0 ? (
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
  const { slug } = params;

  let config = {
    method: "get",
    url: `${process.env.API_ADDRESS}/api/news/${slug}`,
  };

  let data = {};
  try {
    const res = await axios(config);

    data = res.data.data;
  } catch (e) {
    return {
      notFound: true,
    };
  }

  return { props: { currentNews: data } };
}

const mapStateToProps = (state) => ({
  news: state.news,
  newsComment: state.newsComment,
  user: state.user,
});

export default connect(mapStateToProps, {
  getRelatedNewsByCategory,
  getCommentByNews,
  createComment,
  selectNewsComment,
  setActiveLink,
})(SingleNews);

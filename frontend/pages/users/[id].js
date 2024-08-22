import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { getNewsByUser } from "../../redux/actions/newsActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import assetsPath from "../../components/layouts/Assets";
import Spinner from "../../components/layouts/Spinner";
import * as Sentry from "@sentry/nextjs";

const GetUserProfile = ({
  getNewsByUser,
  trendingNewsByUser,
  setActiveLink,
  userProfile,
  user: { loading: userLoading },
  news: { newsByUser, loading: newsLoading },
  match,
}) => {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    getNewsByUser(id, 1);
    setActiveLink("");
  }, []);

  const handlePageClick = (data) => {
    let selected = data.selected + 1;

    getNewsByUser(id, selected);
  };

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
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> / Pengguna /{" "}
          <span className="breadcrumb_last" aria-current="page">
            {userLoading ? <Spinner /> : userProfile && userProfile.name}
          </span>
        </div>
      </nav>

      <section id="author" className="w3l-author py-5">
        <div className="container py-md-3">
          <div className="row align-items-center">
            <div className="col-md-3 col-sm-4 col-7 order-first">
              <div className="embed-responsive embed-responsive-1by1">
                <img
                  src={
                    userProfile && userProfile.photo
                      ? userProfile.photo
                      : assetsPath("images/author.jpg")
                  }
                  alt=""
                  className="rounded-circle img-fluid embed-responsive-item"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            <div className="col-md-9 col-sm-12 order-md-first mt-lg-0 mt-4">
              <span className="category">
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile && userProfile.motto && userProfile.motto
                )}
              </span>
              <h1 className="mb-4 title">
                <span className="typed-text">
                  {userLoading ? <Spinner /> : userProfile && userProfile.name}
                </span>
                <span className="cursor typing">&nbsp;</span>
              </h1>
              <p>
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile && userProfile.bio && parse(userProfile.bio)
                )}
              </p>
              <ul className="author-icons mt-4">
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile &&
                  userProfile.facebook && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="facebook"
                        href={userProfile.facebook}
                      >
                        <span
                          className="fab fa-facebook"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )
                )}
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile &&
                  userProfile.twitter && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="twitter"
                        href={`https://twitter.com/${userProfile.twitter}`}
                      >
                        <span
                          className="fab fa-twitter"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )
                )}
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile &&
                  userProfile.instagram && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="instagram"
                        href={`https://instagram.com/${userProfile.instagram}`}
                      >
                        <span
                          className="fab fa-instagram"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )
                )}
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile &&
                  userProfile.linkedin && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="linkedin"
                        href={userProfile.linkedin}
                      >
                        <span
                          className="fab fa-linkedin"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )
                )}
                {userLoading ? (
                  <Spinner />
                ) : (
                  userProfile &&
                  userProfile.tiktok && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="tiktok"
                        href={`https://www.tiktok.com/@${userProfile.tiktok}`}
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
      </section>

      <div
        className="display-ad"
        style={{ margin: "8px auto", display: "block", textAlign: "center" }}
      ></div>

      <div className="w3l-authorblock2 w3l-homeblock1 mb-5 pb-5">
        <div className="container">
          <div className="item mt-4">
            <div className="row mt-5 pt-md-5 img-block-mobile">
              <div className="col-lg-9 most-recent">
                <h3 className="section-title-left">
                  Pengguna Terbaru dari{" "}
                  {userLoading ? <Spinner /> : userProfile && userProfile.name}{" "}
                </h3>
                <div className="list-view ">
                  {newsLoading ? (
                    <Spinner />
                  ) : (
                    newsByUser &&
                    newsByUser.data &&
                    newsByUser.data.length > 0 &&
                    newsByUser.data.map((news) => (
                      <div key={news._id} className="grids5-info mt-5">
                        <div className="blog-info">
                          <span className="category">
                            {news && news.category.name}
                          </span>
                          <Link
                            href={`/news/${news.slug}`}
                            className="blog-desc mt-0"
                          >
                            {news && news.title}
                          </Link>
                          <div className="text-truncate">
                            {parse(news.content.replace(/<(.|\n)*?>/g, ""))}
                          </div>
                          <div className="author align-items-center mt-3 mb-1">
                            <Link
                              href={`/users/${news.user._id}`}
                              legacyBehavior
                            >
                              {news && news.user.name}
                            </Link>{" "}
                            in{" "}
                            <Link
                              href={`/newsCategories/${news.category.slug}`}
                              legacyBehavior
                            >
                              {news.category.name}
                            </Link>
                          </div>
                          <ul className="blog-meta">
                            <li className="meta-item blog-lesson">
                              <span className="meta-value">
                                {" "}
                                <Moment format="dddd, Do MMMM YYYY">
                                  {news.created_at}
                                </Moment>{" "}
                              </span>
                            </li>
                            <li className="meta-item blog-students">
                              <span className="meta-value">
                                {" "}
                                {Math.ceil(news.time_read / 10)} menit
                              </span>
                            </li>
                          </ul>
                        </div>
                        <Link
                          href={`/news/${news.slug}`}
                          className="d-block zoom embed-responsive embed-responsive-1by1"
                        >
                          <img
                            src={news.mainImage}
                            alt=""
                            className="img-fluid radius-image news-image mt-md-0 mt-3 embed-responsive-item"
                            style={{ objectFit: "cover" }}
                          />
                        </Link>
                      </div>
                    ))
                  )}
                </div>

                {newsLoading ? (
                  <Spinner />
                ) : (
                  newsByUser && (
                    <div className="pagination-wrapper mt-5">
                      <ReactPaginate
                        previousLabel={"<"}
                        nextLabel={">"}
                        breakLabel={"..."}
                        initialPage={newsByUser.pagination.currentPage - 1}
                        pageCount={newsByUser.pagination.totalPages}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={5}
                        onPageChange={handlePageClick}
                        containerClassName={"page-pagination"}
                        pageLinkClassName={"page-numbers"}
                        activeLinkClassName={"active"}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="col-lg-3 trending mb-5 mt-lg-0 mt-5">
                <div className="pos-sticky">
                  <h3 className="section-title-left">
                    Trending oleh {userProfile && userProfile.name}{" "}
                  </h3>

                  {newsLoading ? (
                    <Spinner />
                  ) : (
                    trendingNewsByUser &&
                    trendingNewsByUser.length > 0 &&
                    trendingNewsByUser?.map((news, index) => (
                      <div key={news._id} className="grids5-info">
                        <h4>{index + 1}.</h4>
                        <div className="blog-info">
                          <Link
                            href={`/news/${news.slug}`}
                            className="blog-desc1"
                          >
                            {news.title}
                          </Link>
                          <div className="author align-items-center mt-2 mb-1">
                            <Link
                              href={`/users/${news.user._id}`}
                              legacyBehavior
                            >
                              {news.user.name}
                            </Link>{" "}
                            in{" "}
                            <Link
                              href={`/newsCategories/${news.category.slug}`}
                              legacyBehavior
                            >
                              {news.category.name}
                            </Link>
                          </div>
                          <ul className="blog-meta">
                            <li className="meta-item blog-lesson">
                              <span className="meta-value">
                                <Moment format="dddd, Do MMMM YYYY">
                                  {news.created_at}
                                </Moment>
                              </span>
                            </li>
                            <li className="meta-item blog-students">
                              <span className="meta-value">
                                {" "}
                                {Math.ceil(news.time_read / 10)} menit
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
      name: "users.[id].getServerSideProps",
    },
    async () => {
      const { id } = params;

      const trendingNewsUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&user=${id}&created_at[gte]=${moment()
        .subtract(3, "months")
        .toISOString()}`;
      const userUrl = `${process.env.API_ADDRESS}/api/users/${id}`;

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
    }
  );

  return result;
}

const mapStateToProps = (state) => ({
  user: state.user,
  news: state.news,
});

export default connect(mapStateToProps, {
  getNewsByUser,
  setActiveLink,
})(GetUserProfile);

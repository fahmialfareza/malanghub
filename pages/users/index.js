import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { loadUser } from "../../redux/actions/userActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import assetsPath from "../../components/layouts/Assets";
import Dashboard from "../../components/users/Dashboard";
import EditProfileModal from "../../components/users/EditProfileModal";
import parse from "html-react-parser";

const UserProfile = ({
  user: { user, loading: userLoading },
  loadUser,
  setActiveLink,
}) => {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.token) {
      loadUser();
    }
  }, []);

  useEffect(() => {
    if (!user && !localStorage.token) {
      return router.push("/signin");
    }

    setActiveLink("");
  }, [user]);

  return (
    <>
      <Head>
        <title>Malanghub - Profil</title>
        <meta name="title" content="Malanghub - Profil" />
        <meta
          name="description"
          content="Malanghub - Profil - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/users" />
        <meta property="og:title" content="Malanghub - Profil" />
        <meta
          property="og:description"
          content="Malanghub - Profil - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.malanghub.com/users"
        />
        <meta property="twitter:title" content="Malanghub - Profil" />
        <meta
          property="twitter:description"
          content="Malanghub - Profil - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /
          <span className="breadcrumb_last" aria-current="page">
            Profil
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
                    user && user.photo
                      ? user.photo
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
                {userLoading ? <Spinner /> : user && user.motto && user.motto}
              </span>
              <h1 className="mb-4 title">
                Halo,{" "}
                <span className="typed-text">
                  {userLoading ? <Spinner /> : user && user.name}
                </span>
                <span className="cursor typing">&nbsp;</span>
              </h1>
              <p>
                {userLoading ? (
                  <Spinner />
                ) : (
                  user && user.bio && parse(user.bio)
                )}
              </p>
              <ul className="author-icons mt-4">
                {userLoading ? (
                  <Spinner />
                ) : (
                  user &&
                  user.facebook && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="facebook"
                        href={user.facebook}
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
                  user &&
                  user.twitter && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="twitter"
                        href={`https://twitter.com/${user.twitter}`}
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
                  user &&
                  user.instagram && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="instagram"
                        href={`https://instagram.com/${user.instagram}`}
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
                  user &&
                  user.linkedin && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="linkedin"
                        href={user.linkedin}
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
                  user &&
                  user.tiktok && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="tiktok"
                        href={`https://www.tiktok.com/@${user.tiktok}`}
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
              <a
                href="#"
                className="btn btn-primary btn-block my-2"
                data-toggle="modal"
                data-target="#editProfileModal"
              >
                <i className="fa fa-edit" aria-hidden="true"></i> Edit Profil
              </a>
            </div>
          </div>
        </div>
      </section>

      <Dashboard />

      <EditProfileModal />
    </>
  );
};

export async function getServerSideProps({ req }) {
  try {
    const response = await axios.get(`${process.env.API_ADDRESS}/api/user`, {
      headers: {
        Cookie: req.headers.cookie,
      },
    });

    return { props: {} };
  } catch (e) {
    return {
      redirect: {
        permanent: false,
        destination: "/signin",
      },
      props: {},
    };
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps, { loadUser, setActiveLink })(
  UserProfile
);

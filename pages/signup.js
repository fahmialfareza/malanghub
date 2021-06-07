import { useState, useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { signUp } from "../redux/actions/userActions";
import { setActiveLink, setAlert } from "../redux/actions/layoutActions";
import GoogleLogin from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

const SignUp = ({
  user: { isAuthenticated, error, token },
  signUp,
  setActiveLink,
  setAlert,
}) => {
  const router = useRouter();

  useEffect(() => {
    setActiveLink("signup");
  }, []);

  useEffect(() => {
    if (isAuthenticated && localStorage.token) {
      router.push("/users");
    }

    if (error) {
      setAlert(error, "danger");
    }
  }, [error, isAuthenticated]);

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  const { name, email, password, passwordConfirmation } = user;

  const onChange = (event) => {
    setUser({ ...user, [event.target.name]: event.target.value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (name === "" || email === "" || password === "") {
      setAlert("Please fill in all fields", "danger");
    } else if (password !== passwordConfirmation) {
      setAlert("Password does not match", "danger");
    } else {
      signUp({
        name,
        email,
        password,
        passwordConfirmation,
      });
    }
  };

  const responseGoogle = (response) => {
    try {
      signUp({
        name: response.profileObj.name,
        email: response.profileObj.email,
        password: "Google" + response.profileObj.googleId,
        passwordConfirmation: "Google" + response.profileObj.googleId,
        photo: response.profileObj.imageUrl,
      });
    } catch (e) {}
  };

  const responseFacebook = (response) => {
    try {
      signUp({
        name: response.name,
        email: response.email,
        password: "Facebook" + response.id,
        passwordConfirmation: "Facebook" + response.id,
        photo: response.picture.data.url,
      });
    } catch (e) {}
  };

  return (
    <>
      <Head>
        <title>Malanghub - Daftar</title>
        <meta name="title" content="Malanghub - Daftar" />
        <meta
          name="description"
          content="Malanghub - Daftar - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/signup" />
        <meta property="og:title" content="Malanghub - Daftar" />
        <meta
          property="og:description"
          content="Malanghub - Daftar - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.malanghub.com/signup"
        />
        <meta property="twitter:title" content="Malanghub - Daftar" />
        <meta
          property="twitter:description"
          content="Malanghub - Daftar - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /{" "}
          <span className="breadcrumb_last" aria-current="page">
            Daftar
          </span>
        </div>
      </nav>
      <section className="w3l-contact-2 py-5">
        <div className="container py-lg-5 py-md-4">
          <h3 className="section-title-left">Daftar </h3>
          <div className="contact-grids d-grid">
            <div className="contact-left m-auto">
              <GoogleLogin
                clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                buttonText={"Daftar dengan Google"}
                onSuccess={responseGoogle}
                onFailure={responseGoogle}
                cookiePolicy={"single_host_origin"}
                className={"mr-3"}
                render={(renderProps) => (
                  <a
                    onClick={renderProps.onClick}
                    className="btn btn-danger btn-block btn-lg text-light"
                  >
                    <i className="fa fa-google"></i> Daftar dengan <b>Google</b>
                  </a>
                )}
              />

              <FacebookLogin
                appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}
                fields="name,email,picture"
                scope="public_profile, email"
                callback={responseFacebook}
                render={(renderProps) => (
                  <a
                    onClick={renderProps.onClick}
                    className="btn btn-primary btn-block btn-lg text-light"
                  >
                    <i className="fa fa-facebook"></i> Daftar dengan{" "}
                    <b>Facebook</b>
                  </a>
                )}
              />
            </div>
            <div className="contact-right">
              <form onSubmit={onSubmit} className="signin-form">
                <div className="input-grids">
                  <input
                    type="text"
                    name="name"
                    value={name}
                    id="w3lName"
                    placeholder="Nama*"
                    className="contact-input"
                    onChange={onChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={email}
                    id="w3lSender"
                    placeholder="Email*"
                    className="contact-input"
                    onChange={onChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    value={password}
                    id="w3lSubect"
                    placeholder="Password*"
                    className="contact-input"
                    onChange={onChange}
                    required
                  />
                  <input
                    type="password"
                    value={passwordConfirmation}
                    name="passwordConfirmation"
                    id="w3lSubect-confirm"
                    placeholder="Konfirmasi Password*"
                    className="contact-input"
                    onChange={onChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-style btn-outline">
                  Daftar
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export async function getServerSideProps({ req }) {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_ADDRESS}/api/user`,
      {
        headers: {
          Cookie: req.headers.cookie,
        },
      }
    );

    return {
      redirect: {
        permanent: false,
        destination: "/users",
      },
      props: {},
    };
  } catch (e) {
    return { props: {} };
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps, {
  signUp,
  setActiveLink,
  setAlert,
})(SignUp);

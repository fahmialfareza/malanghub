import { useEffect, useState } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, googleLogin } from "../redux/actions/userActions";
import { setActiveLink, setAlert } from "../redux/actions/layoutActions";
import { useGoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import * as Sentry from "@sentry/nextjs";

const SignIn = ({
  user: { isAuthenticated, error, token },
  signIn,
  googleLogin,
  setActiveLink,
  setAlert,
}) => {
  const router = useRouter();

  useEffect(() => {
    setActiveLink("signin");
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("token");

    if (isAuthenticated && token) {
      router.push("/users");
    }

    if (error) {
      setAlert(error, "danger");
    }
  }, [error, isAuthenticated, router.isReady]);

  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const { email, password } = user;

  const onChange = (event) => {
    setUser({ ...user, [event.target.name]: event.target.value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (email === "" || password === "") {
      setAlert("Please fill in all fields", "danger");
    } else {
      signIn({
        email,
        password,
      });
    }
  };

  const responseGoogle = (accessToken) => {
    const transaction = Sentry.startTransaction({
      name: "signin.responseGoogle",
    });

    Sentry.configureScope((scope) => {
      scope.setSpan(transaction);
    });

    try {
      googleLogin({
        access_token: accessToken,
      });
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      transaction.finish();
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (response) => responseGoogle(response.access_token),
  });

  const responseFacebook = (response) => {
    const transaction = Sentry.startTransaction({
      name: "signin.responseFacebook",
    });

    Sentry.configureScope((scope) => {
      scope.setSpan(transaction);
    });

    try {
      signIn({
        email: response.email,
        password: "Facebook" + response.id,
      });
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      transaction.finish();
    }
  };

  return (
    <>
      <Head>
        <title>Malanghub - Masuk</title>
        <meta name="title" content="Malanghub - Masuk" />
        <meta
          name="description"
          content="Malanghub - Masuk - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/signin" />
        <meta property="og:title" content="Malanghub - Masuk" />
        <meta
          property="og:description"
          content="Malanghub - Masuk - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.malanghub.com/signin"
        />
        <meta property="twitter:title" content="Malanghub - Masuk" />
        <meta
          property="twitter:description"
          content="Malanghub - Masuk - Situs yang menyediakan informasi sekitar Malang Raya!"
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
            Masuk
          </span>
        </div>
      </nav>
      <section className="w3l-contact-2 py-5">
        <div className="container py-lg-5 py-md-4">
          <h3 className="section-title-left">Masuk </h3>
          <div className="contact-grids d-grid">
            <div className="contact-left m-auto">
              <a
                onClick={loginWithGoogle}
                className="btn btn-danger btn-block btn-lg text-light"
              >
                <i className="fa fa-google"></i> Masuk dengan <b>Google</b>
              </a>

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
                    <i className="fa fa-facebook"></i> Masuk dengan{" "}
                    <b>Facebook</b>
                  </a>
                )}
              />
            </div>
            <div className="contact-right">
              <form onSubmit={onSubmit} className="signin-form">
                <div className="input-grids">
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
                </div>
                <button className="btn btn-style btn-outline">Masuk</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps, {
  signIn,
  googleLogin,
  setActiveLink,
  setAlert,
})(SignIn);

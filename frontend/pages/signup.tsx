import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { signUp, googleLogin } from "../redux/actions/userActions";
import { setActiveLink, setAlert } from "../redux/actions/layoutActions";
import { useGoogleLogin } from "@react-oauth/google";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../redux/store";
import { GetServerSidePropsContext } from "next";
import { UserReducerState } from "../redux/types";
import { GoogleLoginRequest, SignUpRequest } from "../redux/actions/types/user";

interface SignUpProps {
  user: UserReducerState;
  signUp: (formData: SignUpRequest) => void;
  googleLogin: (formData: GoogleLoginRequest) => void;
  setActiveLink: (link: string) => void;
  setAlert: (message: string, type: string) => void;
}

const SignUp = ({
  user: { isAuthenticated, error, token },
  signUp,
  googleLogin,
  setActiveLink,
  setAlert,
}: SignUpProps) => {
  const router = useRouter();

  useEffect(() => {
    setActiveLink("signup");
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
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  const { name, email, password, passwordConfirmation } = user;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [event.target.name]: event.target.value });
  };

  const onSubmit = (event: FormEvent) => {
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

  const responseGoogle = (accessToken: string) => {
    Sentry.startSpan({ name: "signup.responseGoogle" }, () => {
      try {
        googleLogin({
          access_token: accessToken,
        });
      } catch (e) {
        Sentry.captureException(e);
      }
    });
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (response) => responseGoogle(response.access_token),
  });

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
              <a
                onClick={(event) => {
                  event.preventDefault();
                  loginWithGoogle();
                }}
                className="btn btn-danger btn-block btn-lg text-light"
              >
                <i className="fa fa-google"></i> Daftar dengan <b>Google</b>
              </a>
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

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
  const result = await Sentry.startSpan(
    { name: "signup.getServerSideProps" },
    async () => {
      try {
        const response = await fetch(`${process.env.API_ADDRESS}/api/user`, {
          headers: {
            Cookie: req.headers.cookie || "",
          },
        });

        if (response.ok) {
          return {
            redirect: {
              permanent: false,
              destination: "/users",
            },
            props: {},
          };
        } else {
          throw new Error("Failed to fetch user data");
        }
      } catch (e) {
        Sentry.captureException(e);
        return { props: {} };
      }
    }
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, {
  signUp,
  googleLogin,
  setActiveLink,
  setAlert,
})(SignUp);

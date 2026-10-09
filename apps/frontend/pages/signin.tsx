import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, googleLogin } from "../redux/actions/userActions";
import { setActiveLink, setAlert } from "../redux/actions/layoutActions";
import { useGoogleLogin } from "@react-oauth/google";
import * as Sentry from "@sentry/nextjs";
import { Breadcrumbs, Button, Card, Input } from "@malanghub/ui";
import { RootState } from "../redux/store";
import { UserReducerState } from "../redux/types";
import { GoogleLoginRequest, SignInRequest } from "../redux/actions/types/user";

interface SignInProps {
  user: UserReducerState;
  signIn: (formData: SignInRequest) => void;
  googleLogin: (formData: GoogleLoginRequest) => void;
  setActiveLink: (link: string) => void;
  setAlert: (message: string, type: string) => void;
}

const SignIn = ({
  user: { isAuthenticated, error, token },
  signIn,
  googleLogin,
  setActiveLink,
  setAlert,
}: SignInProps) => {
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

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [event.target.name]: event.target.value });
  };

  const onSubmit = (event: FormEvent) => {
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

  const responseGoogle = (accessToken: string) => {
    Sentry.startSpan({ name: "signin.responseGoogle" }, () => {
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
        <meta name="robots" content="noindex,nofollow" />
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

      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Masuk" }]}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />
      <section className="bg-bg px-4 py-12 sm:py-16">
        <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
              Masuk
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Masuk ke akun Malanghub Anda untuk mengelola berita dan profil.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <Input
              type="email"
              name="email"
              id="signin-email"
              label="Email"
              placeholder="nama@email.com"
              autoComplete="email"
              value={email}
              onChange={onChange}
              required
            />
            <Input
              type="password"
              name="password"
              id="signin-password"
              label="Password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={onChange}
              required
            />
            <Button type="submit" block className="mt-2">
              Masuk
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
            <span aria-hidden className="h-px flex-1 bg-line" />
            atau
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>

          <Button variant="secondary" block onClick={() => loginWithGoogle()}>
            <i className="fa fa-google text-danger" aria-hidden="true"></i>
            Masuk dengan Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            Belum punya akun?{" "}
            <Link
              href="/signup"
              className="font-semibold text-brand hover:text-brand-hover"
            >
              Daftar
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, {
  signIn,
  googleLogin,
  setActiveLink,
  setAlert,
})(SignIn);

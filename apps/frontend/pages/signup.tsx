import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { signUp, googleLogin } from "../redux/actions/userActions";
import { setActiveLink, setAlert } from "../redux/actions/layoutActions";
import { useGoogleLogin } from "@react-oauth/google";
import * as Sentry from "@sentry/nextjs";
import { Breadcrumbs, Button, Card, Input } from "@malanghub/ui";
import { RootState } from "../redux/store";
import { GetServerSidePropsContext } from "next";
import * as cookie from "cookie";
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
        <meta name="robots" content="noindex,nofollow" />
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

      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Daftar" }]}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />
      <section className="tw:bg-bg tw:px-4 tw:py-12 tw:sm:py-16">
        <Card className="tw:mx-auto tw:w-full tw:max-w-md tw:p-6 tw:sm:p-8">
          <div className="tw:mb-6 tw:text-center">
            <h1 className="tw:m-0 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg tw:sm:text-3xl">
              Daftar
            </h1>
            <p className="tw:mt-2 tw:text-sm tw:leading-relaxed tw:text-muted">
              Buat akun Malanghub untuk mulai menulis dan berbagi informasi
              sekitar Malang Raya.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <Input
              type="text"
              name="name"
              id="signup-name"
              label="Nama"
              placeholder="Nama lengkap"
              autoComplete="name"
              value={name}
              onChange={onChange}
              required
            />
            <Input
              type="email"
              name="email"
              id="signup-email"
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
              id="signup-password"
              label="Password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={onChange}
              required
            />
            <Input
              type="password"
              name="passwordConfirmation"
              id="signup-password-confirmation"
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={onChange}
              required
            />
            <Button type="submit" block className="tw:mt-2">
              Daftar
            </Button>
          </form>

          <div className="tw:my-6 tw:flex tw:items-center tw:gap-3 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted">
            <span aria-hidden className="tw:h-px tw:flex-1 tw:bg-line" />
            atau
            <span aria-hidden className="tw:h-px tw:flex-1 tw:bg-line" />
          </div>

          <Button variant="secondary" block onClick={() => loginWithGoogle()}>
            <i className="fa fa-google tw:text-danger" aria-hidden="true"></i>
            Daftar dengan Google
          </Button>

          <p className="tw:mt-6 tw:text-center tw:text-sm tw:text-muted">
            Sudah punya akun?{" "}
            <Link
              href="/signin"
              className="tw:font-semibold tw:text-brand tw:hover:text-brand-hover"
            >
              Masuk
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
};

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
  const result = await Sentry.startSpan(
    { name: "signup.getServerSideProps" },
    async () => {
      try {
        if (!req.headers.cookie) {
          return { props: {} };
        }

        const { token } = cookie.parse(req.headers.cookie);

        if (!token) {
          return { props: {} };
        }

        const response = await fetch(`${process.env.API_ADDRESS}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
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
          return { props: {} };
        }
      } catch (e) {
        Sentry.captureException(e);
        return { props: {} };
      }
    },
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

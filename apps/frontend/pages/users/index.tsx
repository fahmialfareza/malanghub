import { useEffect, useState } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Spinner,
} from "@malanghub/ui";
import { loadUser, logout } from "../../redux/actions/userActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import assetsPath from "../../components/layouts/Assets";
import Dashboard from "../../components/users/Dashboard";
import EditProfileModal from "../../components/users/EditProfileModal";
import parse from "html-react-parser";
import { RootState } from "../../redux/store";
import { UserReducerState } from "../../redux/types";

interface UserProfileProps {
  user: UserReducerState;
  logout: () => void;
  loadUser: () => void;
  setActiveLink: (link: string) => void;
}

const UserProfile = ({
  user: { user, loading: userLoading },
  logout,
  loadUser,
  setActiveLink,
}: UserProfileProps) => {
  const router = useRouter();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const socialLinks = user
    ? [
        user.facebook && {
          key: "facebook",
          label: "Facebook",
          icon: "fab fa-facebook",
          href: user.facebook,
        },
        user.twitter && {
          key: "twitter",
          label: "Twitter",
          icon: "fab fa-twitter",
          href: `https://twitter.com/${user.twitter}`,
        },
        user.instagram && {
          key: "instagram",
          label: "Instagram",
          icon: "fab fa-instagram",
          href: `https://instagram.com/${user.instagram}`,
        },
        user.linkedin && {
          key: "linkedin",
          label: "Linkedin",
          icon: "fab fa-linkedin",
          href: user.linkedin,
        },
        user.tiktok && {
          key: "tiktok",
          label: "Tiktok",
          icon: "fab fa-tiktok",
          href: `https://www.tiktok.com/@${user.tiktok}`,
        },
      ].filter(
        (
          link,
        ): link is { key: string; label: string; icon: string; href: string } =>
          !!link,
      )
    : [];

  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("token");

    if (token) {
      loadUser();
    } else {
      logout();
      router.push("/signin");
    }
  }, [router.isReady]);

  useEffect(() => {
    if (router.isReady) return;

    const token = localStorage.getItem("token");

    if (!user && !token) {
      router.push("/signin");
    }

    setActiveLink("");
  }, [user, router.isReady]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
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

      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Profil" }]}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />
      <section className="bg-bg py-8 sm:py-12">
        <Container>
          <Card className="p-6 sm:p-8">
            {userLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left">
                <div className="relative size-32 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface-2 shadow-card ring-1 ring-line sm:size-40">
                  <Image
                    src={
                      user && user.photo
                        ? user.photo
                        : assetsPath("images/author.jpg")
                    }
                    alt={user?.name ? `Foto profil ${user.name}` : ""}
                    className="object-cover"
                    sizes="160px"
                    fill
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {user && user.motto && (
                    <Badge className="mb-3">{user.motto}</Badge>
                  )}
                  <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
                    Halo,{" "}
                    <span className="text-brand">{user && user.name}</span>
                  </h1>
                  {user && user.bio && (
                    <div className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-body [&_p]:mb-2 [&_p]:text-body">
                      {parse(user.bio)}
                    </div>
                  )}
                  <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row md:justify-between">
                    {socialLinks.length > 0 ? (
                      <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
                        {socialLinks.map((link) => (
                          <li key={link.key}>
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={link.href}
                              aria-label={link.label}
                              className="flex size-10 items-center justify-center rounded-full border border-line bg-surface-2 font-normal text-body no-underline transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                            >
                              <span
                                className={link.icon}
                                aria-hidden="true"
                              ></span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span />
                    )}
                    <Button onClick={() => setEditProfileOpen(true)}>
                      <i className="fa fa-edit" aria-hidden="true"></i> Edit
                      Profil
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Container>
      </section>

      <Dashboard />

      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, { loadUser, setActiveLink, logout })(
  UserProfile,
);

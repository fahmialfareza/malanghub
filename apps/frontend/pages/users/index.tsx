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
      <section className="tw:bg-bg tw:py-8 tw:sm:py-12">
        <Container>
          <Card className="tw:p-6 tw:sm:p-8">
            {userLoading ? (
              <div className="tw:flex tw:justify-center tw:py-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-6 tw:text-center tw:md:flex-row tw:md:items-center tw:md:text-left">
                <div className="tw:relative tw:size-32 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:border-4 tw:border-surface tw:bg-surface-2 tw:shadow-card tw:ring-1 tw:ring-line tw:sm:size-40">
                  <Image
                    src={
                      user && user.photo
                        ? user.photo
                        : assetsPath("images/author.jpg")
                    }
                    alt={user?.name ? `Foto profil ${user.name}` : ""}
                    className="tw:object-cover"
                    sizes="160px"
                    fill
                  />
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  {user && user.motto && (
                    <Badge className="tw:mb-3">{user.motto}</Badge>
                  )}
                  <h1 className="tw:m-0 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg tw:sm:text-3xl">
                    Halo,{" "}
                    <span className="tw:text-brand">{user && user.name}</span>
                  </h1>
                  {user && user.bio && (
                    <div className="tw:mt-3 tw:max-w-2xl tw:text-[0.95rem] tw:leading-relaxed tw:text-body tw:[&_p]:mb-2 tw:[&_p]:text-body">
                      {parse(user.bio)}
                    </div>
                  )}
                  <div className="tw:mt-5 tw:flex tw:flex-col tw:items-center tw:gap-4 tw:sm:flex-row tw:md:justify-between">
                    {socialLinks.length > 0 ? (
                      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:justify-center tw:gap-2 tw:p-0">
                        {socialLinks.map((link) => (
                          <li key={link.key}>
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={link.href}
                              aria-label={link.label}
                              className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface-2 tw:font-normal tw:text-body tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:bg-brand-soft tw:hover:text-brand"
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

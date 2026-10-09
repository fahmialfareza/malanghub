import { useEffect, useState, FormEvent } from "react";
import { connect } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import Router, { useRouter } from "next/router";
import {
  Button,
  Container,
  Dropdown,
  Modal,
  Spinner,
  buttonClass,
  controlClass,
  cx,
} from "@malanghub/ui";
import { getNewsCategories } from "../../redux/actions/newsCategoryActions";
import { loadUser, logout } from "../../redux/actions/userActions";
import assetsPath from "./Assets";
import { setTheme } from "../../redux/actions/layoutActions";
import logo from "./logo.png";
import NProgress from "nprogress";
import { RootState } from "../../redux/store";
import {
  LayoutReducerState,
  NewsCategoryReducerState,
  UserReducerState,
} from "../../redux/types";

interface HeaderProps {
  newsCategory: NewsCategoryReducerState;
  user: UserReducerState;
  layout: LayoutReducerState;
  getNewsCategories: () => void;
  loadUser: () => void;
  logout: () => void;
  setTheme: (theme: string) => void;
}

// @ts-ignore
Router.onRouteChangeStart = (url: string) => {
  NProgress.start();
};
// @ts-ignore
Router.onRouteChangeComplete = () => NProgress.done();
// @ts-ignore
Router.onRouteChangeError = () => NProgress.done();

const navLinkClass = (active: boolean) =>
  cx(
    "tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:px-3 tw:py-2 tw:text-[0.95rem] tw:font-semibold tw:no-underline tw:transition-colors",
    active
      ? "tw:bg-brand-soft tw:text-brand"
      : "tw:text-body tw:hover:bg-surface-2 tw:hover:text-fg"
  );

const iconButtonClass =
  "tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-line tw:bg-surface tw:text-body tw:transition-colors tw:hover:bg-surface-2 tw:hover:text-fg tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring";

const Header = ({
  newsCategory: { newsCategories, loading: newsCategoryLoading },
  user: { user, isAuthenticated, loading: userLoading },
  layout: { activeLink, theme },
  getNewsCategories,
  loadUser,
  logout,
  setTheme,
}: HeaderProps) => {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getNewsCategories();

    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (isAuthenticated && token) {
      loadUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    router.events.on("routeChangeStart", closeMenu);
    return () => router.events.off("routeChangeStart", closeMenu);
  }, [router.events]);

  const onLogout = () => {
    if (!router.isReady) return;

    logout();

    router.push("/signin");
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);

    // Navigate to search page
    router.push(`/search/${search}`);
  };

  const isDark = theme === "dark";

  const categoryItems = [
    { key: "all", label: "Semua Berita", href: "/news" },
    ...(newsCategories ?? []).map((category) => ({
      key: category._id,
      label: category.name,
      href: `/newsCategories/${category.slug}`,
    })),
  ];

  const renderLink = ({
    href,
    className,
    children,
  }: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => (
    <Link href={href} className={className}>
      {children}
    </Link>
  );

  const avatar = (
    <Image
      src={user && user.photo ? user.photo : assetsPath("images/author.jpg")}
      className="tw:size-9 tw:rounded-full tw:object-cover tw:ring-2 tw:ring-line"
      alt=""
      width={72}
      height={72}
    />
  );

  const accountArea = userLoading && !user ? (
    <Spinner size="sm" />
  ) : user ? (
    <div className="tw:flex tw:items-center tw:gap-3">
      <Link
        href="/users"
        className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-lg tw:py-1 tw:pr-2 tw:no-underline tw:hover:bg-surface-2"
      >
        {avatar}
        <span className="tw:flex tw:flex-col tw:leading-tight">
          <span className="tw:max-w-36 tw:truncate tw:text-sm tw:font-semibold tw:text-fg">
            {user.name}
          </span>
          <span className="tw:text-xs tw:font-normal tw:text-muted">
            {user?.role?.includes("admin") ? "Admin" : "Pengguna"}
          </span>
        </span>
      </Link>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        Keluar
      </Button>
    </div>
  ) : (
    <div className="tw:flex tw:items-center tw:gap-2">
      <Link
        href="/signup"
        className={buttonClass({ variant: "ghost", size: "sm" })}
      >
        Daftar
      </Link>
      <Link href="/signin" className={buttonClass({ size: "sm" })}>
        Masuk
      </Link>
    </div>
  );

  const themeToggle = (
    <button
      type="button"
      className={iconButtonClass}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
    >
      <span
        aria-hidden
        className={cx("fa", isDark ? "fa-sun-o" : "fa-moon-o")}
      />
    </button>
  );

  const searchButton = (
    <button
      type="button"
      className={iconButtonClass}
      onClick={() => setSearchOpen(true)}
      aria-label="Cari berita"
    >
      <span aria-hidden className="fa fa-search" />
    </button>
  );

  return (
    <header className="tw:sticky tw:top-0 tw:z-[1030] tw:border-b tw:border-line tw:bg-surface/90 tw:backdrop-blur-md">
      <Container className="tw:flex tw:h-16 tw:items-center tw:gap-4">
        <Link href="/" className="tw:flex tw:shrink-0 tw:items-center">
          <Image src={logo} height={34} alt="Malanghub" priority />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="tw:hidden tw:items-center tw:gap-1 tw:lg:flex"
        >
          <Link href="/" className={navLinkClass(activeLink === "home")}>
            Beranda
          </Link>
          {newsCategoryLoading && !newsCategories ? (
            <span className="tw:px-3">
              <Spinner size="sm" />
            </span>
          ) : (
            <Dropdown
              label={
                <>
                  Berita <span aria-hidden className="fa fa-angle-down" />
                </>
              }
              items={categoryItems}
              renderLink={renderLink}
              buttonClassName={cx(
                navLinkClass(activeLink === "news"),
                "tw:border-0 tw:bg-transparent"
              )}
            />
          )}
          <Link href="/ask" className={navLinkClass(activeLink === "ask")}>
            Tanya AI
          </Link>
          <Link
            href="/contact"
            className={navLinkClass(activeLink === "contact")}
          >
            Kontak
          </Link>
        </nav>

        <div className="tw:ml-auto tw:flex tw:items-center tw:gap-2">
          {searchButton}
          {themeToggle}
          <div className="tw:ml-2 tw:hidden tw:lg:block">{accountArea}</div>
          <button
            type="button"
            className={cx(iconButtonClass, "tw:lg:hidden")}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          >
            <span
              aria-hidden
              className={cx("fa", menuOpen ? "fa-times" : "fa-bars")}
            />
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="tw:max-h-[calc(100dvh-4rem)] tw:overflow-y-auto tw:border-t tw:border-line tw:bg-surface tw:lg:hidden"
        >
          <Container className="tw:flex tw:flex-col tw:gap-1 tw:py-4">
            <Link href="/" className={navLinkClass(activeLink === "home")}>
              Beranda
            </Link>
            <p className="tw:mt-3 tw:mb-1 tw:px-3 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted">
              Berita
            </p>
            <div className="tw:grid tw:grid-cols-2 tw:gap-1">
              {categoryItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={navLinkClass(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="tw:my-2 tw:border-t tw:border-line" />
            <Link href="/ask" className={navLinkClass(activeLink === "ask")}>
              Tanya AI
            </Link>
            <Link
              href="/contact"
              className={navLinkClass(activeLink === "contact")}
            >
              Kontak
            </Link>
            <div className="tw:mt-3 tw:border-t tw:border-line tw:pt-4">
              {accountArea}
            </div>
          </Container>
        </div>
      )}

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Cari disini"
      >
        <form className="tw:flex tw:gap-2" onSubmit={onSearch} role="search">
          <label htmlFor="header-search" className="tw:sr-only">
            Cari berita
          </label>
          <input
            id="header-search"
            type="search"
            placeholder="Cari Berita...."
            name="search"
            className={controlClass}
            onChange={(event) => setSearch(event.target.value)}
            value={search}
            required
            autoFocus
          />
          <Button type="submit">
            <span aria-hidden className="fa fa-search" />
            Cari
          </Button>
        </form>
      </Modal>
    </header>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
  user: state.user,
  layout: state.layout,
});

const mapActionToProps = {
  getNewsCategories,
  loadUser,
  logout,
  setTheme,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(Header);

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
  useTheme,
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
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.95rem] font-semibold no-underline transition-colors",
    active
      ? "bg-brand-soft text-brand"
      : "text-body hover:bg-surface-2 hover:text-fg"
  );

const iconButtonClass =
  "flex size-10 items-center justify-center rounded-lg border border-line bg-surface text-body transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

const Header = ({
  newsCategory: { newsCategories, loading: newsCategoryLoading },
  user: { user, isAuthenticated, loading: userLoading },
  layout: { activeLink },
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

  // Read the applied theme from <html data-theme>, which the pre-paint script
  // sets; the Redux value is null until the user toggles.
  const isDark = useTheme().theme === "dark";

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
      className="size-9 rounded-full object-cover ring-2 ring-line"
      alt=""
      width={72}
      height={72}
    />
  );

  const accountArea = userLoading && !user ? (
    <Spinner size="sm" />
  ) : user ? (
    <div className="flex items-center gap-3">
      <Link
        href="/users"
        className="flex items-center gap-2.5 rounded-lg py-1 pr-2 no-underline hover:bg-surface-2"
      >
        {avatar}
        <span className="flex flex-col leading-tight">
          <span className="max-w-36 truncate text-sm font-semibold text-fg">
            {user.name}
          </span>
          <span className="text-xs font-normal text-muted">
            {user?.role?.includes("admin") ? "Admin" : "Pengguna"}
          </span>
        </span>
      </Link>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        Keluar
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
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
    <header className="sticky top-0 z-[1030] border-b border-line bg-surface/90 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src={logo} height={34} alt="Malanghub" priority />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 lg:flex"
        >
          <Link href="/" className={navLinkClass(activeLink === "home")}>
            Beranda
          </Link>
          {newsCategoryLoading && !newsCategories ? (
            <span className="px-3">
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
                "border-0 bg-transparent"
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

        <div className="ml-auto flex items-center gap-2">
          {searchButton}
          {themeToggle}
          <div className="ml-2 hidden lg:block">{accountArea}</div>
          <button
            type="button"
            className={cx(iconButtonClass, "lg:hidden")}
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
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface lg:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            <Link href="/" className={navLinkClass(activeLink === "home")}>
              Beranda
            </Link>
            <p className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Berita
            </p>
            <div className="grid grid-cols-2 gap-1">
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
            <div className="my-2 border-t border-line" />
            <Link href="/ask" className={navLinkClass(activeLink === "ask")}>
              Tanya AI
            </Link>
            <Link
              href="/contact"
              className={navLinkClass(activeLink === "contact")}
            >
              Kontak
            </Link>
            <div className="mt-3 border-t border-line pt-4">
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
        <form className="flex gap-2" onSubmit={onSearch} role="search">
          <label htmlFor="header-search" className="sr-only">
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

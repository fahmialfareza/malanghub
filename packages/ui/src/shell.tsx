import React, { useEffect, useMemo, useState } from "react";
import { useCategories, useCurrentUser } from "@malanghub/core";
import { useAdapters } from "./adapters";
import { useMalanghubRuntime } from "./providers";
import {
  Button,
  Collapse,
  Container,
  Dropdown,
  Input,
  Modal,
  cx,
  useTheme,
} from "./primitives";
import { Avatar } from "./content";

const BRAND_LOGO_SRC = "/logo.png";

const focusRing =
  "tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring";

const navLinkClass = (active: boolean) =>
  cx(
    "tw:inline-flex tw:h-10 tw:items-center tw:gap-1.5 tw:rounded-lg tw:border-0 tw:bg-transparent tw:px-3 tw:text-[0.95rem] tw:font-semibold tw:no-underline tw:transition-colors tw:cursor-pointer",
    focusRing,
    active
      ? "tw:bg-brand-soft tw:text-brand tw:hover:text-brand"
      : "tw:text-body tw:hover:bg-surface-2 tw:hover:text-fg",
  );

const mobileLinkClass = (active: boolean) =>
  cx(navLinkClass(active), "tw:flex tw:w-full tw:justify-between");

const iconButtonClass = cx(
  "tw:inline-flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:border-0 tw:bg-transparent tw:text-lg tw:text-body tw:transition-colors tw:cursor-pointer tw:hover:bg-surface-2 tw:hover:text-fg",
  focusRing,
);

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Aktifkan mode terang" : "Aktifkan mode gelap";

  return (
    <button
      type="button"
      className={iconButtonClass}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      <span
        className={cx("fa", dark ? "fa-sun-o tw:text-warning" : "fa-moon-o")}
        aria-hidden="true"
      />
    </button>
  );
};

const Header = () => {
  const { api, authStorage, authVersion, refreshAuth, signOut, notify } =
    useMalanghubRuntime();
  const adapters = useAdapters();
  const { Link, Image } = adapters;
  const currentPath = adapters.useCurrentPath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hasToken, setHasToken] = useState(false);

  const categories = useCategories(api);
  const currentUser = useCurrentUser(api, hasToken);

  useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
    });
  }, [authStorage, authVersion]);

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href);

  const closeMenus = () => {
    setMenuOpen(false);
  };

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextSearch = search.trim();
    if (!nextSearch) return;
    setSearchOpen(false);
    closeMenus();
    adapters.navigate(`/search/${encodeURIComponent(nextSearch)}`);
  };

  const onLogout = async (event: React.MouseEvent) => {
    event.preventDefault();
    await signOut();
    refreshAuth();
    closeMenus();
    notify("Berhasil keluar", "success");
    adapters.navigate("/signin");
  };

  const user = currentUser.data;
  const newsActive = isActive("/news");
  const categoryLinks = [
    { key: "all", label: "Semua Berita", href: "/news" },
    ...(categories.data ?? []).map((category) => ({
      key: category._id,
      label: category.name,
      href: `/newsCategories/${category.slug}`,
    })),
  ];

  const authLinks = (mobile: boolean) => {
    const linkClass = mobile ? mobileLinkClass : navLinkClass;
    return user ? (
      <a href="/signin" className={linkClass(false)} onClick={onLogout}>
        Keluar
      </a>
    ) : (
      <>
        <Link
          href="/signup"
          className={linkClass(isActive("/signup"))}
          onClick={closeMenus}
        >
          Daftar
        </Link>
        <Link
          href="/signin"
          className={linkClass(isActive("/signin"))}
          onClick={closeMenus}
        >
          Masuk
        </Link>
      </>
    );
  };

  const userBadge = user ? (
    <Link
      href="/users"
      onClick={closeMenus}
      className={cx(
        "tw:flex tw:min-w-0 tw:items-center tw:gap-3 tw:rounded-lg tw:p-1 tw:no-underline tw:transition-colors tw:hover:bg-surface-2",
        focusRing,
      )}
    >
      <Avatar src={user.photo} alt={user.name} className="tw:size-9" />
      <span className="tw:flex tw:min-w-0 tw:flex-col tw:leading-tight">
        <span className="tw:truncate tw:text-sm tw:font-bold tw:text-fg">
          {user.name}
        </span>
        <span className="tw:text-xs tw:font-normal tw:text-muted">
          {user.role?.includes("admin") ? "Admin" : "Pengguna"}
        </span>
      </span>
    </Link>
  ) : null;

  return (
    <header className="malanghub-header tw:sticky tw:top-0 tw:z-[1030] tw:border-b tw:border-line tw:bg-surface/90 tw:shadow-card tw:backdrop-blur-lg">
      <Container className="tw:flex tw:h-16 tw:items-center tw:gap-2">
        <Link
          href="/"
          className={cx(
            "tw:mr-auto tw:flex tw:shrink-0 tw:items-center tw:rounded-lg",
            focusRing,
          )}
          onClick={closeMenus}
        >
          <Image
            src={BRAND_LOGO_SRC}
            height={35}
            alt=""
            className="tw:h-9 tw:w-auto tw:max-w-[52vw] tw:object-contain"
          />
          <span className="tw:sr-only">Malanghub</span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="malanghub-header-nav tw:hidden tw:items-center tw:gap-1 tw:lg:flex"
        >
          <Link href="/" className={navLinkClass(isActive("/"))}>
            Beranda
          </Link>
          <Dropdown
            label={
              <>
                Berita <span className="fa fa-angle-down" aria-hidden="true" />
              </>
            }
            buttonClassName={navLinkClass(newsActive)}
            items={categoryLinks}
            renderLink={({ href, className, children }) => (
              <Link href={href} className={className}>
                {children}
              </Link>
            )}
          />
          <Link href="/contact" className={navLinkClass(isActive("/contact"))}>
            Kontak
          </Link>
          {authLinks(false)}
        </nav>

        <div className="tw:flex tw:items-center tw:gap-1">
          <button
            type="button"
            className={cx(iconButtonClass, "malanghub-header-nav")}
            onClick={() => setSearchOpen(true)}
            aria-label="Cari berita"
            title="Cari berita"
          >
            <span className="fa fa-search" aria-hidden="true" />
          </button>
          <ThemeToggle />
          {userBadge && (
            <div className="malanghub-header-nav tw:ml-2 tw:hidden tw:max-w-52 tw:lg:block">
              {userBadge}
            </div>
          )}
          <button
            type="button"
            className={cx(iconButtonClass, "malanghub-header-nav tw:lg:hidden")}
            aria-controls="malanghub-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span
              className={cx("fa", menuOpen ? "fa-times" : "fa-bars")}
              aria-hidden="true"
            />
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div
          id="malanghub-mobile-menu"
          className="malanghub-header-nav tw:max-h-[calc(100dvh-4rem)] tw:overflow-y-auto tw:border-t tw:border-line tw:bg-surface tw:lg:hidden"
        >
          <Container className="tw:flex tw:flex-col tw:gap-1 tw:py-3">
            {userBadge && (
              <div className="tw:mb-2 tw:border-b tw:border-line tw:pb-3">
                {userBadge}
              </div>
            )}
            <Link
              href="/"
              className={mobileLinkClass(isActive("/"))}
              onClick={closeMenus}
            >
              Beranda
            </Link>
            <Collapse
              title="Berita"
              defaultOpen={newsActive}
              buttonClassName={mobileLinkClass(newsActive)}
              panelClassName="tw:ml-3 tw:flex tw:flex-col tw:gap-0.5 tw:border-l tw:border-line tw:py-1 tw:pl-2"
            >
              {categoryLinks.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={mobileLinkClass(currentPath === item.href)}
                  onClick={closeMenus}
                >
                  {item.label}
                </Link>
              ))}
            </Collapse>
            <Link
              href="/contact"
              className={mobileLinkClass(isActive("/contact"))}
              onClick={closeMenus}
            >
              Kontak
            </Link>
            {authLinks(true)}
          </Container>
        </div>
      )}

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Cari disini"
      >
        <form
          role="search"
          className="tw:flex tw:items-start tw:gap-2"
          onSubmit={onSearch}
        >
          <Input
            type="search"
            name="search"
            aria-label="Cari Berita"
            placeholder="Cari Berita...."
            wrapperClassName="tw:mb-0 tw:flex-1"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
            data-autofocus
            required
          />
          <Button type="submit" className="tw:h-11">
            <span className="fa fa-search" aria-hidden="true" />
            Cari
          </Button>
        </form>
      </Modal>
    </header>
  );
};

const footerLinkClass =
  "tw:font-semibold tw:text-muted tw:no-underline tw:transition-colors tw:hover:text-brand";

const Footer = () => {
  const { Link } = useAdapters();

  return (
    <footer className="tw:mt-12 tw:border-t tw:border-line tw:bg-surface">
      <Container className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-8 tw:text-center tw:text-sm tw:md:flex-row tw:md:justify-between tw:md:text-left">
        <p className="tw:m-0 tw:text-sm tw:leading-6 tw:text-muted">
          © <span>{new Date().getFullYear()}</span> Malanghub. Made with{" "}
          <span className="fa fa-heart tw:text-danger" aria-hidden="true" />
          <span className="tw:sr-only">love</span>, Designed by{" "}
          <a href="https://w3layouts.com" className={footerLinkClass}>
            W3layouts
          </a>
        </p>
        <nav
          aria-label="Tautan footer"
          className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-x-5 tw:gap-y-2"
        >
          <Link href="/terms" className={footerLinkClass}>
            Syarat dan Ketentuan
          </Link>
          <Link href="/privacy" className={footerLinkClass}>
            Kebijakan Privasi
          </Link>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={cx(
              "tw:inline-flex tw:size-9 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface tw:text-base tw:text-body tw:transition-colors tw:cursor-pointer tw:hover:border-brand tw:hover:text-brand",
              focusRing,
            )}
            title="Kembali ke atas"
            aria-label="Kembali ke atas"
          >
            <span className="fa fa-angle-up" aria-hidden="true" />
          </button>
        </nav>
      </Container>
    </footer>
  );
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const description = useMemo(
    () => "Situs yang menyediakan informasi sekitar Malang Raya!",
    []
  );
  const { Meta } = useAdapters();

  return (
    <>
      <Meta title="Malanghub" description={description} />
      <Header />
      {children}
      <Footer />
    </>
  );
};

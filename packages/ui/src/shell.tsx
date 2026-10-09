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
  ThemeIcon,
  cx,
  useTheme,
} from "./primitives";
import { Avatar } from "./content";

const BRAND_LOGO_SRC = "/logo.png";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

const navLinkClass = (active: boolean) =>
  cx(
    "inline-flex h-10 items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 text-[0.95rem] font-semibold no-underline transition-colors cursor-pointer",
    focusRing,
    active
      ? "bg-brand-soft text-brand hover:text-brand"
      : "text-body hover:bg-surface-2 hover:text-fg",
  );

const mobileLinkClass = (active: boolean) =>
  cx(navLinkClass(active), "flex w-full justify-between");

const iconButtonClass = cx(
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-lg text-body transition-colors cursor-pointer hover:bg-surface-2 hover:text-fg",
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
      <ThemeIcon theme={theme} />
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
      key: category.id ?? category._id,
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
        "flex min-w-0 items-center gap-3 rounded-lg p-1 no-underline transition-colors hover:bg-surface-2",
        focusRing,
      )}
    >
      <Avatar src={user.photo} alt={user.name} className="size-9" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-bold text-fg">{user.name}</span>
        <span className="text-xs font-normal text-muted">
          {user.role?.includes("admin") ? "Admin" : "Pengguna"}
        </span>
      </span>
    </Link>
  ) : null;

  return (
    <header className="sticky top-0 native-mobile:pt-[env(safe-area-inset-top)] z-[1030] border-b border-line bg-surface/90 shadow-card backdrop-blur-lg">
      <Container className="flex h-16 items-center gap-2">
        <Link
          href="/"
          className={cx(
            "mr-auto flex shrink-0 items-center rounded-lg",
            focusRing,
          )}
          onClick={closeMenus}
        >
          <Image
            src={BRAND_LOGO_SRC}
            height={35}
            alt=""
            className="h-9 w-auto max-w-[52vw] object-contain"
          />
          <span className="sr-only">Malanghub</span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 lg:flex native-mobile:hidden!"
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
          <Link href="/ask" className={navLinkClass(isActive("/ask"))}>
            Tanya AI
          </Link>
          <Link href="/contact" className={navLinkClass(isActive("/contact"))}>
            Kontak
          </Link>
          {authLinks(false)}
        </nav>

        <div className="flex items-center gap-1">
          {/* The mobile app has no header nav, so Tanya AI gets its own button there. */}
          <span className="hidden native-mobile:contents">
            <Link
              href="/ask"
              className={cx(iconButtonClass, isActive("/ask") && "text-brand")}
              aria-label="Tanya AI"
              aria-current={isActive("/ask") ? "page" : undefined}
            >
              <span className="fa fa-comments" aria-hidden="true" />
            </Link>
          </span>
          <button
            type="button"
            className={cx(iconButtonClass, "native-mobile:hidden!")}
            onClick={() => setSearchOpen(true)}
            aria-label="Cari berita"
            title="Cari berita"
          >
            <span className="fa fa-search" aria-hidden="true" />
          </button>
          <ThemeToggle />
          {userBadge && (
            <div className="ml-2 hidden max-w-52 lg:block native-mobile:hidden!">
              {userBadge}
            </div>
          )}
          <button
            type="button"
            className={cx(iconButtonClass, "lg:hidden native-mobile:hidden!")}
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
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface lg:hidden native-mobile:hidden!"
        >
          <Container className="flex flex-col gap-1 py-3">
            {userBadge && (
              <div className="mb-2 border-b border-line pb-3">{userBadge}</div>
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
              panelClassName="ml-3 flex flex-col gap-0.5 border-l border-line py-1 pl-2"
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
              href="/ask"
              className={mobileLinkClass(isActive("/ask"))}
              onClick={closeMenus}
            >
              Tanya AI
            </Link>
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
          className="flex items-start gap-2"
          onSubmit={onSearch}
        >
          <Input
            type="search"
            name="search"
            aria-label="Cari Berita"
            placeholder="Cari Berita...."
            wrapperClassName="mb-0 flex-1"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
            data-autofocus
            required
          />
          <Button type="submit" className="h-11">
            <span className="fa fa-search" aria-hidden="true" />
            Cari
          </Button>
        </form>
      </Modal>
    </header>
  );
};

const footerLinkClass =
  "font-semibold text-muted no-underline transition-colors hover:text-brand";

const Footer = () => {
  const { Link } = useAdapters();

  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <Container className="flex flex-col items-center gap-4 py-8 text-center text-sm md:flex-row md:justify-between md:text-left">
        <p className="m-0 text-sm leading-6 text-muted">
          © <span>{new Date().getFullYear()}</span> Malanghub. Made with{" "}
          <span className="fa fa-heart text-danger" aria-hidden="true" />
          <span className="sr-only">love</span>, Designed by{" "}
          <a
            href="https://github.com/fahmialfareza"
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClass}
          >
            Fahmi Alfareza
          </a>
        </p>
        <nav
          aria-label="Tautan footer"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
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
              "inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-base text-body transition-colors cursor-pointer hover:border-brand hover:text-brand",
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
    [],
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

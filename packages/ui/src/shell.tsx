import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCategories, useCurrentUser } from "@malanghub/core";
import { useAdapters } from "./adapters";
import { useMalanghubRuntime } from "./providers";

const BRAND_LOGO_SRC = "/logo.png";
const DEFAULT_AVATAR_SRC = "/assets/images/author.jpg";

const Header = () => {
  const { api, authStorage, authVersion, refreshAuth, signOut, notify } =
    useMalanghubRuntime();
  const adapters = useAdapters();
  const { Link, Image } = adapters;
  const currentPath = adapters.useCurrentPath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const categories = useCategories(api);
  const currentUser = useCurrentUser(api, hasToken);

  useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
    });
  }, [authStorage, authVersion]);

  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
    setTheme(storedTheme ?? "light");
  }, []);

  useEffect(() => {
    if (!theme || typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href);

  const closeMenus = () => {
    setMenuOpen(false);
    setCategoryOpen(false);
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
  const guestHeader = (
    <>
      <li className={isActive("/signup") ? "nav-item active" : "nav-item"}>
        <Link href="/signup" className="nav-link" onClick={closeMenus}>
          Daftar
        </Link>
      </li>
      <li className={isActive("/signin") ? "nav-item active" : "nav-item"}>
        <Link href="/signin" className="nav-link" onClick={closeMenus}>
          Masuk
        </Link>
      </li>
    </>
  );

  const logoutLink = (
    <li className="nav-item">
      <a href="/signin" className="nav-link" onClick={onLogout}>
        Keluar
      </a>
    </li>
  );

  const authHeader = user ? (
    <div className="header-author d-flex ml-lg-4 pl-2 mt-lg-0 mt-3">
      <Link href="/users" className="img-circle img-circle-sm" onClick={closeMenus}>
        <Image
          src={user.photo || DEFAULT_AVATAR_SRC}
          className="img-fluid"
          alt={user.name}
          objectFit="cover"
          width={400}
          height={400}
        />
      </Link>
      <div className="align-self ml-3">
        <Link href="/users" onClick={closeMenus}>
          <h5>{user.name}</h5>
        </Link>
        <span>{user.role?.includes("admin") ? "Admin" : "Pengguna"}</span>
      </div>
    </div>
  ) : null;

  return (
    <header className="w3l-header">
      <nav className="navbar navbar-expand-lg navbar-light fill px-lg-0 py-0 px-3">
        <div className="container">
          <Link href="/" className="navbar-brand" onClick={closeMenus}>
            <span aria-hidden>
              <Image src={BRAND_LOGO_SRC} height={35} alt="" />
            </span>
          </Link>
          <button
            className={`navbar-toggler ${menuOpen ? "" : "collapsed"}`}
            type="button"
            aria-controls="navbarSupportedContent"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="fa icon-expand fa-bars" />
            <span className="fa icon-close fa-times" />
          </button>

          <div
            className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}
            id="navbarSupportedContent"
          >
            <ul className="navbar-nav ml-auto">
              <li className={isActive("/") ? "nav-item active" : "nav-item"}>
                <Link href="/" className="nav-link" onClick={closeMenus}>
                  Beranda
                </Link>
              </li>
              <li
                className={
                  isActive("/news")
                    ? "nav-item dropdown active"
                    : "nav-item dropdown"
                }
              >
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  aria-expanded={categoryOpen}
                  onClick={(event) => {
                    event.preventDefault();
                    setCategoryOpen((value) => !value);
                  }}
                >
                  Berita <span className="fa fa-angle-down" />
                </a>
                <div className={`dropdown-menu ${categoryOpen ? "show" : ""}`}>
                  <Link href="/news" className="dropdown-item" onClick={closeMenus}>
                    Semua Berita
                  </Link>
                  {categories.data?.map((category) => (
                    <Link
                      key={category._id}
                      href={`/newsCategories/${category.slug}`}
                      className="dropdown-item"
                      onClick={closeMenus}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </li>
              <li className={isActive("/contact") ? "nav-item active" : "nav-item"}>
                <Link href="/contact" className="nav-link" onClick={closeMenus}>
                  Kontak
                </Link>
              </li>
              {user ? logoutLink : guestHeader}
            </ul>

            <div className="search-right mt-lg-0 mt-2">
              <a
                href="#search"
                title="search"
                onClick={(event) => {
                  event.preventDefault();
                  setSearchOpen(true);
                }}
              >
                <span className="fa fa-search" aria-hidden="true" />
              </a>
              <div
                id="search"
                className={`pop-overlay ${searchOpen ? "open" : ""}`}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    setSearchOpen(false);
                  }
                }}
                style={{
                  display: searchOpen ? "block" : "none",
                  visibility: searchOpen ? "visible" : "hidden",
                  opacity: searchOpen ? 1 : 0,
                }}
              >
                <div className="popup">
                  <h3 className="hny-title two">Cari disini</h3>
                  <form className="search-box" onSubmit={onSearch}>
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Cari Berita...."
                      name="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      required
                    />
                    <button type="submit" className="btn">
                      Cari
                    </button>
                  </form>
                  <a
                    className="close"
                    href="#close"
                    onClick={(event) => {
                      event.preventDefault();
                      setSearchOpen(false);
                    }}
                    aria-label="Close search"
                  >
                    x
                  </a>
                </div>
              </div>
            </div>

            {authHeader}
          </div>

          <div className="mobile-position">
            <nav className="navigation" aria-label="Theme">
              <div className="theme-switch-wrapper">
                <label className="theme-switch" htmlFor="checkbox">
                  <input
                    type="checkbox"
                    id="checkbox"
                    checked={theme === "dark"}
                    onChange={(event) =>
                      setTheme(event.target.checked ? "dark" : "light")
                    }
                  />
                  <div className="mode-container">
                    <i className="gg-sun" />
                    <i className="gg-moon" />
                  </div>
                </label>
              </div>
            </nav>
          </div>
        </div>
      </nav>
    </header>
  );
};

const Footer = () => {
  const { Link } = useAdapters();

  return (
    <footer className="w3l-footer-16">
      <div className="footer-content py-lg-5 py-4 text-center">
        <div className="container">
          <div className="copy-right">
            <h6>
              © <span>{new Date().getFullYear()}</span> Malanghub. Made with{" "}
              <span className="fa fa-heart" aria-hidden="true" />, Designed by{" "}
              <a href="https://w3layouts.com">W3layouts</a>
            </h6>
            <p className="mt-2" style={{ fontSize: "0.85rem" }}>
              <Link href="/terms" style={{ color: "inherit", marginRight: "1rem" }}>
                Syarat dan Ketentuan
              </Link>
              <Link href="/privacy" style={{ color: "inherit" }}>
                Kebijakan Privasi
              </Link>
            </p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            id="movetop"
            title="Go to top"
          >
            <span className="fa fa-angle-up" />
          </button>
        </div>
      </div>
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

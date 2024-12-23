import { useEffect, useState, useRef, MouseEvent, FormEvent } from "react";
import { connect } from "react-redux";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import { getNewsCategories } from "../../redux/actions/newsCategoryActions";
import { loadUser, logout } from "../../redux/actions/userActions";
import assetsPath from "./Assets";
import { setTheme } from "../../redux/actions/layoutActions";
import Spinner from "./Spinner";
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
  const themeSwitcher = useRef<HTMLInputElement>(null);

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

  const onLogout = (
    event: MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>
  ) => {
    event.preventDefault();
    if (!router.isReady) return;

    logout();

    router.push("/signin");
  };

  const onClickSearch = (
    event: MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>
  ) => {
    event.preventDefault();

    // @ts-ignore
    window.$(".pop-overlay").show();
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    if (!router.isReady) return;
    event.preventDefault();

    // @ts-ignore
    window.$(".pop-overlay").hide();
    // router.push("#close");

    router.push(`/search/${search}`);
  };

  const guestHeader = (
    <>
      <li className={activeLink === "signup" ? "nav-item active" : "nav-item"}>
        <Link href="/signup" className="nav-link">
          Daftar
        </Link>
      </li>
      <li className={activeLink === "signin" ? "nav-item active" : "nav-item"}>
        <Link href="/signin" className="nav-link">
          Masuk
        </Link>
      </li>
    </>
  );

  const authHeader = (
    <div className="header-author d-flex ml-lg-4 pl-2 mt-lg-0 mt-3">
      <Link href="/users" className="img-circle img-circle-sm">
        <img
          src={
            user && user.photo ? user.photo : assetsPath("images/author.jpg")
          }
          className="img-fluid"
          alt="..."
        />
      </Link>
      <div className="align-self ml-3">
        <Link href="/users" legacyBehavior>
          <h5>{user && user.name}</h5>
        </Link>
        <span>
          {user && user?.role && user?.role?.includes("admin")
            ? "Admin"
            : "Pengguna"}
        </span>
      </div>
    </div>
  );

  const logoutLink = (
    <li className="nav-item">
      <a className="nav-link" onClick={onLogout}>
        Keluar
      </a>
    </li>
  );

  return (
    <header className="w3l-header">
      <nav className="navbar navbar-expand-lg navbar-light fill px-lg-0 py-0 px-3">
        <div className="container">
          <Link href="/" className="navbar-brand">
            <span aria-hidden>
              <img src={logo} height="35" alt="" />
            </span>
          </Link>
          <button
            className="navbar-toggler collapsed"
            type="button"
            data-toggle="collapse"
            data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="fa icon-expand fa-bars"></span>
            <span className="fa icon-close fa-times"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ml-auto">
              <li
                className={
                  activeLink === "home" ? "nav-item active" : "nav-item"
                }
              >
                <Link href="/" className="nav-link">
                  Beranda
                </Link>
              </li>
              <li
                className={
                  activeLink === "news"
                    ? "nav-item dropdown @@category__active active"
                    : "nav-item nav-item dropdown @@category__active"
                }
              >
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Berita <span className="fa fa-angle-down"></span>
                </a>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <Link href="/news" className="dropdown-item @@ls__active">
                    Semua Berita
                  </Link>
                  {newsCategoryLoading && !newsCategories ? (
                    <Spinner />
                  ) : (
                    !newsCategoryLoading &&
                    newsCategories !== null &&
                    newsCategories.length > 0 &&
                    newsCategories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/newsCategories/${category.slug}`}
                        className="dropdown-item @@ls__active"
                      >
                        {category.name}
                      </Link>
                    ))
                  )}
                </div>
              </li>
              <li
                className={
                  activeLink === "contact"
                    ? "nav-item @@contact__active active"
                    : "nav-item @@contact__active"
                }
              >
                <Link href="/contact" className="nav-link">
                  Kontak
                </Link>
              </li>
              {!user && guestHeader}
              {userLoading ? <Spinner /> : !userLoading && user && logoutLink}
            </ul>

            <div className="search-right mt-lg-0 mt-2">
              <a href="#search" title="search" onClick={onClickSearch}>
                <span className="fa fa-search" aria-hidden="true"></span>
              </a>
              <div id="search" className="pop-overlay">
                <div className="popup">
                  <h3 className="hny-title two">Cari disini</h3>
                  <form className="search-box" onSubmit={(event) => {}}>
                    <input
                      type="search"
                      placeholder="Cari Berita...."
                      name="search"
                      onChange={(event) => setSearch(event.target.value)}
                      value={search}
                      required
                      autoFocus={true}
                    />
                    <button type="submit" className="btn">
                      Cari
                    </button>
                  </form>
                  <a className="close" href="#close">
                    ×
                  </a>
                </div>
              </div>
            </div>

            {userLoading && !user ? (
              <Spinner />
            ) : (
              !userLoading && user && authHeader
            )}
          </div>

          <div className="mobile-position">
            <nav className="navigation">
              <div className="theme-switch-wrapper">
                <label className="theme-switch" htmlFor="checkbox">
                  <input
                    type="checkbox"
                    id="checkbox"
                    ref={themeSwitcher}
                    checked={theme === "dark"}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTheme("dark");
                      } else {
                        setTheme("light");
                      }
                    }}
                  />
                  <div className="mode-container">
                    <i className="gg-sun"></i>
                    <i className="gg-moon"></i>
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

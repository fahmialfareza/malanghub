import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@malanghub/ui";
import { downloadLinks } from "../../utils/downloadLinks";

const headingClass =
  "tw:m-0 tw:mb-4 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-muted";

const linkClass =
  "tw:text-sm tw:font-normal tw:text-body tw:no-underline tw:transition-colors tw:hover:text-brand";

const exploreLinks = [
  { href: "/", label: "Beranda" },
  { href: "/news", label: "Semua Berita" },
  { href: "/ask", label: "Tanya Malanghub AI" },
  { href: "/contact", label: "Kontak" },
];

const legalLinks = [
  { href: "/terms", label: "Syarat dan Ketentuan" },
  { href: "/privacy", label: "Kebijakan Privasi" },
];

const Footer = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(
        document.body.scrollTop > 20 || document.documentElement.scrollTop > 20,
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  return (
    <footer className="tw:mt-auto tw:border-t tw:border-line tw:bg-surface tw:text-body">
      <Container className="tw:py-12 tw:lg:py-16">
        <div className="tw:grid tw:gap-10 tw:sm:grid-cols-2 tw:lg:grid-cols-12">
          <div className="tw:sm:col-span-2 tw:lg:col-span-4">
            <Link
              href="/"
              className="tw:font-heading tw:text-2xl tw:font-bold tw:text-fg tw:no-underline tw:hover:text-brand"
            >
              Malanghub
            </Link>
            <p className="tw:m-0 tw:mt-3 tw:max-w-sm tw:text-sm tw:leading-relaxed tw:text-muted">
              Situs berita dan informasi terkini seputar Malang Raya
            </p>
          </div>

          <nav aria-label="Jelajahi" className="tw:lg:col-span-2">
            <h2 className={headingClass}>Jelajahi</h2>
            <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:p-0">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="tw:lg:col-span-2">
            <h2 className={headingClass}>Legal</h2>
            <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:p-0">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="tw:sm:col-span-2 tw:lg:col-span-4">
            <h2 className={headingClass}>Download Sekarang</h2>
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              {downloadLinks
                .filter((l) => l.href)
                .map((l) => (
                  <a
                    key={l.platform}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-line tw:bg-surface-2 tw:px-3 tw:py-2 tw:text-sm tw:font-semibold tw:text-fg tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:text-brand tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring"
                  >
                    <span className={`fa ${l.icon}`} aria-hidden="true" />
                    {l.platform}
                  </a>
                ))}
            </div>
          </div>
        </div>

        <div className="tw:mt-12 tw:flex tw:flex-col tw:gap-2 tw:border-t tw:border-line tw:pt-6 tw:text-sm tw:text-muted tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
          <p className="tw:m-0 tw:text-sm tw:text-muted">
            © <span>{new Date().getFullYear()}</span> Malanghub . Made with{" "}
            <span
              className="fa fa-heart tw:text-danger"
              aria-hidden="true"
            ></span>
            , Designed by{" "}
            <a
              href="https://w3layouts.com"
              className="tw:font-semibold tw:text-body tw:no-underline tw:hover:text-brand"
            >
              W3layouts
            </a>
          </p>
        </div>
      </Container>

      <button
        type="button"
        onClick={topFunction}
        title="Go to top"
        aria-label="Kembali ke atas"
        className={`tw:fixed tw:right-4 tw:bottom-5 tw:z-50 tw:size-11 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border-0 tw:bg-brand tw:text-brand-fg tw:shadow-pop tw:transition-colors tw:hover:bg-brand-hover tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring ${
          showTop ? "tw:inline-flex" : "tw:hidden"
        }`}
      >
        <span className="fa fa-angle-up tw:text-2xl" aria-hidden="true"></span>
      </button>
    </footer>
  );
};

export default Footer;

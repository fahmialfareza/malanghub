import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@malanghub/ui";
import { downloadLinks } from "../../utils/downloadLinks";

const headingClass =
  "m-0 mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted";

const linkClass =
  "text-sm font-normal text-body no-underline transition-colors hover:text-brand";

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
    <footer className="mt-auto border-t border-line bg-surface text-body">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="font-heading text-2xl font-bold text-fg no-underline hover:text-brand"
            >
              Malanghub
            </Link>
            <p className="m-0 mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Situs berita dan informasi terkini seputar Malang Raya
            </p>
          </div>

          <nav aria-label="Jelajahi" className="lg:col-span-2">
            <h2 className={headingClass}>Jelajahi</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="lg:col-span-2">
            <h2 className={headingClass}>Legal</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className={headingClass}>Download Sekarang</h2>
            <div className="flex flex-wrap gap-2">
              {downloadLinks
                .filter((l) => l.href)
                .map((l) => (
                  <a
                    key={l.platform}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-fg no-underline transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                  >
                    <span className={`fa ${l.icon}`} aria-hidden="true" />
                    {l.platform}
                  </a>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-sm text-muted">
            © <span>{new Date().getFullYear()}</span> Malanghub . Made with{" "}
            <span
              className="fa fa-heart text-danger"
              aria-hidden="true"
            ></span>
            , Designed by{" "}
            <a
              href="https://w3layouts.com"
              className="font-semibold text-body no-underline hover:text-brand"
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
        className={`fixed right-4 bottom-5 z-50 size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-brand text-brand-fg shadow-pop transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
          showTop ? "inline-flex" : "hidden"
        }`}
      >
        <span className="fa fa-angle-up text-2xl" aria-hidden="true"></span>
      </button>
    </footer>
  );
};

export default Footer;

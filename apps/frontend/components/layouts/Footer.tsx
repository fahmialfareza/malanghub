import React, { useEffect } from "react";
import Link from "next/link";
import assetsPath from "./Assets";
import { downloadLinks } from "../../utils/downloadLinks";

const Footer = () => {
  useEffect(() => {
    const script = document.createElement("script");

    script.src = assetsPath("js/footer.js");
    script.async = true;

    document.body.appendChild(script);
  }, []);

  const topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  return (
    <footer className="w3l-footer-16">
      <div className="footer-content py-lg-5 py-4 text-center">
        <div className="container">
          <div className="mb-4">
            <p className="mb-2" style={{ fontSize: "0.8rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Download Sekarang
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem" }}>
              {downloadLinks.filter((l) => l.href).map((l) => (
                <a
                  key={l.platform}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.35rem 0.8rem",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: "6px",
                    color: "inherit",
                    fontSize: "0.8rem",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}
                >
                  <span className={`fa ${l.icon}`} aria-hidden="true" />
                  {l.platform}
                </a>
              ))}
            </div>
          </div>
          <div className="copy-right">
            <h6>
              © <span>{new Date().getFullYear()}</span> Malanghub . Made with{" "}
              <span className="fa fa-heart" aria-hidden="true"></span>, Designed
              by
              <a href="https://w3layouts.com">W3layouts</a>{" "}
            </h6>
            <p className="mt-2" style={{ fontSize: "0.85rem" }}>
              <Link href="/terms" style={{ color: "inherit", marginRight: "1rem" }}>
                Syarat dan Ketentuan
              </Link>
              <Link
                href="/privacy"
                style={{ color: "inherit" }}
              >
                Kebijakan Privasi
              </Link>
            </p>
          </div>
          {/* <ul className="author-icons mt-4">
            <li>
              <a className="facebook" href="#url">
                <span className="fa fa-facebook" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="twitter" href="#url">
                <span className="fa fa-twitter" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="google" href="#url">
                <span className="fa fa-google-plus" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="linkedin" href="#url">
                <span className="fa fa-linkedin" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="github" href="#url">
                <span className="fa fa-github" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="dribbble" href="#url">
                <span className="fa fa-dribbble" aria-hidden="true"></span>
              </a>
            </li>
          </ul> */}
          <button onClick={topFunction} id="movetop" title="Go to top">
            <span className="fa fa-angle-up"></span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

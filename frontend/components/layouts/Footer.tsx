import React, { useEffect } from "react";
import assetsPath from "./Assets";

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
          <div className="copy-right">
            <h6>
              © <span>{new Date().getFullYear()}</span> Malanghub . Made with{" "}
              <span className="fa fa-heart" aria-hidden="true"></span>, Designed
              by
              <a href="https://w3layouts.com">W3layouts</a>{" "}
            </h6>
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

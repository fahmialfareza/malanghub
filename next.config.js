const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const withSass = require("@zeit/next-sass");
const withImages = require("next-images");
const withLess = require("@zeit/next-less");
const withCSS = require("@zeit/next-css");

module.exports = withPWA(
  withCSS(
    withLess(
      withImages(
        withSass({
          pwa: {
            dest: "public",
            runtimeCaching,
            register: true,
            sw: "/sw.js",
          },
        })
      )
    )
  )
);

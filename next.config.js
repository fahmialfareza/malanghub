const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const withSass = require("@zeit/next-sass");
const withImages = require("next-images");
const withLess = require("@zeit/next-less");
const withCSS = require("@zeit/next-css");
const prod = process.env.NODE_ENV === "production";

module.exports = withPWA(
  withCSS(
    withLess(
      withImages(
        withSass({
          pwa: {
            disable: prod ? false : true,
            dest: "public",
            runtimeCaching,
          },
        })
      )
    )
  )
);

const runtimeCaching = require("next-pwa/cache");
const withImages = require("next-images");

const withPWA = require("next-pwa")({
  dest: "public",
  runtimeCaching,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA(
  withImages({
    images: {
      disableStaticImages: true,
    },
    compress: true,
  })
);

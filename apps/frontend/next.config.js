const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === "development",
});
const { withSentryConfig } = require("@sentry/nextjs");

// Static export served as plain files by Cloudflare Pages (no Worker).
// Headers and rewrites live in public/_headers and public/_redirects; the
// apex → www redirect is a Cloudflare Redirect Rule; sitemap, feed and
// llms.txt are written by scripts/generate-seo-files.mts.
const baseConfig = {
  output: "export",
  transpilePackages: ["@malanghub/core", "@malanghub/ui"],
  images: {
    // Static export has no image optimizer; Cloudinary resizes instead.
    // remotePatterns is not enforced with a custom loader but documents allowed hosts.
    loader: "custom",
    loaderFile: "./utils/imageLoader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  compress: true,
};

const sentryWrappedConfig = withSentryConfig(baseConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  sourcemaps: {
    disable: false,
  },
});

module.exports = withPWA(sentryWrappedConfig);

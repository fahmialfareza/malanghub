const withImages = require("next-images");
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === "development",
});
const { withSentryConfig } = require("@sentry/nextjs");

const baseConfig = withImages({
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
      {
        source: "/news-sitemap.xml",
        destination: "/api/news-sitemap",
      },
      {
        source: "/feed.xml",
        destination: "/api/feed",
      },
      {
        source: "/:key([0-9a-f]{32,}).txt",
        destination: "/api/indexnow-key",
      },
    ];
  },
  images: {
    disableStaticImages: true,
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
});

const sentryWrappedConfig = withSentryConfig(baseConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  sourcemaps: {
    disable: false,
  },
});

module.exports = withPWA(sentryWrappedConfig);

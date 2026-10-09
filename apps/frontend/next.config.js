const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === "development",
});
const { withSentryConfig } = require("@sentry/nextjs");
const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");

// Exposes Cloudflare bindings (getCloudflareContext) during `next dev`.
initOpenNextCloudflareForDev();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const baseConfig = {
  transpilePackages: ["@malanghub/core", "@malanghub/ui"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "malanghub.com" }],
        destination: "https://www.malanghub.com/:path*",
        permanent: true,
      },
    ];
  },
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
    // Cloudflare Workers has no built-in image optimizer; Cloudinary resizes instead.
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
  tunnelRoute: "/monitoring",
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  sourcemaps: {
    disable: false,
  },
});

module.exports = withPWA(sentryWrappedConfig);

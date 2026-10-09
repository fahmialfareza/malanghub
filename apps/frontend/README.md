This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Cloudflare Workers

The frontend runs on Cloudflare Workers through [OpenNext](https://opennext.js.org/cloudflare) (`wrangler.jsonc`, `open-next.config.ts`). Production deploys run from Cloudflare Workers Builds on push to `main`; other branches get preview URLs.

```bash
pnpm preview     # build with OpenNext and serve in the local Workers runtime (http://localhost:8787)
pnpm run deploy  # build and deploy to Cloudflare (needs `wrangler login`)
pnpm upload      # build and upload a new version without promoting it
```

Notes:

- Copy `.dev.vars.example` to `.dev.vars` for local Workers previews.
- `NEXT_PUBLIC_*`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` must be set as **build** variables (they are inlined/used at build time). `API_ADDRESS`, `INDEXNOW_KEY` and `SENTRY_DSN` are **runtime** variables/secrets on the Worker.
- `API_ADDRESS` must be a public hostname (`global_fetch_strictly_public` blocks private addresses), so local previews against `localhost` will not load data.
- `next/image` uses `utils/imageLoader.ts`: Cloudinary images are resized by Cloudinary, everything else is served as-is.
- Don't use `export const runtime = "edge"`; OpenNext runs everything on the Node.js-compatible runtime.
- `patches/@opennextjs__cloudflare@*.patch` works around Next.js 16.4's `preview-props.json` ([opennextjs-cloudflare#1355](https://github.com/opennextjs/opennextjs-cloudflare/issues/1355)); drop it once an upstream release includes the fix.

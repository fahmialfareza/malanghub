// Custom Worker entry: wraps the OpenNext handler with an edge cache for
// article pages. Cloudflare does not cache Worker responses on its own, so
// pages that opt in with `Cache-Control: s-maxage` are stored in the Cache
// API of the serving data center.
//
// Excluded from tsconfig: `.open-next/worker.js` only exists after
// `opennextjs-cloudflare build`, and wrangler bundles this file itself.
// @ts-ignore generated at build time
import handler from "./.open-next/worker.js";

interface Env {
  CF_VERSION_METADATA?: { id: string };
  [key: string]: unknown;
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

// Pages has no version_metadata binding, so the Pages build
// (scripts/build-pages.mjs) injects the Next.js build id here instead.
declare const __PAGES_BUILD_ID__: string | undefined;
const pagesBuildId =
  typeof __PAGES_BUILD_ID__ === "string" ? __PAGES_BUILD_ID__ : undefined;

// Article HTML and the JSON Next.js fetches for client-side navigation.
const CACHEABLE_PATHS = [
  /^\/news\/[^/]+\/?$/,
  /^\/_next\/data\/[^/]+\/news\/[^/]+\.json$/,
];

const isCacheable = (request: Request, url: URL) =>
  request.method === "GET" &&
  CACHEABLE_PATHS.some((pattern) => pattern.test(url.pathname));

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (!isCacheable(request, url)) {
      return handler.fetch(request, env, ctx);
    }

    // The deployment id is part of the key, so a new deploy never serves
    // HTML that points at the previous build's (deleted) JS chunks.
    const version = env.CF_VERSION_METADATA?.id ?? pagesBuildId ?? "dev";
    const keyUrl = new URL(url.toString());
    keyUrl.searchParams.set("__v", version);
    const cacheKey = new Request(keyUrl.toString(), { method: "GET" });
    const cache = (caches as unknown as { default: Cache }).default;

    const cached = await cache.match(cacheKey);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set("x-edge-cache", "HIT");
      return hit;
    }

    const response: Response = await handler.fetch(request, env, ctx);

    // Only store what the page explicitly marked as shared-cacheable.
    const cacheControl = response.headers.get("cache-control") ?? "";
    if (
      response.status === 200 &&
      /s-maxage=\d+/.test(cacheControl) &&
      !response.headers.has("set-cookie")
    ) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      const miss = new Response(response.body, response);
      miss.headers.set("x-edge-cache", "MISS");
      return miss;
    }

    return response;
  },
};

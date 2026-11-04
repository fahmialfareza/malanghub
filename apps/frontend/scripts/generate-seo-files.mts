// Writes the crawler-facing files into the static export (`out/`) after
// `next build`. Any API failure exits non-zero so the deploy is skipped and
// the previous build stays live.
//
// Usage: node scripts/generate-seo-files.mts
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  buildFeed,
  buildLlms,
  buildNewsSitemap,
  buildSitemap,
} from "../utils/seoFiles.ts";

const frontendDir = resolve(import.meta.dirname, "..");
const outDir = join(frontendDir, "out");

// `next build` reads .env files itself; this script has to do it by hand.
for (const file of [".env.production.local", ".env.production"]) {
  const path = join(frontendDir, file);
  if (existsSync(path)) process.loadEnvFile(path);
}

if (!process.env.API_ADDRESS) throw new Error("API_ADDRESS is not set");
if (!existsSync(outDir)) {
  throw new Error(`${outDir} is missing; run next build first.`);
}

const [sitemap, newsSitemap, feed, llms] = await Promise.all([
  buildSitemap(),
  buildNewsSitemap(),
  buildFeed(),
  buildLlms(),
]);

const files: Record<string, string> = {
  "sitemap.xml": sitemap,
  "news-sitemap.xml": newsSitemap,
  "feed.xml": feed,
  "llms.txt": llms,
};

// IndexNow verifies ownership by fetching /{key}.txt.
const indexNowKey = process.env.NEXT_PUBLIC_INDEXNOW_KEY;
if (indexNowKey) files[`${indexNowKey}.txt`] = indexNowKey;

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(outDir, name), content);
  console.log(`wrote out/${name} (${content.length} bytes)`);
}

// Pings IndexNow for the URLs that changed in this deploy, after the new
// pages are live. Changes come from diffing the freshly built out/sitemap.xml
// against the sitemap that was live before the deploy (new, updated or
// removed URLs).
//
// Usage: node scripts/submit-indexnow.mts <previous-sitemap.xml>
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SITE_HOST = "www.malanghub.com";
// IndexNow accepts at most 10,000 URLs per request.
const MAX_URLS = 10_000;

const frontendDir = resolve(import.meta.dirname, "..");
const previousPath = process.argv[2];
const key = process.env.NEXT_PUBLIC_INDEXNOW_KEY;

/** `<loc>` → `<lastmod>` (or "") for every URL in a sitemap. */
function readSitemap(path: string): Map<string, string> {
  const entries = new Map<string, string>();
  const xml = readFileSync(path, "utf8");
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
    if (!loc) continue;
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1] ?? "";
    entries.set(decodeXml(loc), lastmod);
  }
  return entries;
}

function decodeXml(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

if (!key) {
  console.log("NEXT_PUBLIC_INDEXNOW_KEY is not set; skipping IndexNow.");
  process.exit(0);
}
// Without the previous sitemap every URL would look new; skip rather than
// resubmit the whole site.
if (!previousPath || !existsSync(previousPath)) {
  console.log("No previous sitemap; skipping IndexNow.");
  process.exit(0);
}

const previous = readSitemap(previousPath);
const current = readSitemap(join(frontendDir, "out", "sitemap.xml"));

const changed = new Set<string>();
for (const [loc, lastmod] of current) {
  if (previous.get(loc) !== lastmod) changed.add(loc);
}
for (const loc of previous.keys()) {
  if (!current.has(loc)) changed.add(loc);
}

const urlList = Array.from(changed).slice(0, MAX_URLS);
if (urlList.length === 0) {
  console.log("No changed URLs; skipping IndexNow.");
  process.exit(0);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: SITE_HOST,
    key,
    keyLocation: `https://${SITE_HOST}/${key}.txt`,
    urlList,
  }),
});

console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URL(s)`);
for (const url of urlList) console.log(`  ${url}`);
// A failed ping must not fail the deploy that already went out.
if (!res.ok) console.log(await res.text());

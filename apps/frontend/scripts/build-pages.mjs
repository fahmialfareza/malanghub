// Packages the OpenNext build for Cloudflare Pages (advanced mode).
//
// Output (cloudflare-pages/dist):
//   - every static asset from .open-next/assets
//   - _worker.js/index.js: worker.ts + the OpenNext server, bundled by
//     wrangler. A directory, so it can be uploaded as-is (no_bundle) with
//     its node: imports intact
//   - _routes.json: sends static assets straight to the CDN so they never
//     invoke (or count against) Pages Functions
//
// Usage: node scripts/build-pages.mjs [--skip-build]
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const frontendDir = resolve(import.meta.dirname, "..");
const assetsDir = resolve(frontendDir, ".open-next/assets");
const outDir = resolve(frontendDir, "cloudflare-pages/dist");

// Pages allows 100 include + exclude rules in _routes.json.
const MAX_ROUTE_RULES = 100;

function run(command, args) {
  execFileSync(command, args, { cwd: frontendDir, stdio: "inherit" });
}

if (!process.argv.includes("--skip-build")) {
  run("npx", ["opennextjs-cloudflare", "build"]);
}

if (!existsSync(assetsDir)) {
  throw new Error(
    `${assetsDir} is missing; run opennextjs-cloudflare build first.`,
  );
}

// The Next.js build id changes on every build, so it keys worker.ts's edge
// cache per deploy just like CF_VERSION_METADATA does on Workers.
const buildId = readFileSync(join(assetsDir, "BUILD_ID"), "utf8").trim();

const bundleDir = mkdtempSync(join(tmpdir(), "malanghub-pages-"));
try {
  run("npx", [
    "wrangler",
    "deploy",
    "--dry-run",
    "--outdir",
    bundleDir,
    "--define",
    `__PAGES_BUILD_ID__:${JSON.stringify(buildId)}`,
  ]);

  rmSync(outDir, { recursive: true, force: true });
  cpSync(assetsDir, outDir, { recursive: true });
  cpSync(join(bundleDir, "worker.js"), join(outDir, "_worker.js/index.js"));
} finally {
  rmSync(bundleDir, { recursive: true, force: true });
}

// On Workers, matching static files are served before the worker runs. Pages
// advanced mode sends everything to _worker.js unless _routes.json excludes it,
// and the Next.js handler cannot serve those files itself.
const exclude = readdirSync(assetsDir)
  .filter((name) => !name.startsWith("_") || name === "_next")
  .map((name) => {
    if (name === "_next") return "/_next/static/*"; // /_next/data/* is SSR
    return statSync(join(assetsDir, name)).isDirectory()
      ? `/${name}/*`
      : `/${name}`;
  })
  .sort();

if (exclude.length + 1 > MAX_ROUTE_RULES) {
  throw new Error(
    `_routes.json would have ${exclude.length + 1} rules (max ${MAX_ROUTE_RULES}); ` +
      "move top-level files in public/ into a folder.",
  );
}

writeFileSync(
  join(outDir, "_routes.json"),
  `${JSON.stringify({ version: 1, include: ["/*"], exclude }, null, 2)}\n`,
);

console.log(
  `Pages build ready in ${outDir} (build ${buildId}, ${exclude.length} static routes).`,
);

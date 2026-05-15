import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const buildNumber = process.argv[2];

if (!/^[1-9]\d*$/.test(buildNumber ?? "")) {
  throw new Error("Build number must be a positive integer, for example 100.");
}

const build = parseInt(buildNumber, 10);
const major = Math.floor(build / 100);
const minor = Math.floor((build % 100) / 10);
const patch = build % 10;
const releaseVersion = `${major}.${minor}.${patch}`;

const repoRoot = resolve(import.meta.dirname, "../../..");
const nativeDir = resolve(repoRoot, "apps/native");
const tauriConfigPath = resolve(nativeDir, "src-tauri/tauri.conf.json");
const nativePackagePath = resolve(nativeDir, "package.json");
const cargoTomlPath = resolve(nativeDir, "src-tauri/Cargo.toml");
const snapcraftPath = resolve(repoRoot, "snap/snapcraft.yaml");

function updateJson(path, updater) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  updater(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

updateJson(nativePackagePath, (pkg) => {
  pkg.version = releaseVersion;
});

updateJson(tauriConfigPath, (config) => {
  config.version = releaseVersion;
  config.bundle ??= {};
  config.bundle.android ??= {};
  config.bundle.android.versionCode = Number(buildNumber);
  config.bundle.iOS ??= {};
  config.bundle.iOS.bundleVersion = buildNumber;
  config.bundle.macOS ??= {};
  config.bundle.macOS.bundleVersion = buildNumber;
});

const cargoToml = readFileSync(cargoTomlPath, "utf8").replace(
  /^version = ".*"$/m,
  `version = "${releaseVersion}"`,
);
writeFileSync(cargoTomlPath, cargoToml);

const snapcraftYaml = readFileSync(snapcraftPath, "utf8").replace(
  /^version: .*/m,
  `version: "${releaseVersion}"`,
);
writeFileSync(snapcraftPath, snapcraftYaml);

if (process.env.GITHUB_ENV) {
  appendFileSync(process.env.GITHUB_ENV, `RELEASE_VERSION=${releaseVersion}\n`);
}

console.log(`Prepared native release ${releaseVersion} (${buildNumber}).`);

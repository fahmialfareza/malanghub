import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const appDir = resolve(import.meta.dirname, "..");
const srcTauriDir = resolve(appDir, "src-tauri");
const storeIdentifier =
  process.env.MALANGHUB_STORE_IDENTIFIER || "com.malanghub.native";
const tauriMobileIdentifier =
  process.env.MALANGHUB_TAURI_MOBILE_IDENTIFIER || "com.malanghub.mobile";
const knownIdentifierPattern = /com\.malanghub\.(?:app|mobile|native)/g;

const command = process.argv[2] || "patch";
const platform = process.argv[3] || "all";

function identifierToPath(identifier) {
  return identifier.split(".");
}

function updateFile(path, updater) {
  if (!existsSync(path)) {
    return false;
  }

  const before = readFileSync(path, "utf8");
  const after = updater(before);

  if (after !== before) {
    writeFileSync(path, after);
  }

  return true;
}

function walkFiles(path, files = []) {
  if (!existsSync(path)) {
    return files;
  }

  for (const entry of readdirSync(path)) {
    const child = join(path, entry);
    const stat = statSync(child);

    if (stat.isDirectory()) {
      walkFiles(child, files);
    } else {
      files.push(child);
    }
  }

  return files;
}

function findMainActivityDir(javaRoot) {
  const mainActivity = walkFiles(javaRoot).find((file) =>
    file.endsWith("MainActivity.kt"),
  );

  return mainActivity ? dirname(mainActivity) : "";
}

function ensureAndroidSafePackageDir() {
  const javaRoot = resolve(
    srcTauriDir,
    "gen/android/app/src/main/java",
  );
  const safeDir = resolve(javaRoot, ...identifierToPath(tauriMobileIdentifier));

  if (existsSync(safeDir)) {
    return safeDir;
  }

  const sourceDir = findMainActivityDir(javaRoot);

  if (!sourceDir) {
    throw new Error(
      "Android project is missing MainActivity.kt. Run mobile:init android first.",
    );
  }

  mkdirSync(dirname(safeDir), { recursive: true });
  cpSync(sourceDir, safeDir, { recursive: true });

  return safeDir;
}

function removeStaleAndroidPackageDirs() {
  const packageRoot = resolve(
    srcTauriDir,
    "gen/android/app/src/main/java",
    ...identifierToPath(tauriMobileIdentifier).slice(0, -1),
  );
  const safeLeaf = identifierToPath(tauriMobileIdentifier).at(-1);

  if (!existsSync(packageRoot) || !safeLeaf) {
    return;
  }

  for (const entry of readdirSync(packageRoot)) {
    const child = join(packageRoot, entry);

    if (entry !== safeLeaf && statSync(child).isDirectory()) {
      rmSync(child, { recursive: true, force: true });
    }
  }
}

function patchAndroid() {
  const androidRoot = resolve(srcTauriDir, "gen/android");

  if (!existsSync(androidRoot)) {
    throw new Error("Android project is not initialized.");
  }

  const safeDir = ensureAndroidSafePackageDir();

  for (const file of walkFiles(safeDir).filter((path) => path.endsWith(".kt"))) {
    updateFile(file, (source) =>
      source.replace(
        /^package com\.malanghub\.(?:app|mobile|native)$/gm,
        `package ${tauriMobileIdentifier}`,
      ),
    );
  }

  updateFile(resolve(androidRoot, "app/build.gradle.kts"), (source) =>
    source
      .replace(
        /namespace = "com\.malanghub\.(?:app|mobile|native)"/,
        `namespace = "${tauriMobileIdentifier}"`,
      )
      .replace(
        /applicationId = "com\.malanghub\.(?:app|mobile|native)"/,
        `applicationId = "${storeIdentifier}"`,
      ),
  );

  updateFile(
    resolve(androidRoot, "app/src/main/AndroidManifest.xml"),
    (source) => {
      let result = source.replace(
        /android:scheme="com\.malanghub\.(?:app|mobile|native)"/g,
        `android:scheme="${storeIdentifier}"`,
      );

      // Inject camera permissions required for <input type="file"> camera access.
      const cameraEntries = [
        '    <uses-permission android:name="android.permission.CAMERA" />',
        '    <uses-feature android:name="android.hardware.camera" android:required="false" />',
        '    <uses-feature android:name="android.hardware.camera.front" android:required="false" />',
      ];
      for (const entry of cameraEntries) {
        const nameMatch = entry.match(/android:name="([^"]+)"/);
        if (nameMatch && !result.includes(nameMatch[1])) {
          result = result.replace(
            '    <uses-permission android:name="android.permission.INTERNET" />',
            `    <uses-permission android:name="android.permission.INTERNET" />\n${entry}`,
          );
        }
      }

      return result;
    },
  );

  updateFile(
    resolve(androidRoot, "app/src/main/assets/tauri.conf.json"),
    (source) => source.replace(knownIdentifierPattern, storeIdentifier),
  );

  removeStaleAndroidPackageDirs();

  console.log(
    `Prepared Android generated project for store package ${storeIdentifier} using Tauri mobile package ${tauriMobileIdentifier}.`,
  );
}

function patchIos() {
  const appleRoot = resolve(srcTauriDir, "gen/apple");

  if (!existsSync(appleRoot)) {
    throw new Error("iOS project is not initialized.");
  }

  updateFile(resolve(appleRoot, "project.yml"), (source) =>
    source
      .replace(
        /^  bundleIdPrefix: com\.malanghub\.(?:app|mobile|native)$/m,
        `  bundleIdPrefix: ${storeIdentifier}`,
      )
      .replace(
        /^      PRODUCT_BUNDLE_IDENTIFIER: com\.malanghub\.(?:app|mobile|native)$/m,
        `      PRODUCT_BUNDLE_IDENTIFIER: ${storeIdentifier}`,
      ),
  );

  updateFile(
    resolve(appleRoot, "malanghub-native.xcodeproj/project.pbxproj"),
    (source) =>
      source.replace(
        /PRODUCT_BUNDLE_IDENTIFIER = com\.malanghub\.(?:app|mobile|native);/g,
        `PRODUCT_BUNDLE_IDENTIFIER = ${storeIdentifier};`,
      ),
  );

  for (const file of walkFiles(appleRoot).filter(
    (path) => path.endsWith(".plist") || path.endsWith(".entitlements"),
  )) {
    updateFile(file, (source) =>
      source.replace(knownIdentifierPattern, storeIdentifier),
    );
  }

  // Inject camera and photo library usage descriptions required for
  // <input type="file"> camera/gallery access on iOS/iPadOS.
  updateFile(
    resolve(appleRoot, "malanghub-native_iOS/Info.plist"),
    (source) => {
      let result = source;
      const iosPermissions = [
        [
          "NSCameraUsageDescription",
          "Malanghub needs camera access to update your profile photo.",
        ],
        [
          "NSPhotoLibraryUsageDescription",
          "Malanghub needs photo library access to update your profile photo.",
        ],
      ];
      for (const [key, value] of iosPermissions) {
        if (!result.includes(`<key>${key}</key>`)) {
          result = result.replace(
            "</dict>\n</plist>",
            `\t<key>${key}</key>\n\t<string>${value}</string>\n</dict>\n</plist>`,
          );
        }
      }
      return result;
    },
  );

  console.log(`Prepared iOS generated project for bundle ${storeIdentifier}.`);
}

function patch(target) {
  if (target === "android" || target === "all") {
    patchAndroid();
  }

  if (target === "ios" || target === "all") {
    patchIos();
  }
}

function init(target) {
  if (target !== "android" && target !== "ios") {
    throw new Error("Usage: mobile:init <android|ios>");
  }

  const root =
    target === "android"
      ? resolve(srcTauriDir, "gen/android")
      : resolve(srcTauriDir, "gen/apple");

  if (!existsSync(root)) {
    const result = spawnSync(
      "pnpm",
      [
        "tauri",
        target,
        "init",
        "--ci",
        "--config",
        "src-tauri/tauri.mobile-ci.conf.json",
      ],
      {
        cwd: appDir,
        env: process.env,
        stdio: "inherit",
      },
    );

    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  }

  patch(target);
}

try {
  if (command === "init") {
    init(platform);
  } else if (command === "patch") {
    patch(platform);
  } else {
    throw new Error(
      "Usage: node ./scripts/mobile-store-identifier.mjs [init|patch] [android|ios|all]",
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

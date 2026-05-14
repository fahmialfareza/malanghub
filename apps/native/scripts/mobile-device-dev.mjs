import { spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcTauriDir = resolve(appDir, "src-tauri");
const splashDir = resolve(srcTauriDir, "splash");
const preferredInterfaces = ["en0", "en1"];
const command = process.argv[2] ?? "config";
const extraArgs = process.argv.slice(3);

const iosLaunchScreenStoryboard = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="17150" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="Y6W-OH-hqX">
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="17122"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="s0d-6b-0kx">
            <objects>
                <viewController id="Y6W-OH-hqX" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="5EZ-qb-Rvc">
                        <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="LaunchLogo" translatesAutoresizingMaskIntoConstraints="NO" id="8Jf-3x-Qgc">
                                <rect key="frame" x="87" y="412" width="240" height="72"/>
                            </imageView>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="vDu-zF-Fre"/>
                        <color key="backgroundColor" red="0.066666666666666666" green="0.074509803921568626" blue="0.13333333333333333" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="8Jf-3x-Qgc" firstAttribute="centerX" secondItem="5EZ-qb-Rvc" secondAttribute="centerX" id="4ct-kd-0yM"/>
                            <constraint firstItem="8Jf-3x-Qgc" firstAttribute="centerY" secondItem="5EZ-qb-Rvc" secondAttribute="centerY" id="DnS-wx-Cka"/>
                            <constraint firstItem="8Jf-3x-Qgc" firstAttribute="width" constant="240" id="PP2-u9-7JX"/>
                            <constraint firstItem="8Jf-3x-Qgc" firstAttribute="height" constant="72" id="fsn-Ac-55W"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="Ief-a0-LHa" userLabel="First Responder" customClass="UIResponder" sceneMemberID="firstResponder"/>
            </objects>
        </scene>
    </scenes>
    <resources>
        <image name="LaunchLogo" width="240" height="67"/>
    </resources>
</document>
`;

const iosLaunchLogoContents = {
  images: [
    {
      filename: "LaunchLogo.png",
      idiom: "universal",
      scale: "1x",
    },
    {
      filename: "LaunchLogo@2x.png",
      idiom: "universal",
      scale: "2x",
    },
    {
      filename: "LaunchLogo@3x.png",
      idiom: "universal",
      scale: "3x",
    },
  ],
  info: {
    author: "xcode",
    version: 1,
  },
};

const androidSplashScreenXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo" />
    </item>
</layer-list>
`;

const androidThemeItems = `        <item name="android:windowBackground">@drawable/splash_screen</item>
        <item name="android:navigationBarColor">@color/splash_background</item>
        <item name="android:statusBarColor">@color/splash_background</item>`;

function getAndroidThemeName() {
  try {
    const manifest = readFileSync(
      resolve(
        srcTauriDir,
        "gen/android/app/src/main/AndroidManifest.xml",
      ),
      "utf8",
    );
    const match = manifest.match(/android:theme="@style\/([^"]+)"/);

    if (match?.[1]) {
      return match[1];
    }
  } catch {
    // The generated Android project may not exist yet.
  }

  return "Theme.malanghub_native";
}

function getAndroidThemeXml(themeName) {
  return `<resources xmlns:tools="http://schemas.android.com/tools">
    <!-- Base application theme. -->
    <style name="${themeName}" parent="Theme.MaterialComponents.DayNight.NoActionBar">
${androidThemeItems}
    </style>
</resources>
`;
}

function getAndroidV31ThemeXml(themeName) {
  return `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="${themeName}" parent="Theme.MaterialComponents.DayNight.NoActionBar">
${androidThemeItems}
        <item name="android:windowSplashScreenBackground">@color/splash_background</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>
    </style>
</resources>
`;
}

function writeGeneratedFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function copyGeneratedFile(source, target) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

function ensureAndroidSplashColor(colorsPath) {
  let colors = "";

  try {
    colors = readFileSync(colorsPath, "utf8");
  } catch (error) {
    colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
</resources>
`;
  }

  if (colors.includes('name="splash_background"')) {
    return;
  }

  writeGeneratedFile(
    colorsPath,
    colors.replace(
      "</resources>",
      "    <color name=\"splash_background\">#FF111322</color>\n</resources>",
    ),
  );
}

function prepareMobileSplashResources() {
  const iosImageSetDir = resolve(
    srcTauriDir,
    "gen/apple/Assets.xcassets/LaunchLogo.imageset",
  );
  const androidResDir = resolve(srcTauriDir, "gen/android/app/src/main/res");
  const androidThemeName = getAndroidThemeName();

  writeGeneratedFile(
    resolve(srcTauriDir, "gen/apple/LaunchScreen.storyboard"),
    iosLaunchScreenStoryboard,
  );
  writeGeneratedFile(
    resolve(iosImageSetDir, "Contents.json"),
    `${JSON.stringify(iosLaunchLogoContents, null, 2)}\n`,
  );
  copyGeneratedFile(
    resolve(splashDir, "ios/LaunchLogo.png"),
    resolve(iosImageSetDir, "LaunchLogo.png"),
  );
  copyGeneratedFile(
    resolve(splashDir, "ios/LaunchLogo@2x.png"),
    resolve(iosImageSetDir, "LaunchLogo@2x.png"),
  );
  copyGeneratedFile(
    resolve(splashDir, "ios/LaunchLogo@3x.png"),
    resolve(iosImageSetDir, "LaunchLogo@3x.png"),
  );

  copyGeneratedFile(
    resolve(splashDir, "android/splash_logo.png"),
    resolve(androidResDir, "drawable-nodpi/splash_logo.png"),
  );
  copyGeneratedFile(
    resolve(splashDir, "android/splash_icon.png"),
    resolve(androidResDir, "drawable-nodpi/splash_icon.png"),
  );
  writeGeneratedFile(
    resolve(androidResDir, "drawable/splash_screen.xml"),
    androidSplashScreenXml,
  );
  writeGeneratedFile(
    resolve(androidResDir, "values/themes.xml"),
    getAndroidThemeXml(androidThemeName),
  );
  writeGeneratedFile(
    resolve(androidResDir, "values-night/themes.xml"),
    getAndroidThemeXml(androidThemeName),
  );
  writeGeneratedFile(
    resolve(androidResDir, "values-v31/themes.xml"),
    getAndroidV31ThemeXml(androidThemeName),
  );
  ensureAndroidSplashColor(resolve(androidResDir, "values/colors.xml"));

  console.log("Prepared native mobile splash resources.");
}

function getAddressFromInterface(name) {
  const result = spawnSync("ipconfig", ["getifaddr", name], {
    encoding: "utf8",
  });

  if (result.status === 0) {
    return result.stdout.trim();
  }

  return "";
}

function getMacLanAddress() {
  for (const name of preferredInterfaces) {
    const address = getAddressFromInterface(name);

    if (address) {
      return address;
    }
  }

  const result = spawnSync("ifconfig", [], { encoding: "utf8" });
  const match = result.stdout.match(
    /\binet (192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)/,
  );

  return match?.[1] ?? "";
}

function getHost() {
  return process.env.TAURI_DEV_HOST || getMacLanAddress();
}

function writePlatformConfig(platform, host) {
  const configPath = resolve(srcTauriDir, `tauri.${platform}.conf.json`);
  const config = {
    build: {
      devUrl: `http://${host}:1420`,
    },
  };

  mkdirSync(srcTauriDir, { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  return configPath;
}

function ensureMobileProject(platform) {
  const root =
    platform === "android"
      ? resolve(srcTauriDir, "gen/android")
      : resolve(srcTauriDir, "gen/apple");
  const action = existsSync(root) ? "patch" : "init";
  const result = spawnSync(
    process.execPath,
    [
      resolve(appDir, "scripts/mobile-store-identifier.mjs"),
      action,
      platform,
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

function configure(platforms, host) {
  prepareMobileSplashResources();

  for (const platform of platforms) {
    const configPath = writePlatformConfig(platform, host);
    console.log(`Wrote ${configPath}`);
  }

  console.log(`Mobile dev URL: http://${host}:1420/`);
}

function run(platform, host) {
  ensureMobileProject(platform);
  configure([platform], host);

  const args = [
    "tauri",
    platform,
    "dev",
    "--config",
    "src-tauri/tauri.mobile-ci.conf.json",
    "--open",
    `--host=${host}`,
    ...extraArgs,
  ];

  console.log(`Starting ${platform} device dev server on ${host}`);
  console.log(`Use the IDE opened by this command so the generated mobile config is applied.`);

  const child = spawn("pnpm", args, {
    cwd: appDir,
    env: {
      ...process.env,
      TAURI_DEV_HOST: host,
    },
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    }

    process.exit(code ?? 0);
  });
}

if (command === "prepare") {
  prepareMobileSplashResources();
  process.exit(0);
}

const host = getHost();

if (!host) {
  if (command === "config") {
    prepareMobileSplashResources();
    console.warn("Could not detect the Mac LAN IP. Skipping mobile dev config generation.");
    process.exit(0);
  }

  console.error("Could not detect the Mac LAN IP. Set TAURI_DEV_HOST manually.");
  process.exit(1);
}

if (command === "config") {
  configure(["ios", "android"], host);
} else if (command === "ios" || command === "android") {
  run(command, host);
} else {
  console.error("Usage: node ./scripts/mobile-device-dev.mjs [prepare|config|ios|android]");
  process.exit(1);
}

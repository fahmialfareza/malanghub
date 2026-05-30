# Native release guide

## Commands

These commands dispatch GitHub Actions from the current Git branch. They release
version `1.0.0` by default and use the last argument as the store build number.

```bash
pnpm release android 100
pnpm release ios 100
pnpm release linux 100
pnpm release macos 100
pnpm release windows 100
```

Useful overrides:

```bash
MALANGHUB_RELEASE_VERSION=1.0.1 pnpm release android 101
MALANGHUB_RELEASE_REF=main pnpm release ios 100
MALANGHUB_ANDROID_TRACK=internal MALANGHUB_ANDROID_STATUS=draft pnpm release android 100
MALANGHUB_SNAP_CHANNEL=edge pnpm release linux 100
```

## GitHub Secrets

Add these in GitHub repository settings:
`Settings > Secrets and variables > Actions > Secrets`.

Shared:

| Name                            | Notes                                                         |
| ------------------------------- | ------------------------------------------------------------- |
| `VITE_API_ADDRESS`              | Backend API base URL, for example `https://api.malanghub.com` |
| `VITE_GOOGLE_CLIENT_ID`         | Desktop OAuth client ID                                       |
| `VITE_GOOGLE_CLIENT_SECRET`     | Optional desktop OAuth secret if the client type requires it  |
| `VITE_GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client ID                                       |
| `VITE_GOOGLE_IOS_CLIENT_ID`     | iOS OAuth client ID                                           |
| `VITE_GOOGLE_IOS_REDIRECT_URI`  | Usually `com.malanghub.native:/oauth2redirect/google`         |
| `VITE_TINY_API_KEY`             | TinyMCE API key                                               |
| `VITE_SENTRY_DSN`               | Optional Sentry DSN                                           |

Store identifiers:

- Android Play Store package: `com.malanghub.native`
- iOS App Store bundle ID: `com.malanghub.native`
- Tauri mobile generator ID: `com.malanghub.mobile`

Tauri's Android/iOS generator rejects `native` because it is a reserved Java
keyword. The CI workflows therefore run Tauri mobile commands with
`src-tauri/tauri.mobile-ci.conf.json`, then patch the generated Android/iOS
projects back to `com.malanghub.native` before compiling. Do not create new
store apps for `com.malanghub.mobile`; it is only an internal build-time ID. The
iOS workflow also wraps `xcodebuild` so the archived IPA keeps
`com.malanghub.native` as its final `CFBundleIdentifier`.

For manual mobile builds, use the same mobile config path:

```bash
pnpm --filter native mobile:init android
pnpm --filter native tauri android build --config src-tauri/tauri.mobile-ci.conf.json --aab --ci

pnpm --filter native mobile:init ios
```

For a local iOS App Store archive, also mimic the workflow's `xcodebuild`
bundle-ID wrapper or use `pnpm release ios <build-number>` so the final archive
does not fall back to the internal `com.malanghub.mobile` generator ID.
The iOS App Store workflow runs on `macos-26` and verifies the selected iPhoneOS
SDK is 26 or newer before building. The workflow writes `CFBundleVersion` through
`pnpm --filter native release:version <version> <build-number>` and does not pass
Tauri's extra `--build-number` flag, so App Store Connect receives the same build
number that is embedded in the IPA.

Apple App Store Connect:

| Name                                      | Notes                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `APPLE_TEAM_ID`                           | Apple Developer Team ID                                                           |
| `APPLE_DISTRIBUTION_CERTIFICATE_BASE64`   | Base64 `.p12` Apple Distribution certificate                                      |
| `APPLE_DISTRIBUTION_CERTIFICATE_PASSWORD` | Password used when exporting that `.p12`                                          |
| `APPLE_KEYCHAIN_PASSWORD`                 | Any strong temporary CI keychain password                                         |
| `IOS_PROVISIONING_PROFILE_BASE64`         | Base64 iOS App Store distribution provisioning profile for `com.malanghub.native` |
| `MACOS_PROVISIONING_PROFILE_BASE64`       | Base64 Mac App Store provisioning profile                                         |
| `MACOS_APP_SIGNING_IDENTITY`              | Usually `3rd Party Mac Developer Application: ...`                                |
| `MACOS_INSTALLER_CERTIFICATE_BASE64`      | Base64 `.p12` Mac Installer certificate                                           |
| `MACOS_INSTALLER_CERTIFICATE_PASSWORD`    | Password used when exporting the installer `.p12`                                 |
| `MACOS_INSTALLER_SIGNING_IDENTITY`        | Usually `3rd Party Mac Developer Installer: ...`                                  |
| `APP_STORE_CONNECT_KEY_ID`                | App Store Connect API key ID                                                      |
| `APP_STORE_CONNECT_ISSUER_ID`             | App Store Connect issuer ID                                                       |
| `APP_STORE_CONNECT_PRIVATE_KEY_BASE64`    | Base64 `AuthKey_<KEY_ID>.p8`                                                      |
| `APP_STORE_CONNECT_IOS_APPLE_ID`          | Numeric App Store Connect Apple ID for the iOS app                                |
| `APP_STORE_CONNECT_MACOS_APPLE_ID`        | Numeric App Store Connect Apple ID for the macOS app                              |
| `APP_STORE_CONNECT_ASC_PUBLIC_ID`         | Optional provider public ID when the ASC account has multiple providers           |

Android Play Console:

| Name                               | Notes                                             |
| ---------------------------------- | ------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`          | Base64 upload keystore                            |
| `ANDROID_KEYSTORE_PASSWORD`        | Upload keystore password                          |
| `ANDROID_KEY_ALIAS`                | Upload key alias                                  |
| `ANDROID_KEY_PASSWORD`             | Optional; defaults to `ANDROID_KEYSTORE_PASSWORD` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full Play Console service account JSON            |

Snapcraft:

| Name                          | Notes                                         |
| ----------------------------- | --------------------------------------------- |
| `SNAPCRAFT_STORE_CREDENTIALS` | Contents of the exported Snapcraft login file |

Windows MSIX:

| Name                                       | Notes                                                             |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `MALANGHUB_WINDOWS_IDENTITY_NAME`          | Partner Center package identity `Name`                            |
| `MALANGHUB_WINDOWS_PUBLISHER`              | Partner Center package identity `Publisher`, for example `CN=...` |
| `MALANGHUB_WINDOWS_PUBLISHER_DISPLAY_NAME` | Partner Center publisher display name                             |
| `WINDOWS_PFX_BASE64`                       | Optional `.pfx` for sideload/local install signing                |
| `WINDOWS_PFX_PASSWORD`                     | Optional password for `WINDOWS_PFX_BASE64`                        |

## How to Create the Secrets

Base64 helper on macOS:

```bash
base64 < path/to/file | tr -d '\n' | pbcopy
```

Apple:

1. In Apple Developer, create/download the iOS App Store distribution and Mac App Store provisioning profiles for `com.malanghub.native`.
2. In Keychain Access, export the Apple Distribution certificate as `.p12`.
3. Export the Mac Installer certificate as `.p12`.
4. In App Store Connect, create an API key under `Users and Access > Integrations > App Store Connect API`, then copy the key ID, issuer ID, and base64 the downloaded `.p8`.
5. Copy the numeric Apple ID from each App Store Connect app page into `APP_STORE_CONNECT_IOS_APPLE_ID` and `APP_STORE_CONNECT_MACOS_APPLE_ID`.
6. If the App Store Connect account has more than one provider, run `xcrun altool --list-providers --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>` and save the provider public ID in `APP_STORE_CONNECT_ASC_PUBLIC_ID`.
7. Copy the exact signing identity names from `security find-identity -v -p codesigning`.
8. The iOS workflow installs the profile by UUID and forces manual signing with `Apple Distribution`, so the profile must not be an iOS App Development profile.

Mac App Review note:

- The macOS App Store bundle keeps `com.apple.security.network.server` because desktop Google sign-in uses a temporary localhost OAuth callback listener.
- The flow is implemented in `apps/native/src/main.tsx` via `plugin:oauth|start`, which opens a short-lived loopback port, waits for Google's redirect, then calls `plugin:oauth|cancel` to close it.
- Reviewers can trigger it from the sign-in or sign-up screen by tapping the Google button. The app does not expose a general-purpose LAN or internet-facing server.

Android:

```bash
keytool -genkeypair \
  -v \
  -keystore malanghub-upload-key.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias malanghub-upload
```

1. Base64 `malanghub-upload-key.jks` into `ANDROID_KEYSTORE_BASE64`.
2. In Play Console, enable API access, create or link a Google Cloud service account, grant app release access, and download the JSON key.
3. The Android OAuth client package name must remain `com.malanghub.native`; add the SHA-1 for the upload key or debug key you are testing.
4. The first Play Console app/bundle upload may still need to be done manually before API uploads are accepted.

If the Play upload fails with `Android Developer API has not been used in
project ... or it is disabled`, enable the Google Play Android Developer API
for the Google Cloud project that owns `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, then
wait a few minutes and rerun the workflow. Also confirm the same service account
is linked under `Play Console > Setup > API access` and has release permission
for the `com.malanghub.native` app.

Snapcraft:

```bash
snapcraft login
snapcraft export-login --snaps malanghub --acls package_upload,package_release snapcraft-login.txt
```

Copy the full `snapcraft-login.txt` contents into `SNAPCRAFT_STORE_CREDENTIALS`.
The Snapcraft build installs `pnpm` locally inside the part build directory
because the Node snap used by Snapcraft does not expose `corepack`.
The Linux workflow publishes with `snapcraft upload` and passes the exported
login through the `SNAPCRAFT_STORE_CREDENTIALS` environment variable, matching
newer Snapcraft versions that no longer accept `snapcraft login --with`.

Windows:

1. In Partner Center, create the MSIX/PWA product.
2. Copy the package identity `Name`, `Publisher`, and publisher display name.
3. Save those values in `MALANGHUB_WINDOWS_IDENTITY_NAME`, `MALANGHUB_WINDOWS_PUBLISHER`, and `MALANGHUB_WINDOWS_PUBLISHER_DISPLAY_NAME` GitHub Secrets.
4. Download the x64 and arm64 MSIX artifacts from the GitHub Actions run and upload them manually in Partner Center.

`WINDOWS_PFX_BASE64` is not required for the Partner Center artifact flow. It is only useful if you want the GitHub artifact to be signed for sideload testing before Store submission.

The MSIX script generates the required wide tile logo during packaging so
`Square310x310Logo` and `Wide310x150Logo` are present together in the manifest.

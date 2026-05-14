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

Windows MSIX needs the exact Partner Center package identity values:

```bash
MALANGHUB_WINDOWS_IDENTITY_NAME="your-package-name" \
MALANGHUB_WINDOWS_PUBLISHER="CN=your-publisher-id" \
MALANGHUB_WINDOWS_PUBLISHER_DISPLAY_NAME="Your Publisher Name" \
pnpm release windows 100
```

## GitHub Variables

Add these in GitHub repository settings:
`Settings > Secrets and variables > Actions > Variables`.

| Name | Used by | Value |
| --- | --- | --- |
| `VITE_API_ADDRESS` | All native builds | Backend API base URL, for example `https://api.malanghub.com` |
| `VITE_GOOGLE_CLIENT_ID` | Desktop Google OAuth | Desktop OAuth client ID |
| `VITE_GOOGLE_ANDROID_CLIENT_ID` | Android Google OAuth | Android OAuth client ID |
| `VITE_GOOGLE_IOS_CLIENT_ID` | iOS Google OAuth | iOS OAuth client ID |
| `VITE_GOOGLE_IOS_REDIRECT_URI` | iOS Google OAuth | Usually `com.malanghub.app:/oauth2redirect/google` |

## GitHub Secrets

Add these in GitHub repository settings:
`Settings > Secrets and variables > Actions > Secrets`.

Shared:

| Name | Notes |
| --- | --- |
| `VITE_TINY_API_KEY` | TinyMCE API key |
| `VITE_SENTRY_DSN` | Optional Sentry DSN |

Apple App Store Connect:

| Name | Notes |
| --- | --- |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_DISTRIBUTION_CERTIFICATE_BASE64` | Base64 `.p12` Apple Distribution certificate |
| `APPLE_DISTRIBUTION_CERTIFICATE_PASSWORD` | Password used when exporting that `.p12` |
| `APPLE_KEYCHAIN_PASSWORD` | Any strong temporary CI keychain password |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64 iOS App Store provisioning profile |
| `MACOS_PROVISIONING_PROFILE_BASE64` | Base64 Mac App Store provisioning profile |
| `MACOS_APP_SIGNING_IDENTITY` | Usually `3rd Party Mac Developer Application: ...` |
| `MACOS_INSTALLER_CERTIFICATE_BASE64` | Base64 `.p12` Mac Installer certificate |
| `MACOS_INSTALLER_CERTIFICATE_PASSWORD` | Password used when exporting the installer `.p12` |
| `MACOS_INSTALLER_SIGNING_IDENTITY` | Usually `3rd Party Mac Developer Installer: ...` |
| `APP_STORE_CONNECT_KEY_ID` | App Store Connect API key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect issuer ID |
| `APP_STORE_CONNECT_PRIVATE_KEY_BASE64` | Base64 `AuthKey_<KEY_ID>.p8` |

Android Play Console:

| Name | Notes |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 upload keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Upload keystore password |
| `ANDROID_KEY_ALIAS` | Upload key alias |
| `ANDROID_KEY_PASSWORD` | Optional; defaults to `ANDROID_KEYSTORE_PASSWORD` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full Play Console service account JSON |

Snapcraft:

| Name | Notes |
| --- | --- |
| `SNAPCRAFT_STORE_CREDENTIALS` | Contents of the exported Snapcraft login file |

Windows MSIX:

| Name | Notes |
| --- | --- |
| `WINDOWS_PFX_BASE64` | Optional signing `.pfx`; Partner Center signs Store submissions |
| `WINDOWS_PFX_PASSWORD` | Optional password for `WINDOWS_PFX_BASE64` |

## How to Create the Secrets

Base64 helper on macOS:

```bash
base64 < path/to/file | tr -d '\n' | pbcopy
```

Apple:

1. In Apple Developer, create/download the iOS App Store and Mac App Store provisioning profiles for `com.malanghub.app`.
2. In Keychain Access, export the Apple Distribution certificate as `.p12`.
3. Export the Mac Installer certificate as `.p12`.
4. In App Store Connect, create an API key under `Users and Access > Integrations > App Store Connect API`, then copy the key ID, issuer ID, and base64 the downloaded `.p8`.
5. Copy the exact signing identity names from `security find-identity -v -p codesigning`.

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
3. The first Play Console app/bundle upload may still need to be done manually before API uploads are accepted.

Snapcraft:

```bash
snapcraft login
snapcraft export-login --snaps malanghub --acls package_upload,package_release snapcraft-login.txt
```

Copy the full `snapcraft-login.txt` contents into `SNAPCRAFT_STORE_CREDENTIALS`.

Windows:

1. In Partner Center, create the MSIX/PWA product.
2. Copy the package identity `Name`, `Publisher`, and publisher display name.
3. Use those values through the `MALANGHUB_WINDOWS_*` environment variables when dispatching the workflow.
4. Download the x64 and arm64 MSIX artifacts from the GitHub Actions run and upload them manually in Partner Center.

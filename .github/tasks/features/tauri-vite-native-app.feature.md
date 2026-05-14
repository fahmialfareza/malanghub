# Feature: Tauri 2 + Vite native app migration

## Summary

Create a shared Malanghub UI/data architecture while keeping the current Next.js web app SSR-capable and adding a new Tauri 2 Vite app for desktop and mobile.

## Scope

- Affected app or package: `apps/frontend`, new `apps/native`, new `packages/core`, new `packages/ui`.
- In scope: shared API/types/query contracts, shared React UI/adapters, Vite/Tauri app scaffold, native route parity for the main web flows, localStorage token auth for native, direct backend support needed by native profile editing.
- Out of scope: replacing web SEO/PWA/RSS/sitemap behavior.

## Constraints

- Keep the existing Next.js web app deployable and SSR-capable.
- Use `pnpm` and Turborepo workspace packages.
- Tauri app uses Vite CSR, TanStack Query, and localStorage-compatible token storage.
- Google sign-in uses native Android/iOS credentials in the native app and the existing backend issues the Malanghub token.
- Do not add secrets or embed credentials.

## Checklist

- [x] Save this implementation task.
- [x] Add `packages/core` with platform-neutral models, API client, auth storage, and TanStack Query contracts.
- [x] Add `packages/ui` with shared providers, adapters, app shell, and page views.
- [x] Add `apps/native` as a Vite React + Tauri 2 app.
- [x] Configure native Tauri/Vite desktop and mobile dev/build settings.
- [x] Wire `apps/frontend` to consume shared packages without removing SSR behavior.
- [x] Validate shared packages and app builds/typechecks.

## Validation

- [x] `pnpm --filter @malanghub/core check-types`
- [x] `pnpm --filter @malanghub/ui check-types`
- [x] `pnpm --filter client check-types`
- [x] `pnpm --filter client build`
- [x] `pnpm --filter native check-types`
- [x] `pnpm --filter native build`
- [x] `node --check apps/native/scripts/mobile-device-dev.mjs`
- [x] `pnpm --filter native mobile:config`
- [x] Native auth style updated to match the web sign-in/sign-up layout.
- [x] Native Google login button added as the first auth action.
- [x] Native mobile launcher icons regenerated from the Malanghub logo for Android and iOS.
- [x] Native Google login no longer depends on app-level browser callbacks on Android; iOS uses native PKCE inside `ASWebAuthenticationSession`.
- [x] Native mobile Google login switched to Option B: Android/iOS obtain a Google credential natively, then the backend issues the Malanghub token.
- [x] Native Android Google login uses the Android OAuth app/account picker and sends a Google access token to the backend.
- [x] Backend Google login accepts Google `id_token`/`access_token` payloads and validates ID-token audiences before issuing a Malanghub token.
- [x] Native Tauri Google auth plugin added for Android/iOS sign-in.
- [x] Native Option B Google auth validated through Android debug APK and iOS simulator archive builds.
- [x] Shared Google auth UI can consume a platform-provided Malanghub auth token directly and reports non-Error failures with useful messages.
- [x] Native shell updated to match web header logo, search popup, author block, and dark-mode toggle structure.
- [x] Native shared UI overrides updated so pagination, dashboard cards, tables, and profile forms follow the web theme tokens.
- [x] Native/shared news detail updated to match web article layout, tag/share row, author card, and related-news sidebar.
- [x] Native/shared news pagination markup updated to match web `ReactPaginate` classes.
- [x] Native/shared contact, terms, and privacy pages updated to match web content and layout.
- [x] Native/shared dashboard updated to match web profile hero, edit profile modal, section actions, cards, tables, and CRUD modals.
- [x] Native/shared edit profile modal scroll behavior fixed for long forms and short viewports.
- [x] Native/shared API error handling fixed so plain-text backend failures do not surface as JSON parse errors.
- [x] Native/shared category and tag CRUD added for admin users.
- [x] Native/shared category and tag create/update now send generated slugs.
- [x] Native/shared news draft create/edit/delete, admin approval, and draft preview routes added.
- [x] Native/shared draft preview updated to match the web preview structure.
- [x] Backend profile update route added for native direct API parity.
- [x] Backend category and tag create/update now generate slugs and return friendly duplicate errors.
- [x] `cd apps/backend && go test ./...`
- [x] `pnpm --filter native tauri --version`
- [x] `pnpm --filter native tauri info`
- [x] `cargo check --no-default-features --color always` in `apps/native/src-tauri`
- [x] `pnpm --filter native build`
- [x] `pnpm --filter native tauri ios build --debug --target aarch64-sim --no-sign --ci --archive-only`
- [x] `pnpm --filter native tauri android build --debug --target aarch64 --apk --ci`
- [x] Verified generated iOS `CFBundleURLTypes` contains `com.malanghub.native`.
- [x] Verified generated Android manifest contains `com.malanghub.native` deep-link intent filter.
- [x] Added `native` iOS real-device dev helper so Tauri uses the Mac LAN IP instead of `localhost`.
- [x] Native iOS Xcode build phase PATH updated so GUI Xcode can find `npm` and `cargo`.
- [x] Native mobile device dev helper added for iOS and Android so generated platform configs use the Mac LAN IP instead of `localhost`.
- [x] Native Tauri `beforeDevCommand` now refreshes mobile dev configs before starting Vite.
- [x] Native generated local `tauri.ios.conf.json` and `tauri.android.conf.json` point at `http://192.168.1.9:1420` for physical-device testing.
- [x] Native Vite dev server responded at `http://localhost:1420/`
- [x] `curl -I http://localhost:1420/`
- [x] Native Vite dev server responded at `http://192.168.1.9:1420/`
- [x] `curl -I http://192.168.1.9:1420/`
- [x] Manual desktop: `pnpm --filter native tauri dev`
- [x] iOS simulator and device Xcode project builds validated with `xcodebuild`.
- [x] iOS physical-device dev opener validated with `pnpm --filter native tauri ios dev --open --host <mac-lan-ip>`.
- [x] Native mobile back/forward/refresh gestures added on top of React Router history without visible browser controls.
- [x] Android hardware back button wired to native React Router navigation.
- [x] Native mobile edge-swipe back/forward and pull-to-refresh gestures added.
- [x] Root and native package scripts added for macOS, Windows, Linux, iOS real-device, and Android real-device runs.
- [x] Native mobile bottom tab navigation added and web-style hamburger navigation hidden on native mobile.
- [x] Native external link bridge added for browser/app links such as Google Maps, WhatsApp, email, and social shares.
- [x] Native shell open allowlist configured for http, mail, tel, SMS, maps, and WhatsApp links.
- [x] Native external link opening moved behind an ACL-permitted Rust plugin command so real-device dev builds can open OS apps from the LAN Vite origin.
- [x] Native Vite startup splash screen limited to Android/iOS and protected with a fail-safe timeout.
- [x] Native mobile News tab now opens a category sheet for "Semua Berita" and category routes.
- [x] Native mobile header and dark/light toggle polished for bottom-tab navigation.
- [x] Shared profile page logout action added for authenticated users.
- [x] Shared sign-in/sign-up pages updated with clearer account-switch links and mobile spacing.
- [x] Shared social links normalized so handles and full external URLs open consistently.
- [x] Web frontend download page and navigation/footer links added for native app installers.
- [x] Web frontend opts out of the shared offline banner so `navigator.onLine` false positives do not cover pages.
- [x] Native external link bridge deduplicates desktop opens and uses app-first Google Maps navigation fallbacks.
- [x] Contact map overlays working link/navigation hit areas on the embedded Google Maps controls without an extra button below the iframe.
- [x] Android native Google auth no longer requires a Web OAuth client for native-device login.
- [x] Android WebView `intent://` map navigations are intercepted and opened through native intents with browser fallback.
- [x] Native mobile shared modals moved above app chrome with fixed header/footer and scrollable modal bodies.
- [x] Native mobile modal form controls, file inputs, switches, and footer actions polished for all dashboard CRUD/profile/news forms.
- [x] Native mobile news content forms use textarea instead of TinyMCE to avoid WebView modal reopen crashes.
- [x] Native mobile splash logos added for iOS launch screen and Android/WebView startup without cropped artwork.
- [x] Native iOS WebView startup splash fail-safe shortened so it cannot linger after app boot.
- [x] Native Tauri zoom locked through viewport, touch-action, and desktop zoom shortcut guards.
- [x] GitHub Actions added for iOS App Store Connect upload.
- [x] GitHub Actions added for macOS App Store Connect package upload.
- [x] GitHub Actions added for Android Play Store AAB upload.
- [x] GitHub Actions added for Linux Snapcraft publish.
- [x] GitHub Actions added for Windows MSIX artifact builds for manual Microsoft Partner Center upload.
- [x] Root `pnpm release <platform> <build-number>` dispatcher added for native release workflows.
- [x] Native release guide added with required GitHub variables, secrets, and credential setup steps.
- [x] Native release workflows switched shared build configuration from GitHub variables to GitHub secrets.
- [x] Native bundle/package identifier migrated to `com.malanghub.native`.
- [x] Native Android/iOS CI uses a safe Tauri generator identifier while keeping store package/bundle `com.malanghub.native`.
- [x] Windows MSIX Partner Center identity moved into GitHub Secrets; PFX kept optional for sideload signing only.
- [x] Linux Snapcraft build fixed to install `pnpm` without `corepack`.
- [x] Windows MSIX manifest fixed with a generated wide tile logo.
- [x] iOS CI fixed to use manual App Store signing with the installed provisioning profile.
- [x] iOS CI signing wrapper fixed to bake Team ID and provisioning profile values before Tauri invokes `xcodebuild`.
- [x] iOS CI signing wrapper escaped Bash array expansion so GitHub Actions does not parse it as an expression.
- [x] iOS CI export fixed to replace Tauri's export plist with manual App Store signing options.
- [x] macOS/iOS App Store Connect uploads switched to `altool` API key flags accepted by Xcode 16.4.
- [x] macOS/iOS App Store Connect uploads updated with required `altool --upload-package` metadata.
- [x] Linux Snapcraft invalid architecture-variable layout removed and snap icon selection tightened.
- [x] Linux Snapcraft publish updated to use `SNAPCRAFT_STORE_CREDENTIALS` with `snapcraft upload`.
- [x] Android Play Developer API enablement failure documented in the native release guide.
- [x] Manual mobile: `pnpm --filter native tauri android dev --open`
- [x] Manual mobile: `pnpm --filter native tauri ios dev --open`

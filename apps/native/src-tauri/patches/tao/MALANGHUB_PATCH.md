# Vendored tao 0.35.2 (patched)

Why: the iOS 27 SDK requires apps to adopt the UIScene life cycle
(`UIApplicationSceneManifest` in Info.plist; injected by
`apps/native/scripts/mobile-store-identifier.mjs`). With that manifest,
tao 0.35.x crashes **release** iOS builds on launch because
`configuration_for_connecting_scene_session` returns a freed
`UISceneConfiguration` (tauri-apps/tao#1244). The fix (tao#1245) only shipped in
tao 0.37, which Tauri 2.11 (`tauri-runtime-wry` -> `tao ^0.35`) cannot use.

Change vs crates.io tao 0.35.2: one line in
`src/platform_impl/ios/view.rs` (`Retained::autorelease_ptr(config)`).
Wired in via `[patch.crates-io]` in `apps/native/src-tauri/Cargo.toml`.

Remove this directory and the `[patch.crates-io]` entry once Tauri depends on a
tao release that includes the fix (tao >= 0.37, or a 0.35.4 backport —
tauri-apps/tao#1340).

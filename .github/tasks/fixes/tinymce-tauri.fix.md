# Fix: TinyMCE (Tiny Cloud) does not load in the Tauri apps

## Summary

The dashboard rich-text editor never worked in packaged Tauri builds on macOS. Mobile avoided the problem by showing a plain textarea. There were two causes:

1. **URL crash.** The app loads at `tauri://localhost` and uses `HashRouter`, so `location.href` was `tauri://localhost#/route`, with no `/` before the hash. On non-http schemes TinyMCE builds its document base URL from the raw href and parsed this into `tauri:/`. It then crashed in `toAbsPath` (`undefined is not an object (evaluating 'e.split')`), and tinymce-react reported `tinymce should have been loaded into global scope`.
2. **Tiny Cloud domain check.** WebKit sends no Referer from `tauri://`, so Tiny Cloud reported "referer header is missing" and disabled the editor. `tauri dev` (`http://localhost:1420`) and Windows/Android (`http://tauri.localhost`) were not affected.

## Behavior

- Observed: the Konten field was an empty box with no toolbar. After fixing (1), the toolbar rendered but showed "The editor is disabled because the API key could not be validated". Mobile always showed a textarea.
- Expected: TinyMCE loads and can be edited on every Tauri platform.

## Scope

- Affected: `apps/native` (all platforms), `packages/ui`
- In scope: URL normalisation, serving bundled assets from `http://localhost:47815` on macOS/Linux/iOS, the CSP allowlist, enabling the editor on mobile, a textarea fallback, and the App Review note
- Out of scope: self-hosting TinyMCE

## Checklist

- [x] Reproduce on a packaged macOS debug build using Web Inspector.
- [x] Normalise `tauri://localhost#/…` to `tauri://localhost/#/…` before rendering (`apps/native/src/main.tsx`).
- [x] Serve bundled assets from `http://localhost:47815` on macOS, Linux and iOS via `tauri-plugin-localhost` (`src-tauri/src/lib.rs`). This only applies to bundled builds, binds `127.0.0.1` only, and falls back to `tauri://` if the port is taken.
- [x] Create the main window in `setup` on every platform (`tauri.conf.json` sets `create: false`). The mobile platform configs are gitignored and regenerated, so they cannot hold this setting.
- [x] Allow IPC from `http://localhost:47815` (`capabilities/default.json` `remote.urls`).
- [x] Widen the CSP to `https://*.tiny.cloud`.
- [x] Use TinyMCE on mobile too, with the menubar hidden on phones. Fall back to the textarea on `onScriptsLoadError`.
- [x] Document the loopback asset server in the Mac App Review note (`RELEASE.md`, `Entitlements.appstore.plist`).
- [x] Restyle "Hapus Akun" as an outlined danger button matching "Keluar".
- [ ] Verify Linux and Windows release builds.

## Validation

- [x] `pnpm --filter native check-types`; `cargo check` for `aarch64-apple-darwin`, `aarch64-apple-ios-sim` and `aarch64-linux-android`.
- [x] macOS debug bundle: served from `localhost:47815` with the CSP header, Google login works, and TinyMCE loads with no Tiny warnings.
- [x] iPhone 15 (debug IPA): TinyMCE works.
- [x] Samsung SM-A546E (debug APK): Google login and TinyMCE work. The debug SHA-1 needed its own Android OAuth client, which was added to the backend `GOOGLE_ALLOWED_CLIENT_IDS`.
- [x] "Hapus Akun" checked on macOS and Android.

## Notes

- Changing origin moves localStorage, so macOS, Linux and iOS users will be logged out once after updating.
- Tiny Cloud accepts `localhost` because it is in the key's approved domains, and Windows and Android pass the domain check too.

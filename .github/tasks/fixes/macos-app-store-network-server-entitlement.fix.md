# Fix: Document macOS network server entitlement usage

## Summary

Document why the macOS App Store build keeps `com.apple.security.network.server` so App Review replies and future release work can point to the exact in-app behavior.

## Behavior

- Observed behavior: App Review flagged `com.apple.security.network.server` as unmatched.
- Expected behavior: The release notes and entitlement source explain that desktop Google sign-in uses a temporary localhost OAuth callback listener.

## Scope

- Affected app or package: `apps/native`
- In scope: App Store entitlement documentation, release guidance, and review-note tracking.
- Out of scope: Reworking desktop OAuth away from the loopback callback flow.

## Checklist

- [x] Confirm the failing path or controlling code.
- [x] Implement the smallest fix that addresses the root cause.
- [x] Validate the fix with the narrowest useful check.
- [x] Update any affected docs or task notes.

## Validation

- [x] Inspected `apps/native/src/main.tsx` and confirmed desktop Google login calls `plugin:oauth|start` to open a localhost callback port and `plugin:oauth|cancel` to close it.
- [x] `plutil -lint apps/native/src-tauri/Entitlements.appstore.plist`

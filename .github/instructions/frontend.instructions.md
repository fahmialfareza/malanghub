---
name: "Frontend App Coding Conventions"
description: "Coding conventions for the Next.js frontend app in the `apps/frontend` directory."
applyTo: "apps/frontend/**/*.ts, apps/frontend/**/*.js, apps/frontend/**/*.tsx, apps/frontend/**/*.jsx"
---

# Copilot Instructions — apps/frontend

## Purpose

Guidance for working in the Next.js frontend app.

## Key points

- Language: TypeScript/JavaScript with Next.js. Follow `tsconfig.json` and existing component patterns.
- Structure:
  - `components/` for reusable components.
  - `models/` for TypeScript types and interfaces.
  - `pages/` for Next.js page components.
  - `public/` for static assets.
  - `redux/` for state management (if applicable).
  - `styles/` for CSS modules or global styles.
  - `utils/` for helper functions and hooks.
  - `declaration.d.ts` for global type declarations.
  - `instrumentation-client.ts` for telemetry and logging setup (browser Sentry; there is no server runtime).
  - `next-env.d.ts` for Next.js type definitions.
  - `next.config.js` for Next.js configuration.
  - `nodemon.json` for development server configuration.
  - `package.json` for frontend dependencies and scripts.
  - `Readme.md` for frontend-specific documentation.
  - `tsconfig.json` for TypeScript configuration.
  - `tsconfig.tsbuildinfo.json` for TypeScript build info configuration.

## Run & test

- Dev: `pnpm --filter frontend install && pnpm --filter frontend dev` (or `next dev` in `apps/frontend`).
- Build: `pnpm --filter frontend install && pnpm --filter frontend build` (or `next build` in `apps/frontend`).
- The site is a static export served by Cloudflare Pages (no Worker, no server): `pnpm pages:build` writes `out/`, `pnpm pages:preview` serves it with `wrangler pages dev`. Never add `getServerSideProps`, API routes, middleware, `headers()`/`redirects()`/`rewrites()` or ISR (`revalidate`): they don't work with `output: "export"`.
- Public pages fetch with `getStaticProps` (+ `getStaticPaths` with `fallback: false`, listing every item via `utils/apiList.ts`) from `API_ADDRESS` at build time. A failed fetch must throw so the build fails and the previous deploy stays live. Anything per-user, private or query-string driven loads in the browser from `NEXT_PUBLIC_API_ADDRESS`.
- Content changes reach the site through a rebuild: the backend calls `pkg/sitebuild.Trigger`, which fires `.github/workflows/frontend-pages.yml`. If a page shows data from a new backend resource, trigger a rebuild where that resource changes.
- Crawler files (`sitemap.xml`, `news-sitemap.xml`, `feed.xml`, `llms.txt`, the IndexNow key) are written by `scripts/generate-seo-files.mts` from `utils/seoFiles.ts`. Response headers go in `public/_headers`, shell rewrites in `public/_redirects`.

## Style & safety

- Follow existing code patterns and conventions in the `apps/frontend` directory.
- Use TypeScript for type safety and maintainability.
- Write clear, concise code with meaningful variable and function names.
- Add comments where necessary to explain complex logic or decisions.
- Ensure new components are reusable and follow the design system (if applicable).

## Styling (Tailwind design system)

- Styling is Tailwind CSS v4 (entry: `styles/app.css`). Bootstrap and jQuery are no longer loaded; don't reintroduce them.
- Use the semantic color tokens from `packages/ui/src/tailwind.css` (`bg-bg`, `bg-surface`, `bg-surface-2`, `bg-input`, `border-line`, `text-fg`, `text-body`, `text-muted`, `bg-brand`/`text-brand`, `danger`/`success`/`warning`) instead of hex colors. They switch automatically for dark mode (`data-theme="dark"` on `<html>`), so avoid `theme === "dark" ? ...` class ternaries; use `dark:` only when a token isn't enough. Plain CSS (CSS modules) should use the `--mh-*` variables.
- Prefer the shared primitives from `@malanghub/ui` (`Button`, `Input`, `Textarea`, `Select`, `Card`, `Table`, `Modal`, `Dropdown`, `Breadcrumbs`, `Container`, `paginationClasses`, `useTheme`). Modals are React state driven; pass `allowExternalPopups` when a modal hosts TinyMCE.
- Put layout utilities on a wrapper, not on Font Awesome `fa` elements: the Font Awesome kit injects unlayered CSS that overrides `display`/`line-height` utilities on those elements.

## Examples of good prompts

- "Add a new screen and navigation entry; wire state using existing `redux` store."
- "Create a small hook in `utils/` to wrap local storage usage and add tests."

## Pagination and dashboard routes

- Listing pages paginate through the URL (`?page=N`). Page 1 is prerendered in `getStaticProps`; `utils/usePagedNews.ts` loads later pages in the browser (invalid `?page` values are replaced with the clean URL, pages past the end show "Halaman Tidak Ditemukan" with `noindex`). Use `utils/pagination.ts` helpers, the `Pagination` primitive from `@malanghub/ui` (real links), and `components/seo/ListingSeo.tsx` (canonical, prev/next, ItemList JSON-LD).
- The user dashboard is split into routes under `/users`: `/users` (overview), `/users/news`, `/users/news/drafts`, `/users/news/agreements` (admin), `/users/categories` (admin), `/users/tags` (admin). Wrap new dashboard pages in `components/users/DashboardLayout.tsx` (auth/admin guards, nav, noindex).

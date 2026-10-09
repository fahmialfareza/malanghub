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
  - `instrumentation-client.ts` for telemetry and logging setup.
  - `instrumentation.ts` for shared instrumentation utilities.
  - `next-env.d.ts` for Next.js type definitions.
  - `next.config.js` for Next.js configuration.
  - `nodemon.json` for development server configuration.
  - `package.json` for frontend dependencies and scripts.
  - `Readme.md` for frontend-specific documentation.
  - `sentry.edge.config.ts` for Sentry configuration.
  - `sentry.server.config.ts` for Sentry configuration.
  - `tsconfig.json` for TypeScript configuration.
  - `tsconfig.tsbuildinfo.json` for TypeScript build info configuration.

## Run & test

- Dev: `pnpm --filter frontend install && pnpm --filter frontend dev` (or `next dev` in `apps/frontend`).
- Build: `pnpm --filter frontend install && pnpm --filter frontend build` (or `next build` in `apps/frontend`).
- Deploy target is Cloudflare Workers via OpenNext: `pnpm preview` runs the build in the local Workers runtime, `pnpm run deploy` deploys. Don't add `export const runtime = "edge"`, and avoid Node APIs that workerd lacks (e.g. `fs` at request time).

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

- Listing pages paginate through the URL (`?page=N`) and render the list in `getServerSideProps` for SEO. Use `utils/pagination.ts` (`parsePage`, `firstPageRedirect`, `isPageOutOfRange`, `fetchNewsPage`), the `Pagination` primitive from `@malanghub/ui` (real links), and `components/seo/ListingSeo.tsx` (canonical, prev/next, ItemList JSON-LD). `?page=1`/invalid pages 308-redirect to the clean URL; pages past the end return 404.
- The user dashboard is split into routes under `/users`: `/users` (overview), `/users/news`, `/users/news/drafts`, `/users/news/agreements` (admin), `/users/categories` (admin), `/users/tags` (admin). Wrap new dashboard pages in `components/users/DashboardLayout.tsx` (auth/admin guards, nav, noindex).

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

## Style & safety

- Follow existing code patterns and conventions in the `apps/frontend` directory.
- Use TypeScript for type safety and maintainability.
- Write clear, concise code with meaningful variable and function names.
- Add comments where necessary to explain complex logic or decisions.
- Ensure new components are reusable and follow the design system (if applicable).

## Examples of good prompts

- "Add a new screen and navigation entry; wire state using existing `redux` store."
- "Create a small hook in `utils/` to wrap local storage usage and add tests."

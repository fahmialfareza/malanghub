# AGENTS.md

This repository supports coding agents that look for a root `AGENTS.md`, including Codex-style workflows.

## Read Order

1. Read `AGENT_CONTEXT.md` first. It is the shared source of truth for repository-wide guidance.
2. Follow the relevant file-level instructions under `.github/instructions/` for the area you are editing.
3. Prefer nearby code patterns over generic framework defaults when they conflict.

## Area Guides

- `apps/backend/**/*.go`: follow `.github/instructions/backend.instructions.md`.
- `apps/frontend/**/*.{ts,tsx,js,jsx}`: follow `.github/instructions/frontend.instructions.md`.
- `apps/server/**/*.ts`: only touch this deprecated app when the user explicitly asks, and follow `.github/instructions/server.instructions.md`.

## Repo Expectations

- Keep changes minimal, local, and consistent with the existing monorepo structure.
- Use `pnpm` for JavaScript or TypeScript package changes.
- Keep Go changes idiomatic and `gofmt`-compatible.
- Do not add secrets or embed credentials.
- Do not introduce heavy new services or dependencies without explaining the tradeoffs.
- Do not add a new test framework unless the user explicitly requests it.
- If work is driven by `.github/tasks/features/*.feature.md`, `.github/tasks/fixes/*.fix.md`, or `.github/tasks/chores/`, update the checklist as items are completed.

## Response Expectations

- Mention the affected app or apps.
- Include the validation you ran, or say when validation was not available.
- Include manual verification steps when behavior changes are not covered by existing automation.

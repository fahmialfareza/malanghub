# Malanghub Agent Context

This file is the shared source of truth for AI coding agents working in this repository. Keep this file aligned with `.github/copilot-instructions.md`, `AGENTS.md`, and `CLAUDE.md` whenever shared repository guidance changes.

## Project Snapshot

- Monorepo for `Malanghub`.
- Primary apps:
  - `apps/backend`: Go backend using Gin Gonic.
  - `apps/frontend`: Next.js frontend using `pnpm`.
  - `apps/server`: older Express server that is being phased out. Avoid new work here unless explicitly requested.

## Working Rules

- Prefer minimal, focused changes over broad rewrites.
- Follow the existing directory structure and package boundaries.
- Do not introduce secrets, API keys, or credentials. If a change needs configuration, document the required environment variables instead.
- Prefer existing internal packages and utilities before creating new abstractions.
- Do not add heavy new third-party services or dependencies without noting the tradeoffs.
- Use `pnpm` for JavaScript or TypeScript dependency changes.
- Keep Go changes idiomatic and formatted with `gofmt`.
- Keep frontend TypeScript and JavaScript changes aligned with existing Next.js patterns and formatting.

## Repo-Specific Guidance

- Backend Go conventions live in `.github/instructions/backend.instructions.md`.
- Frontend conventions live in `.github/instructions/frontend.instructions.md`.
- Deprecated server conventions live in `.github/instructions/server.instructions.md`.
- Shared task prompts live in `.github/prompts/`.
- When implementing work from `.github/tasks/features/*.feature.md`, `.github/tasks/fixes/*.fix.md`, or `.github/tasks/chores/`, update the task checklist as you complete items.
- Task templates and working specs live under `.github/tasks/`.

## Testing And Validation

- There is no established unit test framework configured for routine use in this repo, so prefer targeted validation with existing commands and manual verification steps.
- If you change build, CI, or runtime behavior, mention the relevant verification steps in your summary.
- Keep validation scoped to the files or app you changed whenever possible.

## Common Commands

From the repo root:

- `pnpm run dev:backend`
- `pnpm run dev:frontend`
- `pnpm run dev:server`
- `pnpm run format:all`

Backend development can also use the VS Code debugger when configured.

## Commit Guidance

- Follow Conventional Commits: `type(scope): subject`.
- Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `perf`, `build`, `ci`, `revert`.

## Maintenance

- Update this file first when shared agent guidance changes.
- Keep agent-specific files thin; they should reference this file instead of duplicating large blocks of repo facts.

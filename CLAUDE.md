# CLAUDE.md

This repository supports Claude Code. Use this file as the entrypoint, but treat `AGENT_CONTEXT.md` as the authoritative shared guidance.

## Start Here

1. Read `AGENT_CONTEXT.md` before planning or editing.
2. Load the relevant `.github/instructions/*.instructions.md` file for the files you will change.
3. Follow existing local patterns in the nearest package, module, or component before introducing new structure.

## Project Rules

- Primary apps are `apps/backend` and `apps/frontend`.
- `apps/server` is deprecated; avoid new work there unless explicitly requested.
- Prefer focused edits over broad rewrites.
- Use `pnpm` for frontend dependency or script work.
- Keep Go code idiomatic and formatted with `gofmt`.
- Do not introduce secrets, API keys, or credentials into the repository.
- Avoid heavy new dependencies or services unless the tradeoffs are documented.
- Do not add a new test framework unless the user explicitly asks for it.

## Task Workflow

- If the task references `.github/tasks/features/*.feature.md`, `.github/tasks/fixes/*.fix.md`, or `.github/tasks/chores/`, update the checklist as work is completed.
- When requirements are ambiguous, prefer small incremental changes and state the assumption clearly.
- Keep final summaries short and include affected apps plus validation or manual verification steps.

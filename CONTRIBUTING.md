# Contributing

This repository supports both human contributors and AI-assisted workflows.

## Start Here

1. Read `AGENT_CONTEXT.md` for the shared repository rules.
2. Use `AGENTS.md` when working with Codex-style agents.
3. Use `CLAUDE.md` when working with Claude Code.
4. Use `.github/copilot-instructions.md` when working with GitHub Copilot.

## AI Workflow

1. Start from the shared repository context in `AGENT_CONTEXT.md`.
2. Load the relevant file-level guidance from `.github/instructions/` for the files you will touch.
3. If the work needs structure or checklists, create or update a task file under `.github/tasks/`.
4. Use a reusable prompt from `.github/prompts/` when you want a consistent review, refactor, or task-creation workflow.
5. Keep changes small, validate the touched area, and update the task checklist as items are completed.

## Task Files

- `.github/tasks/features/`: new capabilities or meaningful enhancements.
- `.github/tasks/fixes/`: bug fixes and regressions.
- `.github/tasks/chores/`: maintenance, tooling, and documentation work.

Each task should describe scope, constraints, a checklist, and validation.

## Prompt Files

- `.github/prompts/create-task-spec.prompt.md`: create or update a task specification.
- `.github/prompts/work-from-task-spec.prompt.md`: execute work from a task specification.
- `.github/prompts/bootstrap-feature.prompt.md`: scope and start a feature workflow.
- `.github/prompts/triage-fix.prompt.md`: triage a bug and drive the first fix slice.
- `.github/prompts/review-changes.prompt.md`: run a review-focused workflow.
- `.github/prompts/refactor-scope.prompt.md`: run a scoped refactor workflow.

## Validation Expectations

- Prefer the narrowest useful validation for the changed area.
- If there is no automated check, document the manual verification performed.
- Mention the affected app or package in summaries or pull requests.

## Repository Notes

- `apps/backend` is the primary Go backend.
- `apps/frontend` is the primary Next.js frontend.
- `apps/server` is deprecated and should only receive changes when explicitly requested.
- Use `pnpm` for JavaScript and TypeScript dependency changes.
- Do not commit secrets, API keys, or embedded credentials.

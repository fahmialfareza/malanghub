# Malanghub

Malanghub is a monorepo for the backend and frontend applications that power the project.

## Apps

- `apps/backend`: Go backend built with Gin Gonic.
- `apps/frontend`: Next.js frontend managed with `pnpm`.
- `apps/server`: legacy Express server that is being phased out.

## Common Commands

- `pnpm run dev:backend`
- `pnpm run dev:frontend`
- `pnpm run dev:server`
- `pnpm run format:all`

## AI Agents

This repository now includes shared guidance for multiple coding agents.

- `AGENT_CONTEXT.md`: shared source of truth for repository-wide AI guidance.
- `AGENTS.md`: root entrypoint for Codex-style agents.
- `CLAUDE.md`: root entrypoint for Claude Code.
- `CONTRIBUTING.md`: contributor workflow guide for humans and AI-assisted work.
- `.github/copilot-instructions.md`: GitHub Copilot-specific instruction file.
- `.github/prompts/`: reusable prompt templates for task creation, feature bootstrap, fix triage, review, and refactoring.
- `.github/tasks/`: shared feature, fix, and chore task specifications.

## Recommended Workflow

1. Start from `AGENT_CONTEXT.md`.
2. Load the relevant file-level rules from `.github/instructions/`.
3. Create or update a task spec in `.github/tasks/` when work needs a checklist.
4. Execute the work in small, validated steps.
5. Update the checklist as items are completed.

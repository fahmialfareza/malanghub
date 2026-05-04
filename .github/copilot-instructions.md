# GitHub Copilot Instructions — Malanghub

## Purpose

This file tells GitHub Copilot how to behave when working inside this repository. Use it to produce code, tests, documentation, and CI changes that match the project's architecture, languages, and conventions.

Shared repository facts that should stay aligned across Copilot, Codex, and Claude Code now live in `AGENT_CONTEXT.md`. Keep that file in sync when updating assistant guidance, and keep this file focused on Copilot-specific workflow details.

## Read Order

1. Read `AGENT_CONTEXT.md` first for repository-wide rules.
2. Load the relevant file-level instructions under `.github/instructions/` for the paths you touch.
3. Use the reusable prompts under `.github/prompts/` and the task specs under `.github/tasks/` when the work benefits from a checklist-driven workflow.

## Copilot Workflow

- Prefer minimal, focused changes to existing files rather than large rewrites.
- Follow existing local patterns before introducing new abstractions.
- Mention affected apps and validation in your final summary.
- If the work is feature, fix, or chore driven, create or update the matching task spec under `.github/tasks/` and keep its checklist current.
- Follow Conventional Commits guidance from `.github/skills/commit-standards.skill.md` when preparing commit messages.

## Copilot Hooks

- Post-edit formatting: automatically formats files after Copilot edits them.
  - Go files in `apps/backend`: formatted with `gofmt`
  - TypeScript/JavaScript files in `apps/frontend`: formatted with `prettier`
- See `.github/hooks/README.md` for details.

## Reusable Prompts

- `.github/prompts/create-task-spec.prompt.md`: create or update a task specification.
- `.github/prompts/work-from-task-spec.prompt.md`: execute work from a task specification.
- `.github/prompts/bootstrap-feature.prompt.md`: bootstrap a feature workflow from scoping through the first implementation slice.
- `.github/prompts/triage-fix.prompt.md`: triage and repair a bug with a local hypothesis and focused validation.
- `.github/prompts/review-changes.prompt.md`: review a change with a findings-first mindset.
- `.github/prompts/refactor-scope.prompt.md`: refactor a scoped area with minimal behavioral change.

## Maintenance Notes

- Update `AGENT_CONTEXT.md` first when shared repository rules change.
- Keep `AGENTS.md`, `CLAUDE.md`, and this file aligned by referencing the same shared guidance instead of copying large sections.
- Keep this file limited to Copilot-specific workflow details, hooks, and prompt entrypoints.

— End of instructions —

## Task Specifications

- When implementing features in the `.github/tasks/features/*.feature.md` files, follow the existing structure and conventions and check off the features as they are completed.
- When fixing bugs in the `.github/tasks/fixes/*.fix.md` files, follow the existing structure and conventions and check off the fixes as they are completed.
- When performing chores, create task specifications in `.github/tasks/chores/` following the same pattern.

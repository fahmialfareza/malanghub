# Chore: improve multi-agent repository support

## Summary

Make the repository easier to use with GitHub Copilot, Codex, and Claude Code by establishing shared agent guidance, prompt templates, and task specification scaffolding.

## Scope

- Affected app or package: repository root and `.github/` guidance files.
- In scope: shared agent docs, prompt templates, and task templates.
- Out of scope: runtime code changes in application packages.

## Checklist

- [x] Add shared repository guidance for multiple AI agents.
- [x] Add root entrypoints for Codex and Claude Code.
- [x] Keep `.github/copilot-instructions.md` aligned with the shared guidance.
- [x] Add a root README that documents the agent entrypoints.
- [x] Add reusable prompt templates under `.github/prompts/`.
- [x] Add shared task templates under `.github/tasks/`.
- [x] Validate the new instruction and template files.

## Validation

- [x] Review the created files for consistency.
- [x] Check git status or diff for the touched documentation files.

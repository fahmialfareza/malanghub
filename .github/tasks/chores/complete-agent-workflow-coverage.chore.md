# Chore: complete shared agent workflow coverage

## Summary

Round out the shared AI workflow surface by adding prompts for feature bootstrap and fix triage, then reduce duplication in the Copilot-specific instructions.

## Scope

- Affected app or package: repository root and `.github/` guidance files.
- In scope: prompt templates, contributor-facing docs, and Copilot instruction cleanup.
- Out of scope: runtime code changes in application packages.

## Checklist

- [x] Confirm the remaining workflow gaps.
- [x] Add a feature bootstrap prompt.
- [x] Add a fix triage prompt.
- [x] Update contributor-facing docs to include the new prompts.
- [x] Normalize `.github/copilot-instructions.md` so it references shared guidance instead of duplicating it.
- [x] Validate the new prompt and instruction changes.

## Validation

- [x] Review the created files for consistency.
- [x] Check git status or diff for the touched documentation files.

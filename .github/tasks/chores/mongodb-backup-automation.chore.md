# Chore: automate weekly MongoDB backups

## Summary

Add repository-level automation for weekly MongoDB backups to Cloudflare R2, plus restore documentation and a local restore helper script.

## Scope

- Affected app or package: repository root, `.github/workflows/`, `docs/`, and `scripts/`.
- In scope: scheduled/manual backup workflow, restore script, and backup documentation.
- Out of scope: application runtime code changes and database schema changes.

## Checklist

- [x] Confirm the files and repository-level tooling surface to update.
- [x] Add a GitHub Actions workflow for weekly and manual MongoDB backups.
- [x] Add a restore helper script that restores a compressed archive into `RESTORE_MONGODB_URI` with confirmation.
- [x] Document secrets, workflow behavior, manual runs, restore steps, and verification guidance.
- [x] Validate the workflow file, restore script, and resulting repository changes.

## Validation

- [x] Run `bash -n scripts/restore-mongodb.sh`.
- [x] Parse `.github/workflows/mongodb-backup.yml` with Ruby YAML and review the required schedule, backup path, and restore references.

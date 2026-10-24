# Chore: Move the backend from MongoDB to Postgres (GORM)

## Summary

Run `apps/backend` on the Railway Postgres instance (its own `malanghub` database) through GORM, instead of MongoDB. Ask AI keeps hybrid retrieval: Postgres full-text search plus pgvector, replacing `$text` and Atlas `$vectorSearch`. Existing ObjectIDs are kept as 24-char hex string IDs, so the API contract and client links don't change.

## Scope

- Affected app or package: `apps/backend`, `.github/workflows`
- In scope: data layer (`pkg/db`, `models`, controllers, middleware, `pkg/ai`), one-off Mongo → Postgres migration command, backup workflow, docs.
- Out of scope: frontend/native changes; deleting MongoDB and its backup workflow (after cut-over is confirmed).

## Checklist

- [x] Add GORM, Postgres driver (pgx v5), pgvector-go and New Relic `nrpgx5`.
- [x] `pkg/db`: connection, `Migrate` (AutoMigrate + feed/filter/full-text indexes), shared scopes (`NotDeleted`, `Published`, `WithNewsRelations`).
- [x] `models`: GORM structs with hex string IDs; JSON keeps `_id`/`id`, populated user/category/tags, no password.
- [x] Port controllers, `AdvancedResults`, admin/JWT middleware and validators.
- [x] Ask AI: pgvector `news_embeddings` (HNSW, cosine) and OR'ed full-text keyword search.
- [x] `cmd/migrate-mongo` one-off copy tool (idempotent, orphan-safe, prints counts).
- [x] `postgres-backup.yml` workflow, README and `.env.example`.
- [x] Railway: confirm pgvector is available (`vector` 0.8.7 in `pg_available_extensions`).
- [x] Railway: create the `malanghub` database.
- [x] Railway: set `DATABASE_URL` on the malanghub service to the `/malanghub` database.
- [x] Run `cmd/migrate-mongo` against production, deploy, `POST /api/ai/reindex`.
- [x] Add the `DATABASE_URL` repository secret for the backup workflow.
- [x] Remove `MONGO_*` service variables, the `MONGO_URI` secret, the Mongo backup workflow, restore script and doc, and `cmd/migrate-mongo`.

## Validation

- [x] `gofmt -l .`, `go vet ./...`, `go build ./...`, `go test ./...` in `apps/backend`.
- [x] Local run against `pgvector/pgvector:pg17` + `mongo:7` seeded with legacy-shaped data: migration (run twice), news list filters/sort/search/select, news by slug, drafts, approve, myNews, category CRUD + duplicates, comments + replies, signup/signin/profile, hard delete, Ask AI keyword + vector ordering.
- [x] Production smoke test after cut-over.
- [x] Manual `postgres-backup.yml` run uploaded a `pg_dump` (v18) archive to R2.

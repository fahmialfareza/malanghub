# Backend (Go / Gin) scaffold

Go (Gin) API for Malanghub, backed by Postgres (GORM) and Redis.

Environment variables (use `.env` or export in your shell):

- `DATABASE_URL` - Postgres connection URL (default: `postgres://localhost:5432/malanghub?sslmode=disable`). The schema is created/updated automatically on startup.
- `DB_MAX_OPEN_CONNS` / `DB_MAX_IDLE_CONNS` - Postgres connection pool size (defaults `10` / `2`).
- `GEMINI_EMBED_DIM` - Ask AI embedding size (default `768`); it fixes the `news_embeddings.embedding` column size when the table is first created.
- `PORT` - HTTP server port (default: `8080`)
- `GOOGLE_ALLOWED_CLIENT_IDS` - comma-separated Google OAuth client IDs accepted for native ID-token login.
- `GOOGLE_SERVER_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID` / `GOOGLE_CLIENT_ID` - accepted fallback Google OAuth audience envs for ID-token login.
- `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` - optional accepted platform client IDs for native login.

Quick start:

```bash
# Postgres with pgvector (needed for Ask AI vector search)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=malanghub pgvector/pgvector:pg17

cd apps/backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/malanghub?sslmode=disable"
go run .
```

If the `vector` extension is unavailable, the API still runs; Ask AI falls back to
Postgres full-text (keyword) search and logs a warning.

## Migrating from MongoDB

`cmd/migrate-mongo` copies users, categories, tags, news (with tag links), comments
and replies from MongoDB into Postgres. It keeps every ObjectID as the row ID, so
URLs and IDs held by clients stay valid. It is safe to re-run; existing rows are
skipped, and documents that reference a missing user are skipped with a log line
(a missing category is set to `NULL`, missing tags are dropped). It prints
per-collection counts at the end to compare.

```bash
MONGO_URI="mongodb+srv://..." DATABASE_URL="postgres://..." go run ./cmd/migrate-mongo
```

Ask AI embeddings are not copied. After the cut-over, call `POST /api/ai/reindex`
as an admin (or wait for the `AI_SYNC_INTERVAL` loop) to rebuild them.

### Railway cut-over

1. Check that the Postgres service has pgvector: run `CREATE EXTENSION IF NOT EXISTS vector;`
   with psql. If it fails, either move the service to the `pgvector/pgvector:pg<major>` image
   (back up every database on it first; other projects share this instance) or add a
   dedicated pgvector Postgres service for Malanghub.
2. `CREATE DATABASE malanghub;` and set `DATABASE_URL` on the malanghub service to the
   `/malanghub` database (Railway reference variables work, e.g. replace the database name
   in `${{Postgres.DATABASE_URL}}`).
3. Run `go run ./cmd/migrate-mongo` once against production, deploy, and smoke-test.
4. Run `POST /api/ai/reindex`, then remove `MONGO_URI` from the service.
5. Add a `DATABASE_URL` repository secret for `.github/workflows/postgres-backup.yml`.

Endpoints:

- `GET /api/users` - list users
- `POST /api/users` - create user (JSON body)

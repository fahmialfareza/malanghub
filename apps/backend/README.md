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

## Operations

- **Ask AI index:** embeddings are synced ~30s after boot and every `AI_SYNC_INTERVAL`
  (default `6h`). An admin can force a sync with `POST /api/ai/reindex`.
- **Backups:** `.github/workflows/postgres-backup.yml` runs `pg_dump` weekly to Cloudflare R2
  (`postgres/weekly/`, kept 4 weeks) using the `DATABASE_URL` repository secret. Restore with
  `pg_restore --no-owner --dbname="$DATABASE_URL" <file>.dump`.

The data was migrated from MongoDB in October 2026; IDs keep the ObjectID format so old
links stay valid.

Endpoints:

- `GET /api/users` - list users
- `POST /api/users` - create user (JSON body)

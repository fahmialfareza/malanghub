# Backend (Go / Gin) scaffold

This folder contains a minimal Gin + MongoDB starter to migrate from the existing Node/Express backend.

Environment variables (use `.env` or export in your shell):

- `MONGO_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `PORT` - HTTP server port (default: `8080`)
- `GOOGLE_ALLOWED_CLIENT_IDS` - comma-separated Google OAuth client IDs accepted for native ID-token login.
- `GOOGLE_SERVER_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID` / `GOOGLE_CLIENT_ID` - accepted fallback Google OAuth audience envs for ID-token login.
- `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` - optional accepted platform client IDs for native login.

Quick start:

```bash
cd apps/backend
go get ./...
go run .
```

Endpoints:

- `GET /api/users` - list users
- `POST /api/users` - create user (JSON body)

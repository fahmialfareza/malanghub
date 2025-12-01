# Backend (Go / Gin) scaffold

This folder contains a minimal Gin + MongoDB starter to migrate from the existing Node/Express backend.

Environment variables (use `.env` or export in your shell):

- `MONGO_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `PORT` - HTTP server port (default: `8080`)

Quick start:

```bash
cd apps/backend
go get ./...
go run .
```

Endpoints:

- `GET /api/users` - list users
- `POST /api/users` - create user (JSON body)

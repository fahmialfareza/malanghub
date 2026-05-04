---
name: "Backend Go coding conventions"
description: "Coding conventions for Go files"
applyTo: "apps/backend/**/*.go"
---

# Copilot Instructions — apps/backend

## Purpose

Guidance for working in the Go backend:

- Gin Gonic framework for HTTP handling.
- MVC architecture and patterns which have `controllers/`, `models/`, and `pkg/`.

## Key points

- Language: Go. Use idiomatic Go patterns (`context.Context`, error handling). Run `gofmt`.
- Structure:
  - `controllers/` contains the HTTP handlers and controller logic.
  - `models/` contains the data models and business logic.
  - `pkg/` contains reusable packages and utilities.
    - `pkg/auth` for authentication logic.
    - `pkg/cache` for caching utilities.
    - `pkg/cloudinary` for Cloudinary integration.
    - `pkg/db` for database configuration.
    - `pkg/logger` for logger utilities to track log which will send to New Relic.
    - `pkg/middleware` for HTTP middleware.
    - `pkg/newrelic` for New Relic integration.
    - `pkg/routes` for route definitions.
    - `pkg/validators` for input validation logic.
  - `backend.code-workspace.yaml` contains VSCode workspace configuration.
  - `Dockerfile` contains the Dockerfile for building the backend image.
  - `main.go` contains the main application entry point.

## Run

- Common tasks: `cd apps/backend` and use existing `bin/` artifacts for reference.
- Alternatively, run with VSCode debugger.

## Style & safety

- Use `gofmt`/`go vet`. Keep handlers thin; move business logic into usecases.

## Examples of good prompts

- "Create an internal cache wrapper under `pkg/cache`."

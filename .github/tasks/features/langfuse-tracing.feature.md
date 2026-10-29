# Feature: Langfuse tracing for Ask AI (Gemini and Groq)

## Summary

Trace every Ask AI model call in Langfuse v4 over OpenTelemetry, ported from catetin.ai's
`package/langfuse`. Each question becomes an `ask-ai` trace with the retrieval embedding and
one generation per Gemini/Groq attempt (model, token usage, latency, WARNING on failover,
ERROR when the last provider fails).

## Scope

- Affected app or package: `apps/backend` (`pkg/langfuse`, `pkg/ai`, `controllers/ai_controller.go`, `main.go`), `apps/frontend/pages/privacy.tsx`
- In scope: Langfuse exporter, generation/embedding observations, `ask-ai` and `ai-index-news` traces, graceful shutdown that flushes spans, docs and privacy note.
- Out of scope: prompt management, scores/feedback, tracing the deprecated `apps/server`.

## Constraints

- Tracing is a no-op when `LANGFUSE_PUBLIC_KEY` or `LANGFUSE_SECRET_KEY` is empty.
- Dedicated OpenTelemetry tracer provider, so New Relic is unaffected.
- New deps: `go.opentelemetry.io/otel`, `otel/sdk`, `otel/trace`, `otlptracehttp` v1.43.0 (same as catetin.ai).

## Checklist

- [x] Confirm the owning files or modules.
- [x] Add `pkg/langfuse` (exporter, observation helpers).
- [x] Providers report model and token usage (`Completion`).
- [x] Trace every chain attempt and embedding call.
- [x] `ask-ai` root trace in the controller; `ai-index-news` for background indexing.
- [x] Graceful shutdown that flushes spans.
- [x] Update `.env.example`, backend README and privacy page.
- [x] Validate the changed behavior with unit tests.
- [x] Add `LANGFUSE_*` variables to the Railway backend service.
- [ ] Check a live `ask-ai` trace after the deploy.

## Validation

- [x] `cd apps/backend && gofmt -l . && go vet ./... && go test ./...`
- [ ] Manual: ask a question with Langfuse keys set and check the `ask-ai` trace; set an invalid `GEMINI_API_KEY` and confirm a WARNING `gemini-ask` followed by `groq-ask`.

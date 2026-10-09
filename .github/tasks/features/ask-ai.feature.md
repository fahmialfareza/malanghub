# Feature: Tanya AI (Ask AI) about Malang Raya

## Summary

Free "Ask AI" for everyone: users ask about Malang Raya and get an answer grounded in Malanghub news (RAG), with links to the source articles. Retrieval is hybrid (MongoDB `$text` + Atlas Vector Search over Gemini embeddings, merged with Reciprocal Rank Fusion). Generation uses free-tier providers with failover (Gemini → Groq → related articles only).

## Scope

- Affected app or package: `apps/backend`, `apps/frontend`
- In scope: `POST /api/ai/ask`, admin `POST /api/ai/reindex`, embedding sync (hooks + periodic), per-IP rate limit, daily cap, `/ask` page, header link, privacy note.
- Out of scope: native app, multi-turn chat, streaming, external news ingestion, LLM re-ranking.

## Constraints

- Must cost nothing: free tiers only; quotas can change, so everything degrades gracefully.
- No SDKs; plain `net/http`. Model names and limits are env vars (see `apps/backend/.env.example`).
- Eligible articles match public listing: `approved: true` and not deleted.

## Checklist

- [x] Confirm the owning files or modules.
- [x] Backend: `pkg/ai` (providers, failover chain, chunking, indexing, hybrid retrieval, prompt).
- [x] Backend: text index, Atlas vector index, `cache.Incr`, `RateLimitByIP`, `controllers/ai_controller.go`, routes, news hooks, sync loop.
- [x] Frontend: `/ask` page, Redux (`aiActions`, `aiReducer`), header link, privacy policy entry.
- [x] Update `.env.example`.
- [ ] Set `GEMINI_API_KEY` / `GROQ_API_KEY` in production and run `POST /api/ai/reindex` once.
- [ ] Verify on Atlas (vector index + hybrid results).

## Validation

- [x] `go vet ./... && go build ./... && gofmt -l .` and `go test ./pkg/ai/` pass.
- [x] Provider tests against fake Gemini/Groq servers: request format (API key header, system instruction, embedding task type/dimension), response parsing, failover on 429 and 5xx, both-exhausted error, embeddings skip Groq, disabled without keys.
- [x] `pnpm --filter client check-types` and `pnpm --filter client build` pass.
- [x] Local smoke test (no AI keys, non-Atlas Mongo): validation 400, keyword hit returns `fallback: true` with sources, not-found answer, per-IP 429; vector index creation logs a warning and is skipped.
- [ ] With keys on Atlas: answers with citations, off-topic refusal, cached repeat, Groq failover when Gemini is out of quota.

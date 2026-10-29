package controllers

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/fahmialfareza/malanghub/backend/pkg/ai"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/langfuse"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

const (
	aiAnswerTTL      = 6 * time.Hour
	aiQuestionMinLen = 5
	aiQuestionMaxLen = 500
	aiNotFoundAnswer = "Maaf, Malanghub belum memiliki artikel yang membahas hal tersebut. Coba ajukan pertanyaan lain seputar Malang Raya."
)

type askAIRequest struct {
	Question string `json:"question"`
}

type askAIResponse struct {
	Answer   string      `json:"answer"`
	Sources  []ai.Source `json:"sources"`
	Fallback bool        `json:"fallback"`
	Provider string      `json:"provider,omitempty"`
}

// AskAI answers a question about Malang Raya from Malanghub news (RAG).
// When no AI provider is available it returns the related articles only.
func AskAI(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.AskAI")()

	var req askAIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "pertanyaan tidak valid"})
		return
	}
	question := strings.Join(strings.Fields(req.Question), " ")
	if n := utf8.RuneCountInString(question); n < aiQuestionMinLen || n > aiQuestionMaxLen {
		c.JSON(http.StatusBadRequest, gin.H{"message": "pertanyaan harus berisi 5 sampai 500 karakter"})
		return
	}

	sum := md5.Sum([]byte(strings.ToLower(question)))
	cacheKey := "ai:answer:" + hex.EncodeToString(sum[:])
	if cached, err := cache.Get(c, cacheKey); err == nil {
		var resp askAIResponse
		if json.Unmarshal(cached, &resp) == nil {
			c.JSON(http.StatusOK, gin.H{"data": resp})
			return
		}
	}

	// one Langfuse trace per answered question: retrieval embedding plus every
	// Gemini/Groq attempt; cache hits make no model call and are not traced
	ctx, span := ai.StartTrace(c, "ask-ai", nil)
	defer span.End()
	langfuse.SetInput(span, map[string]any{"question": question})

	sources, err := ai.Retrieve(ctx, question)
	if err != nil {
		langfuse.SetLevel(span, langfuse.LevelError, err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"message": "gagal mencari artikel"})
		return
	}
	if len(sources) == 0 {
		langfuse.SetMetadata(span, map[string]any{"sources": 0, "fallback_reason": "no_sources"})
		langfuse.SetOutput(span, map[string]any{"answer": aiNotFoundAnswer})
		c.JSON(http.StatusOK, gin.H{"data": askAIResponse{Answer: aiNotFoundAnswer, Sources: []ai.Source{}}})
		return
	}

	resp := askAIResponse{Sources: sources, Fallback: true}
	metadata := map[string]any{"sources": len(sources)}
	switch {
	case !ai.Default().Enabled():
		logger.Info("ai: no provider configured; returning related articles only")
		metadata["fallback_reason"] = "disabled"
	case !underDailyLimit(c):
		logger.Info("ai: AI_DAILY_LIMIT reached; returning related articles only")
		metadata["fallback_reason"] = "daily_limit"
	default:
		answer, provider, err := ai.Default().Generate(ctx, ai.SystemPrompt, ai.BuildPrompt(question, sources))
		if err == nil {
			resp.Answer, resp.Provider, resp.Fallback = answer, provider, false
			_ = cache.Set(c, cacheKey, resp, aiAnswerTTL)
		} else {
			logger.Error("ai: no answer, returning related articles only:", err)
			metadata["fallback_reason"] = "generate_failed"
			langfuse.SetLevel(span, langfuse.LevelError, err.Error())
		}
	}
	langfuse.SetMetadata(span, metadata)
	langfuse.SetOutput(span, askAITraceOutput(resp))

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// askAITraceOutput lists sources by title and slug, without excerpts.
func askAITraceOutput(resp askAIResponse) map[string]any {
	sources := make([]map[string]string, len(resp.Sources))
	for i, src := range resp.Sources {
		sources[i] = map[string]string{"id": src.ID, "title": src.Title, "slug": src.Slug}
	}
	return map[string]any{
		"answer":   resp.Answer,
		"provider": resp.Provider,
		"fallback": resp.Fallback,
		"sources":  sources,
	}
}

// underDailyLimit counts LLM calls per day across all users so the free quota
// is never exceeded (AI_DAILY_LIMIT, default 800; 0 disables the cap).
func underDailyLimit(ctx context.Context) bool {
	limit := 800
	if v, err := strconv.Atoi(os.Getenv("AI_DAILY_LIMIT")); err == nil {
		limit = v
	}
	if limit <= 0 {
		return true
	}
	key := "ai:daily:" + time.Now().UTC().Format("2006-01-02")
	n, err := cache.Incr(ctx, key, 25*time.Hour)
	return err != nil || n <= int64(limit)
}

// ReindexAI starts a background sync of news embeddings (admin only).
func ReindexAI(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.ReindexAI")()

	if !ai.Default().Enabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "AI provider not configured"})
		return
	}
	go ai.SyncAll(context.Background())
	c.JSON(http.StatusAccepted, gin.H{"data": gin.H{"message": "reindex started"}})
}

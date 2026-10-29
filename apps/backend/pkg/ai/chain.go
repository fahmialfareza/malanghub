package ai

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel/trace"

	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/langfuse"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

const (
	// quotaCooldown skips a provider after a 429; free-tier limits are often
	// per minute, so keep it short.
	quotaCooldown = time.Minute
	// notFoundCooldown skips a provider whose model is missing (retired or
	// misconfigured) until it is fixed or the backend restarts.
	notFoundCooldown = 10 * time.Minute
)

// ErrAllCoolingDown is returned when every provider is temporarily skipped.
var ErrAllCoolingDown = errors.New("ai: all providers are cooling down after recent failures")

// Chain tries providers in order so the feature keeps working when one free
// tier runs out. Embeddings only use the first provider that supports them,
// because vectors from different models are not comparable.
type Chain struct {
	providers []Provider
}

var (
	defaultChain *Chain
	chainOnce    sync.Once
)

// Default returns the process-wide chain built from AI_PROVIDERS
// (default "gemini,groq"). Providers without an API key are skipped.
func Default() *Chain {
	chainOnce.Do(func() {
		defaultChain = NewChain()
		// a restart usually follows a config change (keys, models), so give
		// every provider a fresh chance instead of honoring old cooldowns
		_ = cache.DeleteByPattern(context.Background(), "ai:cooldown:*")
	})
	return defaultChain
}

// NewChain builds a chain from env vars.
func NewChain() *Chain {
	c := &Chain{}
	var names []string
	for _, name := range strings.Split(getEnv("AI_PROVIDERS", "gemini,groq"), ",") {
		switch strings.TrimSpace(strings.ToLower(name)) {
		case "gemini":
			if p := NewGemini(); p != nil {
				c.providers = append(c.providers, p)
				names = append(names, p.Name()+"("+p.model+")")
			}
		case "groq":
			if p := NewGroq(); p != nil {
				c.providers = append(c.providers, p)
				names = append(names, p.Name()+"("+p.model+")")
			}
		}
	}
	if len(c.providers) == 0 {
		logger.Info("ai: no provider configured; Ask AI will return related articles only")
	} else {
		logger.Info("ai: providers:", strings.Join(names, ", "))
	}
	return c
}

// Enabled reports whether at least one provider is configured.
func (c *Chain) Enabled() bool {
	return c != nil && len(c.providers) > 0
}

// Generate returns the answer and the name of the provider that produced it.
func (c *Chain) Generate(ctx context.Context, system, prompt string) (string, string, error) {
	defer newrelicpkg.EndSegment(ctx, "ai.Chain.Generate")()
	if !c.Enabled() {
		return "", "", ErrNoProvider
	}
	ctx, endTrace := ensureTrace(ctx, "ask")
	defer endTrace()

	lastErr := ErrAllCoolingDown
	attempt := 0
	var skipped []string
	defer func() {
		if len(skipped) > 0 {
			langfuse.SetMetadata(trace.SpanFromContext(ctx), map[string]any{"skipped_providers": skipped})
		}
	}()
	for i, p := range c.providers {
		if ttl, ok := coolingDown(ctx, p.Name()); ok {
			logger.Info("ai: skipping", p.Name(), "- cooling down for", ttl.Round(time.Second), "after a recent failure")
			skipped = append(skipped, p.Name())
			continue
		}
		attempt++
		obs := startObservation(ctx, langfuse.ObservationGeneration, p.Name(), "ask", p.Model(), attempt, chatInput(system, prompt))
		completion, err := p.Generate(ctx, system, prompt)
		if err == nil && completion.Text == "" {
			err = errors.New(p.Name() + ": empty answer")
		}
		obs.endCompletion(completion, err, i < len(c.providers)-1)
		if err == nil {
			return completion.Text, p.Name(), nil
		}
		if ctx.Err() != nil {
			return "", "", ctx.Err()
		}
		switch {
		case errors.Is(err, ErrQuotaExceeded):
			startCooldown(ctx, p.Name(), quotaCooldown)
		case isModelNotFound(err):
			startCooldown(ctx, p.Name(), notFoundCooldown)
			logger.Error("ai:", p.Name(), "model not found; it may be retired — update the *_MODEL env var")
		}
		logger.Error("ai: generate failed, trying next provider:", err)
		lastErr = err
	}
	return "", "", lastErr
}

// Embed embeds texts with the first provider that supports embeddings.
func (c *Chain) Embed(ctx context.Context, texts []string, task TaskType) ([][]float32, error) {
	defer newrelicpkg.EndSegment(ctx, "ai.Chain.Embed")()
	if !c.Enabled() {
		return nil, ErrNoProvider
	}
	for _, p := range c.providers {
		em, ok := p.(embedder)
		if !ok {
			continue
		}
		if _, ok := coolingDown(ctx, p.Name()+":embed"); ok {
			return nil, ErrQuotaExceeded
		}
		ctx, endTrace := ensureTrace(ctx, "embed")
		obs := startObservation(ctx, langfuse.ObservationEmbedding, p.Name(), "embed", em.EmbedModel(), 1, map[string]any{
			"texts": len(texts),
			"task":  string(task),
		})
		vectors, err := p.Embed(ctx, texts, task)
		obs.end("", nil, map[string]any{"vectors": len(vectors), "dim": EmbedDim()}, err, false)
		endTrace()
		if errors.Is(err, ErrNotSupported) {
			continue
		}
		if errors.Is(err, ErrQuotaExceeded) {
			startCooldown(ctx, p.Name()+":embed", quotaCooldown)
		}
		return vectors, err
	}
	return nil, ErrNotSupported
}

// embedder is a provider that can embed text.
type embedder interface {
	EmbedModel() string
}

// isModelNotFound reports a 404 from a provider, which usually means the
// configured model was retired. Skipping it for a while avoids a wasted call
// on every question.
func isModelNotFound(err error) bool {
	var he *httpError
	return errors.As(err, &he) && he.Status == http.StatusNotFound
}

// coolingDown reports whether name is being skipped and for how much longer.
func coolingDown(ctx context.Context, name string) (time.Duration, bool) {
	ttl, err := cache.TTL(ctx, "ai:cooldown:"+name)
	return ttl, err == nil && ttl > 0
}

func startCooldown(ctx context.Context, name string, d time.Duration) {
	_ = cache.Set(ctx, "ai:cooldown:"+name, true, d)
}

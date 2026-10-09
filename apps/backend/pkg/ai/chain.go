package ai

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// cooldown is how long a provider is skipped after it reports an exhausted quota.
const cooldown = 10 * time.Minute

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
	})
	return defaultChain
}

// NewChain builds a chain from env vars.
func NewChain() *Chain {
	c := &Chain{}
	for _, name := range strings.Split(getEnv("AI_PROVIDERS", "gemini,groq"), ",") {
		switch strings.TrimSpace(strings.ToLower(name)) {
		case "gemini":
			if p := NewGemini(); p != nil {
				c.providers = append(c.providers, p)
			}
		case "groq":
			if p := NewGroq(); p != nil {
				c.providers = append(c.providers, p)
			}
		}
	}
	if len(c.providers) == 0 {
		logger.Info("ai: no provider configured; Ask AI will return related articles only")
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

	lastErr := ErrNoProvider
	for _, p := range c.providers {
		if coolingDown(ctx, p.Name()) {
			continue
		}
		text, err := p.Generate(ctx, system, prompt)
		if err == nil && text != "" {
			return text, p.Name(), nil
		}
		if err == nil {
			err = errors.New(p.Name() + ": empty answer")
		}
		if ctx.Err() != nil {
			return "", "", ctx.Err()
		}
		if errors.Is(err, ErrQuotaExceeded) {
			startCooldown(ctx, p.Name())
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
		if coolingDown(ctx, p.Name()+":embed") {
			return nil, ErrQuotaExceeded
		}
		vectors, err := p.Embed(ctx, texts, task)
		if errors.Is(err, ErrNotSupported) {
			continue
		}
		if errors.Is(err, ErrQuotaExceeded) {
			startCooldown(ctx, p.Name()+":embed")
		}
		return vectors, err
	}
	return nil, ErrNotSupported
}

func coolingDown(ctx context.Context, name string) bool {
	_, err := cache.Get(ctx, "ai:cooldown:"+name)
	return err == nil
}

func startCooldown(ctx context.Context, name string) {
	_ = cache.Set(ctx, "ai:cooldown:"+name, true, cooldown)
}

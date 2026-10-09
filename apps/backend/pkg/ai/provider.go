package ai

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strconv"
	"time"

	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// TaskType tells the embedding model how the text will be used.
type TaskType string

const (
	RetrievalDocument TaskType = "RETRIEVAL_DOCUMENT"
	RetrievalQuery    TaskType = "RETRIEVAL_QUERY"
)

var (
	// ErrQuotaExceeded is returned when a provider responds with HTTP 429.
	ErrQuotaExceeded = errors.New("ai: provider quota exceeded")
	// ErrNotSupported is returned when a provider does not implement an operation.
	ErrNotSupported = errors.New("ai: operation not supported by provider")
	// ErrNoProvider is returned when no provider is configured or available.
	ErrNoProvider = errors.New("ai: no provider available")
)

// Provider is an LLM backend used for answer generation and embeddings.
type Provider interface {
	Name() string
	Generate(ctx context.Context, system, prompt string) (string, error)
	Embed(ctx context.Context, texts []string, task TaskType) ([][]float32, error)
}

// httpError carries a non-2xx status from a provider so the chain can decide
// whether to fail over.
type httpError struct {
	Provider string
	Status   int
	Body     string
}

func (e *httpError) Error() string {
	return e.Provider + ": http " + strconv.Itoa(e.Status) + ": " + e.Body
}

func newHTTPClient() *http.Client {
	return newrelicpkg.InstrumentedHTTPClient(&http.Client{Timeout: 20 * time.Second})
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

// EmbedDim is the embedding vector size stored in Mongo and used by the
// Atlas vector search index.
func EmbedDim() int {
	return getEnvInt("GEMINI_EMBED_DIM", 768)
}

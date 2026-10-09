package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

// groqURL is a var so tests can point it at a fake server.
var groqURL = "https://api.groq.com/openai/v1/chat/completions"

// Groq is a generation-only fallback provider using Groq's OpenAI-compatible API.
type Groq struct {
	apiKey string
	model  string
	client *http.Client
}

// NewGroq returns nil when GROQ_API_KEY is not set.
func NewGroq() *Groq {
	key := strings.TrimSpace(getEnv("GROQ_API_KEY", ""))
	if key == "" {
		return nil
	}
	return &Groq{
		apiKey: key,
		model:  getEnv("GROQ_MODEL", "llama-3.3-70b-versatile"),
		client: newHTTPClient(),
	}
}

func (g *Groq) Name() string { return "groq" }

func (g *Groq) Generate(ctx context.Context, system, prompt string) (string, error) {
	payload, err := json.Marshal(map[string]interface{}{
		"model": g.model,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.2,
		"max_tokens":  1024,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqURL, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.apiKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return "", ErrQuotaExceeded
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", &httpError{Provider: g.Name(), Status: resp.StatusCode, Body: truncate(string(data), 300)}
	}

	var out struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(data, &out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", &httpError{Provider: g.Name(), Status: http.StatusBadGateway, Body: "empty choices"}
	}
	return strings.TrimSpace(out.Choices[0].Message.Content), nil
}

func (g *Groq) Embed(ctx context.Context, texts []string, task TaskType) ([][]float32, error) {
	return nil, ErrNotSupported
}

package ai

import (
	"bytes"
	"cmp"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/fahmialfareza/malanghub/backend/pkg/langfuse"
)

// geminiBaseURL is a var so tests can point it at a fake server.
var geminiBaseURL = "https://generativelanguage.googleapis.com/v1beta/models/"

// Gemini calls the Google Gemini REST API (free tier friendly, no SDK).
type Gemini struct {
	apiKey     string
	model      string
	embedModel string
	embedDim   int
	client     *http.Client
}

// NewGemini returns nil when GEMINI_API_KEY is not set.
func NewGemini() *Gemini {
	key := strings.TrimSpace(getEnv("GEMINI_API_KEY", ""))
	if key == "" {
		return nil
	}
	return &Gemini{
		apiKey:     key,
		model:      getEnv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
		embedModel: getEnv("GEMINI_EMBED_MODEL", "gemini-embedding-001"),
		embedDim:   EmbedDim(),
		client:     newHTTPClient(),
	}
}

func (g *Gemini) Name() string  { return "gemini" }
func (g *Gemini) Model() string { return g.model }

// EmbedModel is the configured embedding model.
func (g *Gemini) EmbedModel() string { return g.embedModel }

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

func (g *Gemini) Generate(ctx context.Context, system, prompt string) (Completion, error) {
	body := map[string]interface{}{
		"systemInstruction": geminiContent{Parts: []geminiPart{{Text: system}}},
		"contents":          []geminiContent{{Role: "user", Parts: []geminiPart{{Text: prompt}}}},
		// newer Gemini models think before answering and thinking tokens
		// count toward maxOutputTokens, so leave room beyond the answer itself
		"generationConfig": map[string]interface{}{
			"temperature":     0.2,
			"maxOutputTokens": 4096,
		},
	}

	var out struct {
		Candidates []struct {
			Content geminiContent `json:"content"`
		} `json:"candidates"`
		ModelVersion  string `json:"modelVersion"`
		UsageMetadata *struct {
			PromptTokenCount     int64 `json:"promptTokenCount"`
			CandidatesTokenCount int64 `json:"candidatesTokenCount"`
			ThoughtsTokenCount   int64 `json:"thoughtsTokenCount"`
			TotalTokenCount      int64 `json:"totalTokenCount"`
		} `json:"usageMetadata"`
	}
	if err := g.post(ctx, g.model+":generateContent", body, &out); err != nil {
		return Completion{}, err
	}

	result := Completion{Model: cmp.Or(out.ModelVersion, g.model)}
	if u := out.UsageMetadata; u != nil {
		// thinking tokens are billed as output
		result.Usage = &langfuse.Usage{
			Input:  u.PromptTokenCount,
			Output: u.CandidatesTokenCount + u.ThoughtsTokenCount,
			Total:  u.TotalTokenCount,
		}
	}
	if len(out.Candidates) == 0 {
		return result, &httpError{Provider: g.Name(), Status: http.StatusBadGateway, Body: "empty candidates"}
	}

	var sb strings.Builder
	for _, p := range out.Candidates[0].Content.Parts {
		sb.WriteString(p.Text)
	}
	result.Text = strings.TrimSpace(sb.String())
	return result, nil
}

func (g *Gemini) Embed(ctx context.Context, texts []string, task TaskType) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}
	requests := make([]map[string]interface{}, 0, len(texts))
	for _, t := range texts {
		requests = append(requests, map[string]interface{}{
			"model":                "models/" + g.embedModel,
			"content":              geminiContent{Parts: []geminiPart{{Text: t}}},
			"taskType":             string(task),
			"outputDimensionality": g.embedDim,
		})
	}

	var out struct {
		Embeddings []struct {
			Values []float32 `json:"values"`
		} `json:"embeddings"`
	}
	if err := g.post(ctx, g.embedModel+":batchEmbedContents", map[string]interface{}{"requests": requests}, &out); err != nil {
		return nil, err
	}
	if len(out.Embeddings) != len(texts) {
		return nil, &httpError{Provider: g.Name(), Status: http.StatusBadGateway, Body: "embedding count mismatch"}
	}

	vectors := make([][]float32, len(out.Embeddings))
	for i, e := range out.Embeddings {
		vectors[i] = e.Values
	}
	return vectors, nil
}

func (g *Gemini) post(ctx context.Context, path string, body interface{}, out interface{}) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, geminiBaseURL+path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.apiKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return fmt.Errorf("%s: %w: %s", g.Name(), ErrQuotaExceeded, truncate(string(data), 300))
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &httpError{Provider: g.Name(), Status: resp.StatusCode, Body: truncate(string(data), 300)}
	}
	return json.Unmarshal(data, out)
}

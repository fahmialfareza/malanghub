package ai

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// fakeServers starts fake Gemini and Groq APIs and points the providers at them.
func fakeServers(t *testing.T, gemini, groq http.HandlerFunc) {
	t.Helper()
	gs := httptest.NewServer(gemini)
	qs := httptest.NewServer(groq)
	oldGemini, oldGroq := geminiBaseURL, groqURL
	geminiBaseURL, groqURL = gs.URL+"/", qs.URL
	t.Cleanup(func() {
		gs.Close()
		qs.Close()
		geminiBaseURL, groqURL = oldGemini, oldGroq
	})
	t.Setenv("GEMINI_API_KEY", "test-gemini")
	t.Setenv("GROQ_API_KEY", "test-groq")
}

func geminiAnswer(text string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"candidates":[{"content":{"parts":[{"text":"` + text + `"}]}}]}`))
	}
}

func groqAnswer(text string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"` + text + `"}}]}`))
	}
}

func status(code int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(code) }
}

func TestGeminiGenerateRequest(t *testing.T) {
	var gotKey, gotPath string
	var body map[string]interface{}
	fakeServers(t, func(w http.ResponseWriter, r *http.Request) {
		gotKey, gotPath = r.Header.Get("x-goog-api-key"), r.URL.Path
		_ = json.NewDecoder(r.Body).Decode(&body)
		geminiAnswer("Halo Malang")(w, r)
	}, status(500))
	t.Setenv("GEMINI_MODEL", "test-model")

	got, err := NewGemini().Generate(context.Background(), "sys", "prompt")
	if err != nil || got != "Halo Malang" {
		t.Fatalf("got %q, %v", got, err)
	}
	if gotKey != "test-gemini" || gotPath != "/test-model:generateContent" {
		t.Fatalf("unexpected key %q or path %q", gotKey, gotPath)
	}
	if _, ok := body["systemInstruction"]; !ok {
		t.Fatalf("systemInstruction missing from request: %v", body)
	}
}

func TestGeminiEmbed(t *testing.T) {
	var body struct {
		Requests []struct {
			TaskType             string `json:"taskType"`
			OutputDimensionality int    `json:"outputDimensionality"`
		} `json:"requests"`
	}
	fakeServers(t, func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, ":batchEmbedContents") {
			t.Errorf("unexpected path %q", r.URL.Path)
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		_, _ = w.Write([]byte(`{"embeddings":[{"values":[0.1,0.2]},{"values":[0.3,0.4]}]}`))
	}, status(500))
	t.Setenv("GEMINI_EMBED_DIM", "2")

	vectors, err := NewGemini().Embed(context.Background(), []string{"a", "b"}, RetrievalQuery)
	if err != nil || len(vectors) != 2 || vectors[1][1] != 0.4 {
		t.Fatalf("got %v, %v", vectors, err)
	}
	if body.Requests[0].TaskType != "RETRIEVAL_QUERY" || body.Requests[0].OutputDimensionality != 2 {
		t.Fatalf("unexpected embed request: %+v", body.Requests[0])
	}
}

func TestChainFailover(t *testing.T) {
	cases := []struct {
		name         string
		gemini, groq http.HandlerFunc
		wantText     string
		wantProvider string
		wantErr      error
	}{
		{"gemini answers", geminiAnswer("dari gemini"), groqAnswer("dari groq"), "dari gemini", "gemini", nil},
		{"gemini quota exhausted", status(429), groqAnswer("dari groq"), "dari groq", "groq", nil},
		{"gemini server error", status(503), groqAnswer("dari groq"), "dari groq", "groq", nil},
		{"both out of quota", status(429), status(429), "", "", ErrQuotaExceeded},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			fakeServers(t, tc.gemini, tc.groq)
			text, provider, err := NewChain().Generate(context.Background(), "sys", "prompt")
			if text != tc.wantText || provider != tc.wantProvider {
				t.Fatalf("got (%q, %q), want (%q, %q)", text, provider, tc.wantText, tc.wantProvider)
			}
			if tc.wantErr != nil && !errors.Is(err, tc.wantErr) {
				t.Fatalf("got err %v, want %v", err, tc.wantErr)
			}
		})
	}
}

func TestChainEmbedSkipsGenerationOnlyProviders(t *testing.T) {
	fakeServers(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"embeddings":[{"values":[1,0]}]}`))
	}, status(500))
	t.Setenv("AI_PROVIDERS", "groq,gemini")

	vectors, err := NewChain().Embed(context.Background(), []string{"q"}, RetrievalQuery)
	if err != nil || len(vectors) != 1 {
		t.Fatalf("got %v, %v", vectors, err)
	}
}

func TestChainWithoutKeysIsDisabled(t *testing.T) {
	t.Setenv("GEMINI_API_KEY", "")
	t.Setenv("GROQ_API_KEY", "")
	c := NewChain()
	if c.Enabled() {
		t.Fatal("chain should be disabled without keys")
	}
	if _, _, err := c.Generate(context.Background(), "s", "p"); !errors.Is(err, ErrNoProvider) {
		t.Fatalf("got %v, want ErrNoProvider", err)
	}
}

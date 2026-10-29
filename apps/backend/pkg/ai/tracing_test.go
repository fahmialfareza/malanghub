package ai

import (
	"context"
	"net/http"
	"testing"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"

	"github.com/fahmialfareza/malanghub/backend/pkg/langfuse"
)

// recordSpans routes Langfuse spans to an in-memory recorder for the test.
func recordSpans(t *testing.T) *tracetest.SpanRecorder {
	t.Helper()
	recorder := tracetest.NewSpanRecorder()
	langfuse.SetProvider(sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(recorder)))
	t.Cleanup(func() { langfuse.SetProvider(nil) })
	return recorder
}

func spanAttr(s sdktrace.ReadOnlySpan, key string) string {
	for _, kv := range s.Attributes() {
		if string(kv.Key) == key {
			return kv.Value.Emit()
		}
	}
	return ""
}

func TestChainTracesEveryAttempt(t *testing.T) {
	recorder := recordSpans(t)
	fakeServers(t, status(503), groqAnswer("dari groq"))

	if _, _, err := NewChain().Generate(context.Background(), "sys", "prompt"); err != nil {
		t.Fatal(err)
	}

	spans := recorder.Ended()
	if len(spans) != 3 {
		t.Fatalf("got %d spans, want gemini, groq and the root", len(spans))
	}
	gemini, groq, root := spans[0], spans[1], spans[2]
	if root.Name() != "ai-ask" || spanAttr(root, "langfuse.observation.type") != langfuse.ObservationSpan {
		t.Fatalf("unexpected root span %q", root.Name())
	}
	if gemini.Name() != "gemini-ask" || spanAttr(gemini, "langfuse.observation.level") != langfuse.LevelWarning {
		t.Fatalf("failed gemini attempt should be a WARNING, got %q level %q", gemini.Name(), spanAttr(gemini, "langfuse.observation.level"))
	}
	if groq.Name() != "groq-ask" || spanAttr(groq, "langfuse.observation.type") != langfuse.ObservationGeneration {
		t.Fatalf("unexpected groq span %q", groq.Name())
	}
	if spanAttr(groq, "langfuse.observation.level") != "" || spanAttr(groq, "langfuse.trace.name") != "ai-ask" {
		t.Fatalf("groq generation should succeed inside the ai-ask trace: %v", groq.Attributes())
	}
	for _, s := range []sdktrace.ReadOnlySpan{gemini, groq} {
		if s.Parent().SpanID() != root.SpanContext().SpanID() {
			t.Fatalf("%s is not a child of the root span", s.Name())
		}
	}
}

func TestChainLastFailureIsError(t *testing.T) {
	recorder := recordSpans(t)
	fakeServers(t, status(503), status(503))

	if _, _, err := NewChain().Generate(context.Background(), "sys", "prompt"); err == nil {
		t.Fatal("want an error when every provider fails")
	}
	groq := recorder.Ended()[1]
	if spanAttr(groq, "langfuse.observation.level") != langfuse.LevelError {
		t.Fatalf("last failed attempt should be an ERROR: %v", groq.Attributes())
	}
}

func TestStartTraceJoinsExistingTrace(t *testing.T) {
	recorder := recordSpans(t)
	fakeServers(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"embeddings":[{"values":[1,0]}]}`))
	}, status(500))

	ctx, root := StartTrace(context.Background(), "ask-ai", nil)
	if _, err := NewChain().Embed(ctx, []string{"q"}, RetrievalQuery); err != nil {
		t.Fatal(err)
	}
	root.End()

	spans := recorder.Ended()
	if len(spans) != 2 {
		t.Fatalf("got %d spans, want the embedding and the root only", len(spans))
	}
	embed := spans[0]
	if embed.Name() != "gemini-embed" || spanAttr(embed, "langfuse.observation.type") != langfuse.ObservationEmbedding ||
		spanAttr(embed, "langfuse.trace.name") != "ask-ai" {
		t.Fatalf("unexpected embedding span %q: %v", embed.Name(), embed.Attributes())
	}
}

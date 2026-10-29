package langfuse

import (
	"context"
	"testing"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

func TestStartSetsLangfuseAttributes(t *testing.T) {
	recorder := tracetest.NewSpanRecorder()
	SetProvider(sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(recorder)))
	t.Cleanup(func() { SetProvider(nil) })
	t.Setenv("LANGFUSE_TRACING_ENVIRONMENT", "Production")

	ctx := WithTraceAttributes(context.Background(), "ask-ai", "u1", "s1")
	_, span := Start(ctx, "gemini-ask", ObservationGeneration)
	SetGeneration(span, "gemini-x", &Usage{Input: 1, Output: 2, Total: 3})
	SetLevel(span, LevelWarning, "quota")
	span.End()

	got := map[string]string{}
	for _, kv := range recorder.Ended()[0].Attributes() {
		got[string(kv.Key)] = kv.Value.Emit()
	}
	want := map[string]string{
		"langfuse.observation.type":          "generation",
		"langfuse.trace.name":                "ask-ai",
		"langfuse.user.id":                   "u1",
		"langfuse.session.id":                "s1",
		"langfuse.environment":               "production",
		"langfuse.observation.model.name":    "gemini-x",
		"langfuse.observation.usage_details": `{"input":1,"output":2,"total":3}`,
		"langfuse.observation.level":         "WARNING",
	}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("%s = %q, want %q", k, got[k], v)
		}
	}
}

func TestDisabledWithoutKeys(t *testing.T) {
	t.Setenv("LANGFUSE_PUBLIC_KEY", "")
	t.Setenv("LANGFUSE_SECRET_KEY", "")
	if err := Init(); err != nil || Enabled() {
		t.Fatalf("Init() = %v, Enabled() = %v; want a no-op tracer", err, Enabled())
	}
	_, span := Start(context.Background(), "x", ObservationSpan)
	if span.SpanContext().IsValid() {
		t.Fatal("no-op tracer should not record spans")
	}
	span.End()
}

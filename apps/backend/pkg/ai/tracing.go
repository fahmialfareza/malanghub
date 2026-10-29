package ai

import (
	"context"
	"time"

	"go.opentelemetry.io/otel/trace"

	"github.com/fahmialfareza/malanghub/backend/pkg/langfuse"
)

// StartTrace opens a named root span for an AI entry point. When ctx is
// already part of a Langfuse trace, it adds a child span instead, so the calls
// stay grouped under the caller.
func StartTrace(ctx context.Context, name string, metadata map[string]any) (context.Context, trace.Span) {
	if !langfuse.HasTrace(ctx) {
		ctx = langfuse.WithTraceAttributes(ctx, name, "", "")
	}
	ctx, span := langfuse.Start(ctx, name, langfuse.ObservationSpan)
	if len(metadata) > 0 {
		langfuse.SetMetadata(span, metadata)
	}
	return ctx, span
}

// ensureTrace makes sure every model call belongs to a named trace, even when
// its caller did not open one.
func ensureTrace(ctx context.Context, route string) (context.Context, func()) {
	if langfuse.HasTrace(ctx) {
		return ctx, func() {}
	}
	ctx, span := StartTrace(ctx, "ai-"+route, map[string]any{"route": route})
	return ctx, func() { span.End() }
}

// observation is one call to one provider. Every attempt (Gemini, then Groq)
// is its own observation, so Langfuse shows the model that actually answered
// and prices each call separately.
type observation struct {
	span      trace.Span
	model     string
	startedAt time.Time
}

func startObservation(ctx context.Context, observationType, provider, route, model string, attempt int, input any) observation {
	_, span := langfuse.Start(ctx, provider+"-"+route, observationType)
	langfuse.SetInput(span, input)
	langfuse.SetMetadata(span, map[string]any{
		"provider": provider,
		"route":    route,
		"attempt":  attempt,
	})
	return observation{span: span, model: model, startedAt: time.Now()}
}

// end records the outcome. A failed attempt that falls back to the next
// provider is a WARNING; the last attempt failing is an ERROR.
func (o observation) end(model string, usage *langfuse.Usage, output map[string]any, err error, fallsBack bool) {
	if model == "" {
		model = o.model
	}
	if output == nil {
		output = map[string]any{}
	}
	output["success"] = err == nil
	output["latency_ms"] = time.Since(o.startedAt).Milliseconds()
	if err != nil {
		output["error"] = err.Error()
		level := langfuse.LevelError
		if fallsBack {
			level = langfuse.LevelWarning
		}
		langfuse.SetLevel(o.span, level, err.Error())
	}
	langfuse.SetOutput(o.span, output)
	langfuse.SetGeneration(o.span, model, usage)
	o.span.End()
}

func (o observation) endCompletion(c Completion, err error, fallsBack bool) {
	o.end(c.Model, c.Usage, map[string]any{"content": c.Text}, err, fallsBack)
}

// chatInput is the generation input in the chat format Langfuse renders.
func chatInput(system, prompt string) []map[string]string {
	return []map[string]string{
		{"role": "system", "content": system},
		{"role": "user", "content": prompt},
	}
}

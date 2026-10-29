package langfuse

import (
	"context"
	"encoding/json"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// Observation types understood by Langfuse.
const (
	ObservationSpan       = "span"
	ObservationGeneration = "generation"
	ObservationEmbedding  = "embedding"
)

// Observation levels understood by Langfuse.
const (
	LevelDefault = "DEFAULT"
	LevelWarning = "WARNING"
	LevelError   = "ERROR"
)

// Usage holds token counts for a generation.
type Usage struct {
	Input  int64
	Output int64
	Total  int64
}

type traceAttributes struct {
	name      string
	userID    string
	sessionID string
}

type traceAttributesKey struct{}

// WithTraceAttributes stores trace-level attributes on ctx. Every observation
// started from ctx gets them, like propagate_attributes in the v4 SDKs, so
// user and session filters cover child generations too.
func WithTraceAttributes(ctx context.Context, name, userID, sessionID string) context.Context {
	return context.WithValue(ctx, traceAttributesKey{}, traceAttributes{name: name, userID: userID, sessionID: sessionID})
}

// HasTrace reports whether ctx already carries trace attributes, i.e. whether
// an observation started from ctx joins an existing trace.
func HasTrace(ctx context.Context) bool {
	_, ok := ctx.Value(traceAttributesKey{}).(traceAttributes)
	return ok
}

// Start begins an observation of the given type as a child of the span in ctx.
func Start(ctx context.Context, name, observationType string) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{attribute.String("langfuse.observation.type", observationType)}
	if ta, ok := ctx.Value(traceAttributesKey{}).(traceAttributes); ok {
		if ta.name != "" {
			attrs = append(attrs, attribute.String("langfuse.trace.name", ta.name))
		}
		if ta.userID != "" {
			attrs = append(attrs, attribute.String("user.id", ta.userID), attribute.String("langfuse.user.id", ta.userID))
		}
		if ta.sessionID != "" {
			attrs = append(attrs, attribute.String("session.id", ta.sessionID), attribute.String("langfuse.session.id", ta.sessionID))
		}
	}
	if env := tracingEnvironment(); env != "" {
		attrs = append(attrs, attribute.String("langfuse.environment", env))
	}
	return Tracer().Start(ctx, name, trace.WithAttributes(attrs...))
}

func SetInput(span trace.Span, input any) {
	span.SetAttributes(attribute.String("langfuse.observation.input", toJSON(input)))
}

func SetOutput(span trace.Span, output any) {
	span.SetAttributes(attribute.String("langfuse.observation.output", toJSON(output)))
}

func SetMetadata(span trace.Span, metadata map[string]any) {
	attrs := make([]attribute.KeyValue, 0, len(metadata))
	for key, value := range metadata {
		attrs = append(attrs, metadataAttribute("langfuse.observation.metadata."+key, value))
	}
	span.SetAttributes(attrs...)
}

// SetGeneration records the model and token usage of a generation.
func SetGeneration(span trace.Span, model string, usage *Usage) {
	if model != "" {
		span.SetAttributes(attribute.String("langfuse.observation.model.name", model))
	}
	if usage != nil {
		span.SetAttributes(attribute.String("langfuse.observation.usage_details", toJSON(map[string]int64{
			"input":  usage.Input,
			"output": usage.Output,
			"total":  usage.Total,
		})))
	}
}

func SetLevel(span trace.Span, level, statusMessage string) {
	span.SetAttributes(attribute.String("langfuse.observation.level", level))
	if statusMessage != "" {
		span.SetAttributes(attribute.String("langfuse.observation.status_message", statusMessage))
	}
	if level == LevelError {
		span.SetStatus(codes.Error, statusMessage)
	}
}

func metadataAttribute(key string, value any) attribute.KeyValue {
	switch v := value.(type) {
	case string:
		return attribute.String(key, v)
	case bool:
		return attribute.Bool(key, v)
	case int:
		return attribute.Int(key, v)
	case int64:
		return attribute.Int64(key, v)
	case uint:
		return attribute.Int64(key, int64(v))
	case float64:
		return attribute.Float64(key, v)
	default:
		return attribute.String(key, toJSON(v))
	}
}

func toJSON(value any) string {
	if s, ok := value.(string); ok {
		return s
	}
	data, err := json.Marshal(value)
	if err != nil {
		return ""
	}
	return string(data)
}

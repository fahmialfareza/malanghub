package langfuse

import (
	"context"
	"encoding/base64"
	"os"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
	"go.opentelemetry.io/otel/trace/noop"
)

const (
	serviceName      = "malanghub-backend"
	tracerName       = "github.com/fahmialfareza/malanghub/backend"
	otelTracesPath   = "/api/public/otel/v1/traces"
	defaultBaseURL   = "https://cloud.langfuse.com"
	exportTimeout    = 10 * time.Second
	batchFlushPeriod = 500 * time.Millisecond
)

var (
	mu       sync.RWMutex
	provider *sdktrace.TracerProvider
	tracer   trace.Tracer = noop.NewTracerProvider().Tracer(tracerName)
)

// Init exports traces to Langfuse v4 through its OpenTelemetry endpoint. The
// provider is dedicated (not the global one), so New Relic and other
// instrumentation never send spans to Langfuse. Tracing stays a no-op when
// LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY is not set.
func Init() error {
	publicKey := strings.TrimSpace(os.Getenv("LANGFUSE_PUBLIC_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("LANGFUSE_SECRET_KEY"))
	if publicKey == "" || secretKey == "" {
		return nil
	}

	baseURL := strings.TrimRight(baseURL(), "/")
	auth := base64.StdEncoding.EncodeToString([]byte(publicKey + ":" + secretKey))

	exporter, err := otlptracehttp.New(context.Background(),
		otlptracehttp.WithEndpointURL(baseURL+otelTracesPath),
		otlptracehttp.WithHeaders(map[string]string{
			"Authorization": "Basic " + auth,
			// Opts the OTLP endpoint into the Langfuse v4 ingestion path.
			"x-langfuse-ingestion-version": "4",
		}),
		otlptracehttp.WithCompression(otlptracehttp.GzipCompression),
		otlptracehttp.WithTimeout(exportTimeout),
	)
	if err != nil {
		return err
	}

	attrs := []attribute.KeyValue{semconv.ServiceName(serviceName)}
	if env := tracingEnvironment(); env != "" {
		attrs = append(attrs, semconv.DeploymentEnvironment(env))
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter, sdktrace.WithBatchTimeout(batchFlushPeriod)),
		sdktrace.WithResource(resource.NewSchemaless(attrs...)),
	)
	SetProvider(tp)
	return nil
}

// Enabled reports whether spans are exported to Langfuse.
func Enabled() bool {
	mu.RLock()
	defer mu.RUnlock()
	return provider != nil
}

// Tracer returns the Langfuse tracer, or a no-op tracer when disabled.
func Tracer() trace.Tracer {
	mu.RLock()
	defer mu.RUnlock()
	return tracer
}

// Shutdown flushes buffered spans; call it before the process exits.
func Shutdown(ctx context.Context) error {
	mu.RLock()
	tp := provider
	mu.RUnlock()
	if tp == nil {
		return nil
	}
	return tp.Shutdown(ctx)
}

// SetProvider swaps the tracer provider; tests pass one with a span recorder
// and reset it with nil.
func SetProvider(tp *sdktrace.TracerProvider) {
	mu.Lock()
	defer mu.Unlock()
	provider = tp
	if tp == nil {
		tracer = noop.NewTracerProvider().Tracer(tracerName)
		return
	}
	tracer = tp.Tracer(tracerName)
}

// baseURL reads LANGFUSE_BASE_URL (the v4 name), then LANGFUSE_HOST.
func baseURL() string {
	for _, key := range []string{"LANGFUSE_BASE_URL", "LANGFUSE_HOST"} {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" {
			return v
		}
	}
	return defaultBaseURL
}

func tracingEnvironment() string {
	return strings.ToLower(strings.TrimSpace(os.Getenv("LANGFUSE_TRACING_ENVIRONMENT")))
}

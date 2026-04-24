package newrelicpkg

import (
	"context"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	nrredis "github.com/newrelic/go-agent/v3/integrations/nrredis-v9"
	"github.com/newrelic/go-agent/v3/newrelic"
	redis "github.com/redis/go-redis/v9"
)

// Init initializes New Relic application if env vars are present.
// Returns nil,nil when New Relic is not configured (so callers can skip instrumentation).
func Init() (*newrelic.Application, error) {
	appName := os.Getenv("NEW_RELIC_APP_NAME")
	license := os.Getenv("NEW_RELIC_LICENSE_KEY")
	enabled := os.Getenv("NEW_RELIC_ENABLED")

	if license == "" || appName == "" {
		return nil, nil
	}
	if enabled == "false" {
		return nil, nil
	}

	app, err := newrelic.NewApplication(
		newrelic.ConfigAppName(appName),
		newrelic.ConfigLicense(license),
		newrelic.ConfigDistributedTracerEnabled(true),
	)
	if err != nil {
		return nil, err
	}
	return app, nil
}

// TransactionFromContext returns the New Relic transaction carried by ctx, if any.
func TransactionFromContext(ctx context.Context) *newrelic.Transaction {
	return newrelic.FromContext(ctx)
}

// ContextWithTransaction returns ctx with txn attached when txn is present.
func ContextWithTransaction(ctx context.Context, txn *newrelic.Transaction) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	if txn == nil {
		return ctx
	}
	return newrelic.NewContext(ctx, txn)
}

// EndSegment starts a named segment from ctx and returns its end function.
// It is safe to defer even when New Relic is not configured or no transaction
// is attached to the context.
func EndSegment(ctx context.Context, name string) func() {
	txn := newrelic.FromContext(ctx)
	if txn == nil {
		return func() {}
	}
	segment := txn.StartSegment(name)
	return segment.End
}

// GinTransactionContextMiddleware copies the nrgin transaction into the
// request context so downstream code can use either c or c.Request.Context().
func GinTransactionContextMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer EndSegment(c, "newrelic.GinTransactionContextMiddleware")()

		if txn := newrelic.FromContext(c); txn != nil {
			c.Request = c.Request.WithContext(newrelic.NewContext(c.Request.Context(), txn))
		}
		c.Next()
	}
}

// InstrumentRequest attaches ctx to req and preserves any New Relic transaction
// already present on ctx for NewRoundTripper/StartExternalSegment.
func InstrumentRequest(ctx context.Context, req *http.Request) *http.Request {
	if req == nil {
		return nil
	}
	if ctx != nil {
		req = req.WithContext(ctx)
	}
	if txn := newrelic.FromContext(req.Context()); txn != nil {
		return newrelic.RequestWithTransactionContext(req, txn)
	}
	return req
}

// InstrumentedHTTPClient returns a copy of client whose transport records
// outbound requests as New Relic external segments.
func InstrumentedHTTPClient(client *http.Client) *http.Client {
	if client == nil {
		client = http.DefaultClient
	}
	instrumented := *client
	instrumented.Transport = newrelic.NewRoundTripper(client.Transport)
	return &instrumented
}

// InstrumentHTTPClient mutates client so outbound requests are recorded as New
// Relic external segments.
func InstrumentHTTPClient(client *http.Client) {
	if client == nil {
		return
	}
	client.Transport = newrelic.NewRoundTripper(client.Transport)
}

// NewRedisClient creates a go-redis v9 client with New Relic datastore hooks.
// Redis calls must use a context carrying the transaction, for example the
// *gin.Context passed to handlers or ContextWithTransaction.
func NewRedisClient(opts *redis.Options) *redis.Client {
	client := redis.NewClient(opts)
	InstrumentRedisClient(client, opts)
	return client
}

// InstrumentRedisClient adds New Relic hooks to an existing go-redis v9 client.
func InstrumentRedisClient(client *redis.Client, opts *redis.Options) {
	if client == nil {
		return
	}
	client.AddHook(nrredis.NewHook(opts))
}

// InstrumentRedisClusterClient adds New Relic hooks to a go-redis v9 cluster client.
func InstrumentRedisClusterClient(client *redis.ClusterClient) {
	if client == nil {
		return
	}
	client.AddHook(nrredis.NewHook(nil))
}

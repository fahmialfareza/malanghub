package main

import (
	"cmp"
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/fahmialfareza/malanghub/backend/pkg/ai"
	"github.com/fahmialfareza/malanghub/backend/pkg/auth"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/langfuse"
	"github.com/fahmialfareza/malanghub/backend/pkg/middleware"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"github.com/fahmialfareza/malanghub/backend/pkg/routes"
	nrgin "github.com/newrelic/go-agent/v3/integrations/nrgin"
)

func main() {
	// Load .env file if present — only attempt when the file exists.
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			log.Printf("warning: failed to load .env: %v", err)
		}
	}

	// JWT_SECRET is read only after .env is loaded; refuse to start without it.
	if err := auth.Init(); err != nil {
		log.Fatalf("invalid auth config: %v", err)
	}

	// load env vars if present (user can use dir environment)
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://localhost:5432/malanghub?sslmode=disable"
		log.Println("DATABASE_URL not set; using default " + databaseURL)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	if err := db.Connect(ctx, databaseURL); err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer db.Close()

	// create or update the schema
	if err := db.Migrate(ctx); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// initialize Redis if configured (non-fatal)
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	cache.Connect(redisURL)

	// Ask AI: pgvector store + periodic embedding sync (non-fatal)
	ai.Migrate(context.Background())
	ai.StartSyncLoop()

	// Langfuse tracing for Ask AI (non-fatal; off without keys)
	if err := langfuse.Init(); err != nil {
		log.Printf("warning: langfuse init error: %v", err)
	} else if langfuse.Enabled() {
		log.Printf("langfuse tracing enabled")
	}

	// initialize New Relic if configured (non-fatal)
	nrApp, err := newrelicpkg.Init()
	if err != nil {
		log.Printf("warning: newrelic init error: %v", err)
	}
	if nrApp != nil {
		log.Printf("newrelic enabled")
	}

	// GIN_MODE is read here because gin's own init runs before .env is loaded.
	gin.SetMode(cmp.Or(os.Getenv("GIN_MODE"), gin.ReleaseMode))

	r := gin.Default()
	r.MaxMultipartMemory = middleware.MaxMultipartMemory
	// c.ClientIP() (used by the rate limits) trusts X-Forwarded-For only from
	// the proxies listed in TRUSTED_PROXIES; by default it uses the TCP peer.
	if err := r.SetTrustedProxies(trustedProxies()); err != nil {
		log.Fatalf("invalid TRUSTED_PROXIES: %v", err)
	}
	if h := os.Getenv("TRUSTED_PLATFORM_HEADER"); h != "" {
		// e.g. CF-Connecting-IP, only when the backend is reachable solely via that platform
		r.TrustedPlatform = h
	}
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}

	r.Use(nrgin.Middleware(nrApp))
	r.Use(newrelicpkg.GinTransactionContextMiddleware())
	r.Use(cors.New(config))
	// Compress responses for clients that accept it (Cloudflare and Worker
	// fetch do); JSON shrinks ~3x, which cuts Railway egress.
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	routes.Register(r)
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"message": "route not found"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{Addr: ":" + port, Handler: r}
	go func() {
		log.Printf("listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	// wait for a deploy or Ctrl+C, then drain requests and flush traces
	stop, cancelStop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancelStop()
	<-stop.Done()
	log.Println("shutting down")

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}
	if err := langfuse.Shutdown(shutdownCtx); err != nil {
		log.Printf("langfuse shutdown error: %v", err)
	}
}

// trustedProxies parses TRUSTED_PROXIES (comma-separated IPs or CIDRs).
func trustedProxies() []string {
	var proxies []string
	for _, p := range strings.Split(os.Getenv("TRUSTED_PROXIES"), ",") {
		if p = strings.TrimSpace(p); p != "" {
			proxies = append(proxies, p)
		}
	}
	return proxies
}

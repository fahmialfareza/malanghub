package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/fahmialfareza/malanghub/backend/pkg/ai"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
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

	// initialize New Relic if configured (non-fatal)
	nrApp, err := newrelicpkg.Init()
	if err != nil {
		log.Printf("warning: newrelic init error: %v", err)
	}
	if nrApp != nil {
		log.Printf("newrelic enabled")
	}

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}

	r.Use(nrgin.Middleware(nrApp))
	r.Use(newrelicpkg.GinTransactionContextMiddleware())
	r.Use(cors.New(config))

	routes.Register(r)
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"message": "route not found"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

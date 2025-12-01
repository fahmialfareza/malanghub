package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

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
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Println("MONGO_URI not set; using default mongodb://localhost:27017")
		mongoURI = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.Connect(ctx, mongoURI); err != nil {
		log.Fatalf("failed to connect to mongo: %v", err)
	}
	defer db.Disconnect(ctx)

	// ensure indexes
	if err := db.EnsureIndexes(ctx, db.Client()); err != nil {
		log.Printf("warning: could not ensure indexes: %v", err)
	}

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

	r.Use(cors.New(config))

	r.Use(nrgin.Middleware(nrApp))

	routes.Register(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

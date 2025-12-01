package redisclient

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var client *redis.Client

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func Init(ctx context.Context) error {
	if client != nil {
		return nil
	}
	addr := getEnv("REDIS_ADDR", "localhost:6379")
	pwd := getEnv("REDIS_PASSWORD", "")
	db := 0

	c := redis.NewClient(&redis.Options{Addr: addr, Password: pwd, DB: db})
	if err := c.Ping(ctx).Err(); err != nil {
		return err
	}
	client = c
	return nil
}

func GetClient() *redis.Client {
	return client
}

// CacheGet returns the raw string value or empty string if not found
func CacheGet(ctx context.Context, key string) (string, error) {
	if client == nil {
		if err := Init(ctx); err != nil {
			return "", err
		}
	}
	return client.Get(ctx, key).Result()
}

// CacheSetIfUnderSize marshals v to JSON and sets it if size < maxBytes
func CacheSetIfUnderSize(ctx context.Context, key string, v interface{}, ttl time.Duration, maxBytes int) error {
	if client == nil {
		if err := Init(ctx); err != nil {
			return err
		}
	}

	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	if len(b) >= maxBytes {
		// skip caching if too large
		return nil
	}
	return client.Set(ctx, key, b, ttl).Err()
}

// Convenience function to expose default max (1MB) used in Node
func CacheSetDefault(ctx context.Context, key string, v interface{}, ttl time.Duration) error {
	max := 1048576 // 1MB
	return CacheSetIfUnderSize(ctx, key, v, ttl, max)
}

package cache

import (
	"context"
	"encoding/json"
	"log"
	"time"

	redis "github.com/redis/go-redis/v9"

	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

var client *redis.Client

// Connect initializes the Redis client from a Redis URL (e.g. redis://localhost:6379).
// A failed connection is non-fatal; all cache ops become no-ops when client is nil.
func Connect(redisURL string) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("cache: failed to parse Redis URL: %v — caching disabled", err)
		return
	}

	c := newrelicpkg.NewRedisClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := c.Ping(ctx).Err(); err != nil {
		log.Printf("cache: Redis ping failed: %v — caching disabled", err)
		return
	}

	client = c
	log.Printf("cache: Redis connected")
}

// Client returns the underlying go-redis client (may be nil if not connected).
func Client() *redis.Client { return client }

// Get retrieves raw bytes stored at key. Returns redis.Nil when the key is absent.
func Get(ctx context.Context, key string) ([]byte, error) {
	defer newrelicpkg.EndSegment(ctx, "cache.Get")()
	if client == nil {
		return nil, redis.Nil
	}
	return client.Get(ctx, key).Bytes()
}

// Set JSON-encodes value and stores it at key with the given TTL.
// A zero TTL means no expiry.
func Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	defer newrelicpkg.EndSegment(ctx, "cache.Set")()
	if client == nil {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return client.Set(ctx, key, data, ttl).Err()
}

// Delete removes one or more keys.
func Delete(ctx context.Context, keys ...string) error {
	defer newrelicpkg.EndSegment(ctx, "cache.Delete")()
	if client == nil || len(keys) == 0 {
		return nil
	}
	return client.Del(ctx, keys...).Err()
}

// DeleteByPattern removes all keys matching a glob pattern using SCAN.
func DeleteByPattern(ctx context.Context, pattern string) error {
	defer newrelicpkg.EndSegment(ctx, "cache.DeleteByPattern")()
	if client == nil {
		return nil
	}
	var cursor uint64
	var keys []string
	for {
		batch, next, err := client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}
		keys = append(keys, batch...)
		cursor = next
		if cursor == 0 {
			break
		}
	}
	if len(keys) > 0 {
		return client.Del(ctx, keys...).Err()
	}
	return nil
}

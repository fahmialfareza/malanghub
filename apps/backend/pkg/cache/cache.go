package cache

import (
	"context"
	"encoding/json"
	"log"
	"time"

	redis "github.com/redis/go-redis/v9"

	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// KeyPrefix namespaces every key this package reads or writes.
const KeyPrefix = "malanghub:"

var client *redis.Client

// key returns k namespaced with KeyPrefix.
func key(k string) string { return KeyPrefix + k }

// keys returns ks namespaced with KeyPrefix.
func keys(ks []string) []string {
	out := make([]string, len(ks))
	for i, k := range ks {
		out[i] = key(k)
	}
	return out
}

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
// Keys used directly on it are not prefixed; wrap them with KeyPrefix.
func Client() *redis.Client { return client }

// Get retrieves raw bytes stored at key. Returns redis.Nil when the key is absent.
func Get(ctx context.Context, k string) ([]byte, error) {
	defer newrelicpkg.EndSegment(ctx, "cache.Get")()
	if client == nil {
		return nil, redis.Nil
	}
	return client.Get(ctx, key(k)).Bytes()
}

// TTL returns the remaining time to live of key. Returns redis.Nil when the
// key is absent or Redis is not connected.
func TTL(ctx context.Context, k string) (time.Duration, error) {
	defer newrelicpkg.EndSegment(ctx, "cache.TTL")()
	if client == nil {
		return 0, redis.Nil
	}
	ttl, err := client.TTL(ctx, key(k)).Result()
	if err != nil {
		return 0, err
	}
	// -2: key does not exist
	if ttl == -2 {
		return 0, redis.Nil
	}
	return ttl, nil
}

// Set JSON-encodes value and stores it at key with the given TTL.
// A zero TTL means no expiry.
func Set(ctx context.Context, k string, value interface{}, ttl time.Duration) error {
	defer newrelicpkg.EndSegment(ctx, "cache.Set")()
	if client == nil {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return client.Set(ctx, key(k), data, ttl).Err()
}

// Incr increments the counter at key and sets ttl when the key is new.
// Returns 0 and no error when Redis is not connected so callers fail open.
func Incr(ctx context.Context, k string, ttl time.Duration) (int64, error) {
	defer newrelicpkg.EndSegment(ctx, "cache.Incr")()
	if client == nil {
		return 0, nil
	}
	n, err := client.Incr(ctx, key(k)).Result()
	if err != nil {
		return 0, err
	}
	if n == 1 && ttl > 0 {
		_ = client.Expire(ctx, key(k), ttl).Err()
	}
	return n, nil
}

// Delete removes one or more keys.
func Delete(ctx context.Context, ks ...string) error {
	defer newrelicpkg.EndSegment(ctx, "cache.Delete")()
	if client == nil || len(ks) == 0 {
		return nil
	}
	return client.Del(ctx, keys(ks)...).Err()
}

// DeleteByPattern removes all keys matching a glob pattern using SCAN.
func DeleteByPattern(ctx context.Context, pattern string) error {
	defer newrelicpkg.EndSegment(ctx, "cache.DeleteByPattern")()
	if client == nil {
		return nil
	}
	var cursor uint64
	var matched []string
	for {
		batch, next, err := client.Scan(ctx, cursor, key(pattern), 100).Result()
		if err != nil {
			return err
		}
		matched = append(matched, batch...)
		cursor = next
		if cursor == 0 {
			break
		}
	}
	// SCAN returns full (already prefixed) keys.
	if len(matched) > 0 {
		return client.Del(ctx, matched...).Err()
	}
	return nil
}

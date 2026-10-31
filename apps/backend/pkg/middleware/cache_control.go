package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// NoStore marks every response as uncacheable by default, so a CDN rule that
// caches /api/* never stores per-user data. Public routes override it with
// PublicCache.
func NoStore() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "private, no-store")
		c.Next()
	}
}

// PublicCache lets shared caches (Cloudflare) keep 200 responses for ttl while
// browsers and apps always revalidate. Errors keep the no-store default. Use
// it only on GET routes whose response is the same for every caller.
func PublicCache(ttl time.Duration) gin.HandlerFunc {
	value := fmt.Sprintf("public, max-age=0, s-maxage=%d", int(ttl.Seconds()))
	return func(c *gin.Context) {
		c.Writer = &publicCacheWriter{ResponseWriter: c.Writer, value: value}
		c.Next()
	}
}

// publicCacheWriter sets Cache-Control once the status is known.
type publicCacheWriter struct {
	gin.ResponseWriter
	value string
}

func (w *publicCacheWriter) WriteHeader(code int) {
	if code == http.StatusOK && !w.Written() {
		w.Header().Set("Cache-Control", w.value)
	}
	w.ResponseWriter.WriteHeader(code)
}

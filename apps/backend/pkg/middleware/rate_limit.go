package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// RateLimitByIP allows at most limit requests per client IP within each fixed
// window. It fails open when Redis is unavailable.
func RateLimitByIP(prefix string, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer newrelicpkg.EndSegment(c, "middleware.RateLimitByIP")()

		if limit <= 0 {
			c.Next()
			return
		}

		bucket := time.Now().Unix() / int64(window.Seconds())
		key := fmt.Sprintf("ratelimit:%s:%s:%d", prefix, c.ClientIP(), bucket)
		n, err := cache.Incr(c, key, window)
		if err == nil && n > int64(limit) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": "Terlalu banyak permintaan. Silakan coba lagi nanti.",
			})
			return
		}
		c.Next()
	}
}

package middleware

import (
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"github.com/gin-gonic/gin"
)

// InjectUserQuery copies authenticated userID into the request query as `user`.
func InjectUserQuery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer newrelicpkg.EndSegment(c, "middleware.InjectUserQuery")()

		v, ok := c.Get("userID")
		if ok {
			if uid, ok := v.(string); ok && uid != "" {
				q := c.Request.URL.Query()
				q.Set("user", uid)
				c.Request.URL.RawQuery = q.Encode()
			}
		}
		c.Next()
	}
}

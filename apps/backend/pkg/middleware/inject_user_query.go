package middleware

import "github.com/gin-gonic/gin"

// InjectUserQuery copies authenticated userID into the request query as `user`.
func InjectUserQuery() gin.HandlerFunc {
	return func(c *gin.Context) {
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

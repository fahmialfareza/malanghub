package validators

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CategoryCreateValidator() gin.HandlerFunc {
	return func(c *gin.Context) {
		b, err := c.GetRawData()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid body"})
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewBuffer(b))

		var m map[string]interface{}
		if err := json.Unmarshal(b, &m); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid json"})
			return
		}

		if v, ok := m["name"].(string); !ok || v == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "name is required"})
			return
		}

		c.Next()
	}
}

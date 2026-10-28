package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
)

// internalError logs err and replies 500 with a generic message under key,
// so database and provider details stay server-side.
func internalError(c *gin.Context, key string, err error) {
	logger.Error(c.Request.Method, c.FullPath(), err)
	c.JSON(http.StatusInternalServerError, gin.H{key: "internal server error"})
}

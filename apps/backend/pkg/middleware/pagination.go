package middleware

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	defaultPageLimit = 20
	// MaxPageLimit caps ?limit= so one request cannot load every article with
	// full content into memory. The sitemap, the largest client page, uses 100.
	MaxPageLimit = 100
)

// Pagination reads ?page= and ?limit= (defaults 1 and 20, limit capped at
// MaxPageLimit) and returns them with the matching row offset.
func Pagination(c *gin.Context) (page, limit, offset int) {
	page, limit = 1, defaultPageLimit
	if v, err := strconv.Atoi(c.Query("page")); err == nil && v > 0 {
		page = v
	}
	if v, err := strconv.Atoi(c.Query("limit")); err == nil && v > 0 {
		limit = min(v, MaxPageLimit)
	}
	return page, limit, (page - 1) * limit
}

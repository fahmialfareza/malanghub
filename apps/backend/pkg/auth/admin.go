package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"github.com/gin-gonic/gin"
)

// AdminMiddleware requires JWTMiddleware to run first (so `userID` is set)
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer newrelicpkg.EndSegment(c, "auth.AdminMiddleware")()

		v, ok := c.Get("userID")
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		id, _ := v.(string)
		if !models.IsValidID(id) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user id"})
			return
		}

		gdb := db.DB()
		if gdb == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
			return
		}

		var u models.User
		if err := gdb.WithContext(c).Select("role").Scopes(db.NotDeleted).Take(&u, "id = ?", id).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "user not found"})
			return
		}

		if !strings.Contains(u.Role, "admin") {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "admin required"})
			return
		}

		c.Next()
	}
}

// IsAdmin reports whether the user (not soft-deleted) has the admin role. It
// returns false when the user or database is unavailable.
func IsAdmin(ctx context.Context, id string) bool {
	gdb := db.DB()
	if gdb == nil || !models.IsValidID(id) {
		return false
	}
	var u models.User
	if err := gdb.WithContext(ctx).Select("role").Scopes(db.NotDeleted).Take(&u, "id = ?", id).Error; err != nil {
		return false
	}
	return strings.Contains(u.Role, "admin")
}

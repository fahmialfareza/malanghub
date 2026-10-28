package auth

import (
	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"net/http"

	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer newrelicpkg.EndSegment(c, "auth.JWTMiddleware")()

		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing authorization header"})
			return
		}

		// expect "Bearer <token>"
		var tokenStr string
		if len(header) > 7 && header[:7] == "Bearer " {
			tokenStr = header[7:]
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid authorization header"})
			return
		}

		tok, err := ValidateTokenStringWithContext(c, tokenStr)
		if err != nil || !tok.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			return
		}

		claims, ok := tok.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid claims"})
			return
		}

		userClaim, ok := claims["user"].(map[string]interface{})
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user claim"})
			return
		}

		idStr, _ := userClaim["id"].(string)
		if idStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user id"})
			return
		}

		// validate id
		if !models.IsValidID(idStr) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user id"})
			return
		}

		// reject tokens of deleted (or removed) accounts
		gdb := db.DB()
		if gdb == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
			return
		}
		var count int64
		if err := gdb.WithContext(c).Model(&models.User{}).Scopes(db.NotDeleted).Where("id = ?", idStr).Count(&count).Error; err != nil || count == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "user not found"})
			return
		}

		c.Set("userID", idStr)
		c.Next()
	}
}

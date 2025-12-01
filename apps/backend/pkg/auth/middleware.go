package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
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

		tok, err := ValidateTokenString(tokenStr)
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

		// validate object id
		if _, err := primitive.ObjectIDFromHex(idStr); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user id"})
			return
		}

		c.Set("userID", idStr)
		c.Next()
	}
}

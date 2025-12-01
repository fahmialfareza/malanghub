package auth

import (
	"net/http"
	"strings"

	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AdminMiddleware requires JWTMiddleware to run first (so `userID` is set)
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		v, ok := c.Get("userID")
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		idStr, _ := v.(string)
		oid, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user id"})
			return
		}

		coll := db.GetCollection("users")
		if coll == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
			return
		}

		var u bson.M
		if err := coll.FindOne(c.Request.Context(), bson.M{"_id": oid}).Decode(&u); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "user not found"})
			return
		}

		role, _ := u["role"].(string)
		if !strings.Contains(role, "admin") {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "admin required"})
			return
		}

		c.Next()
	}
}

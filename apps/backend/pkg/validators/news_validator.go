package validators

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// NewsCreateValidator ensures required fields for creating news
func NewsCreateValidator() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse form data with file
		if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid form data"})
			return
		}

		// required fields
		if v := c.PostForm("title"); v == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "title is required"})
			return
		}

		vcat := c.PostForm("category")
		if vcat == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "category is required"})
			return
		}
		if _, err := primitive.ObjectIDFromHex(vcat); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "category must be a valid ObjectID"})
			return
		}

		// Check for mainImage file upload
		if _, fileHeader, err := c.Request.FormFile("mainImage"); err != nil || fileHeader == nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "mainImage file is required"})
			return
		}

		if v := c.PostForm("content"); v == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "content is required"})
			return
		}

		tagsStr := c.PostForm("tags")
		if tagsStr == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "tags is required"})
			return
		}

		var tags []string
		if err := json.Unmarshal([]byte(tagsStr), &tags); err != nil || len(tags) == 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "tags must be a valid JSON array of ObjectID strings"})
			return
		}

		for _, tag := range tags {
			if _, err := primitive.ObjectIDFromHex(tag); err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "each tag must be a valid ObjectID"})
				return
			}
		}

		c.Next()
	}
}

// NewsUpdateValidator validates partial updates to a news item
func NewsUpdateValidator() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse form data with file
		if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid form data"})
			return
		}

		if cat := c.PostForm("category"); cat != "" {
			if _, err := primitive.ObjectIDFromHex(cat); err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "category must be a valid ObjectID"})
				return
			}
		}

		if tagsStr := c.PostForm("tags"); tagsStr != "" {
			var tags []string
			if err := json.Unmarshal([]byte(tagsStr), &tags); err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "tags must be a valid JSON array of ObjectID strings"})
				return
			}
			for _, tag := range tags {
				if _, err := primitive.ObjectIDFromHex(tag); err != nil {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "each tag must be a valid ObjectID"})
					return
				}
			}
		}

		c.Next()
	}
}

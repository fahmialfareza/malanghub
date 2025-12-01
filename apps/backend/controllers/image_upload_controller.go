package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"

	cloudinarypkg "github.com/fahmialfareza/malanghub/backend/pkg/cloudinary"
)

// ImageUploadController - supports multipart file uploads and Cloudinary.
func ImageUpload(c *gin.Context) {
	// If a multipart file is provided under the "file" field, attempt Cloudinary upload
	fh, err := c.FormFile("file")
	if err == nil && fh != nil {
		// Basic validation to match Node validator behavior
		contentType := fh.Header.Get("Content-Type")
		if contentType == "" || len(contentType) < 5 || contentType[:5] != "image" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file must be an image"})
			return
		}
		// size check (max 1MB)
		if fh.Size > 1000000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image must be less than 1 MB"})
			return
		}

		cld, err := cloudinarypkg.Init()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if cld != nil {
			// generate random filename (similar to Node behavior)
			b := make([]byte, 16)
			if _, err := rand.Read(b); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate filename"})
				return
			}
			publicID := hex.EncodeToString(b)

			url, err := cloudinarypkg.UploadFileHeader(c, cld, fh, "malanghub", publicID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"uploaded": true, "location": url})
			return
		}
	}

	// Fallback: accept JSON body with `file` field (as legacy behavior)
	var body struct {
		File string `json:"file"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"uploaded": true, "location": body.File})
}

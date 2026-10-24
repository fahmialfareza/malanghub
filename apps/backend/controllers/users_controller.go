package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"gorm.io/gorm/clause"

	"github.com/fahmialfareza/malanghub/backend/models"
	cloudinarypkg "github.com/fahmialfareza/malanghub/backend/pkg/cloudinary"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/middleware"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

func CreateUser(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateUser")()

	var payload models.User
	if err := c.ShouldBind(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	payload.ID = ""
	payload.Deleted = nil

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	if err := gdb.WithContext(c).Create(&payload).Error; err != nil {
		if db.IsDuplicateKey(err) {
			c.JSON(http.StatusConflict, gin.H{"message": "email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	payload.Password = ""
	c.JSON(http.StatusCreated, payload)
}

func ListUsers(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.ListUsers")()

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var users []models.User
	if err := gdb.WithContext(c).Order("created_at").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

func GetProfile(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetProfile")()

	// userID set by JWT middleware
	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	id, _ := v.(string)
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	if err := gdb.WithContext(c).Take(&u, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": u})
}

func UpdateProfile(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.UpdateProfile")()

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	id, _ := v.(string)
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	if err := c.Request.ParseMultipartForm(middleware.MaxMultipartMemory); err != nil && err != http.ErrNotMultipart {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid form data"})
		return
	}

	body := map[string]interface{}{}
	for _, field := range []string{"name", "motto", "bio", "instagram", "facebook", "twitter", "tiktok", "linkedin"} {
		if value := strings.TrimSpace(c.PostForm(field)); value != "" {
			body[field] = value
		}
	}

	if fileHeader, err := c.FormFile("photo"); err == nil && fileHeader != nil {
		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" || !strings.HasPrefix(contentType, "image") {
			c.JSON(http.StatusBadRequest, gin.H{"message": "photo must be an image"})
			return
		}
		if fileHeader.Size > 1000000 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "photo must be less than 1 MB"})
			return
		}

		cld, err := cloudinarypkg.InitWithContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "cloudinary init failed: " + err.Error()})
			return
		}
		if cld != nil {
			b := make([]byte, 16)
			if _, err := rand.Read(b); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "could not generate filename"})
				return
			}
			publicID := hex.EncodeToString(b)

			url, err := cloudinarypkg.UploadFileHeader(c, cld, fileHeader, "malanghub", publicID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "cloudinary upload failed: " + err.Error()})
				return
			}
			body["photo"] = url
		}
	}

	body["updated_at"] = time.Now().UTC()

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	res := gdb.WithContext(c).Model(&u).Clauses(clause.Returning{}).Where("id = ?", id).Updates(body)
	if res.Error != nil || res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": u})
}

// DeleteAccount soft-deletes the authenticated user's account.
func DeleteAccount(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.DeleteAccount")()

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	id, _ := v.(string)
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	update := map[string]interface{}{
		"deleted":    true,
		"name":       "User Dihapus",
		"email":      "deleted_" + id + "@malanghub.com",
		"password":   "",
		"photo":      "",
		"motto":      "",
		"bio":        "",
		"instagram":  "",
		"facebook":   "",
		"twitter":    "",
		"tiktok":     "",
		"linkedin":   "",
		"updated_at": time.Now().UTC(),
	}

	res := gdb.WithContext(c).Model(&models.User{}).Where("id = ?", id).Updates(update)
	if res.Error != nil || res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account deleted"})
}

// GetUser returns a user by id (public view)
func GetUser(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetUser")()

	id := c.Param("id")
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	if err := gdb.WithContext(c).Take(&u, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": u})
}

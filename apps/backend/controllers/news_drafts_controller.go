package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"gorm.io/gorm"

	"github.com/fahmialfareza/malanghub/backend/models"
	cloudinarypkg "github.com/fahmialfareza/malanghub/backend/pkg/cloudinary"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// GetAllDrafts returns drafts (approved: false) with basic pagination and filters
func GetAllDrafts(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetAllDrafts")()

	// prefer using query-based advancedResults if set
	if v, ok := c.Get("advancedResults"); ok {
		c.JSON(http.StatusOK, v)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscan(p, &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscan(l, &limit)
	}
	skip := (page - 1) * limit

	list := []models.News{}
	if err := gdb.WithContext(c).Scopes(db.NotDeleted, db.WithNewsRelations).Where("approved = ?", false).
		Order("created_at DESC").Offset(skip).Limit(limit).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"meta": gin.H{"page": page, "limit": limit}, "data": list})
}

// MyDrafts returns drafts created by the authenticated user
func MyDrafts(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.MyDrafts")()

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	uid, _ := v.(string)
	if !models.IsValidID(uid) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	list := []models.News{}
	if err := gdb.WithContext(c).Scopes(db.NotDeleted, db.WithNewsRelations).
		Where("user_id = ? AND approved = ?", uid, false).Order("created_at DESC").Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// GetDraftBySlug returns a single draft by slug (not approved)
func GetDraftBySlug(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetDraftBySlug")()

	slug := c.Param("slug")
	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var result models.News
	err := gdb.WithContext(c).Scopes(db.NotDeleted, db.WithNewsRelations).
		Where("slug = ? AND approved = ?", slug, false).Take(&result).Error
	if db.IsNotFound(err) {
		c.JSON(http.StatusNotFound, gin.H{"message": "draft not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateDraft creates a draft news (approved:false)
func CreateDraft(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateDraft")()

	// Parse form data
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid form data"})
		return
	}

	// Extract form fields
	title := strings.TrimSpace(c.PostForm("title"))
	category := strings.TrimSpace(c.PostForm("category"))
	content := strings.TrimSpace(c.PostForm("content"))
	tagsStr := strings.TrimSpace(c.PostForm("tags"))

	// Upload mainImage to Cloudinary
	var mainImage string
	file, fileHeader, err := c.Request.FormFile("mainImage")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "mainImage file is required: " + err.Error()})
		return
	}
	if fileHeader == nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "mainImage file header is missing"})
		return
	}
	defer file.Close()

	cld, err := cloudinarypkg.InitWithContext(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "cloudinary init failed: " + err.Error()})
		return
	}
	if cld == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "cloudinary not configured"})
		return
	}

	// generate random filename
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
	mainImage = url

	// Parse tags from JSON string
	var tags []string
	if tagsStr != "" {
		if err := json.Unmarshal([]byte(tagsStr), &tags); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid tags format"})
			return
		}
	}

	// Get user ID from context
	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	uid, _ := v.(string)
	if !models.IsValidID(uid) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	// Build News model
	var payload models.News
	payload.Title = title
	payload.Slug = slug.Make(title)
	payload.MainImage = mainImage
	payload.Content = content
	payload.TimeRead = models.CalculateTimeRead(content)

	if models.IsValidID(category) {
		payload.CategoryID = &category
	}

	var tagIDs []string
	for _, tagID := range tags {
		if models.IsValidID(tagID) {
			tagIDs = append(tagIDs, tagID)
		}
	}

	payload.UserID = uid
	payload.Approved = false

	if db.DB() == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	if err := createNews(c, &payload, tagIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	_ = db.DB().WithContext(c).Scopes(db.WithNewsRelations).Take(&payload, "id = ?", payload.ID).Error
	c.JSON(http.StatusCreated, gin.H{"data": payload})
}

// UpdateDraft updates a draft owned by user (or admin) and not approved
func UpdateDraft(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.UpdateDraft")()

	id := c.Param("id")
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid, _ := v.(string)

	// Parse multipart form (support form-data updates)
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form data"})
		return
	}

	body := map[string]interface{}{}

	// Read simple form fields
	if title := strings.TrimSpace(c.PostForm("title")); title != "" {
		body["title"] = title
		body["slug"] = slug.Make(title)
	}
	if content := strings.TrimSpace(c.PostForm("content")); content != "" {
		normalizedContent := strings.ReplaceAll(content, "&lt;", "<")
		body["content"] = normalizedContent
		body["time_read"] = models.CalculateTimeRead(normalizedContent)
	}
	if category := strings.TrimSpace(c.PostForm("category")); category != "" {
		if models.IsValidID(category) {
			body["category_id"] = category
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
			return
		}
	}

	// Parse tags JSON string -> tag IDs
	var tagIDs []string
	hasTags := false
	if tagsStr := strings.TrimSpace(c.PostForm("tags")); tagsStr != "" {
		var tagsArr []string
		if err := json.Unmarshal([]byte(tagsStr), &tagsArr); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tags format"})
			return
		}
		for _, t := range tagsArr {
			if !models.IsValidID(t) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag id"})
				return
			}
			tagIDs = append(tagIDs, t)
		}
		hasTags = true
	}

	// Optional mainImage upload
	file, fileHeader, err := c.Request.FormFile("mainImage")
	if err == nil && fileHeader != nil {
		defer file.Close()
		cld, err := cloudinarypkg.InitWithContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cloudinary init failed"})
			return
		}
		if cld != nil {
			// generate random filename
			b := make([]byte, 16)
			if _, err := rand.Read(b); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate filename"})
				return
			}
			publicID := hex.EncodeToString(b)

			url, err := cloudinarypkg.UploadFileHeader(c, cld, fileHeader, "malanghub", publicID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "cloudinary upload failed: " + err.Error()})
				return
			}
			body["main_image"] = url
		}
	}

	// update timestamp
	body["updated_at"] = time.Now().UTC()

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	// only allow update if not approved and owned by the user
	var updated models.News
	err = gdb.WithContext(c).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&models.News{}).Where("id = ? AND approved = ? AND user_id = ?", id, false, uid).Updates(body)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		if hasTags {
			if err := setNewsTags(tx, id, tagIDs); err != nil {
				return err
			}
		}
		return tx.Scopes(db.WithNewsRelations).Take(&updated, "id = ?", id).Error
	})
	if db.IsNotFound(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "draft not found or not owned"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

// DeleteDraft soft-delete a draft
func DeleteDraft(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.DeleteDraft")()

	id := c.Param("id")
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid, _ := v.(string)

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	// If user is admin, allow deleting any draft; otherwise restrict to owner
	var u models.User
	isAdmin := gdb.WithContext(c).Select("role").Take(&u, "id = ?", uid).Error == nil && strings.Contains(u.Role, "admin")

	query := gdb.WithContext(c).Model(&models.News{}).Where("id = ?", id)
	if !isAdmin {
		query = query.Where("user_id = ?", uid)
	}

	res := query.Update("deleted", true)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "draft not found or not owned"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

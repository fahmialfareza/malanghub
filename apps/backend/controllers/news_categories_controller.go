package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	slugpkg "github.com/gosimple/slug"
	"gorm.io/gorm/clause"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// GetAllCategories returns categories populated with approved news (lightweight)
func GetAllCategories(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetAllCategories")()

	const cacheKey = "categories:all"
	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var cats []models.Category
	if err := gdb.WithContext(c).Scopes(db.NotDeleted).Order("created_at").Find(&cats).Error; err != nil {
		internalError(c, "message", err)
		return
	}

	if len(cats) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "categories not found"})
		return
	}

	response := gin.H{"data": cats}
	_ = cache.Set(c, cacheKey, response, 10*time.Minute)
	c.JSON(http.StatusOK, response)
}

// GetCategoryBySlug returns category and approved news under it
func GetCategoryBySlug(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetCategoryBySlug")()

	slug := c.Param("slug")
	cacheKey := "category:slug:" + slug

	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var cat models.Category
	if err := gdb.WithContext(c).Scopes(db.NotDeleted).Where("slug = ?", slug).Take(&cat).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "category not found"})
		return
	}

	// Clients only read the category here and page through its news with
	// GET /api/news?category=<id>. Loading every article with full content made
	// this response megabytes large, so `news` stays empty (kept for shape).
	newsList := []models.News{}

	response := gin.H{"data": gin.H{"category": cat, "news": newsList}}
	_ = cache.Set(c, cacheKey, response, 10*time.Minute)
	c.JSON(http.StatusOK, response)
}

// CreateCategory creates a new category
func CreateCategory(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateCategory")()

	var payload models.Category
	if err := c.ShouldBind(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "name is required"})
		return
	}
	payload.Slug = slugpkg.Make(payload.Slug)
	if payload.Slug == "" {
		payload.Slug = slugpkg.Make(payload.Name)
	}
	if payload.Slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "slug is required"})
		return
	}

	// server-controlled fields
	payload.ID = ""
	payload.Deleted = nil

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	if err := gdb.WithContext(c).Create(&payload).Error; err != nil {
		if db.IsDuplicateKey(err) {
			c.JSON(http.StatusConflict, gin.H{"message": "category already exists"})
			return
		}
		internalError(c, "message", err)
		return
	}

	_ = cache.Delete(c, "categories:all")
	c.JSON(http.StatusCreated, gin.H{"data": payload})
}

// UpdateCategory updates a category
func UpdateCategory(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.UpdateCategory")()

	id := c.Param("id")
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	update := map[string]interface{}{}
	if name, ok := body["name"].(string); ok {
		name = strings.TrimSpace(name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "name is required"})
			return
		}
		update["name"] = name
		update["slug"] = slugpkg.Make(name)
	}
	if slugValue, ok := body["slug"].(string); ok && strings.TrimSpace(slugValue) != "" {
		update["slug"] = slugpkg.Make(slugValue)
	}
	if slugValue, ok := update["slug"].(string); ok && slugValue == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "slug is required"})
		return
	}
	if len(update) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "no fields to update"})
		return
	}
	update["updated_at"] = time.Now().UTC()

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var updated models.Category
	res := gdb.WithContext(c).Model(&updated).Clauses(clause.Returning{}).Where("id = ?", id).Updates(update)
	if res.Error != nil {
		if db.IsDuplicateKey(res.Error) {
			c.JSON(http.StatusConflict, gin.H{"message": "category already exists"})
			return
		}
		internalError(c, "message", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "category not found"})
		return
	}

	_ = cache.Delete(c, "categories:all")
	_ = cache.DeleteByPattern(c, "category:slug:*")
	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

// DeleteCategory soft-deletes a category
func DeleteCategory(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.DeleteCategory")()

	id := c.Param("id")
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}
	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var existing models.Category
	res := gdb.WithContext(c).Model(&existing).Clauses(clause.Returning{Columns: []clause.Column{{Name: "slug"}}}).
		Where("id = ?", id).Update("deleted", true)
	if res.Error != nil {
		internalError(c, "message", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "category not found"})
		return
	}

	_ = cache.Delete(c, "categories:all", "category:slug:"+existing.Slug)
	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

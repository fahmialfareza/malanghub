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

func GetAllTags(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetAllTags")()

	const cacheKey = "tags:all"
	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var tags []models.Tag
	if err := gdb.WithContext(c).Scopes(db.NotDeleted).Order("created_at").Find(&tags).Error; err != nil {
		internalError(c, "message", err)
		return
	}

	if len(tags) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "tags not found"})
		return
	}

	response := gin.H{"data": tags}
	_ = cache.Set(c, cacheKey, response, 10*time.Minute)
	c.JSON(http.StatusOK, response)
}

// GetTagBySlug returns tag and approved news under it
func GetTagBySlug(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetTagBySlug")()

	slug := c.Param("slug")
	cacheKey := "tag:slug:" + slug

	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var tag models.Tag
	if err := gdb.WithContext(c).Scopes(db.NotDeleted).Where("slug = ?", slug).Take(&tag).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "tag not found"})
		return
	}

	// Clients only read the tag here and page through its news with
	// GET /api/news?tags=<id>. Loading every article with full content made
	// this response megabytes large, so `news` stays empty (kept for shape).
	newsList := []models.News{}

	response := gin.H{"data": gin.H{"tag": tag, "news": newsList}}
	_ = cache.Set(c, cacheKey, response, 10*time.Minute)
	c.JSON(http.StatusOK, response)
}

// CreateTag creates a new tag
func CreateTag(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateTag")()

	var payload models.Tag
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
			c.JSON(http.StatusConflict, gin.H{"message": "tag already exists"})
			return
		}
		internalError(c, "message", err)
		return
	}

	_ = cache.Delete(c, "tags:all")
	c.JSON(http.StatusCreated, gin.H{"data": payload})
}

// UpdateTag updates a tag
func UpdateTag(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.UpdateTag")()

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

	var updated models.Tag
	res := gdb.WithContext(c).Model(&updated).Clauses(clause.Returning{}).Where("id = ?", id).Updates(update)
	if res.Error != nil {
		if db.IsDuplicateKey(res.Error) {
			c.JSON(http.StatusConflict, gin.H{"message": "tag already exists"})
			return
		}
		internalError(c, "message", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "tag not found"})
		return
	}

	_ = cache.Delete(c, "tags:all")
	_ = cache.DeleteByPattern(c, "tag:slug:*")
	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

// DeleteTag soft-deletes a tag
func DeleteTag(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.DeleteTag")()

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

	var existing models.Tag
	res := gdb.WithContext(c).Model(&existing).Clauses(clause.Returning{Columns: []clause.Column{{Name: "slug"}}}).
		Where("id = ?", id).Update("deleted", true)
	if res.Error != nil {
		internalError(c, "message", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "tag not found"})
		return
	}

	_ = cache.Delete(c, "tags:all", "tag:slug:"+existing.Slug)
	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

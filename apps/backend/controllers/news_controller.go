package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	slug "github.com/gosimple/slug"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/ai"
	"github.com/fahmialfareza/malanghub/backend/pkg/auth"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/middleware"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// submitIndexNow notifies Bing/Yandex via IndexNow when a news article is published.
// Runs in a goroutine — fire and forget, never blocks the request.
func submitIndexNow(newsSlug string) {
	key := os.Getenv("INDEXNOW_KEY")
	siteURL := os.Getenv("SITE_URL")
	if key == "" || siteURL == "" {
		return
	}

	articleURL := siteURL + "/news/" + newsSlug
	payload := map[string]interface{}{
		"host":        "www.malanghub.com",
		"key":         key,
		"keyLocation": siteURL + "/" + key + ".txt",
		"urlList":     []string{articleURL},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	resp, err := http.Post(
		"https://api.indexnow.org/indexnow",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return
	}
	defer resp.Body.Close()
}

// ListNews returns approved news with simple pagination
func ListNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.ListNews")()

	// if AdvancedResults middleware ran, return its result
	if v, ok := c.Get("advancedResults"); ok {
		c.JSON(http.StatusOK, v)
		return
	}

	// fallback: behave like previous simple pagination
	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	page, limit, skip := middleware.Pagination(c)

	cacheKey := fmt.Sprintf("news:list:page:%d:limit:%d", page, limit)
	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	results := []models.News{}
	if err := gdb.WithContext(c).Scopes(db.Published, db.WithNewsRelations).
		Order("created_at DESC").Offset(skip).Limit(limit).Find(&results).Error; err != nil {
		internalError(c, "message", err)
		return
	}

	_ = cache.Set(c, cacheKey, results, 5*time.Minute)
	c.JSON(http.StatusOK, results)
}

// GetNewsBySlug returns a single approved news by slug, caching in Redis
func GetNewsBySlug(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetNewsBySlug")()

	slugParam := c.Param("slug")
	cacheKey := "news:slug:" + slugParam

	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var result models.News
	err := gdb.WithContext(c).Scopes(db.Published, db.WithNewsRelations).
		Where("slug = ?", slugParam).Take(&result).Error
	if db.IsNotFound(err) {
		c.JSON(http.StatusNotFound, gin.H{"message": "news not found"})
		return
	}
	if err != nil {
		internalError(c, "message", err)
		return
	}

	response := gin.H{"data": result}
	_ = cache.Set(c, cacheKey, response, 5*time.Minute)
	c.JSON(http.StatusOK, response)
}

// setNewsTags replaces the tag links of a news item. Unknown tag IDs are
// skipped, like the MongoDB $lookup used to ignore them.
func setNewsTags(tx *gorm.DB, newsID string, tagIDs []string) error {
	if err := tx.Exec("DELETE FROM news_tag_links WHERE news_id = ?", newsID).Error; err != nil {
		return err
	}
	if len(tagIDs) == 0 {
		return nil
	}
	return tx.Exec(`INSERT INTO news_tag_links (news_id, tag_id)
		SELECT ?, id FROM news_tags WHERE id IN ? ON CONFLICT DO NOTHING`, newsID, tagIDs).Error
}

// createNews inserts a news row and its tag links in one transaction.
func createNews(c *gin.Context, n *models.News, tagIDs []string) error {
	return db.DB().WithContext(c).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit(clause.Associations).Create(n).Error; err != nil {
			return err
		}
		return setNewsTags(tx, n.ID, tagIDs)
	})
}

// CreateNews creates a news entry; slug is generated if not provided
func CreateNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateNews")()

	// Parse form data
	if err := c.Request.ParseMultipartForm(middleware.MaxMultipartMemory); err != nil && err != http.ErrNotMultipart {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid form data"})
		return
	}

	// Extract form fields - PostForm returns values from either URL or form data
	title := strings.TrimSpace(c.PostForm("title"))
	category := strings.TrimSpace(c.PostForm("category"))
	content := strings.TrimSpace(c.PostForm("content"))
	tagsStr := strings.TrimSpace(c.PostForm("tags"))

	// Get mainImage value (might be URL or filename from form)
	mainImage := strings.TrimSpace(c.PostForm("mainImage"))

	// If mainImage is empty in form fields, it might be a file upload
	if mainImage == "" {
		file, fileHeader, err := c.Request.FormFile("mainImage")
		if err == nil && fileHeader != nil {
			mainImage = fileHeader.Filename
			file.Close()
		}
	}

	// Parse tags from JSON string
	var tags []string
	if tagsStr != "" {
		if err := json.Unmarshal([]byte(tagsStr), &tags); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid tags format"})
			return
		}
	}

	// build models.News
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

	// Set user from context (set by JWTMiddleware)
	if userIDVal, ok := c.Get("userID"); ok {
		if userIDStr, ok := userIDVal.(string); ok {
			payload.UserID = userIDStr
		}
	}

	// Only admins may publish directly; everyone else goes through approval.
	approvedStr := strings.TrimSpace(c.PostForm("approved"))
	payload.Approved = approvedStr == "true" && auth.IsAdmin(c, payload.UserID)

	if db.DB() == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	if err := createNews(c, &payload, tagIDs); err != nil {
		internalError(c, "message", err)
		return
	}

	// an approved news immediately appears in category/tag/list news caches
	if payload.Approved {
		_ = cache.DeleteByPattern(c, "category:slug:*")
		_ = cache.DeleteByPattern(c, "tag:slug:*")
		_ = cache.DeleteByPattern(c, "news:list:*")
		go submitIndexNow(payload.Slug)
		ai.IndexNewsAsync(payload.ID)
	}

	_ = db.DB().WithContext(c).Scopes(db.WithNewsRelations).Take(&payload, "id = ?", payload.ID).Error
	c.JSON(http.StatusCreated, gin.H{"data": payload})
}

// UpdateNews updates a news item if not already approved
func UpdateNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.UpdateNews")()

	id := c.Param("id")
	if !models.IsValidID(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var newData map[string]interface{}
	if err := c.ShouldBind(&newData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// only known fields are updatable; JSON names map to columns
	update := map[string]interface{}{}
	for field, column := range map[string]string{"title": "title", "slug": "slug", "message": "message", "mainImage": "main_image"} {
		if v, ok := newData[field].(string); ok {
			update[column] = v
		}
	}

	if cat, ok := newData["category"].(string); ok && cat != "" {
		if !models.IsValidID(cat) {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid category id"})
			return
		}
		update["category_id"] = cat
	}
	var tagIDs []string
	_, hasTags := newData["tags"].([]interface{})
	if arr, ok := newData["tags"].([]interface{}); ok {
		for _, it := range arr {
			if s, ok := it.(string); ok {
				if !models.IsValidID(s) {
					c.JSON(http.StatusBadRequest, gin.H{"message": "invalid tag id"})
					return
				}
				tagIDs = append(tagIDs, s)
			}
		}
	}

	if content, ok := newData["content"].(string); ok {
		normalizedContent := strings.ReplaceAll(content, "&lt;", "<")
		update["content"] = normalizedContent
		update["time_read"] = models.CalculateTimeRead(normalizedContent)
	}

	approved, _ := newData["approved"].(bool)
	if _, ok := newData["approved"].(bool); ok {
		update["approved"] = approved
	}
	if approved {
		update["status"] = "publish"
	} else {
		update["status"] = "decline"
	}
	update["updated_at"] = time.Now().UTC()

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var updated models.News
	err := gdb.WithContext(c).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&models.News{}).Where("id = ? AND approved = ?", id, false).Updates(update)
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
		c.JSON(http.StatusNotFound, gin.H{"message": "news not found or already approved"})
		return
	}
	if err != nil {
		internalError(c, "message", err)
		return
	}

	_ = cache.Delete(c, "news:slug:"+updated.Slug)
	// approval change makes the news appear/disappear in category, tag & list caches
	_ = cache.DeleteByPattern(c, "category:slug:*")
	_ = cache.DeleteByPattern(c, "tag:slug:*")
	_ = cache.DeleteByPattern(c, "news:list:*")
	if approved {
		go submitIndexNow(updated.Slug)
	}
	ai.IndexNewsAsync(updated.ID)

	// return updated with populated fields similar to GetNewsBySlug
	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

// DeleteNews permanently deletes a news item
func DeleteNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.DeleteNews")()

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

	// fetch row before deleting to get the slug for cache invalidation
	var existing models.News
	if err := gdb.WithContext(c).Select("id", "slug").Take(&existing, "id = ?", id).Error; err == nil {
		_ = cache.Delete(c, "news:slug:"+existing.Slug)
		_ = cache.DeleteByPattern(c, "category:slug:*")
		_ = cache.DeleteByPattern(c, "tag:slug:*")
		_ = cache.DeleteByPattern(c, "news:list:*")
	}

	// perform hard delete to match original Node behavior; tag links go first
	var deleted int64
	err := gdb.WithContext(c).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM news_tag_links WHERE news_id = ?", id).Error; err != nil {
			return err
		}
		res := tx.Delete(&models.News{}, "id = ?", id)
		deleted = res.RowsAffected
		return res.Error
	})
	if err != nil {
		internalError(c, "message", err)
		return
	}
	if deleted == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "news not found"})
		return
	}
	ai.IndexNewsAsync(id)

	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

// MyNews returns news belonging to the authenticated user (uses AdvancedResults when present)
func MyNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.MyNews")()

	// If AdvancedResults middleware ran, return its result
	if v, ok := c.Get("advancedResults"); ok {
		c.JSON(http.StatusOK, v)
		return
	}

	// fallback to manual query - also filter by approved: true
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

	page, limit, skip := middleware.Pagination(c)

	query := gdb.WithContext(c).Model(&models.News{}).Scopes(db.Published).Where("user_id = ?", uid)

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		internalError(c, "message", err)
		return
	}

	results := []models.News{}
	if err := query.Scopes(db.WithNewsRelations).Order("created_at DESC").Offset(skip).Limit(limit).Find(&results).Error; err != nil {
		internalError(c, "message", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"meta": gin.H{"page": page, "limit": limit, "total": total},
		"data": results,
	})
}

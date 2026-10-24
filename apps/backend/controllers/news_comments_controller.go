package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// publicUser loads comment/reply authors without sensitive fields.
func publicUser(tx *gorm.DB) *gorm.DB {
	return tx.Omit("password", "role")
}

// withCommentRelations populates the comment author and every reply author.
func withCommentRelations(tx *gorm.DB) *gorm.DB {
	return tx.Preload("User", publicUser).
		Preload("CommentReplies", func(tx *gorm.DB) *gorm.DB { return tx.Order("created_at") }).
		Preload("CommentReplies.User", publicUser)
}

// GetCommentsByNews returns comments for a news item with populated users
func GetCommentsByNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetCommentsByNews")()

	newsID := c.Param("id")
	if !models.IsValidID(newsID) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid news id"})
		return
	}

	cacheKey := "news:comments:" + newsID
	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	out := []models.NewsComment{}
	if err := gdb.WithContext(c).Scopes(withCommentRelations).
		Where("news_id = ?", newsID).Order("created_at").Find(&out).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{"data": out}
	_ = cache.Set(c, cacheKey, response, 2*time.Minute)
	c.JSON(http.StatusOK, response)
}

// CreateComment creates a comment for a news item
func CreateComment(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateComment")()

	newsID := c.Param("id")
	if !models.IsValidID(newsID) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid news id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	uid, _ := v.(string)

	var body struct {
		Comment string `json:"comment"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	nc := models.NewsComment{
		NewsID:  newsID,
		UserID:  uid,
		Comment: body.Comment,
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	if err := gdb.WithContext(c).Create(&nc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = cache.Delete(c, "news:comments:"+newsID)
	c.JSON(http.StatusCreated, gin.H{"data": nc})
}

// CreateCommentByComment adds a reply to a comment
func CreateCommentByComment(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateCommentByComment")()

	commentID := c.Param("id")
	if !models.IsValidID(commentID) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid comment id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	uid, _ := v.(string)

	var body struct {
		Comment string `json:"comment"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// add reply and return updated comment with populated users
	var updated models.NewsComment
	if err := gdb.WithContext(c).Select("id").Take(&updated, "id = ?", commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "comment not found"})
		return
	}

	reply := models.NewsCommentReply{CommentID: commentID, UserID: uid, Comment: body.Comment}
	if err := gdb.WithContext(c).Create(&reply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	if err := gdb.WithContext(c).Scopes(withCommentRelations).Take(&updated, "id = ?", commentID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	_ = cache.Delete(c, "news:comments:"+updated.NewsID)
	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

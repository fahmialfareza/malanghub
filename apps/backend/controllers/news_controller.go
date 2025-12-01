package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	slug "github.com/gosimple/slug"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/redisclient"
)

// ListNews returns approved news with simple pagination
func ListNews(c *gin.Context) {
	// if AdvancedResults middleware ran, return its result
	if v, ok := c.Get("advancedResults"); ok {
		c.JSON(http.StatusOK, v)
		return
	}

	// fallback: behave like previous simple pagination
	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// simple pagination
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		// ignore parse errors, keep default
		fmt.Sscan(p, &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscan(l, &limit)
	}
	skip := (page - 1) * limit

	filter := bson.M{"approved": true, "$or": bson.A{
		bson.M{"deleted": false},
		bson.M{"deleted": bson.M{"$exists": false}},
	}}

	findOptions := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit))
	cur, err := coll.Find(c, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	var results []models.News
	for cur.Next(c) {
		var n models.News
		if err := cur.Decode(&n); err != nil {
			continue
		}
		results = append(results, n)
	}

	c.JSON(http.StatusOK, results)
}

// GetNewsBySlug returns a single approved news by slug, caching in Redis
func GetNewsBySlug(c *gin.Context) {
	slugParam := c.Param("slug")
	key := "news:" + slugParam
	ctx := c

	if v, err := redisclient.CacheGet(ctx, key); err == nil && v != "" {
		var cached bson.M
		if err := json.Unmarshal([]byte(v), &cached); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": cached})
			return
		}
	}

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// Use aggregation pipeline to populate all related docs in one go
	pipeline := []bson.M{
		// match by slug (treats null/missing deleted as non-deleted)
		{"$match": bson.M{"slug": slugParam, "approved": true, "$or": bson.A{
			bson.M{"deleted": false},
			bson.M{"deleted": bson.M{"$exists": false}},
		}}},
		// lookup user
		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user",
			"foreignField": "_id",
			"as":           "user",
		}},
		{"$unwind": bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}},
		// lookup category
		{"$lookup": bson.M{
			"from":         "newscategories",
			"localField":   "category",
			"foreignField": "_id",
			"as":           "category",
		}},
		{"$unwind": bson.M{"path": "$category", "preserveNullAndEmptyArrays": true}},
		// ensure tags are ObjectIDs when stored as hex strings so lookup works
		{"$addFields": bson.M{
			"tags": bson.M{"$map": bson.M{
				"input": bson.M{"$ifNull": bson.A{"$tags", bson.A{}}},
				"as":    "t",
				"in": bson.M{"$cond": bson.A{
					bson.M{"$eq": bson.A{bson.M{"$type": "$$t"}, "string"}},
					bson.M{"$toObjectId": "$$t"},
					"$$t",
				}},
			}},
		}},
		// lookup tags (after normalization)
		{"$lookup": bson.M{
			"from":         "newstags",
			"localField":   "tags",
			"foreignField": "_id",
			"as":           "tags",
		}},
	}

	cur, err := coll.Aggregate(c, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	if !cur.Next(c) {
		c.JSON(http.StatusNotFound, gin.H{"message": "news not found"})
		return
	}

	var result bson.M
	if err := cur.Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	// Remove password from user if present
	if userDoc, ok := result["user"].(bson.M); ok {
		delete(userDoc, "password")
	}

	// cache response
	_ = redisclient.CacheSetDefault(ctx, key, result, 24*time.Hour)

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateNews creates a news entry; slug is generated if not provided
func CreateNews(c *gin.Context) {
	// Parse form data
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
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

	// convert category hex to ObjectID
	if category != "" {
		if cat, err := primitive.ObjectIDFromHex(category); err == nil {
			payload.Category = cat
		}
	}

	// convert tags array of hex strings
	for _, tagID := range tags {
		if oid, err := primitive.ObjectIDFromHex(tagID); err == nil {
			payload.Tags = append(payload.Tags, oid)
		}
	}

	// Set user from context (set by JWTMiddleware)
	if userIDVal, ok := c.Get("userID"); ok {
		if userIDStr, ok := userIDVal.(string); ok {
			if userID, err := primitive.ObjectIDFromHex(userIDStr); err == nil {
				payload.User = userID
			}
		}
	}

	payload.ID = primitive.NewObjectID()
	now := time.Now().UTC()
	payload.CreatedAt = now
	payload.UpdatedAt = now

	// Check if approved flag is passed (for direct creation by authorized users)
	approvedStr := strings.TrimSpace(c.PostForm("approved"))
	payload.Approved = approvedStr == "true" // Default to false if not specified

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	if _, err := coll.InsertOne(c, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": payload})
}

// UpdateNews updates a news item if not already approved
func UpdateNews(c *gin.Context) {
	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var newData map[string]interface{}
	if err := c.ShouldBind(&newData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// convert possible category and tags fields from hex strings to ObjectIDs
	if cat, ok := newData["category"].(string); ok && cat != "" {
		if coid, err := primitive.ObjectIDFromHex(cat); err == nil {
			newData["category"] = coid
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid category id"})
			return
		}
	}
	if tags, ok := newData["tags"]; ok {
		// expect array
		if arr, ok := tags.([]interface{}); ok {
			var out []primitive.ObjectID
			for _, it := range arr {
				if s, ok := it.(string); ok {
					if tid, err := primitive.ObjectIDFromHex(s); err == nil {
						out = append(out, tid)
					} else {
						c.JSON(http.StatusBadRequest, gin.H{"message": "invalid tag id"})
						return
					}
				}
			}
			newData["tags"] = out
		}
	}

	if content, ok := newData["content"].(string); ok {
		newData["content"] = strings.ReplaceAll(content, "&lt;", "<")
	}

	if approved, ok := newData["approved"].(bool); ok && approved {
		newData["status"] = "publish"
	} else {
		newData["status"] = "decline"
	}

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	res := coll.FindOneAndUpdate(c, bson.M{"_id": oid, "approved": false}, bson.M{"$set": newData}, options.FindOneAndUpdate().SetReturnDocument(options.After))
	var updated models.News
	if err := res.Decode(&updated); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "news not found or already approved"})
		return
	}

	// return updated with populated fields similar to GetNewsBySlug
	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

// DeleteNews marks news as deleted (soft delete)
func DeleteNews(c *gin.Context) {
	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// perform hard delete to match original Node behavior
	res, err := coll.DeleteOne(c, bson.M{"_id": oid})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "news not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

// MyNews returns news belonging to the authenticated user (uses AdvancedResults when present)
func MyNews(c *gin.Context) {
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
	uidStr, _ := v.(string)
	uid, err := primitive.ObjectIDFromHex(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// Query with pagination and proper filters
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	skip := (page - 1) * limit

	filter := bson.M{
		"user":     uid,
		"approved": true,
		"$or": bson.A{
			bson.M{"deleted": false},
			bson.M{"deleted": bson.M{"$exists": false}},
		},
	}

	cur, err := coll.Find(c, filter, options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	var results []models.News
	for cur.Next(c) {
		var n models.News
		if err := cur.Decode(&n); err != nil {
			continue
		}
		results = append(results, n)
	}

	total, _ := coll.CountDocuments(c, filter)
	c.JSON(http.StatusOK, gin.H{
		"meta": bson.M{"page": page, "limit": limit, "total": total},
		"data": results,
	})
}

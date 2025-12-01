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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	cloudinarypkg "github.com/fahmialfareza/malanghub/backend/pkg/cloudinary"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
)

// GetAllDrafts returns drafts (approved: false) with basic pagination and filters
func GetAllDrafts(c *gin.Context) {
	// prefer using query-based advancedResults if set
	if v, ok := c.Get("advancedResults"); ok {
		c.JSON(http.StatusOK, v)
		return
	}

	coll := db.GetCollection("news")
	if coll == nil {
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

	filter := bson.M{"approved": false, "$or": bson.A{
		bson.M{"deleted": false},
		bson.M{"deleted": bson.M{"$exists": false}},
	}}

	findOpts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := coll.Find(c, filter, findOpts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	var list []models.News
	for cur.Next(c) {
		var n models.News
		if err := cur.Decode(&n); err == nil {
			list = append(list, n)
		}
	}

	c.JSON(http.StatusOK, gin.H{"meta": bson.M{"page": page, "limit": limit}, "data": list})
}

// MyDrafts returns drafts created by the authenticated user
func MyDrafts(c *gin.Context) {
	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	idStr, _ := v.(string)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	cur, err := coll.Find(c, bson.M{"user": oid, "approved": false, "$or": bson.A{
		bson.M{"deleted": false},
		bson.M{"deleted": bson.M{"$exists": false}},
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	var list []models.News
	for cur.Next(c) {
		var n models.News
		if err := cur.Decode(&n); err == nil {
			list = append(list, n)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// GetDraftBySlug returns a single draft by slug (not approved)
func GetDraftBySlug(c *gin.Context) {
	slug := c.Param("slug")
	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// Aggregation pipeline mirrors GetNewsBySlug but matches approved: false
	pipeline := []bson.M{
		{"$match": bson.M{"slug": slug, "approved": false, "$or": bson.A{
			bson.M{"deleted": false},
			bson.M{"deleted": bson.M{"$exists": false}},
		}}},
		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user",
			"foreignField": "_id",
			"as":           "user",
		}},
		{"$unwind": bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}},
		{"$lookup": bson.M{
			"from":         "newscategories",
			"localField":   "category",
			"foreignField": "_id",
			"as":           "category",
		}},
		{"$unwind": bson.M{"path": "$category", "preserveNullAndEmptyArrays": true}},
		// normalize tags to ObjectID when stored as hex strings
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
		c.JSON(http.StatusNotFound, gin.H{"message": "draft not found"})
		return
	}

	var result bson.M
	if err := cur.Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	// Remove sensitive fields from user
	if userDoc, ok := result["user"].(bson.M); ok {
		delete(userDoc, "password")
		delete(userDoc, "role")
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateDraft creates a draft news (approved:false)
func CreateDraft(c *gin.Context) {
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
	if err == nil && fileHeader != nil {
		defer file.Close()
		cld, err := cloudinarypkg.Init()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "cloudinary init failed"})
			return
		}

		if cld != nil {
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
		}
	}

	if mainImage == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "mainImage upload failed"})
		return
	}

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
	uidStr, _ := v.(string)
	uid, err := primitive.ObjectIDFromHex(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	// Build News model
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

	payload.ID = primitive.NewObjectID()
	payload.User = uid
	now := time.Now().UTC()
	payload.CreatedAt = now
	payload.UpdatedAt = now
	payload.Approved = false

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

// UpdateDraft updates a draft owned by user (or admin) and not approved
func UpdateDraft(c *gin.Context) {
	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uidStr, _ := v.(string)
	uid, _ := primitive.ObjectIDFromHex(uidStr)

	// Parse multipart form (support form-data updates)
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form data"})
		return
	}

	body := bson.M{}

	// Read simple form fields
	if title := strings.TrimSpace(c.PostForm("title")); title != "" {
		body["title"] = title
		body["slug"] = slug.Make(title)
	}
	if content := strings.TrimSpace(c.PostForm("content")); content != "" {
		body["content"] = strings.ReplaceAll(content, "&lt;", "<")
	}
	if category := strings.TrimSpace(c.PostForm("category")); category != "" {
		if coid, err := primitive.ObjectIDFromHex(category); err == nil {
			body["category"] = coid
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
			return
		}
	}

	// Parse tags JSON string -> []ObjectID
	if tagsStr := strings.TrimSpace(c.PostForm("tags")); tagsStr != "" {
		var tagsArr []string
		if err := json.Unmarshal([]byte(tagsStr), &tagsArr); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tags format"})
			return
		}
		var out []primitive.ObjectID
		for _, t := range tagsArr {
			if tid, err := primitive.ObjectIDFromHex(t); err == nil {
				out = append(out, tid)
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag id"})
				return
			}
		}
		body["tags"] = out
	}

	// Optional mainImage upload
	file, fileHeader, err := c.Request.FormFile("mainImage")
	if err == nil && fileHeader != nil {
		defer file.Close()
		cld, err := cloudinarypkg.Init()
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
			body["mainImage"] = url
		}
	}

	// update timestamp
	body["updated_at"] = time.Now().UTC()

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	// only allow update if not approved, match user stored as ObjectID or hex string
	filter := bson.M{"_id": oid, "approved": false, "$or": bson.A{
		bson.M{"user": uid},
		bson.M{"user": uidStr},
	}}
	res := coll.FindOneAndUpdate(c, filter, bson.M{"$set": body}, options.FindOneAndUpdate().SetReturnDocument(options.After))
	var updated models.News
	if err := res.Decode(&updated); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "draft not found or not owned"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

// DeleteDraft soft-delete a draft
func DeleteDraft(c *gin.Context) {
	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uidStr, _ := v.(string)
	uid, _ := primitive.ObjectIDFromHex(uidStr)

	coll := db.GetCollection("news")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	// If user is admin, allow deleting any draft; otherwise restrict to owner
	// Determine if user is admin
	isAdmin := false
	usersColl := db.GetCollection("users")
	if usersColl != nil {
		var u bson.M
		_ = usersColl.FindOne(c, bson.M{"_id": uid}).Decode(&u)
		if role, ok := u["role"].(string); ok && strings.Contains(role, "admin") {
			isAdmin = true
		}
	}

	var filter bson.M
	if isAdmin {
		filter = bson.M{"_id": oid}
	} else {
		filter = bson.M{"_id": oid, "$or": bson.A{bson.M{"user": uid}, bson.M{"user": uidStr}}}
	}

	res, err := coll.UpdateOne(c, filter, bson.M{"$set": bson.M{"deleted": true}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	if res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "draft not found or not owned"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

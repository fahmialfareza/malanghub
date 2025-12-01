package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/redisclient"
)

func GetAllTags(c *gin.Context) {
	coll := db.GetCollection("newstags")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	cur, err := coll.Find(c, bson.M{"$or": bson.A{
		bson.M{"deleted": false},
		bson.M{"deleted": bson.M{"$exists": false}},
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	var tags []models.Tag
	for cur.Next(c) {
		var t models.Tag
		if err := cur.Decode(&t); err == nil {
			tags = append(tags, t)
		}
	}

	if len(tags) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "tags not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tags})
}

func GetTagBySlug(c *gin.Context) {
	slug := c.Param("slug")
	key := "tag:" + slug
	ctx := c

	if v, err := redisclient.CacheGet(ctx, key); err == nil && v != "" {
		var cached bson.M
		if err := json.Unmarshal([]byte(v), &cached); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": cached})
			return
		}
	}

	coll := db.GetCollection("newstags")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var tag models.Tag
	if err := coll.FindOne(c, bson.M{"slug": slug, "$or": bson.A{
		bson.M{"deleted": false},
		bson.M{"deleted": bson.M{"$exists": false}},
	}}).Decode(&tag); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "tag not found"})
		return
	}

	// load approved news for tag
	newsColl := db.GetCollection("news")
	var newsList []models.News
	if newsColl != nil {
		cur, err := newsColl.Find(c, bson.M{"tags": bson.M{"$in": []primitive.ObjectID{tag.ID}}, "approved": true, "$or": bson.A{
			bson.M{"deleted": false},
			bson.M{"deleted": bson.M{"$exists": false}},
		}})
		if err == nil {
			defer cur.Close(c)
			for cur.Next(c) {
				var n models.News
				if err := cur.Decode(&n); err == nil {
					newsList = append(newsList, n)
				}
			}
		}
	}

	resp := bson.M{"tag": tag, "news": newsList}
	_ = redisclient.CacheSetDefault(ctx, key, resp, 24*time.Hour)
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func CreateTag(c *gin.Context) {
	var payload models.Tag
	if err := c.ShouldBind(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	payload.ID = primitive.NewObjectID()
	now := time.Now().UTC()
	payload.CreatedAt = now
	payload.UpdatedAt = now

	coll := db.GetCollection("newstags")
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

func UpdateTag(c *gin.Context) {
	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	coll := db.GetCollection("newstags")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	res := coll.FindOneAndUpdate(c, bson.M{"_id": oid}, bson.M{"$set": body}, options.FindOneAndUpdate().SetReturnDocument(options.After))
	var updated models.Tag
	if err := res.Decode(&updated); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "tag not found"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": updated})
}

func DeleteTag(c *gin.Context) {
	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	coll := db.GetCollection("newstags")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	res, err := coll.UpdateOne(c, bson.M{"_id": oid}, bson.M{"$set": bson.M{"deleted": true}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	if res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "tag not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": map[string]interface{}{}})
}

package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// GetCommentsByNews returns comments for a news item with populated users
func GetCommentsByNews(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetCommentsByNews")()

	newsID := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(newsID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid news id"})
		return
	}

	cacheKey := "news:comments:" + newsID
	if cached, err := cache.Get(c, cacheKey); err == nil {
		c.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	coll := db.GetCollection("newsComments")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// Single aggregation replaces N+1 user lookups: populates both the
	// comment author and every reply author in two $lookup stages instead of
	// one FindOne per comment/reply.
	pipeline := []bson.M{
		{"$match": bson.M{"news": oid}},
		// Populate comment author
		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user",
			"foreignField": "_id",
			"as":           "user",
		}},
		{"$unwind": bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}},
		// Fetch all reply authors in one query, then merge back into the array
		{"$lookup": bson.M{
			"from": "users",
			"let":  bson.M{"replyUserIds": "$commentReplies.user"},
			"pipeline": bson.A{
				bson.M{"$match": bson.M{"$expr": bson.M{"$in": bson.A{"$_id", "$$replyUserIds"}}}},
				bson.M{"$project": bson.M{"password": 0, "role": 0}},
			},
			"as": "replyUserDocs",
		}},
		{"$addFields": bson.M{
			"commentReplies": bson.M{"$map": bson.M{
				"input": bson.M{"$ifNull": bson.A{"$commentReplies", bson.A{}}},
				"as":    "reply",
				"in": bson.M{"$mergeObjects": bson.A{
					"$$reply",
					bson.M{"user": bson.M{"$arrayElemAt": bson.A{
						bson.M{"$filter": bson.M{
							"input": "$replyUserDocs",
							"as":    "u",
							"cond":  bson.M{"$eq": bson.A{"$$u._id", "$$reply.user"}},
						}},
						0,
					}}},
				}},
			}},
		}},
		// Remove temp lookup field and strip sensitive fields from comment author
		{"$project": bson.M{
			"replyUserDocs": 0,
			"user.password": 0,
			"user.role":     0,
		}},
	}

	cur, err := coll.Aggregate(c, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cur.Close(c)

	var out []bson.M
	for cur.Next(c) {
		var item bson.M
		if err := cur.Decode(&item); err != nil {
			continue
		}
		out = append(out, item)
	}

	response := gin.H{"data": out}
	_ = cache.Set(c, cacheKey, response, 2*time.Minute)
	c.JSON(http.StatusOK, response)
}

// CreateComment creates a comment for a news item
func CreateComment(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateComment")()

	newsID := c.Param("id")
	nid, err := primitive.ObjectIDFromHex(newsID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid news id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	uidStr, _ := v.(string)
	uid, _ := primitive.ObjectIDFromHex(uidStr)

	var body struct {
		Comment string `json:"comment"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	nc := models.NewsComment{
		ID:        primitive.NewObjectID(),
		News:      nid,
		User:      uid,
		Comment:   body.Comment,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	coll := db.GetCollection("newsComments")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db not initialized"})
		return
	}

	if _, err := coll.InsertOne(c, nc); err != nil {
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
	cid, err := primitive.ObjectIDFromHex(commentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid comment id"})
		return
	}

	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	uidStr, _ := v.(string)
	uid, _ := primitive.ObjectIDFromHex(uidStr)

	var body struct {
		Comment string `json:"comment"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	coll := db.GetCollection("newsComments")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// push reply and return updated document with populated users
	now := time.Now().UTC()
	reply := models.CommentReply{User: uid, Comment: body.Comment, CreatedAt: now}

	res := coll.FindOneAndUpdate(c, bson.M{"_id": cid}, bson.M{"$push": bson.M{"commentReplies": reply}}, options.FindOneAndUpdate().SetReturnDocument(options.After))
	var updated models.NewsComment
	if err := res.Decode(&updated); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "comment not found"})
		return
	}

	// populate user and replies
	userColl := db.GetCollection("users")
	var u bson.M
	if userColl != nil {
		_ = userColl.FindOne(c, bson.M{"_id": updated.User}).Decode(&u)
		delete(u, "password")
		delete(u, "role")
	}

	var replies []bson.M
	for _, r := range updated.CommentReplies {
		var ru bson.M
		if userColl != nil {
			_ = userColl.FindOne(c, bson.M{"_id": r.User}).Decode(&ru)
			delete(ru, "password")
			delete(ru, "role")
		}
		replies = append(replies, bson.M{"user": ru, "comment": r.Comment, "created_at": r.CreatedAt})
	}

	_ = cache.Delete(c, "news:comments:"+updated.News.Hex())
	out := bson.M{"id": updated.ID.Hex(), "news": updated.News.Hex(), "user": u, "comment": updated.Comment, "commentReplies": replies}
	c.JSON(http.StatusCreated, gin.H{"data": out})
}

// (no helper needed)

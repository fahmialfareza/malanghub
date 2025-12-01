package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
)

// GetCommentsByNews returns comments for a news item with populated users
func GetCommentsByNews(c *gin.Context) {
	newsID := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(newsID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid news id"})
		return
	}

	coll := db.GetCollection("newsComments")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	cur, err := coll.Find(c, bson.M{"news": oid})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cur.Close(c)

	var out []bson.M
	userColl := db.GetCollection("users")
	for cur.Next(c) {
		var nc models.NewsComment
		if err := cur.Decode(&nc); err != nil {
			continue
		}
		// populate user
		var u bson.M
		if userColl != nil {
			_ = userColl.FindOne(c, bson.M{"_id": nc.User}).Decode(&u)
			// strip sensitive fields
			delete(u, "password")
			delete(u, "role")
		}

		// populate replies' users
		var replies []bson.M
		for _, r := range nc.CommentReplies {
			var ru bson.M
			if userColl != nil {
				_ = userColl.FindOne(c, bson.M{"_id": r.User}).Decode(&ru)
				delete(ru, "password")
				delete(ru, "role")
			}
			replies = append(replies, bson.M{"user": ru, "comment": r.Comment, "created_at": r.CreatedAt})
		}

		item := bson.M{
			"id":             nc.ID.Hex(),
			"news":           nc.News.Hex(),
			"user":           u,
			"comment":        nc.Comment,
			"commentReplies": replies,
			"created_at":     nc.CreatedAt,
			"updated_at":     nc.UpdatedAt,
		}
		out = append(out, item)
	}

	c.JSON(http.StatusOK, gin.H{"data": out})
}

// CreateComment creates a comment for a news item
func CreateComment(c *gin.Context) {
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

	c.JSON(http.StatusCreated, gin.H{"data": nc})
}

// CreateCommentByComment adds a reply to a comment
func CreateCommentByComment(c *gin.Context) {
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

	out := bson.M{"id": updated.ID.Hex(), "news": updated.News.Hex(), "user": u, "comment": updated.Comment, "commentReplies": replies}
	c.JSON(http.StatusCreated, gin.H{"data": out})
}

// (no helper needed)

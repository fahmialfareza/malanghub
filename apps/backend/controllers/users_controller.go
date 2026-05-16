package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/fahmialfareza/malanghub/backend/models"
	cloudinarypkg "github.com/fahmialfareza/malanghub/backend/pkg/cloudinary"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateUser(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.CreateUser")()

	var payload models.User
	if err := c.ShouldBind(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	payload.ID = primitive.NewObjectID()
	payload.CreatedAt = time.Now().UTC()

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	if _, err := coll.InsertOne(c, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	payload.Password = ""
	c.JSON(http.StatusCreated, payload)
}

func ListUsers(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.ListUsers")()

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	cur, err := coll.Find(c, bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cur.Close(c)

	var users []models.User
	for cur.Next(c) {
		var u models.User
		if err := cur.Decode(&u); err != nil {
			continue
		}
		u.Password = ""
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

func GetProfile(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetProfile")()

	// userID set by JWT middleware
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

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	if err := coll.FindOne(c, bson.M{"_id": oid}).Decode(&u); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	u.Password = ""

	c.JSON(http.StatusOK, gin.H{"data": u})
}

func UpdateProfile(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.UpdateProfile")()

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

	if err := c.Request.ParseMultipartForm(32 << 20); err != nil && err != http.ErrNotMultipart {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid form data"})
		return
	}

	body := bson.M{}
	for _, field := range []string{"name", "motto", "bio", "instagram", "facebook", "twitter", "tiktok", "linkedin"} {
		if value := strings.TrimSpace(c.PostForm(field)); value != "" {
			body[field] = value
		}
	}

	if fileHeader, err := c.FormFile("photo"); err == nil && fileHeader != nil {
		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" || !strings.HasPrefix(contentType, "image") {
			c.JSON(http.StatusBadRequest, gin.H{"message": "photo must be an image"})
			return
		}
		if fileHeader.Size > 1000000 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "photo must be less than 1 MB"})
			return
		}

		cld, err := cloudinarypkg.InitWithContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "cloudinary init failed: " + err.Error()})
			return
		}
		if cld != nil {
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
			body["photo"] = url
		}
	}

	body["updated_at"] = time.Now().UTC()

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	res := coll.FindOneAndUpdate(
		c,
		bson.M{"_id": oid},
		bson.M{"$set": body},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	var u models.User
	if err := res.Decode(&u); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	u.Password = ""
	c.JSON(http.StatusOK, gin.H{"data": u})
}

// DeleteAccount soft-deletes the authenticated user's account.
func DeleteAccount(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.DeleteAccount")()

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

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	deleted := true
	update := bson.M{
		"$set": bson.M{
			"deleted":    &deleted,
			"name":       "User Dihapus",
			"email":      "deleted_" + oid.Hex() + "@malanghub.com",
			"password":   "",
			"photo":      "",
			"motto":      "",
			"bio":        "",
			"instagram":  "",
			"facebook":   "",
			"twitter":    "",
			"tiktok":     "",
			"linkedin":   "",
			"updated_at": time.Now().UTC(),
		},
	}

	res, err := coll.UpdateOne(c, bson.M{"_id": oid}, update)
	if err != nil || res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account deleted"})
}

// GetUser returns a user by id (public view)
func GetUser(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GetUser")()

	id := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	if err := coll.FindOne(c, bson.M{"_id": oid}).Decode(&u); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}
	u.Password = ""
	c.JSON(http.StatusOK, gin.H{"data": u})
}

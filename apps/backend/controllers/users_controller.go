package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateUser(c *gin.Context) {
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

// GetUser returns a user by id (public view)
func GetUser(c *gin.Context) {
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

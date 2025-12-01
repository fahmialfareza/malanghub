package controllers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/auth"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/redisclient"
)

type signupPayload struct {
	Name     string `form:"name" json:"name" binding:"required"`
	Email    string `form:"email" json:"email" binding:"required,email"`
	Password string `form:"password" json:"password" binding:"required"`
}

type signinPayload struct {
	Email    string `form:"email" json:"email" binding:"required,email"`
	Password string `form:"password" json:"password" binding:"required"`
}

func Signup(c *gin.Context) {
	var p signupPayload
	// Accept JSON or form-urlencoded payloads
	if err := c.ShouldBind(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// check existing
	var existing bson.M
	if err := coll.FindOne(c, bson.M{"email": p.Email}).Decode(&existing); err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "email already registered"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to hash password"})
		return
	}

	now := time.Now().UTC()
	u := models.User{
		ID:        primitive.NewObjectID(),
		Name:      p.Name,
		Email:     p.Email,
		Password:  string(hashed),
		Role:      "user",
		CreatedAt: now,
		UpdatedAt: now,
	}

	if _, err := coll.InsertOne(c, u); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	token, err := auth.GenerateToken(u.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token})
}

func Signin(c *gin.Context) {
	var p signinPayload
	// Accept JSON or form-urlencoded payloads
	if err := c.ShouldBind(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	if err := coll.FindOne(c, bson.M{"email": p.Email}).Decode(&u); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(p.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(u.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GoogleSignIn accepts { "access_token": "..." }
func GoogleSignIn(c *gin.Context) {
	var body struct {
		AccessToken string `form:"access_token" json:"access_token"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if strings.TrimSpace(body.AccessToken) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "access_token required"})
		return
	}

	// fetch google userinfo
	resp, err := http.Get("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + body.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to call google"})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusBadRequest, gin.H{"message": "google error", "detail": string(b)})
		return
	}

	var info struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to parse google response"})
		return
	}

	coll := db.GetCollection("users")
	if coll == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// try find by email
	var u models.User
	if err := coll.FindOne(c, bson.M{"email": info.Email}).Decode(&u); err != nil {
		// create user
		now := time.Now().UTC()
		newU := models.User{
			ID:        primitive.NewObjectID(),
			Name:      info.Name,
			Email:     info.Email,
			Role:      "user",
			Photo:     info.Picture,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if _, err := coll.InsertOne(c, newU); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create user"})
			return
		}
		u = newU
	}

	token, err := auth.GenerateToken(u.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	// optional: prime profile cache
	go func() {
		_ = redisclient.CacheSetDefault(c, "user:profile:"+u.ID.Hex(), u, 24*time.Hour)
	}()

	c.JSON(http.StatusOK, gin.H{"token": token})
}

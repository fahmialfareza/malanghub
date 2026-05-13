package controllers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/auth"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
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

type googleUserInfo struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func Signup(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.Signup")()

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

	token, err := auth.GenerateTokenWithContext(c, u.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token})
}

func Signin(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.Signin")()

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

	token, err := auth.GenerateTokenWithContext(c, u.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GoogleSignIn accepts { "access_token": "..." } for web/desktop and
// { "id_token": "..." } for native Android/iOS Google sign-in.
func GoogleSignIn(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.GoogleSignIn")()

	var body struct {
		AccessToken string `form:"access_token" json:"access_token"`
		IDToken     string `form:"id_token" json:"id_token"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	accessToken := strings.TrimSpace(body.AccessToken)
	idToken := strings.TrimSpace(body.IDToken)

	if accessToken == "" && idToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "access_token or id_token required"})
		return
	}

	var token string
	var status int
	var payload gin.H
	if idToken != "" {
		token, status, payload = signInWithGoogleIDToken(c, idToken)
	} else {
		token, status, payload = signInWithGoogleAccessToken(c, accessToken)
	}

	if status != http.StatusOK {
		c.JSON(status, payload)
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func signInWithGoogleAccessToken(c *gin.Context, accessToken string) (string, int, gin.H) {
	info, status, payload := googleUserInfoFromAccessToken(c, accessToken)
	if status != http.StatusOK {
		return "", status, payload
	}

	token, status, payload := tokenForGoogleUser(c, info)
	if status != http.StatusOK {
		return "", status, payload
	}

	return token, http.StatusOK, gin.H{"token": token}
}

func signInWithGoogleIDToken(c *gin.Context, idToken string) (string, int, gin.H) {
	info, status, payload := googleUserInfoFromIDToken(c, idToken)
	if status != http.StatusOK {
		return "", status, payload
	}

	token, status, payload := tokenForGoogleUser(c, info)
	if status != http.StatusOK {
		return "", status, payload
	}

	return token, http.StatusOK, gin.H{"token": token}
}

func googleUserInfoFromAccessToken(c *gin.Context, accessToken string) (googleUserInfo, int, gin.H) {
	// fetch google userinfo
	userInfoURL, err := url.Parse("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to build google request"}
	}
	query := userInfoURL.Query()
	query.Set("access_token", accessToken)
	userInfoURL.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(c, http.MethodGet, userInfoURL.String(), nil)
	if err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to build google request"}
	}
	req = newrelicpkg.InstrumentRequest(c, req)

	client := newrelicpkg.InstrumentedHTTPClient(&http.Client{Timeout: 10 * time.Second})
	resp, err := client.Do(req)
	if err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to call google"}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google error", "detail": string(b)}
	}

	var info googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to parse google response"}
	}

	return info, http.StatusOK, gin.H{}
}

func googleUserInfoFromIDToken(c *gin.Context, idToken string) (googleUserInfo, int, gin.H) {
	tokenInfoURL, err := url.Parse("https://oauth2.googleapis.com/tokeninfo")
	if err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to build google request"}
	}
	query := tokenInfoURL.Query()
	query.Set("id_token", idToken)
	tokenInfoURL.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(c, http.MethodGet, tokenInfoURL.String(), nil)
	if err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to build google request"}
	}
	req = newrelicpkg.InstrumentRequest(c, req)

	client := newrelicpkg.InstrumentedHTTPClient(&http.Client{Timeout: 10 * time.Second})
	resp, err := client.Do(req)
	if err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to call google"}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google id token invalid", "detail": string(b)}
	}

	var tokenInfo struct {
		Audience      string `json:"aud"`
		Email         string `json:"email"`
		EmailVerified any    `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		return googleUserInfo{}, http.StatusInternalServerError, gin.H{"message": "failed to parse google response"}
	}

	if !isAllowedGoogleAudience(tokenInfo.Audience) {
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google id token audience is not allowed"}
	}
	if tokenInfo.Email == "" {
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google id token does not include email"}
	}
	if !isGoogleEmailVerified(tokenInfo.EmailVerified) {
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google email is not verified"}
	}

	return googleUserInfo{
		Email:   tokenInfo.Email,
		Name:    tokenInfo.Name,
		Picture: tokenInfo.Picture,
	}, http.StatusOK, gin.H{}
}

func tokenForGoogleUser(c *gin.Context, info googleUserInfo) (string, int, gin.H) {
	coll := db.GetCollection("users")
	if coll == nil {
		return "", http.StatusInternalServerError, gin.H{"message": "db not initialized"}
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
			return "", http.StatusInternalServerError, gin.H{"message": "failed to create user"}
		}
		u = newU
	}

	token, err := auth.GenerateTokenWithContext(c, u.ID.Hex())
	if err != nil {
		return "", http.StatusInternalServerError, gin.H{"message": "failed to generate token"}
	}

	return token, http.StatusOK, gin.H{"token": token}
}

func isAllowedGoogleAudience(audience string) bool {
	if audience == "" {
		return false
	}

	for _, allowed := range allowedGoogleAudiences() {
		if audience == allowed {
			return true
		}
	}

	return false
}

func allowedGoogleAudiences() []string {
	keys := []string{
		"GOOGLE_ALLOWED_CLIENT_IDS",
		"GOOGLE_SERVER_CLIENT_ID",
		"GOOGLE_WEB_CLIENT_ID",
		"GOOGLE_OAUTH_CLIENT_ID",
		"GOOGLE_CLIENT_ID",
		"GOOGLE_IOS_CLIENT_ID",
		"GOOGLE_ANDROID_CLIENT_ID",
	}
	values := make([]string, 0, len(keys))
	seen := map[string]struct{}{}

	for _, key := range keys {
		for _, value := range strings.Split(os.Getenv(key), ",") {
			trimmed := strings.TrimSpace(value)
			if trimmed == "" {
				continue
			}
			if _, exists := seen[trimmed]; exists {
				continue
			}
			seen[trimmed] = struct{}{}
			values = append(values, trimmed)
		}
	}

	return values
}

func isGoogleEmailVerified(value any) bool {
	switch typed := value.(type) {
	case bool:
		return typed
	case string:
		return strings.EqualFold(typed, "true")
	default:
		return false
	}
}

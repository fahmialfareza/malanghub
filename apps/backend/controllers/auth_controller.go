package controllers

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	jwtv5 "github.com/golang-jwt/jwt/v5"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/auth"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
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
	Email         string `json:"email"`
	EmailVerified any    `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func Signup(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.Signup")()

	var p signupPayload
	// Accept JSON or form-urlencoded payloads
	if err := c.ShouldBind(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	// check existing
	var existing models.User
	if err := gdb.WithContext(c).Select("id").Take(&existing, "email = ?", p.Email).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "email already registered"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to hash password"})
		return
	}

	u := models.User{
		Name:     p.Name,
		Email:    p.Email,
		Password: string(hashed),
		Role:     "user",
	}

	if err := gdb.WithContext(c).Create(&u).Error; err != nil {
		if db.IsDuplicateKey(err) {
			c.JSON(http.StatusConflict, gin.H{"message": "email already registered"})
			return
		}
		internalError(c, "message", err)
		return
	}

	token, err := auth.GenerateTokenWithContext(c, u.ID)
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

	gdb := db.DB()
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "db not initialized"})
		return
	}

	var u models.User
	if err := gdb.WithContext(c).Take(&u, "email = ?", p.Email).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(p.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}

	token, err := auth.GenerateTokenWithContext(c, u.ID)
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
	// the token must have been issued to one of our OAuth clients
	if status, payload := checkGoogleAccessTokenAudience(c, accessToken); status != http.StatusOK {
		return googleUserInfo{}, status, payload
	}

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
	if info.Email == "" {
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google account does not include email"}
	}
	if !isGoogleEmailVerified(info.EmailVerified) {
		return googleUserInfo{}, http.StatusBadRequest, gin.H{"message": "google email is not verified"}
	}

	return info, http.StatusOK, gin.H{}
}

// checkGoogleAccessTokenAudience asks Google's tokeninfo endpoint which client
// the access token was issued to and accepts only configured client IDs.
func checkGoogleAccessTokenAudience(c *gin.Context, accessToken string) (int, gin.H) {
	tokenInfoURL, err := url.Parse("https://oauth2.googleapis.com/tokeninfo")
	if err != nil {
		return http.StatusInternalServerError, gin.H{"message": "failed to build google request"}
	}
	query := tokenInfoURL.Query()
	query.Set("access_token", accessToken)
	tokenInfoURL.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(c, http.MethodGet, tokenInfoURL.String(), nil)
	if err != nil {
		return http.StatusInternalServerError, gin.H{"message": "failed to build google request"}
	}
	req = newrelicpkg.InstrumentRequest(c, req)

	client := newrelicpkg.InstrumentedHTTPClient(&http.Client{Timeout: 10 * time.Second})
	resp, err := client.Do(req)
	if err != nil {
		return http.StatusInternalServerError, gin.H{"message": "failed to call google"}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return http.StatusBadRequest, gin.H{"message": "google access token invalid"}
	}

	var tokenInfo struct {
		Audience        string `json:"aud"`
		AuthorizedParty string `json:"azp"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		return http.StatusInternalServerError, gin.H{"message": "failed to parse google response"}
	}
	if !isAllowedGoogleAudience(tokenInfo.Audience) && !isAllowedGoogleAudience(tokenInfo.AuthorizedParty) {
		return http.StatusBadRequest, gin.H{"message": "google access token audience is not allowed"}
	}

	return http.StatusOK, gin.H{}
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
	gdb := db.DB()
	if gdb == nil {
		return "", http.StatusInternalServerError, gin.H{"message": "db not initialized"}
	}

	// try find by email
	var u models.User
	if err := gdb.WithContext(c).Scopes(db.NotDeleted).Take(&u, "email = ?", info.Email).Error; err == nil {
		// Google verified the email, so a password set on this account
		// before (possibly by someone pre-registering it) is cleared.
		if err := clearPassword(c, u); err != nil {
			return "", http.StatusInternalServerError, gin.H{"message": "failed to link account"}
		}
	} else {
		// create user
		newU := models.User{
			Name:  info.Name,
			Email: info.Email,
			Role:  "user",
			Photo: info.Picture,
		}
		if err := gdb.WithContext(c).Create(&newU).Error; err != nil {
			return "", http.StatusInternalServerError, gin.H{"message": "failed to create user"}
		}
		u = newU
	}

	token, err := auth.GenerateTokenWithContext(c, u.ID)
	if err != nil {
		return "", http.StatusInternalServerError, gin.H{"message": "failed to generate token"}
	}

	return token, http.StatusOK, gin.H{"token": token}
}

// clearPassword removes the password of an account that is being signed in
// through an identity provider. Signup never verifies email ownership, so the
// password may have been set by someone else (pre-account hijacking); from
// now on the account signs in through the identity provider.
func clearPassword(c *gin.Context, u models.User) error {
	if u.Password == "" {
		return nil
	}
	return db.DB().WithContext(c).Model(&models.User{}).Where("id = ?", u.ID).
		Updates(map[string]interface{}{"password": "", "updated_at": time.Now().UTC()}).Error
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

// ──────────────────────────────────────────────
// Apple Sign In
// ──────────────────────────────────────────────

type appleJWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type appleJWKS struct {
	Keys []appleJWK `json:"keys"`
}

func fetchApplePublicKeys(c *gin.Context) ([]appleJWK, error) {
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, "https://appleid.apple.com/auth/keys", nil)
	if err != nil {
		return nil, err
	}
	req = newrelicpkg.InstrumentRequest(c, req)
	client := newrelicpkg.InstrumentedHTTPClient(&http.Client{Timeout: 10 * time.Second})
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var jwks appleJWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, err
	}
	return jwks.Keys, nil
}

func jwkToRSAPublicKey(jwk appleJWK) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("decode N: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("decode E: %w", err)
	}
	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: int(new(big.Int).SetBytes(eBytes).Int64()),
	}, nil
}

func verifyAppleIdentityToken(c *gin.Context, identityToken string) (jwtv5.MapClaims, error) {
	keys, err := fetchApplePublicKeys(c)
	if err != nil {
		return nil, fmt.Errorf("fetch Apple JWKS: %w", err)
	}

	audiences := allowedAppleAudiences()
	if len(audiences) == 0 {
		return nil, fmt.Errorf("no Apple client IDs configured")
	}

	token, err := jwtv5.Parse(identityToken, func(token *jwtv5.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwtv5.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected alg: %v", token.Header["alg"])
		}
		kid, _ := token.Header["kid"].(string)
		for _, k := range keys {
			if k.Kid == kid {
				return jwkToRSAPublicKey(k)
			}
		}
		return nil, fmt.Errorf("no key for kid=%q", kid)
	},
		jwtv5.WithIssuer("https://appleid.apple.com"),
		jwtv5.WithAudience(audiences...),
		jwtv5.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwtv5.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid Apple token claims")
	}
	return claims, nil
}

// allowedAppleAudiences reads APPLE_CLIENT_IDS: the comma-separated bundle
// IDs / Services IDs whose identity tokens are accepted.
func allowedAppleAudiences() []string {
	var values []string
	for _, value := range strings.Split(os.Getenv("APPLE_CLIENT_IDS"), ",") {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}

// tokenForAppleUser signs in the user linked to appleSub. email must come from
// the verified identity token; it is used only to link or create an account.
func tokenForAppleUser(c *gin.Context, appleSub, email, name string) (string, int, gin.H) {
	gdb := db.DB()
	if gdb == nil {
		return "", http.StatusInternalServerError, gin.H{"message": "db not initialized"}
	}

	var u models.User
	// Prefer lookup by Apple sub (stable across email changes)
	if err := gdb.WithContext(c).Scopes(db.NotDeleted).Take(&u, "apple_sub = ?", appleSub).Error; err != nil && email != "" {
		_ = gdb.WithContext(c).Scopes(db.NotDeleted).Take(&u, "email = ?", email).Error
	}

	if u.ID != "" && u.AppleSub != "" && u.AppleSub != appleSub {
		return "", http.StatusConflict, gin.H{"message": "account is linked to a different Apple ID"}
	}

	if u.ID == "" {
		genEmail := email
		if genEmail == "" {
			genEmail = "apple_" + appleSub + "@privaterelay.appleid.com"
		}
		genName := strings.TrimSpace(name)
		if genName == "" {
			genName = "Apple User"
		}
		newU := models.User{
			Name:     genName,
			Email:    genEmail,
			AppleSub: appleSub,
			Role:     "user",
		}
		if err := gdb.WithContext(c).Create(&newU).Error; err != nil {
			return "", http.StatusInternalServerError, gin.H{"message": "failed to create user"}
		}
		u = newU
	} else if u.AppleSub == "" {
		// first Apple link of an existing account: Apple verified the email,
		// so drop any password set before (see clearPassword)
		if err := gdb.WithContext(c).Model(&models.User{}).Where("id = ?", u.ID).
			Updates(map[string]interface{}{"apple_sub": appleSub, "password": "", "updated_at": time.Now().UTC()}).Error; err != nil {
			return "", http.StatusInternalServerError, gin.H{"message": "failed to link account"}
		}
	}

	token, err := auth.GenerateTokenWithContext(c, u.ID)
	if err != nil {
		return "", http.StatusInternalServerError, gin.H{"message": "failed to generate token"}
	}
	return token, http.StatusOK, gin.H{"token": token}
}

// AppleSignIn accepts { "identity_token": "...", "name": "..." } from the native
// Apple Sign In SDK. The email is taken only from the verified token.
func AppleSignIn(c *gin.Context) {
	defer newrelicpkg.EndSegment(c, "controllers.AppleSignIn")()

	var body struct {
		IdentityToken string `form:"identity_token" json:"identity_token"`
		Name          string `form:"name"           json:"name"`
	}
	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	identityToken := strings.TrimSpace(body.IdentityToken)
	if identityToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "identity_token required"})
		return
	}

	claims, err := verifyAppleIdentityToken(c, identityToken)
	if err != nil {
		logger.Error("apple sign-in:", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid Apple identity token"})
		return
	}

	sub, _ := claims["sub"].(string)
	if sub == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Apple token missing sub claim"})
		return
	}

	// Never trust a client-supplied email; without a verified email claim the
	// account can only be found by its Apple sub.
	email, _ := claims["email"].(string)
	if email != "" && !isGoogleEmailVerified(claims["email_verified"]) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Apple email is not verified"})
		return
	}

	token, status, payload := tokenForAppleUser(c, sub, email, body.Name)
	if status != http.StatusOK {
		c.JSON(status, payload)
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

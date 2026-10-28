package auth

import (
	"context"
	"errors"
	"os"
	"time"

	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"github.com/golang-jwt/jwt/v5"
)

// minSecretLen is the minimum JWT_SECRET length in bytes (256 bits for HS256).
const minSecretLen = 32

var jwtSecret []byte

var errNoSecret = errors.New("JWT secret not initialized")

// Init reads JWT_SECRET. Call it once at startup, after .env is loaded; it
// fails when the secret is unset, a known placeholder, or too short.
func Init() error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" || secret == "changeme" {
		return errors.New("JWT_SECRET must be set")
	}
	if len(secret) < minSecretLen {
		return errors.New("JWT_SECRET must be at least 32 bytes")
	}
	jwtSecret = []byte(secret)
	return nil
}

func GenerateToken(userID string) (string, error) {
	return GenerateTokenWithContext(context.Background(), userID)
}

func GenerateTokenWithContext(ctx context.Context, userID string) (string, error) {
	defer newrelicpkg.EndSegment(ctx, "auth.GenerateToken")()

	if len(jwtSecret) == 0 {
		return "", errNoSecret
	}

	claims := jwt.MapClaims{
		"user": map[string]string{"id": userID},
		"exp":  time.Now().Add(30 * 24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateTokenString(tokenStr string) (*jwt.Token, error) {
	return ValidateTokenStringWithContext(context.Background(), tokenStr)
}

func ValidateTokenStringWithContext(ctx context.Context, tokenStr string) (*jwt.Token, error) {
	defer newrelicpkg.EndSegment(ctx, "auth.ValidateTokenString")()

	if len(jwtSecret) == 0 {
		return nil, errNoSecret
	}

	return jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
}

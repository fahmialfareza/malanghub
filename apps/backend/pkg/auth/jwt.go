package auth

import (
	"context"
	"os"
	"time"

	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "changeme"))

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func GenerateToken(userID string) (string, error) {
	return GenerateTokenWithContext(context.Background(), userID)
}

func GenerateTokenWithContext(ctx context.Context, userID string) (string, error) {
	defer newrelicpkg.EndSegment(ctx, "auth.GenerateToken")()

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

	return jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
}

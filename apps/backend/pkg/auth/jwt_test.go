package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-0123456789abcdef0123456789"

func TestInitRejectsWeakSecrets(t *testing.T) {
	for _, secret := range []string{"", "changeme", "short-secret"} {
		t.Setenv("JWT_SECRET", secret)
		if err := Init(); err == nil {
			t.Errorf("Init() accepted JWT_SECRET=%q", secret)
		}
	}
	t.Setenv("JWT_SECRET", testSecret)
	if err := Init(); err != nil {
		t.Fatalf("Init() rejected a strong secret: %v", err)
	}
}

func TestValidateToken(t *testing.T) {
	t.Setenv("JWT_SECRET", testSecret)
	if err := Init(); err != nil {
		t.Fatal(err)
	}

	user := map[string]string{"id": "aaaaaaaaaaaaaaaaaaaaaaaa"}
	exp := time.Now().Add(time.Hour).Unix()
	sign := func(m jwt.SigningMethod, claims jwt.MapClaims, key any) string {
		s, err := jwt.NewWithClaims(m, claims).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return s
	}

	good, err := GenerateToken(user["id"])
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name  string
		token string
		ok    bool
	}{
		{"generated", good, true},
		{"changeme key", sign(jwt.SigningMethodHS256, jwt.MapClaims{"user": user, "exp": exp}, []byte("changeme")), false},
		{"HS512", sign(jwt.SigningMethodHS512, jwt.MapClaims{"user": user, "exp": exp}, []byte(testSecret)), false},
		{"no exp", sign(jwt.SigningMethodHS256, jwt.MapClaims{"user": user}, []byte(testSecret)), false},
		{"expired", sign(jwt.SigningMethodHS256, jwt.MapClaims{"user": user, "exp": time.Now().Add(-time.Hour).Unix()}, []byte(testSecret)), false},
		{"alg none", sign(jwt.SigningMethodNone, jwt.MapClaims{"user": user, "exp": exp}, jwt.UnsafeAllowNoneSignatureType), false},
	}
	for _, tt := range tests {
		tok, err := ValidateTokenString(tt.token)
		if got := err == nil && tok.Valid; got != tt.ok {
			t.Errorf("%s: valid=%v, want %v (err=%v)", tt.name, got, tt.ok, err)
		}
	}
}

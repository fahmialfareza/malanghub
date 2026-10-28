package controllers

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"io"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	jwtv5 "github.com/golang-jwt/jwt/v5"
)

// stubTransport answers outbound requests by URL path so no traffic leaves
// the test. The New Relic client wrapper falls back to http.DefaultTransport.
type stubTransport map[string]string

func (s stubTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	body, ok := s[req.URL.Host+req.URL.Path]
	status := http.StatusOK
	if !ok {
		status = http.StatusNotFound
	}
	return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}, Request: req}, nil
}

func useStub(t *testing.T, s stubTransport) {
	t.Helper()
	orig := http.DefaultTransport
	http.DefaultTransport = s
	t.Cleanup(func() { http.DefaultTransport = orig })
}

func testContext() *gin.Context {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest("POST", "/", nil)
	return c
}

func TestGoogleAccessTokenChecks(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "our-client")
	tests := []struct {
		name, tokeninfo, userinfo string
		want                      int
	}{
		{"ours", `{"aud":"our-client","azp":"our-client"}`, `{"email":"a@example.test","email_verified":true}`, http.StatusOK},
		{"other client", `{"aud":"other-client","azp":"other-client"}`, `{"email":"a@example.test","email_verified":true}`, http.StatusBadRequest},
		{"unverified email", `{"aud":"our-client"}`, `{"email":"a@example.test","email_verified":false}`, http.StatusBadRequest},
		{"no email", `{"aud":"our-client"}`, `{}`, http.StatusBadRequest},
	}
	for _, tt := range tests {
		useStub(t, stubTransport{
			"oauth2.googleapis.com/tokeninfo":       tt.tokeninfo,
			"www.googleapis.com/oauth2/v3/userinfo": tt.userinfo,
		})
		_, status, payload := googleUserInfoFromAccessToken(testContext(), "token")
		if status != tt.want {
			t.Errorf("%s: got %d %v, want %d", tt.name, status, payload, tt.want)
		}
	}
}

func TestAppleAudienceCheck(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	jwks, _ := json.Marshal(appleJWKS{Keys: []appleJWK{{
		Kty: "RSA", Kid: "test", Alg: "RS256",
		N: base64.RawURLEncoding.EncodeToString(key.N.Bytes()),
		E: base64.RawURLEncoding.EncodeToString(big.NewInt(int64(key.E)).Bytes()),
	}}})
	useStub(t, stubTransport{"appleid.apple.com/auth/keys": string(jwks)})

	sign := func(aud string) string {
		tok := jwtv5.NewWithClaims(jwtv5.SigningMethodRS256, jwtv5.MapClaims{
			"iss": "https://appleid.apple.com", "aud": aud, "sub": "sub-1",
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		tok.Header["kid"] = "test"
		s, err := tok.SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return s
	}

	t.Setenv("APPLE_CLIENT_IDS", "")
	if _, err := verifyAppleIdentityToken(testContext(), sign("com.malanghub.app")); err == nil {
		t.Error("accepted a token with no Apple client IDs configured")
	}

	t.Setenv("APPLE_CLIENT_IDS", "com.malanghub.app, com.malanghub.web")
	if _, err := verifyAppleIdentityToken(testContext(), sign("com.malanghub.web")); err != nil {
		t.Errorf("rejected a token for a configured client: %v", err)
	}
	if _, err := verifyAppleIdentityToken(testContext(), sign("com.attacker.other")); err == nil {
		t.Error("accepted a token issued to another client")
	}
}

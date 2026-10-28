package routes

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	authpkg "github.com/fahmialfareza/malanghub/backend/pkg/auth"
)

// These run without a database: the checks under test happen before any
// handler touches it.
func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()
	t.Setenv("JWT_SECRET", "test-secret-0123456789abcdef0123456789")
	if err := authpkg.Init(); err != nil {
		t.Fatal(err)
	}
	gin.SetMode(gin.TestMode)
	r := gin.New()
	Register(r)
	return r
}

func TestProtectedRoutesRequireToken(t *testing.T) {
	r := newTestRouter(t)
	routes := []struct{ method, path, body string }{
		{"POST", "/api/users", `{"name":"t","email":"t@example.test","password":"pw","role":"admin"}`},
		{"GET", "/api/users/all", ""},
		{"POST", "/api/upload", `{"file":"x"}`},
		{"GET", "/api/newsDrafts", ""},
		{"GET", "/api/newsDrafts/some-draft", ""},
	}
	for _, rt := range routes {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(rt.method, rt.path, strings.NewReader(rt.body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("%s %s without token: got %d, want 401", rt.method, rt.path, w.Code)
		}
	}
}

func TestTokenIsCheckedAgainstUserTable(t *testing.T) {
	r := newTestRouter(t)
	token, err := authpkg.GenerateToken("aaaaaaaaaaaaaaaaaaaaaaaa")
	if err != nil {
		t.Fatal(err)
	}
	// With no database the middleware cannot confirm the user still exists
	// (not soft-deleted), so it must not let the request through.
	for _, path := range []string{"/api/users/profile", "/api/newsDrafts/myDrafts"} {
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", path, nil)
		req.Header.Set("Authorization", "Bearer "+token)
		r.ServeHTTP(w, req)
		if w.Code < 400 {
			t.Errorf("GET %s with unverifiable user: got %d, want an error", path, w.Code)
		}
	}
}

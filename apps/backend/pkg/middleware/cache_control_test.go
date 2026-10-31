package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
)

func TestPublicCacheOnlyOnSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(NoStore())
	r.GET("/ok", PublicCache(time.Minute), func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{}) })
	r.GET("/missing", PublicCache(time.Minute), func(c *gin.Context) { c.JSON(http.StatusNotFound, gin.H{}) })
	r.GET("/private", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{}) })

	tests := map[string]string{
		"/ok":      "public, max-age=0, s-maxage=60",
		"/missing": "private, no-store",
		"/private": "private, no-store",
	}
	for path, want := range tests {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if got := w.Header().Get("Cache-Control"); got != want {
			t.Errorf("%s: Cache-Control %q, want %q", path, got, want)
		}
	}
}

func TestAdvancedResultsCacheKeyIgnoresUnusedParams(t *testing.T) {
	key := func(query string) string {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Request = httptest.NewRequest("GET", "/api/news?"+query, nil)
		return advancedResultsCacheKey("news", c)
	}
	base := key("page=1&limit=4&sort=-views")
	if got := key("page=1&limit=4&sort=-views&created_at[gte]=2026-10-01T12:00:00.123Z"); got != base {
		t.Errorf("created_at[gte] changed the cache key")
	}
	if got := key("page=1&limit=4&sort=-views&excerpt=1"); got == base {
		t.Errorf("excerpt=1 must have its own cache key")
	}
}

func TestContentExcerpt(t *testing.T) {
	if got := contentExcerpt("<p>Hello <b>Malang</b></p>\n<p>&amp; world</p>"); got != "Hello Malang &amp; world" {
		t.Errorf("short: got %q", got)
	}

	long := "<p>" + strings.Repeat("kata ", 200) + "</p>"
	got := contentExcerpt(long)
	if n := utf8.RuneCountInString(got); n > excerptRunes+1 {
		t.Errorf("long: %d runes, want at most %d", n, excerptRunes+1)
	}
	if !strings.HasSuffix(got, "kata…") {
		t.Errorf("long: should end on a whole word, got %q", got[len(got)-20:])
	}

	entity := strings.Repeat("a", excerptRunes-2) + "&amp;x more text here"
	if got := contentExcerpt(entity); strings.Contains(got, "&am") {
		t.Errorf("entity: cut inside an entity: %q", got[len(got)-10:])
	}
}

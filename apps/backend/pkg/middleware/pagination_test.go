package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPagination(t *testing.T) {
	tests := []struct {
		query                     string
		wantPage, wantLimit, want int
	}{
		{"", 1, 20, 0},
		{"page=3&limit=10", 3, 10, 20},
		{"page=2&limit=100", 2, 100, 100},
		{"page=1&limit=10000", 1, MaxPageLimit, 0},
		{"page=-1&limit=0", 1, 20, 0},
		{"page=abc&limit=xyz", 1, 20, 0},
	}
	for _, tt := range tests {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Request = httptest.NewRequest("GET", "/?"+tt.query, nil)
		page, limit, offset := Pagination(c)
		if page != tt.wantPage || limit != tt.wantLimit || offset != tt.want {
			t.Errorf("%q: got (%d, %d, %d), want (%d, %d, %d)", tt.query, page, limit, offset, tt.wantPage, tt.wantLimit, tt.want)
		}
	}
}

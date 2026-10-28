package middleware

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/cache"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

// advancedResultsCacheKey produces a stable Redis key from the table, query params,
// and (for user-scoped routes like /myNews) the caller's user ID.
func advancedResultsCacheKey(table string, c *gin.Context) string {
	params := c.Request.URL.Query()
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var parts []string
	for _, k := range keys {
		parts = append(parts, k+"="+strings.Join(params[k], ","))
	}

	// For user-scoped routes, include the user ID so different users never share the same cache entry.
	if strings.Contains(c.Request.URL.Path, "/myNews") || strings.Contains(c.Request.URL.Path, "/myDrafts") {
		if v, ok := c.Get("userID"); ok {
			if uid, ok := v.(string); ok && uid != "" {
				parts = append(parts, "_uid="+uid)
			}
		}
	}

	h := md5.Sum([]byte(strings.Join(parts, "&")))
	return table + ":list:adv:" + fmt.Sprintf("%x", h)
}

// sortColumns maps the public sort keys to news columns. Anything else is
// ignored so user input never reaches raw SQL.
var sortColumns = map[string]string{
	"created_at": "created_at",
	"updated_at": "updated_at",
	"views":      "views",
	"title":      "title",
	"slug":       "slug",
	"time_read":  "time_read",
	"status":     "status",
}

// filterColumns maps the supported filter query params to news columns.
var filterColumns = map[string]string{
	"category": "category_id",
	"user":     "user_id",
	"status":   "status",
}

func splitValues(v string) []string {
	vals := strings.Split(v, ",")
	for i := range vals {
		vals[i] = strings.TrimSpace(vals[i])
	}
	return vals
}

// AdvancedResults returns a middleware that performs filtering, sorting and pagination
// for the given table and stores the results in the context under "advancedResults".
func AdvancedResults(table string) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer newrelicpkg.EndSegment(c, "middleware.AdvancedResults."+table)()

		gdb := db.DB()
		if gdb == nil {
			c.Next()
			return
		}

		page, limit, offset := Pagination(c)

		// Return cached result when available (key covers table + query params + user ID).
		cKey := advancedResultsCacheKey(table, c)
		if cached, err := cache.Get(c, cKey); err == nil {
			var result interface{}
			if jsonErr := json.Unmarshal(cached, &result); jsonErr == nil {
				c.Set("advancedResults", result)
				c.Next()
				return
			}
		}

		// base filter: approved and not soft-deleted
		query := gdb.WithContext(c).Model(&models.News{}).Scopes(db.Published)

		// Track if this is myNews to prevent query param override
		isMyNews := strings.Contains(c.Request.RequestURI, "/myNews") || strings.Contains(c.Request.URL.Path, "/myNews")

		// If on /myNews route, automatically filter by current user (still approved)
		if isMyNews {
			if userIDVal, ok := c.Get("userID"); ok {
				if userIDStr, ok := userIDVal.(string); ok {
					query = query.Where("user_id = ?", userIDStr)
				}
			}
		}

		// allow basic filters via query params (category, user, status); comma-separated means IN
		// Skip user param if this is /myNews (already set above)
		for _, key := range []string{"category", "user", "status"} {
			if key == "user" && isMyNews {
				continue
			}
			if v := c.Query(key); v != "" {
				query = query.Where(filterColumns[key]+" IN ?", splitValues(v))
			}
		}
		if v := c.Query("tags"); v != "" {
			query = query.Where("EXISTS (SELECT 1 FROM news_tag_links l WHERE l.news_id = news.id AND l.tag_id IN ?)", splitValues(v))
		}

		// search param -> alias support: use `q` or `search` for case-insensitive match on title and content
		searchQuery := c.Query("q")
		if searchQuery == "" {
			searchQuery = c.Query("search")
		}
		if searchQuery != "" {
			pattern := "%" + escapeLike(searchQuery) + "%"
			query = query.Where("(title ILIKE ? OR content ILIKE ?)", pattern, pattern)
		}

		var total int64
		if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
			logger.Error("advancedResults:", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		// sort
		sorted := false
		if s := c.Query("sort"); s != "" {
			for _, p := range strings.Split(s, ",") {
				p = strings.TrimSpace(p)
				desc := strings.HasPrefix(p, "-")
				col, ok := sortColumns[strings.TrimPrefix(p, "-")]
				if !ok {
					continue
				}
				query = query.Order(clause.OrderByColumn{Column: clause.Column{Name: col}, Desc: desc})
				sorted = true
			}
		}
		if !sorted {
			query = query.Order("created_at DESC")
		}
		// tie-breaker keeps pagination stable
		query = query.Order("id")

		results := []models.News{}
		if err := query.Scopes(db.WithNewsRelations).Offset(offset).Limit(limit).Find(&results).Error; err != nil {
			logger.Error("advancedResults:", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		var data interface{} = results
		if sel := c.Query("select"); sel != "" {
			data = selectFields(results, strings.Split(sel, ","))
		}

		meta := gin.H{"page": page, "limit": limit, "total": total}
		response := gin.H{"meta": meta, "data": data}
		_ = cache.Set(c, cKey, response, 5*time.Minute)
		c.Set("advancedResults", response)
		c.Next()
	}
}

// selectFields keeps only the requested JSON fields (plus the ID) of each
// item, like the MongoDB $project stage did.
func selectFields(items []models.News, fields []string) []map[string]interface{} {
	out := make([]map[string]interface{}, 0, len(items))
	for _, item := range items {
		raw, err := json.Marshal(item)
		if err != nil {
			continue
		}
		var full map[string]interface{}
		if err := json.Unmarshal(raw, &full); err != nil {
			continue
		}
		picked := map[string]interface{}{"_id": full["_id"], "id": full["id"]}
		for _, f := range fields {
			f = strings.TrimSpace(f)
			if v, ok := full[f]; ok {
				picked[f] = v
			}
		}
		out = append(out, picked)
	}
	return out
}

func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, "%", `\%`, "_", `\_`).Replace(s)
}

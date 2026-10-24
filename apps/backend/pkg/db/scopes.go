package db

import "gorm.io/gorm"

// NotDeleted matches soft-delete-aware rows: deleted is false or unset.
func NotDeleted(tx *gorm.DB) *gorm.DB {
	return tx.Where("deleted IS NOT TRUE")
}

// Published matches news visible to the public: approved and not deleted.
func Published(tx *gorm.DB) *gorm.DB {
	return tx.Where("approved = ?", true).Scopes(NotDeleted)
}

// WithNewsRelations populates user, category and tags on news queries.
func WithNewsRelations(tx *gorm.DB) *gorm.DB {
	return tx.Preload("User").Preload("Category").Preload("Tags")
}

// NewsSearchVector is the full-text expression for news. It must match the
// expression of the news_search_idx index so Postgres can use it. The
// "simple" config disables stemming; Postgres has no Indonesian dictionary.
const NewsSearchVector = "setweight(to_tsvector('simple', coalesce(title, '')), 'A') || " +
	"setweight(to_tsvector('simple', coalesce(content, '')), 'B')"

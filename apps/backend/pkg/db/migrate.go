package db

import (
	"context"
	"fmt"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
)

// Migrate creates or updates the schema. It is idempotent and runs on every
// startup.
func Migrate(ctx context.Context) error {
	if gdb == nil {
		return ErrNotInitialized
	}
	tx := gdb.WithContext(ctx)

	if err := tx.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Tag{},
		&models.News{},
		&models.NewsComment{},
		&models.NewsCommentReply{},
	); err != nil {
		return fmt.Errorf("automigrate: %w", err)
	}

	// The news indexes are partial on the NotDeleted predicate: a btree can't
	// search on IS NOT TRUE, and the literal predicate lets the planner match
	// them even with generic prepared-statement plans. approved stays a key
	// column because queries bind it as a parameter.
	stmts := []string{
		// public feed and drafts list, newest first (id is the pagination tie-breaker)
		`CREATE INDEX IF NOT EXISTS idx_news_feed_live ON news (approved, created_at DESC, id) WHERE deleted IS NOT TRUE`,
		// MyNews, user drafts and the user filter
		`CREATE INDEX IF NOT EXISTS idx_news_user_live ON news (user_id, approved, created_at DESC) WHERE deleted IS NOT TRUE`,
		// category filter queries
		`CREATE INDEX IF NOT EXISTS idx_news_category_live ON news (category_id, approved, created_at DESC) WHERE deleted IS NOT TRUE`,
		// comments and replies, oldest first
		`CREATE INDEX IF NOT EXISTS idx_news_comments_news_created ON news_comments (news_id, created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_news_comment_replies_comment_created ON news_comment_replies (comment_id, created_at)`,
		// tag filter queries (the join table primary key is news_id, tag_id)
		`CREATE INDEX IF NOT EXISTS idx_news_tag_links_tag ON news_tag_links (tag_id)`,
		// Ask AI keyword retrieval
		`CREATE INDEX IF NOT EXISTS news_search_idx ON news USING GIN ((` + NewsSearchVector + `))`,
		// superseded by the indexes above
		`DROP INDEX IF EXISTS idx_news_feed`,
		`DROP INDEX IF EXISTS idx_news_user_feed`,
		`DROP INDEX IF EXISTS idx_news_category_feed`,
		`DROP INDEX IF EXISTS idx_news_comments_news_id`,
		`DROP INDEX IF EXISTS idx_news_comment_replies_comment_id`,
	}
	for _, s := range stmts {
		if err := tx.Exec(s).Error; err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}

	// Trigram indexes speed up the ILIKE search in AdvancedResults. They are
	// optional: without pg_trgm the search still works, just slower.
	trgm := []string{
		`CREATE EXTENSION IF NOT EXISTS pg_trgm`,
		`CREATE INDEX IF NOT EXISTS idx_news_title_trgm ON news USING GIN (title gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_news_content_trgm ON news USING GIN (content gin_trgm_ops)`,
	}
	for _, s := range trgm {
		if err := tx.Exec(s).Error; err != nil {
			logger.Error("db: trigram search index setup failed (ILIKE search stays unindexed):", err)
			break
		}
	}
	return nil
}

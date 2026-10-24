package db

import (
	"context"
	"fmt"

	"github.com/fahmialfareza/malanghub/backend/models"
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

	stmts := []string{
		// list queries: approved + soft-delete + newest first
		`CREATE INDEX IF NOT EXISTS idx_news_feed ON news (approved, deleted, created_at DESC)`,
		// MyNews / author queries
		`CREATE INDEX IF NOT EXISTS idx_news_user_feed ON news (user_id, approved, deleted)`,
		// category filter queries
		`CREATE INDEX IF NOT EXISTS idx_news_category_feed ON news (category_id, approved, deleted)`,
		// tag filter queries (the join table primary key is news_id, tag_id)
		`CREATE INDEX IF NOT EXISTS idx_news_tag_links_tag ON news_tag_links (tag_id)`,
		// Ask AI keyword retrieval
		`CREATE INDEX IF NOT EXISTS news_search_idx ON news USING GIN ((` + NewsSearchVector + `))`,
	}
	for _, s := range stmts {
		if err := tx.Exec(s).Error; err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}
	return nil
}

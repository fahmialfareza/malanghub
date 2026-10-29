package ai

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
)

const (
	// embedBatchSize keeps each batchEmbedContents call small.
	embedBatchSize = 20
	// syncPause spaces out embedding calls during SyncAll to respect free-tier RPM.
	syncPause = 7 * time.Second
)

// vectorReady is set once the pgvector extension and news_embeddings table exist.
var vectorReady atomic.Bool

// NewsChunk is one embedded piece of an eligible (public) news article.
type NewsChunk struct {
	ID          string          `gorm:"primaryKey;type:varchar(24)"`
	NewsID      string          `gorm:"type:varchar(24)"`
	Chunk       int             `gorm:"column:chunk"`
	Text        string          `gorm:"column:text"`
	Embedding   pgvector.Vector `gorm:"type:vector"`
	ContentHash string          `gorm:"column:content_hash"`
	CreatedAt   time.Time
}

func (NewsChunk) TableName() string { return "news_embeddings" }

func isEligible(n *models.News) bool {
	return n.Approved && (n.Deleted == nil || !*n.Deleted)
}

func contentHash(n *models.News) string {
	sum := sha256.Sum256([]byte(n.Title + "\x00" + n.Content))
	return hex.EncodeToString(sum[:])
}

// Migrate enables pgvector and creates news_embeddings with an HNSW index.
// It only logs on failure (e.g. pgvector not installed); retrieval then
// falls back to keyword search.
func Migrate(ctx context.Context) {
	gdb := db.DB()
	if gdb == nil {
		return
	}
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	tx := gdb.WithContext(ctx)

	stmts := []string{
		`CREATE EXTENSION IF NOT EXISTS vector`,
		fmt.Sprintf(`CREATE TABLE IF NOT EXISTS news_embeddings (
			id varchar(24) PRIMARY KEY,
			news_id varchar(24) NOT NULL,
			chunk integer NOT NULL,
			text text NOT NULL,
			embedding vector(%d) NOT NULL,
			content_hash text NOT NULL,
			created_at timestamptz NOT NULL DEFAULT now()
		)`, EmbedDim()),
		`CREATE INDEX IF NOT EXISTS idx_news_embeddings_news ON news_embeddings (news_id, chunk)`,
		`CREATE INDEX IF NOT EXISTS news_embedding_idx ON news_embeddings USING hnsw (embedding vector_cosine_ops)`,
	}
	for _, s := range stmts {
		if err := tx.Exec(s).Error; err != nil {
			logger.Error("ai: vector store setup failed (keyword-only retrieval will be used):", err)
			return
		}
	}
	vectorReady.Store(true)
}

// IndexNewsAsync re-indexes one article in the background. Errors are logged.
func IndexNewsAsync(newsID string) {
	if !vectorReady.Load() {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if err := IndexNews(ctx, newsID); err != nil {
			logger.Error("ai: index news", newsID, "failed:", err)
		}
	}()
}

// IndexNews makes news_embeddings match the current state of one article:
// chunks are removed when the article is gone or not public, and re-embedded
// when its title/content changed.
func IndexNews(ctx context.Context, newsID string) error {
	gdb := db.DB()
	if gdb == nil {
		return db.ErrNotInitialized
	}
	tx := gdb.WithContext(ctx)

	var n models.News
	err := tx.Where("id = ?", newsID).Take(&n).Error
	if db.IsNotFound(err) || (err == nil && !isEligible(&n)) {
		return tx.Where("news_id = ?", newsID).Delete(&NewsChunk{}).Error
	}
	if err != nil {
		return err
	}
	return embedNews(ctx, &n)
}

func embedNews(ctx context.Context, n *models.News) error {
	chain := Default()
	if !chain.Enabled() {
		return ErrNoProvider
	}
	tx := db.DB().WithContext(ctx)
	hash := contentHash(n)

	var existing NewsChunk
	err := tx.Select("content_hash").Where("news_id = ?", n.ID).Take(&existing).Error
	if err == nil && existing.ContentHash == hash {
		return nil
	}

	ctx, span := StartTrace(ctx, "ai-index-news", map[string]any{"news_id": n.ID})
	defer span.End()

	texts := Chunk(n.Title, StripHTML(n.Content))
	vectors := make([][]float32, 0, len(texts))
	for i := 0; i < len(texts); i += embedBatchSize {
		end := min(i+embedBatchSize, len(texts))
		v, err := chain.Embed(ctx, texts[i:end], RetrievalDocument)
		if err != nil {
			return err
		}
		vectors = append(vectors, v...)
	}

	now := time.Now().UTC()
	chunks := make([]NewsChunk, len(texts))
	for i, t := range texts {
		chunks[i] = NewsChunk{ID: models.NewID(), NewsID: n.ID, Chunk: i, Text: t, Embedding: pgvector.NewVector(vectors[i]), ContentHash: hash, CreatedAt: now}
	}

	return tx.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("news_id = ?", n.ID).Delete(&NewsChunk{}).Error; err != nil {
			return err
		}
		if len(chunks) == 0 {
			return nil
		}
		return tx.Create(&chunks).Error
	})
}

var syncMu sync.Mutex

// SyncAll embeds every public article that is missing or outdated and removes
// chunks of articles that are no longer public. Only one sync runs at a time;
// it returns false when another sync is already in progress.
func SyncAll(ctx context.Context) bool {
	if !syncMu.TryLock() {
		return false
	}
	defer syncMu.Unlock()

	gdb := db.DB()
	if gdb == nil || !vectorReady.Load() || !Default().Enabled() {
		return true
	}
	tx := gdb.WithContext(ctx)

	// stored hash per article
	var rows []NewsChunk
	if err := tx.Select("news_id", "content_hash").Where("chunk = 0").Find(&rows).Error; err != nil {
		logger.Error("ai: sync list embeddings failed:", err)
		return true
	}
	stored := make(map[string]string, len(rows))
	for _, r := range rows {
		stored[r.NewsID] = r.ContentHash
	}

	var newsList []models.News
	if err := tx.Select("id", "title", "content", "approved", "deleted").Scopes(db.Published).Find(&newsList).Error; err != nil {
		logger.Error("ai: sync list news failed:", err)
		return true
	}

	embedded, failed, removed := 0, 0, 0
	complete := true
	for i := range newsList {
		n := &newsList[i]
		hash, ok := stored[n.ID]
		delete(stored, n.ID)
		if ok && hash == contentHash(n) {
			continue
		}
		if err := embedNews(ctx, n); err != nil {
			failed++
			logger.Error("ai: sync embed", n.ID, "failed:", err)
			if errors.Is(err, ErrQuotaExceeded) || errors.Is(err, ErrNoProvider) {
				complete = false
				break
			}
		} else {
			embedded++
		}
		select {
		case <-ctx.Done():
			return true
		case <-time.After(syncPause):
		}
	}

	// after a full pass, whatever is left in stored belongs to news that is
	// gone or not public anymore
	if complete {
		for id := range stored {
			if err := tx.Where("news_id = ?", id).Delete(&NewsChunk{}).Error; err == nil {
				removed++
			}
		}
	}

	logger.Info("ai: sync done; embedded", embedded, "failed", failed, "removed", removed)
	return true
}

// StartSyncLoop runs SyncAll shortly after startup and then every
// AI_SYNC_INTERVAL (default 6h, "0" disables).
func StartSyncLoop() {
	interval, err := time.ParseDuration(getEnv("AI_SYNC_INTERVAL", "6h"))
	if err != nil || interval <= 0 || !Default().Enabled() || !vectorReady.Load() {
		return
	}
	go func() {
		time.Sleep(30 * time.Second)
		for {
			SyncAll(context.Background())
			time.Sleep(interval)
		}
	}()
}

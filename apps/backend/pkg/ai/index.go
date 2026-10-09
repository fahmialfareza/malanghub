package ai

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
)

const (
	embeddingsCollection = "newsEmbeddings"
	vectorIndexName      = "news_embedding_idx"
	// embedBatchSize keeps each batchEmbedContents call small.
	embedBatchSize = 20
	// syncPause spaces out embedding calls during SyncAll to respect free-tier RPM.
	syncPause = 7 * time.Second
)

// NewsChunk is one embedded piece of an eligible (public) news article.
type NewsChunk struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	News        primitive.ObjectID `bson:"news"`
	Chunk       int                `bson:"chunk"`
	Text        string             `bson:"text"`
	Embedding   []float32          `bson:"embedding"`
	ContentHash string             `bson:"content_hash"`
	CreatedAt   time.Time          `bson:"created_at"`
}

// eligibleFilter matches news that is publicly visible, same as ListNews.
func eligibleFilter() bson.M {
	return bson.M{"approved": true, "$or": bson.A{
		bson.M{"deleted": false},
		bson.M{"deleted": bson.M{"$exists": false}},
	}}
}

func isEligible(n *models.News) bool {
	return n.Approved && (n.Deleted == nil || !*n.Deleted)
}

func contentHash(n *models.News) string {
	sum := sha256.Sum256([]byte(n.Title + "\x00" + n.Content))
	return hex.EncodeToString(sum[:])
}

// EnsureVectorIndex creates the Atlas vector search index on newsEmbeddings.
// It only logs on failure (index exists, or not running on Atlas); retrieval
// then falls back to keyword search.
func EnsureVectorIndex(ctx context.Context) {
	coll := db.GetCollection(embeddingsCollection)
	if coll == nil {
		return
	}
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if _, err := coll.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "news", Value: 1}},
		Options: options.Index().SetBackground(true),
	}); err != nil {
		logger.Error("ai: could not create newsEmbeddings.news index:", err)
	}

	// skip when the search index already exists
	if cur, err := coll.SearchIndexes().List(ctx, options.SearchIndexes().SetName(vectorIndexName)); err == nil {
		exists := cur.Next(ctx)
		cur.Close(ctx)
		if exists {
			return
		}
	}

	definition := bson.M{"fields": bson.A{bson.M{
		"type":          "vector",
		"path":          "embedding",
		"numDimensions": EmbedDim(),
		"similarity":    "cosine",
	}}}
	_, err := coll.SearchIndexes().CreateOne(ctx, mongo.SearchIndexModel{
		Definition: definition,
		Options:    options.SearchIndexes().SetName(vectorIndexName).SetType("vectorSearch"),
	})
	if err != nil {
		logger.Error("ai: could not create vector search index (keyword-only retrieval will be used):", err)
		return
	}
	logger.Info("ai: vector search index", vectorIndexName, "created")
}

// IndexNewsAsync re-indexes one article in the background. Errors are logged.
func IndexNewsAsync(newsID primitive.ObjectID) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if err := IndexNews(ctx, newsID); err != nil {
			logger.Error("ai: index news", newsID.Hex(), "failed:", err)
		}
	}()
}

// IndexNews makes newsEmbeddings match the current state of one article:
// chunks are removed when the article is gone or not public, and re-embedded
// when its title/content changed.
func IndexNews(ctx context.Context, newsID primitive.ObjectID) error {
	newsColl := db.GetCollection("news")
	embColl := db.GetCollection(embeddingsCollection)
	if newsColl == nil || embColl == nil {
		return errors.New("db not initialized")
	}

	var n models.News
	err := newsColl.FindOne(ctx, bson.M{"_id": newsID}).Decode(&n)
	if errors.Is(err, mongo.ErrNoDocuments) || (err == nil && !isEligible(&n)) {
		_, err = embColl.DeleteMany(ctx, bson.M{"news": newsID})
		return err
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
	embColl := db.GetCollection(embeddingsCollection)
	hash := contentHash(n)

	var existing NewsChunk
	err := embColl.FindOne(ctx, bson.M{"news": n.ID}).Decode(&existing)
	if err == nil && existing.ContentHash == hash {
		return nil
	}

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
	docs := make([]interface{}, len(texts))
	for i, t := range texts {
		docs[i] = NewsChunk{News: n.ID, Chunk: i, Text: t, Embedding: vectors[i], ContentHash: hash, CreatedAt: now}
	}

	if _, err := embColl.DeleteMany(ctx, bson.M{"news": n.ID}); err != nil {
		return err
	}
	_, err = embColl.InsertMany(ctx, docs)
	return err
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

	newsColl := db.GetCollection("news")
	embColl := db.GetCollection(embeddingsCollection)
	if newsColl == nil || embColl == nil || !Default().Enabled() {
		return true
	}

	// stored hash per article
	stored := map[primitive.ObjectID]string{}
	cur, err := embColl.Find(ctx, bson.M{"chunk": 0}, options.Find().SetProjection(bson.M{"news": 1, "content_hash": 1}))
	if err != nil {
		logger.Error("ai: sync list embeddings failed:", err)
		return true
	}
	for cur.Next(ctx) {
		var c NewsChunk
		if cur.Decode(&c) == nil {
			stored[c.News] = c.ContentHash
		}
	}
	cur.Close(ctx)

	cur, err = newsColl.Find(ctx, eligibleFilter(), options.Find().SetProjection(bson.M{"title": 1, "content": 1, "approved": 1, "deleted": 1}))
	if err != nil {
		logger.Error("ai: sync list news failed:", err)
		return true
	}
	defer cur.Close(ctx)

	embedded, failed, removed := 0, 0, 0
	complete := true
	for cur.Next(ctx) {
		var n models.News
		if cur.Decode(&n) != nil {
			continue
		}
		hash, ok := stored[n.ID]
		delete(stored, n.ID)
		if ok && hash == contentHash(&n) {
			continue
		}
		if err := embedNews(ctx, &n); err != nil {
			failed++
			logger.Error("ai: sync embed", n.ID.Hex(), "failed:", err)
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
	if complete && cur.Err() == nil {
		for id := range stored {
			if _, err := embColl.DeleteMany(ctx, bson.M{"news": id}); err == nil {
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
	if err != nil || interval <= 0 || !Default().Enabled() {
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

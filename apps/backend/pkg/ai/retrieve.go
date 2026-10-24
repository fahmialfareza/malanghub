package ai

import (
	"context"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm/clause"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

const (
	keywordLimit  = 10
	vectorLimit   = 20
	maxSources    = 5
	excerptLength = 1500
	// rrfK is the standard Reciprocal Rank Fusion constant.
	rrfK = 60
)

// Source is a retrieved article used as context for the answer.
type Source struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	Excerpt   string    `json:"-"`
}

type vectorHit struct {
	NewsID string
	Text   string
}

// Retrieve finds the most relevant public articles for a question using
// hybrid search: Postgres full-text search (keyword) and pgvector (meaning),
// merged with Reciprocal Rank Fusion. If one search fails the other is used.
func Retrieve(ctx context.Context, question string) ([]Source, error) {
	defer newrelicpkg.EndSegment(ctx, "ai.Retrieve")()

	var (
		wg                 sync.WaitGroup
		keywordHits        []models.News
		vectorHits         []vectorHit
		keywordErr, vecErr error
	)
	wg.Add(2)
	go func() {
		defer wg.Done()
		keywordHits, keywordErr = keywordSearch(ctx, question)
	}()
	go func() {
		defer wg.Done()
		vectorHits, vecErr = vectorSearch(ctx, question)
	}()
	wg.Wait()

	if keywordErr != nil {
		logger.Error("ai: keyword search failed:", keywordErr)
	}
	if vecErr != nil {
		logger.Error("ai: vector search failed:", vecErr)
	}
	if keywordErr != nil && vecErr != nil {
		return nil, keywordErr
	}

	scores := map[string]float64{}
	articles := map[string]*models.News{}
	bestChunk := map[string]string{}

	for rank, n := range keywordHits {
		scores[n.ID] += 1.0 / float64(rrfK+rank+1)
		n := n
		articles[n.ID] = &n
	}
	rank := 0
	for _, h := range vectorHits {
		// hits are sorted by similarity; keep each article's best chunk only
		if _, seen := bestChunk[h.NewsID]; seen {
			continue
		}
		bestChunk[h.NewsID] = h.Text
		scores[h.NewsID] += 1.0 / float64(rrfK+rank+1)
		rank++
	}

	// load metadata for vector-only hits; the eligibility filter also drops
	// chunks whose article was unpublished but not yet cleaned up
	var missing []string
	for id := range bestChunk {
		if _, ok := articles[id]; !ok {
			missing = append(missing, id)
		}
	}
	if len(missing) > 0 {
		if found, err := findEligibleNews(ctx, missing); err == nil {
			for i := range found {
				articles[found[i].ID] = &found[i]
			}
		}
	}

	ids := make([]string, 0, len(scores))
	for id := range scores {
		if _, ok := articles[id]; ok {
			ids = append(ids, id)
		}
	}
	sort.Slice(ids, func(i, j int) bool { return scores[ids[i]] > scores[ids[j]] })
	if len(ids) > maxSources {
		ids = ids[:maxSources]
	}

	sources := make([]Source, 0, len(ids))
	for _, id := range ids {
		n := articles[id]
		excerpt := bestChunk[id]
		if excerpt == "" {
			excerpt = truncate(StripHTML(n.Content), excerptLength)
		}
		sources = append(sources, Source{ID: n.ID, Title: n.Title, Slug: n.Slug, CreatedAt: n.CreatedAt, Excerpt: excerpt})
	}
	return sources, nil
}

var wordRe = regexp.MustCompile(`[\p{L}\p{N}]+`)

// orTSQuery turns a question into a tsquery matching any of its words, like
// MongoDB $text did. Words only contain letters and digits, so the result is
// always valid to_tsquery input.
func orTSQuery(question string) string {
	return strings.Join(wordRe.FindAllString(strings.ToLower(question), -1), " | ")
}

func keywordSearch(ctx context.Context, question string) ([]models.News, error) {
	gdb := db.DB()
	if gdb == nil {
		return nil, ErrNoProvider
	}
	query := orTSQuery(question)
	if query == "" {
		return nil, nil
	}
	var out []models.News
	err := gdb.WithContext(ctx).
		Select("id", "title", "slug", "content", "created_at", "approved").
		Scopes(db.Published).
		Where("("+db.NewsSearchVector+") @@ to_tsquery('simple', ?)", query).
		Order(clause.OrderBy{Expression: clause.Expr{
			SQL:  "ts_rank((" + db.NewsSearchVector + "), to_tsquery('simple', ?)) DESC, created_at DESC",
			Vars: []any{query},
		}}).
		Limit(keywordLimit).
		Find(&out).Error
	return out, err
}

func vectorSearch(ctx context.Context, question string) ([]vectorHit, error) {
	gdb := db.DB()
	if gdb == nil || !vectorReady.Load() {
		return nil, ErrNoProvider
	}
	vectors, err := Default().Embed(ctx, []string{question}, RetrievalQuery)
	if err != nil {
		return nil, err
	}
	if len(vectors) == 0 {
		return nil, ErrNoProvider
	}

	var out []vectorHit
	err = gdb.WithContext(ctx).Model(&NewsChunk{}).
		Select("news_id", "text").
		Order(clause.OrderBy{Expression: clause.Expr{SQL: "embedding <=> ?", Vars: []any{pgvector.NewVector(vectors[0])}}}).
		Limit(vectorLimit).
		Scan(&out).Error
	return out, err
}

func findEligibleNews(ctx context.Context, ids []string) ([]models.News, error) {
	var out []models.News
	err := db.DB().WithContext(ctx).
		Select("id", "title", "slug", "content", "created_at", "approved").
		Scopes(db.Published).
		Where("id IN ?", ids).
		Find(&out).Error
	return out, err
}

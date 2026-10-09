package ai

import (
	"context"
	"sort"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
	newrelicpkg "github.com/fahmialfareza/malanghub/backend/pkg/newrelic"
)

const (
	keywordLimit  = 10
	vectorLimit   = 20
	numCandidates = 100
	maxSources    = 5
	excerptLength = 1500
	// rrfK is the standard Reciprocal Rank Fusion constant.
	rrfK = 60
)

// Source is a retrieved article used as context for the answer.
type Source struct {
	ID        primitive.ObjectID `json:"id"`
	Title     string             `json:"title"`
	Slug      string             `json:"slug"`
	CreatedAt time.Time          `json:"created_at"`
	Excerpt   string             `json:"-"`
}

type vectorHit struct {
	News primitive.ObjectID `bson:"news"`
	Text string             `bson:"text"`
}

// Retrieve finds the most relevant public articles for a question using
// hybrid search: MongoDB $text (keyword) and Atlas $vectorSearch (meaning),
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

	scores := map[primitive.ObjectID]float64{}
	articles := map[primitive.ObjectID]*models.News{}
	bestChunk := map[primitive.ObjectID]string{}

	for rank, n := range keywordHits {
		scores[n.ID] += 1.0 / float64(rrfK+rank+1)
		n := n
		articles[n.ID] = &n
	}
	rank := 0
	for _, h := range vectorHits {
		// hits are sorted by similarity; keep each article's best chunk only
		if _, seen := bestChunk[h.News]; seen {
			continue
		}
		bestChunk[h.News] = h.Text
		scores[h.News] += 1.0 / float64(rrfK+rank+1)
		rank++
	}

	// load metadata for vector-only hits; the eligibility filter also drops
	// chunks whose article was unpublished but not yet cleaned up
	var missing []primitive.ObjectID
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

	ids := make([]primitive.ObjectID, 0, len(scores))
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

func keywordSearch(ctx context.Context, question string) ([]models.News, error) {
	coll := db.GetCollection("news")
	if coll == nil {
		return nil, ErrNoProvider
	}
	filter := eligibleFilter()
	filter["$text"] = bson.M{"$search": question}

	opts := options.Find().
		SetProjection(bson.M{"title": 1, "slug": 1, "content": 1, "created_at": 1, "approved": 1, "score": bson.M{"$meta": "textScore"}}).
		SetSort(bson.D{{Key: "score", Value: bson.M{"$meta": "textScore"}}, {Key: "created_at", Value: -1}}).
		SetLimit(keywordLimit)

	cur, err := coll.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []models.News
	err = cur.All(ctx, &out)
	return out, err
}

func vectorSearch(ctx context.Context, question string) ([]vectorHit, error) {
	coll := db.GetCollection(embeddingsCollection)
	if coll == nil {
		return nil, ErrNoProvider
	}
	vectors, err := Default().Embed(ctx, []string{question}, RetrievalQuery)
	if err != nil {
		return nil, err
	}
	if len(vectors) == 0 {
		return nil, ErrNoProvider
	}

	pipeline := bson.A{
		bson.M{"$vectorSearch": bson.M{
			"index":         vectorIndexName,
			"path":          "embedding",
			"queryVector":   vectors[0],
			"numCandidates": numCandidates,
			"limit":         vectorLimit,
		}},
		bson.M{"$project": bson.M{"news": 1, "text": 1}},
	}
	cur, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []vectorHit
	err = cur.All(ctx, &out)
	return out, err
}

func findEligibleNews(ctx context.Context, ids []primitive.ObjectID) ([]models.News, error) {
	filter := eligibleFilter()
	filter["_id"] = bson.M{"$in": ids}
	cur, err := db.GetCollection("news").Find(ctx, filter,
		options.Find().SetProjection(bson.M{"title": 1, "slug": 1, "content": 1, "created_at": 1, "approved": 1}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []models.News
	err = cur.All(ctx, &out)
	return out, err
}

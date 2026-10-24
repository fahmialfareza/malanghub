// Command migrate-mongo copies the malanghub MongoDB data into Postgres.
//
// It keeps every MongoDB ObjectID as the row ID (24-char hex), so URLs and
// stored references stay valid. It is safe to re-run: rows that already exist
// are skipped. Ask AI embeddings are not copied; rebuild them afterwards with
// POST /api/ai/reindex (or wait for the sync loop).
//
// Usage:
//
//	MONGO_URI=mongodb://... DATABASE_URL=postgres://... go run ./cmd/migrate-mongo
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/fahmialfareza/malanghub/backend/models"
	"github.com/fahmialfareza/malanghub/backend/pkg/db"
)

const mongoDatabase = "malanghub"

func main() {
	mongoURI := os.Getenv("MONGO_URI")
	databaseURL := os.Getenv("DATABASE_URL")
	if mongoURI == "" || databaseURL == "" {
		log.Fatal("MONGO_URI and DATABASE_URL are required")
	}

	ctx := context.Background()

	mc, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("mongo connect: %v", err)
	}
	defer mc.Disconnect(ctx)
	if err := mc.Ping(ctx, nil); err != nil {
		log.Fatalf("mongo ping: %v", err)
	}
	mdb := mc.Database(mongoDatabase)

	if err := db.Connect(ctx, databaseURL); err != nil {
		log.Fatalf("postgres connect: %v", err)
	}
	defer db.Close()
	if err := db.Migrate(ctx); err != nil {
		log.Fatalf("postgres migrate: %v", err)
	}

	m := &migrator{ctx: ctx, mdb: mdb, pg: db.DB().WithContext(ctx)}
	m.users()
	m.taxonomy("newscategories", func(id, name, slug string, deleted *bool, created, updated time.Time) any {
		return &models.Category{ID: id, Name: name, Slug: slug, Deleted: deleted, CreatedAt: created, UpdatedAt: updated}
	})
	m.taxonomy("newstags", func(id, name, slug string, deleted *bool, created, updated time.Time) any {
		return &models.Tag{ID: id, Name: name, Slug: slug, Deleted: deleted, CreatedAt: created, UpdatedAt: updated}
	})
	m.news()
	m.comments()

	fmt.Println()
	fmt.Println("collection            mongo  postgres")
	for _, pair := range [][2]string{
		{"users", "users"},
		{"newscategories", "news_categories"},
		{"newstags", "news_tags"},
		{"news", "news"},
		{"newsComments", "news_comments"},
	} {
		mongoCount, _ := mdb.Collection(pair[0]).CountDocuments(ctx, bson.M{})
		var pgCount int64
		m.pg.Table(pair[1]).Count(&pgCount)
		fmt.Printf("%-20s %6d %9d\n", pair[0], mongoCount, pgCount)
	}
	var replies int64
	m.pg.Table("news_comment_replies").Count(&replies)
	fmt.Printf("%-20s %6s %9d\n", "(comment replies)", "-", replies)

	if m.skipped > 0 {
		log.Printf("done with %d skipped documents; see the log above", m.skipped)
	} else {
		log.Println("done")
	}
}

type migrator struct {
	ctx     context.Context
	mdb     *mongo.Database
	pg      *gorm.DB
	skipped int
}

func (m *migrator) each(collection string, fn func(doc bson.M)) {
	cur, err := m.mdb.Collection(collection).Find(m.ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		log.Fatalf("%s: find: %v", collection, err)
	}
	defer cur.Close(m.ctx)
	n := 0
	for cur.Next(m.ctx) {
		var doc bson.M
		if err := cur.Decode(&doc); err != nil {
			log.Printf("%s: decode: %v", collection, err)
			m.skipped++
			continue
		}
		fn(doc)
		n++
	}
	if err := cur.Err(); err != nil {
		log.Fatalf("%s: cursor: %v", collection, err)
	}
	log.Printf("%s: processed %d documents", collection, n)
}

// insert creates the row unless a row with the same key already exists.
func (m *migrator) insert(what, id string, row any) bool {
	res := m.pg.Clauses(clause.OnConflict{DoNothing: true}).Omit(clause.Associations).Create(row)
	if res.Error != nil {
		log.Printf("%s %s: insert failed: %v", what, id, res.Error)
		m.skipped++
		return false
	}
	return true
}

func (m *migrator) exists(table, id string) bool {
	if id == "" {
		return false
	}
	var n int64
	m.pg.Table(table).Where("id = ?", id).Count(&n)
	return n > 0
}

func (m *migrator) users() {
	m.each("users", func(d bson.M) {
		id := idOf(d["_id"])
		created, updated := timestamps(d)
		m.insert("user", id, &models.User{
			ID:        id,
			Name:      str(d["name"]),
			Email:     str(d["email"]),
			Password:  str(d["password"]),
			Role:      str(d["role"]),
			Photo:     str(d["photo"]),
			Motto:     str(d["motto"]),
			Bio:       str(d["bio"]),
			Instagram: str(d["instagram"]),
			Facebook:  str(d["facebook"]),
			Twitter:   str(d["twitter"]),
			Tiktok:    str(d["tiktok"]),
			Linkedin:  str(d["linkedin"]),
			AppleSub:  str(d["apple_sub"]),
			Deleted:   boolPtr(d["deleted"]),
			CreatedAt: created,
			UpdatedAt: updated,
		})
	})
}

func (m *migrator) taxonomy(collection string, build func(id, name, slug string, deleted *bool, created, updated time.Time) any) {
	m.each(collection, func(d bson.M) {
		id := idOf(d["_id"])
		created, updated := timestamps(d)
		m.insert(collection, id, build(id, str(d["name"]), str(d["slug"]), boolPtr(d["deleted"]), created, updated))
	})
}

func (m *migrator) news() {
	m.each("news", func(d bson.M) {
		id := idOf(d["_id"])
		userID := idOf(d["user"])
		if !m.exists("users", userID) {
			log.Printf("news %s: author %q not found, skipped", id, userID)
			m.skipped++
			return
		}

		var categoryID *string
		if cat := idOf(d["category"]); m.exists("news_categories", cat) {
			categoryID = &cat
		} else if cat != "" {
			log.Printf("news %s: category %q not found, set to NULL", id, cat)
		}

		created, updated := timestamps(d)
		n := &models.News{
			ID:         id,
			UserID:     userID,
			Slug:       str(d["slug"]),
			Title:      str(d["title"]),
			CategoryID: categoryID,
			TimeRead:   num(d["time_read"]),
			MainImage:  str(d["mainImage"]),
			Content:    str(d["content"]),
			Views:      num(d["views"]),
			Status:     str(d["status"]),
			Message:    str(d["message"]),
			Approved:   d["approved"] == true,
			Deleted:    boolPtr(d["deleted"]),
			CreatedAt:  created,
			UpdatedAt:  updated,
		}
		if !m.insert("news", id, n) {
			return
		}

		// tags may be stored as ObjectIDs or hex strings; unknown tags are dropped
		var tagIDs []string
		if arr, ok := d["tags"].(bson.A); ok {
			for _, t := range arr {
				if tid := idOf(t); tid != "" {
					tagIDs = append(tagIDs, tid)
				}
			}
		}
		if len(tagIDs) > 0 {
			if err := m.pg.Exec(`INSERT INTO news_tag_links (news_id, tag_id)
				SELECT ?, id FROM news_tags WHERE id IN ? ON CONFLICT DO NOTHING`, id, tagIDs).Error; err != nil {
				log.Printf("news %s: tag links failed: %v", id, err)
			}
		}
	})
}

func (m *migrator) comments() {
	m.each("newsComments", func(d bson.M) {
		id := idOf(d["_id"])
		userID := idOf(d["user"])
		if !m.exists("users", userID) {
			log.Printf("comment %s: author %q not found, skipped", id, userID)
			m.skipped++
			return
		}

		created, updated := timestamps(d)
		if !m.insert("comment", id, &models.NewsComment{
			ID:        id,
			NewsID:    idOf(d["news"]),
			UserID:    userID,
			Comment:   str(d["comment"]),
			Deleted:   boolPtr(d["deleted"]),
			CreatedAt: created,
			UpdatedAt: updated,
		}) {
			return
		}

		// replies were an embedded array without IDs; skip if already migrated
		var existing int64
		m.pg.Model(&models.NewsCommentReply{}).Where("comment_id = ?", id).Count(&existing)
		if existing > 0 {
			return
		}
		arr, _ := d["commentReplies"].(bson.A)
		for i, item := range arr {
			r, ok := item.(bson.M)
			if !ok {
				continue
			}
			replyUser := idOf(r["user"])
			if !m.exists("users", replyUser) {
				log.Printf("comment %s reply %d: author %q not found, skipped", id, i, replyUser)
				m.skipped++
				continue
			}
			replyCreated, _ := timestamps(r)
			if replyCreated.IsZero() {
				replyCreated = created
			}
			m.insert("reply", fmt.Sprintf("%s[%d]", id, i), &models.NewsCommentReply{
				CommentID: id,
				UserID:    replyUser,
				Comment:   str(r["comment"]),
				CreatedAt: replyCreated,
			})
		}
	})
}

// idOf returns the hex ID of an ObjectID or a hex string, or "".
func idOf(v any) string {
	switch t := v.(type) {
	case primitive.ObjectID:
		return t.Hex()
	case string:
		if models.IsValidID(t) {
			return t
		}
	}
	return ""
}

func str(v any) string {
	s, _ := v.(string)
	return s
}

func num(v any) int {
	switch t := v.(type) {
	case int32:
		return int(t)
	case int64:
		return int(t)
	case float64:
		return int(t)
	}
	return 0
}

func boolPtr(v any) *bool {
	if b, ok := v.(bool); ok {
		return &b
	}
	return nil
}

func toTime(v any) time.Time {
	switch t := v.(type) {
	case primitive.DateTime:
		return t.Time().UTC()
	case time.Time:
		return t.UTC()
	}
	return time.Time{}
}

// timestamps reads created_at/updated_at, falling back to the camelCase names
// and to the ObjectID creation time.
func timestamps(d bson.M) (time.Time, time.Time) {
	created := toTime(d["created_at"])
	if created.IsZero() {
		created = toTime(d["createdAt"])
	}
	if created.IsZero() {
		if oid, ok := d["_id"].(primitive.ObjectID); ok {
			created = oid.Timestamp().UTC()
		}
	}
	updated := toTime(d["updated_at"])
	if updated.IsZero() {
		updated = toTime(d["updatedAt"])
	}
	if updated.IsZero() {
		updated = created
	}
	return created, updated
}

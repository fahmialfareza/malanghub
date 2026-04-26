package db

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EnsureIndexes creates required indexes for collections (idempotent)
func EnsureIndexes(ctx context.Context, client *mongo.Client) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Users: unique email
	users := client.Database(databaseName).Collection("users")
	_, err := users.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}

	// News: unique slug, unique title
	news := client.Database(databaseName).Collection("news")
	_, err = news.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "slug", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	_, err = news.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "title", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	// News: composite index for list queries (approved + soft-delete + sort by created_at)
	_, err = news.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "approved", Value: 1}, {Key: "deleted", Value: 1}, {Key: "created_at", Value: -1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	// News: composite index for MyNews / author queries
	_, err = news.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user", Value: 1}, {Key: "approved", Value: 1}, {Key: "deleted", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	// News: composite index for category filter queries
	_, err = news.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "category", Value: 1}, {Key: "approved", Value: 1}, {Key: "deleted", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	// News: composite index for tag $in queries
	_, err = news.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "tags", Value: 1}, {Key: "approved", Value: 1}, {Key: "deleted", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}

	// NewsComments: index on news for GetCommentsByNews queries
	comments := client.Database(databaseName).Collection("newsComments")
	_, err = comments.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "news", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}

	// Categories: unique name, slug
	cats := client.Database(databaseName).Collection("newscategories")
	_, err = cats.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	_, err = cats.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "slug", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}

	// Tags: unique name, slug
	tags := client.Database(databaseName).Collection("newstags")
	_, err = tags.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}
	_, err = tags.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "slug", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil && !isIndexDupErr(err) {
		return err
	}

	return nil
}

func isIndexDupErr(err error) bool {
	// some drivers return specific errors; keep tolerant and ignore index already exists
	if err == nil {
		return false
	}
	// fallback: don't treat any error as fatal here; caller will decide
	return false
}

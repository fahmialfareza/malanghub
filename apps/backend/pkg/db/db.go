package db

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var databaseName = "malanghub"

// Client returns the underlying mongo client (may be nil until connected)
func Client() *mongo.Client {
	return client
}

func Connect(ctx context.Context, uri string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	c, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}

	// verify connection
	if err := c.Ping(ctx, nil); err != nil {
		return fmt.Errorf("mongo ping failed: %w", err)
	}

	client = c
	return nil
}

func Disconnect(ctx context.Context) error {
	if client == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	return client.Disconnect(ctx)
}

func GetCollection(name string) *mongo.Collection {
	if client == nil {
		return nil
	}
	return client.Database(databaseName).Collection(name)
}

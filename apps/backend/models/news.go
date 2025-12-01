package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type News struct {
	ID        primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
	User      primitive.ObjectID   `json:"user" bson:"user"`
	Slug      string               `json:"slug" bson:"slug"`
	Title     string               `json:"title" bson:"title"`
	Category  primitive.ObjectID   `json:"category" bson:"category"`
	TimeRead  int                  `json:"time_read" bson:"time_read"`
	MainImage string               `json:"mainImage" bson:"mainImage"`
	Content   string               `json:"content" bson:"content"`
	Tags      []primitive.ObjectID `json:"tags" bson:"tags"`
	Views     int                  `json:"views" bson:"views"`
	Status    string               `json:"status" bson:"status"`
	Message   string               `json:"message,omitempty" bson:"message,omitempty"`
	Approved  bool                 `json:"approved" bson:"approved"`
	Deleted   *bool                `json:"deleted,omitempty" bson:"deleted,omitempty"`
	CreatedAt time.Time            `json:"created_at,omitempty" bson:"created_at,omitempty"`
	UpdatedAt time.Time            `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}

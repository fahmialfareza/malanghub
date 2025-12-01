package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CommentReply struct {
	User      primitive.ObjectID `json:"user" bson:"user"`
	Comment   string             `json:"comment" bson:"comment"`
	CreatedAt time.Time          `json:"created_at,omitempty" bson:"created_at,omitempty"`
}

type NewsComment struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	News           primitive.ObjectID `json:"news" bson:"news"`
	User           primitive.ObjectID `json:"user" bson:"user"`
	Comment        string             `json:"comment" bson:"comment"`
	CommentReplies []CommentReply     `json:"commentReplies,omitempty" bson:"commentReplies,omitempty"`
	Deleted        *bool              `json:"deleted,omitempty" bson:"deleted,omitempty"`
	CreatedAt      time.Time          `json:"created_at,omitempty" bson:"created_at,omitempty"`
	UpdatedAt      time.Time          `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}

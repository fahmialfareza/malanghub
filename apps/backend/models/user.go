package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name      string             `json:"name" bson:"name"`
	Email     string             `json:"email" bson:"email"`
	Password  string             `json:"password,omitempty" bson:"password"`
	Role      string             `json:"role" bson:"role"`
	Photo     string             `json:"photo,omitempty" bson:"photo,omitempty"`
	Motto     string             `json:"motto,omitempty" bson:"motto,omitempty"`
	Bio       string             `json:"bio,omitempty" bson:"bio,omitempty"`
	Instagram string             `json:"instagram,omitempty" bson:"instagram,omitempty"`
	Facebook  string             `json:"facebook,omitempty" bson:"facebook,omitempty"`
	Twitter   string             `json:"twitter,omitempty" bson:"twitter,omitempty"`
	Tiktok    string             `json:"tiktok,omitempty" bson:"tiktok,omitempty"`
	Linkedin  string             `json:"linkedin,omitempty" bson:"linkedin,omitempty"`
	Deleted   *bool              `json:"deleted,omitempty" bson:"deleted,omitempty"`
	CreatedAt time.Time          `json:"created_at,omitempty" bson:"created_at,omitempty"`
	UpdatedAt time.Time          `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}

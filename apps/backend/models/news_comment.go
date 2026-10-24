package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type NewsCommentReply struct {
	ID        string    `gorm:"primaryKey;type:varchar(24)" json:"_id"`
	CommentID string    `gorm:"type:varchar(24);not null;index" json:"-"`
	UserID    string    `gorm:"type:varchar(24);not null" json:"-"`
	User      *User     `json:"user"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

func (r *NewsCommentReply) BeforeCreate(*gorm.DB) error {
	ensureID(&r.ID)
	return nil
}

func (r NewsCommentReply) MarshalJSON() ([]byte, error) {
	type alias NewsCommentReply
	var user any = r.User
	if r.User == nil {
		user = r.UserID
	}
	return json.Marshal(struct {
		alias
		IDAlias string `json:"id"`
		User    any    `json:"user"`
	}{alias(r), r.ID, user})
}

type NewsComment struct {
	ID             string             `gorm:"primaryKey;type:varchar(24)" json:"_id"`
	NewsID         string             `gorm:"type:varchar(24);not null;index" json:"news"`
	UserID         string             `gorm:"type:varchar(24);not null" json:"-"`
	User           *User              `json:"user"`
	Comment        string             `json:"comment"`
	CommentReplies []NewsCommentReply `gorm:"foreignKey:CommentID" json:"commentReplies"`
	Deleted        *bool              `json:"deleted,omitempty"`
	CreatedAt      time.Time          `json:"created_at,omitempty"`
	UpdatedAt      time.Time          `json:"updated_at,omitempty"`
}

func (nc *NewsComment) BeforeCreate(*gorm.DB) error {
	ensureID(&nc.ID)
	return nil
}

func (nc NewsComment) MarshalJSON() ([]byte, error) {
	type alias NewsComment
	var user any = nc.User
	if nc.User == nil {
		user = nc.UserID
	}
	replies := nc.CommentReplies
	if replies == nil {
		replies = []NewsCommentReply{}
	}
	return json.Marshal(struct {
		alias
		IDAlias        string             `json:"id"`
		User           any                `json:"user"`
		CommentReplies []NewsCommentReply `json:"commentReplies"`
	}{alias(nc), nc.ID, user, replies})
}

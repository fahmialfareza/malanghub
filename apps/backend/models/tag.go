package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID        string    `gorm:"primaryKey;type:varchar(24)" json:"_id"`
	Name      string    `gorm:"uniqueIndex" json:"name"`
	Slug      string    `gorm:"uniqueIndex" json:"slug"`
	Deleted   *bool     `json:"deleted,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

func (Tag) TableName() string { return "news_tags" }

func (t *Tag) BeforeCreate(*gorm.DB) error {
	ensureID(&t.ID)
	return nil
}

func (t Tag) MarshalJSON() ([]byte, error) {
	type alias Tag
	return json.Marshal(struct {
		alias
		IDAlias string `json:"id"`
	}{alias(t), t.ID})
}

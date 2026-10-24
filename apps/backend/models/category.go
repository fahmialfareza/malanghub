package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID        string    `gorm:"primaryKey;type:varchar(24)" json:"_id"`
	Name      string    `gorm:"uniqueIndex" json:"name"`
	Slug      string    `gorm:"uniqueIndex" json:"slug"`
	Deleted   *bool     `json:"deleted,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

func (Category) TableName() string { return "news_categories" }

func (cat *Category) BeforeCreate(*gorm.DB) error {
	ensureID(&cat.ID)
	return nil
}

func (cat Category) MarshalJSON() ([]byte, error) {
	type alias Category
	return json.Marshal(struct {
		alias
		IDAlias string `json:"id"`
	}{alias(cat), cat.ID})
}

package models

import (
	"encoding/json"
	"time"
	"unicode/utf8"

	"gorm.io/gorm"
)

type News struct {
	ID         string    `gorm:"primaryKey;type:varchar(24)" json:"_id"`
	UserID     string    `gorm:"type:varchar(24);not null" json:"-"`
	User       *User     `json:"user"`
	Slug       string    `gorm:"uniqueIndex" json:"slug"`
	Title      string    `gorm:"uniqueIndex" json:"title"`
	CategoryID *string   `gorm:"type:varchar(24)" json:"-"`
	Category   *Category `json:"category"`
	TimeRead   int       `json:"time_read"`
	MainImage  string    `json:"mainImage"`
	Content    string    `json:"content"`
	Tags       []Tag     `gorm:"many2many:news_tag_links" json:"tags"`
	Views      int       `json:"views"`
	Status     string    `json:"status"`
	Message    string    `json:"message,omitempty"`
	Approved   bool      `json:"approved"`
	Deleted    *bool     `json:"deleted,omitempty"`
	CreatedAt  time.Time `json:"created_at,omitempty"`
	UpdatedAt  time.Time `json:"updated_at,omitempty"`
}

func (n *News) BeforeCreate(*gorm.DB) error {
	ensureID(&n.ID)
	return nil
}

// MarshalJSON keeps the MongoDB-era response shape: the ID as both `_id` and
// `id`, user/category as populated objects (or their ID when not loaded),
// and tags as an array (never null).
func (n News) MarshalJSON() ([]byte, error) {
	type alias News
	var user any = (*PublicUser)(n.User)
	if n.User == nil {
		user = n.UserID
	}
	var category any = n.Category
	if n.Category == nil {
		category = n.CategoryID
	}
	tags := n.Tags
	if tags == nil {
		tags = []Tag{}
	}
	return json.Marshal(struct {
		alias
		IDAlias  string `json:"id"`
		User     any    `json:"user"`
		Category any    `json:"category"`
		Tags     []Tag  `json:"tags"`
	}{alias(n), n.ID, user, category, tags})
}

func CalculateTimeRead(content string) int {
	length := utf8.RuneCountInString(content)
	if length == 0 {
		return 0
	}
	return (length + 99) / 100
}

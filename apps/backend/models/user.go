package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:varchar(24)" json:"_id"`
	Name      string    `json:"name"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Password  string    `json:"password,omitempty"`
	Role      string    `json:"role"`
	Photo     string    `json:"photo,omitempty"`
	Motto     string    `json:"motto,omitempty"`
	Bio       string    `json:"bio,omitempty"`
	Instagram string    `json:"instagram,omitempty"`
	Facebook  string    `json:"facebook,omitempty"`
	Twitter   string    `json:"twitter,omitempty"`
	Tiktok    string    `json:"tiktok,omitempty"`
	Linkedin  string    `json:"linkedin,omitempty"`
	AppleSub  string    `gorm:"index" json:"apple_sub,omitempty"`
	Deleted   *bool     `json:"deleted,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

func (u *User) BeforeCreate(*gorm.DB) error {
	ensureID(&u.ID)
	return nil
}

// MarshalJSON exposes the ID as both `_id` and `id` and never sends the
// password hash to clients.
func (u User) MarshalJSON() ([]byte, error) {
	type alias User
	a := alias(u)
	a.Password = ""
	return json.Marshal(struct {
		alias
		IDAlias string `json:"id"`
	}{a, u.ID})
}

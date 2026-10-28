package models

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestPublicUserHidesPrivateFields(t *testing.T) {
	deleted := false
	u := &User{ID: "aaaaaaaaaaaaaaaaaaaaaaaa", Name: "Author", Email: "author@example.test",
		Password: "hash", Role: "admin", AppleSub: "apple-sub", Deleted: &deleted, Bio: "bio"}

	for name, v := range map[string]any{
		"news":    News{User: u},
		"comment": NewsComment{User: u},
		"reply":   NewsCommentReply{User: u},
		"profile": PublicUser(*u),
	} {
		b, err := json.Marshal(v)
		if err != nil {
			t.Fatal(err)
		}
		s := string(b)
		for _, leak := range []string{"author@example.test", `"role"`, "apple-sub", `"password"`, `"deleted"`} {
			if strings.Contains(s, leak) {
				t.Errorf("%s JSON leaks %s: %s", name, leak, s)
			}
		}
		if !strings.Contains(s, `"name":"Author"`) || !strings.Contains(s, `"_id":"aaaaaaaaaaaaaaaaaaaaaaaa"`) {
			t.Errorf("%s JSON lost public fields: %s", name, s)
		}
	}

	// the owner's own profile still includes email and role
	b, _ := json.Marshal(*u)
	if !strings.Contains(string(b), "author@example.test") || !strings.Contains(string(b), `"role":"admin"`) {
		t.Errorf("User JSON should keep email and role: %s", b)
	}
}

package models

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/hex"
	"time"
)

// IDs are 24-char hex strings in the MongoDB ObjectID layout (4-byte unix
// timestamp + 8 random bytes), so IDs from the MongoDB era stay valid.

// NewID returns a new ObjectID-style hex ID.
func NewID() string {
	var b [12]byte
	binary.BigEndian.PutUint32(b[:4], uint32(time.Now().Unix()))
	_, _ = rand.Read(b[4:])
	return hex.EncodeToString(b[:])
}

// IsValidID reports whether s is a 24-char hex ID.
func IsValidID(s string) bool {
	if len(s) != 24 {
		return false
	}
	_, err := hex.DecodeString(s)
	return err == nil
}

func ensureID(id *string) {
	if *id == "" {
		*id = NewID()
	}
}

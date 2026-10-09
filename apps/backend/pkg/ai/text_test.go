package ai

import (
	"strings"
	"testing"
)

func TestStripHTML(t *testing.T) {
	got := StripHTML(`<p>Alun-alun <b>Kota Batu</b></p><script>alert(1)</script><p>ramai</p>`)
	if got != "Alun-alun Kota Batu ramai" {
		t.Fatalf("unexpected text: %q", got)
	}
}

func TestChunk(t *testing.T) {
	body := strings.Repeat("kata ", 600) // 3000 runes
	chunks := Chunk("Judul", body)
	if len(chunks) < 3 {
		t.Fatalf("expected at least 3 chunks, got %d", len(chunks))
	}
	for _, c := range chunks {
		if !strings.HasPrefix(c, "Judul\n\n") {
			t.Fatalf("chunk missing title prefix: %q", c[:20])
		}
		if n := len([]rune(c)); n > chunkSize+len("Judul\n\n") {
			t.Fatalf("chunk too long: %d", n)
		}
	}
	if got := Chunk("Judul", ""); len(got) != 1 || got[0] != "Judul" {
		t.Fatalf("empty body should yield title only, got %v", got)
	}
}

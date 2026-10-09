package ai

import (
	"strings"

	"golang.org/x/net/html"
)

const (
	chunkSize    = 1000
	chunkOverlap = 150
)

// StripHTML converts article HTML into plain text with collapsed whitespace.
func StripHTML(s string) string {
	z := html.NewTokenizer(strings.NewReader(s))
	var sb strings.Builder
	skip := 0
	for {
		switch z.Next() {
		case html.ErrorToken:
			return strings.Join(strings.Fields(sb.String()), " ")
		case html.StartTagToken:
			name, _ := z.TagName()
			if tag := string(name); tag == "script" || tag == "style" {
				skip++
			}
			sb.WriteByte(' ')
		case html.EndTagToken:
			name, _ := z.TagName()
			if tag := string(name); (tag == "script" || tag == "style") && skip > 0 {
				skip--
			}
			sb.WriteByte(' ')
		case html.TextToken:
			if skip == 0 {
				sb.Write(z.Text())
			}
		}
	}
}

// Chunk splits plain text into overlapping pieces of roughly chunkSize
// characters, breaking on spaces. The title is prefixed to every chunk so each
// one carries the article's topic.
func Chunk(title, body string) []string {
	runes := []rune(body)
	if len(runes) == 0 {
		return []string{title}
	}

	var chunks []string
	for start := 0; start < len(runes); {
		end := start + chunkSize
		if end >= len(runes) {
			end = len(runes)
		} else if i := lastSpace(runes[start:end]); i > chunkSize/2 {
			end = start + i
		}
		chunks = append(chunks, title+"\n\n"+strings.TrimSpace(string(runes[start:end])))
		if end == len(runes) {
			break
		}
		start = end - chunkOverlap
	}
	return chunks
}

func lastSpace(r []rune) int {
	for i := len(r) - 1; i >= 0; i-- {
		if r[i] == ' ' {
			return i
		}
	}
	return -1
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n]) + "…"
}

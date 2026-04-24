package models

import (
	"strings"
	"testing"
)

func TestCalculateTimeRead(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    int
	}{
		{name: "empty", content: "", want: 0},
		{name: "short content rounds up", content: "hello", want: 1},
		{name: "exact hundred", content: strings.Repeat("a", 100), want: 1},
		{name: "over hundred rounds up", content: strings.Repeat("a", 101), want: 2},
		{name: "unicode counts characters", content: strings.Repeat("é", 101), want: 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CalculateTimeRead(tt.content); got != tt.want {
				t.Fatalf("CalculateTimeRead() = %d, want %d", got, tt.want)
			}
		})
	}
}

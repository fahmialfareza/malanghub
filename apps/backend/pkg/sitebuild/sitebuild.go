// Package sitebuild asks GitHub Actions to rebuild the website. The web
// frontend is a static export (.github/workflows/frontend-pages.yml), so
// published content only shows up after a rebuild; that workflow also pings
// IndexNow for the changed URLs once the new pages are live.
package sitebuild

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/fahmialfareza/malanghub/backend/pkg/logger"
)

const defaultRepo = "fahmialfareza/malanghub"

// EventType must match the repository_dispatch type in the workflow.
const EventType = "content-changed"

var client = &http.Client{Timeout: 10 * time.Second}

// Trigger requests a site rebuild in the background; it never blocks the
// request. GitHub runs at most one build at a time and keeps only the
// latest pending one, so bursts of changes collapse into a single build.
// It is a no-op unless GITHUB_DISPATCH_TOKEN is set.
func Trigger(reason string) {
	token := os.Getenv("GITHUB_DISPATCH_TOKEN")
	if token == "" {
		return
	}
	repo := os.Getenv("GITHUB_REPO")
	if repo == "" {
		repo = defaultRepo
	}

	go func() {
		if err := dispatch(token, repo, reason); err != nil {
			logger.Error("sitebuild:", err)
		}
	}()
}

func dispatch(token, repo, reason string) error {
	body, err := json.Marshal(map[string]interface{}{
		"event_type":     EventType,
		"client_payload": map[string]string{"reason": reason},
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost,
		"https://api.github.com/repos/"+repo+"/dispatches", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// 204 No Content on success.
	if resp.StatusCode >= 300 {
		return fmt.Errorf("repository_dispatch for %q: HTTP %d", reason, resp.StatusCode)
	}
	return nil
}

package controllers

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// NativeReviewStatus returns whether the given platform+version is currently
// in App Store / Mac App Store review mode.
//
// Query params:
//
//	platform  – "ios" or "macos"
//	version   – semantic version string, e.g. "1.0.2"
//
// Set the APP_STORE_REVIEW env var to a comma-separated list of
// "platform:version" entries to put specific builds into review mode, e.g.:
//
//	APP_STORE_REVIEW=ios:1.0.2,macos:1.0.2
//
// Omit the version to match any version for that platform:
//
//	APP_STORE_REVIEW=ios
func NativeReviewStatus(c *gin.Context) {
	platform := strings.TrimSpace(c.Query("platform"))
	version := strings.TrimSpace(c.Query("version"))

	c.JSON(http.StatusOK, gin.H{"in_review": isInAppStoreReview(platform, version)})
}

func isInAppStoreReview(platform, version string) bool {
	if platform == "" {
		return false
	}

	raw := os.Getenv("APP_STORE_REVIEW")
	if raw == "" {
		return false
	}

	for _, entry := range strings.Split(raw, ",") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		// "ios:1.0.2" matches platform=ios version=1.0.2
		// "ios"       matches platform=ios regardless of version
		if entry == platform {
			return true
		}
		if version != "" && entry == platform+":"+version {
			return true
		}
	}

	return false
}

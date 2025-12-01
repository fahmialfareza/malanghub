package newrelicpkg

import (
	"os"

	"github.com/newrelic/go-agent/v3/newrelic"
)

// Init initializes New Relic application if env vars are present.
// Returns nil,nil when New Relic is not configured (so callers can skip instrumentation).
func Init() (*newrelic.Application, error) {
	appName := os.Getenv("NEW_RELIC_APP_NAME")
	license := os.Getenv("NEW_RELIC_LICENSE_KEY")
	enabled := os.Getenv("NEW_RELIC_ENABLED")

	if license == "" || appName == "" {
		return nil, nil
	}
	if enabled == "false" {
		return nil, nil
	}

	app, err := newrelic.NewApplication(
		newrelic.ConfigAppName(appName),
		newrelic.ConfigLicense(license),
		newrelic.ConfigDistributedTracerEnabled(true),
	)
	if err != nil {
		return nil, err
	}
	return app, nil
}

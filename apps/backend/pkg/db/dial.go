package db

import (
	"context"
	"errors"
	"net"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

// wakeBudget is how long a dial keeps retrying while Postgres refuses
// connections. Railway's serverless Postgres sleeps when idle and refuses
// connections for a few seconds while it wakes; without retrying, the first
// requests after a quiet period fail with 500.
const wakeBudget = 15 * time.Second

// retryOnRefused wraps dial so that "connection refused" is retried with
// backoff until budget runs out or ctx is done. Other errors return at once,
// so a wrong host or a real outage is not hidden behind the retry.
func retryOnRefused(dial pgconn.DialFunc, budget time.Duration) pgconn.DialFunc {
	return func(ctx context.Context, network, addr string) (net.Conn, error) {
		deadline := time.Now().Add(budget)
		backoff := 100 * time.Millisecond
		for {
			conn, err := dial(ctx, network, addr)
			if err == nil || !errors.Is(err, syscall.ECONNREFUSED) {
				return conn, err
			}

			wait := min(backoff, time.Until(deadline))
			if wait <= 0 {
				return nil, err
			}
			t := time.NewTimer(wait)
			select {
			case <-ctx.Done():
				t.Stop()
				return nil, err
			case <-t.C:
			}
			backoff = min(backoff*2, 2*time.Second)
		}
	}
}

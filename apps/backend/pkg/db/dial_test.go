package db

import (
	"context"
	"errors"
	"net"
	"syscall"
	"testing"
	"time"
)

// freeAddr returns a local address with nothing listening on it.
func freeAddr(t *testing.T) string {
	t.Helper()
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := l.Addr().String()
	l.Close()
	return addr
}

func TestRetryOnRefusedWaitsForListener(t *testing.T) {
	addr := freeAddr(t)
	go func() {
		time.Sleep(300 * time.Millisecond) // Postgres "waking up"
		l, err := net.Listen("tcp", addr)
		if err != nil {
			return
		}
		t.Cleanup(func() { l.Close() })
		if c, err := l.Accept(); err == nil {
			c.Close()
		}
	}()

	var d net.Dialer
	conn, err := retryOnRefused(d.DialContext, 5*time.Second)(context.Background(), "tcp", addr)
	if err != nil {
		t.Fatalf("dial after wake-up: %v", err)
	}
	conn.Close()
}

func TestRetryOnRefusedGivesUpAfterBudget(t *testing.T) {
	addr := freeAddr(t)
	var d net.Dialer
	start := time.Now()
	_, err := retryOnRefused(d.DialContext, 300*time.Millisecond)(context.Background(), "tcp", addr)
	if !errors.Is(err, syscall.ECONNREFUSED) {
		t.Fatalf("want ECONNREFUSED, got %v", err)
	}
	if el := time.Since(start); el > 2*time.Second {
		t.Fatalf("took %v, budget was 300ms", el)
	}
}

func TestRetryOnRefusedStopsOnContextCancel(t *testing.T) {
	addr := freeAddr(t)
	var d net.Dialer
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	start := time.Now()
	if _, err := retryOnRefused(d.DialContext, time.Minute)(ctx, "tcp", addr); err == nil {
		t.Fatal("want error")
	}
	if el := time.Since(start); el > 2*time.Second {
		t.Fatalf("ignored context cancel, took %v", el)
	}
}

func TestRetryOnRefusedDoesNotRetryOtherErrors(t *testing.T) {
	calls := 0
	boom := errors.New("no such host")
	dial := func(ctx context.Context, network, addr string) (net.Conn, error) {
		calls++
		return nil, boom
	}
	if _, err := retryOnRefused(dial, time.Minute)(context.Background(), "tcp", "x:1"); !errors.Is(err, boom) {
		t.Fatalf("got %v", err)
	}
	if calls != 1 {
		t.Fatalf("dialed %d times, want 1", calls)
	}
}

package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/newrelic/go-agent/v3/integrations/nrpgx5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var (
	gdb   *gorm.DB
	sqlDB *sql.DB
)

// ErrNotInitialized is returned when the database is used before Connect.
var ErrNotInitialized = errors.New("db not initialized")

// DB returns the GORM handle (nil until connected).
func DB() *gorm.DB {
	return gdb
}

// Connect opens a Postgres connection pool (traced by New Relic) and wraps
// it with GORM.
func Connect(ctx context.Context, dsn string) error {
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil {
		return fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	cfg.Tracer = nrpgx5.NewTracer()

	conn := stdlib.OpenDB(*cfg)
	conn.SetMaxOpenConns(envInt("DB_MAX_OPEN_CONNS", 10))
	conn.SetMaxIdleConns(envInt("DB_MAX_IDLE_CONNS", 2))
	conn.SetConnMaxIdleTime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return fmt.Errorf("postgres ping failed: %w", err)
	}

	g, err := gorm.Open(postgres.New(postgres.Config{Conn: conn}), &gorm.Config{
		// not-found is a normal outcome (e.g. signup email check), not an error to log
		Logger: gormlogger.New(log.New(os.Stdout, "\r\n", log.LstdFlags), gormlogger.Config{
			SlowThreshold:             500 * time.Millisecond,
			LogLevel:                  gormlogger.Warn,
			IgnoreRecordNotFoundError: true,
		}),
	})
	if err != nil {
		conn.Close()
		return err
	}

	gdb, sqlDB = g, conn
	return nil
}

func Close() error {
	if sqlDB == nil {
		return nil
	}
	return sqlDB.Close()
}

func envInt(key string, def int) int {
	if n, err := strconv.Atoi(os.Getenv(key)); err == nil && n > 0 {
		return n
	}
	return def
}

// IsDuplicateKey reports whether err is a unique constraint violation.
func IsDuplicateKey(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// IsNotFound reports whether err means no row matched.
func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}

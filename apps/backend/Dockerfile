# Build stage
FROM golang:1.25-alpine AS builder
RUN apk add --no-cache git ca-certificates tzdata build-base

WORKDIR /src

# Copy go modules manifests first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build a statically linked binary
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -ldflags='-s -w' -o /malanghub-backend ./

# Final image: distroless static (no shell or package manager, runs as non-root).
# It ships CA certificates (outbound HTTPS), tzdata and a writable /tmp
# (multipart uploads above 32 MB spill to temp files).
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=builder /malanghub-backend /app/malanghub-backend

# Application listens on 4000 by default in this project
EXPOSE 4000

# Set a default TZ environment variable for apps that read it
ENV TZ=UTC

USER nonroot:nonroot
ENTRYPOINT ["/app/malanghub-backend"]

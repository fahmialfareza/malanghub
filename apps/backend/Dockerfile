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

# Final image: minimal scratch with timezone data and certificates
FROM alpine:3.18
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /malanghub-backend /app/malanghub-backend

# Application listens on 4000 by default in this project
EXPOSE 4000

ENV TZ=UTC

ENTRYPOINT ["/app/malanghub-backend"]

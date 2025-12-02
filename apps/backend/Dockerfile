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
FROM scratch

# Copy CA certificates and timezone data from the builder's runtime image
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

WORKDIR /app
COPY --from=builder /malanghub-backend /app/malanghub-backend

# Application listens on 4000 by default in this project
EXPOSE 4000

# Set a default TZ environment variable for apps that read it
ENV TZ=UTC

ENTRYPOINT ["/app/malanghub-backend"]

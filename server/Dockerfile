# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.0
FROM oven/bun:${BUN_VERSION}

LABEL fly_launch_runtime="Bun.sh"

# app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
EXPOSE 3000

# Install packages needed to build node modules
RUN apt-get update -qq && \
  apt-get install -y python-is-python3 pkg-config build-essential tini 

# Install node modules
COPY package.json bun.lockb ./
RUN bun install

# Copy application code
COPY . .

# Use Tini as the entrypoint
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start the server by default, this can be overwritten at runtime
CMD [ "bun", "start" ]

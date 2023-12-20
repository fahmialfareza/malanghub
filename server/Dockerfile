# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true \
    NEW_RELIC_LOG=stdout

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential 

# Install node modules
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# Final stage for app image
FROM base

RUN apt-get update -qq && \
    apt-get install -y curl sudo tini redis-server

# Disable protected mode in Redis configuration
RUN echo "protected-mode no" >> /etc/redis/redis.conf

# Copy built application
COPY .env.production .
COPY --from=build /app .

# Copy the startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "-s", "--"]
CMD ["/start.sh"]

#!/bin/bash
# Start Redis in the background
redis-server /etc/redis/redis.conf --protected-mode no &

# Start your Node.js application
exec yarn start

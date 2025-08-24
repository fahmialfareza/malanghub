import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClient, RedisClientType } from "redis";
import logger from "@/utils/logger";

import user from "./user/user";
import newsCategory from "./news/category";
import newsTag from "./news/tag";
import news from "./news/news";
import newsComment from "./news/comment";

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const uri: string = process.env.MONGO_URI as string;

// MongoDB Connection
// Use conservative pool and timeout settings to lower baseline native buffer
// allocations. Adjust values if your workload requires larger pools.
const mongooseOptions = {
  // Maximum number of connections in the pool
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || "5", 10),
  // Minimum number of connections in the pool
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || "1", 10),
  // Time to attempt server selection before failing
  serverSelectionTimeoutMS: parseInt(
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || "5000",
    10
  ),
  // Connection timeout
  connectTimeoutMS: parseInt(
    process.env.MONGO_CONNECT_TIMEOUT_MS || "10000",
    10
  ),
};

// Allow disabling Mongo connection for targeted A/B tests (e.g. to isolate GridFS/BSON
// related allocations). Set DISABLE_GRIDFS=true or DISABLE_MONGO=true to skip connecting.
if (
  process.env.DISABLE_GRIDFS === "true" ||
  process.env.DISABLE_MONGO === "true"
) {
  logger.error(
    "DISABLE_GRIDFS/DISABLE_MONGO is set — skipping mongoose.connect for A/B test"
  );
} else {
  mongoose
    .connect(uri, mongooseOptions)
    .then(() => logger.error("MongoDB Connected"))
    .catch((err) => logger.error(err.message));
}

// Function to connect to Redis
// Redis client singleton to avoid creating/disconnecting a client per request
let redisSingleton: RedisClientType | null = null;
export async function redisClient(): Promise<RedisClientType> {
  if (!process.env.REDIS_URI) {
    throw new Error("REDIS_URI must be defined");
  }

  if (redisSingleton && redisSingleton.isOpen) {
    return redisSingleton;
  }

  try {
    const client: RedisClientType = createClient({
      url: process.env.REDIS_URI,
    });
    // optional error handling
    client.on("error", (err) => logger.error("Redis Client Error", err));

    await client.connect();
    redisSingleton = client;

    // Graceful shutdown
    const shutdown = async () => {
      try {
        if (redisSingleton && redisSingleton.isOpen)
          await redisSingleton.disconnect();
      } catch (e) {
        logger.error("Error disconnecting Redis on shutdown", e);
      }
    };
    process.on("exit", shutdown);
    process.on("SIGINT", () => {
      shutdown().then(() => process.exit(0));
    });
    process.on("SIGTERM", () => {
      shutdown().then(() => process.exit(0));
    });

    return redisSingleton;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

// Exporting models and services
export { user, newsCategory, newsTag, news, newsComment };

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import logger from '@/utils/logger';

import user from './user/user';
import newsCategory from './news/category';
import newsTag from './news/tag';
import news from './news/news';
import newsComment from './news/comment';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const uri: string = process.env.MONGO_URI as string;

// MongoDB Connection
mongoose
  .connect(uri, {})
  .then(() => logger.error('MongoDB Connected'))
  .catch((err) => logger.error(err.message));

// Function to connect to Redis
export async function redisClient(): Promise<RedisClientType> {
  if (!process.env.REDIS_URI) {
    throw new Error('REDIS_URI must be defined');
  }

  try {
    const client: RedisClientType = createClient({
      url: process.env.REDIS_URI,
    });

    await client.connect();

    return client;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

// Exporting models and services
export {
  user,
  newsCategory,
  newsTag,
  news,
  newsComment,
};

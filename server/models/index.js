require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const mongoose = require("mongoose");
const { createClient } = require("redis");

const logger = require("../utils/logger");

const uri = process.env.MONGO_URI;

mongoose
  .connect(uri, {})
  .then(() => logger.error("MongoDB Connected"))
  .catch((err) => logger.error(err.message));

// function connect to redis
async function redisClient() {
  if (!process.env.REDIS_URI) {
    throw new Error("REDIS_URI must be defined");
  }

  try {
    const client = createClient({
      url: process.env.REDIS_URI,
    });

    await client.connect();

    return client;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

const user = require("./user/user");
const newsCategory = require("./news/category");
const newsTag = require("./news/tag");
const news = require("./news/news");
const newsComment = require("./news/comment");

module.exports = {
  user,
  newsCategory,
  newsTag,
  news,
  newsComment,
  redisClient,
};

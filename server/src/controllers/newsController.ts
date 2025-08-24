import { news, redisClient } from "@/models";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";
import { RedisClientType } from "redis";

const oneDay = 60 * 60 * 24;

class NewsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async searchNews(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async myNews(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    let redis: RedisClientType | undefined;

    try {
      const key = `news:${req.params.slug}`;
      redis = await redisClient();

      // Try to get data from Redis
      const redisData = await redis.get(key);
      if (redisData) {
        const data = JSON.parse(redisData); // Redis data is always a string
        return res.status(200).json({ data });
      }

      // Get data from MongoDB
      const dbData = await news
        .findOne({ slug: req.params.slug, approved: true })
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      if (!dbData) {
        return next({ message: "Berita tidak ditemukan", statusCode: 404 });
      }

      // Cache the data in Redis if it's under 1MB
      const dataByteSize = Buffer.from(JSON.stringify(dbData)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(dbData), { EX: oneDay });
      }

      // Send the response
      return res.status(200).json({ data: dbData });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const newData = req.body;

    // Replace &lt; with <
    newData.content = newData.content.replace(/&lt;/g, "<");

    // Set status based on approval
    if (req.body.approved) {
      newData.status = "publish";
    } else {
      newData.status = "decline";
    }

    try {
      const data = await news
        .findOneAndUpdate(
          { _id: req.params.id, approved: false },
          { $set: newData },
          { new: true }
        )
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      if (!data) {
        return next({ message: "Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(201).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await news.deleteOne({ _id: req.params.id });

      if (data.deletedCount === 0) {
        return next({ message: "Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

export default new NewsController();

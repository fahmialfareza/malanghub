const { news, redisClient } = require("../models");
const logger = require("../utils/logger");

const oneDay = 60 * 60 * 24;

class NewsController {
  async getAll(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async searchNews(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async myNews(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async getOne(req, res, next) {
    let redis;

    try {
      const key = `news:${req.params.slug}`;
      redis = await redisClient();

      let data = await redis.get(key);
      if (data) {
        data = JSON.parse(data);
        return res.status(200).json({ data });
      }

      data = await news
        .findOne({ slug: req.params.slug, approved: true })
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      if (!data) {
        return next({ message: "Berita tidak ditemukan", statusCode: 404 });
      }

      const dataByteSize = Buffer.from(JSON.stringify(data)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(data), { EX: oneDay });
      }

      return res.status(200).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    } finally {
      await redis.disconnect();
    }
  }

  async update(req, res, next) {
    let newData = req.body;

    newData.content = newData.content.replace(/&lt;/g, "<");
    req.body.approved
      ? (newData.status = "publish")
      : (newData.status = "decline");

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
        if (req.body.mainImage) {
          await awsNewsDelete(req.body.mainImage);
        }

        return next({ message: "Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(201).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const data = await news.deleteById(req.params.id);

      if (data.n === 0) {
        return next({ message: "Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

module.exports = new NewsController();

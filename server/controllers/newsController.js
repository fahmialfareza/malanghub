const { news, newsCategory, newsTag, user } = require("../models");

class NewsController {
  async getAll(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return next(e);
    }
  }

  async searchNews(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return next(e);
    }
  }

  async myNews(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return next(e);
    }
  }

  async getOne(req, res, next) {
    try {
      let data = await news
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

      return res.status(200).json({ data });
    } catch (e) {
      return next(e);
    }
  }

  async update(req, res, next) {
    let newData = {};

    newData.approved = req.body.approved;
    newData.message = req.body.message;
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
      return next(e);
    }
  }
}

module.exports = new NewsController();

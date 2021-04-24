const { news, newsCategory, newsTag, user } = require("../models");

class NewsController {
  async getAll(req, res) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async searchNews(req, res) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async myNews(req, res) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async getOne(req, res) {
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
        return res.status(404).json({ message: "News not found" });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async update(req, res) {
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

        return res.status(404).json({ message: "News  not found" });
      }

      return res.status(201).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async delete(req, res) {
    try {
      const data = await news.deleteById(req.params.id);

      if (data.n === 0) {
        return res.status(404).json({ message: "News not found" });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
}

module.exports = new NewsController();

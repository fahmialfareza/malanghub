const { news, newsCategory, newsTag, user } = require("../models");
const { awsNewsUpload, awsNewsDelete } = require("../utils/amazons3");

class NewsController {
  async getAll(req, res) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async myDrafts(req, res) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async getOne(req, res) {
    try {
      let data = await news
        .findOne({
          slug: req.params.slug,
          approved: false,
        })
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      if (!data) {
        return res.status(404).json({ message: "News Draft not found" });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async create(req, res) {
    try {
      let data = await news.create(req.body);

      data = await news
        .findById(data.id)
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        await awsNewsDelete(req.body.mainImage);

        return res.status(400).json({ message: "Title has been exist" });
      }

      return res.status(500).json({ message: e.message });
    }
  }

  async update(req, res) {
    try {
      let data = await news.findOneAndUpdate(
        { _id: req.params.id, approved: false, user: req.user.id },
        { $set: req.body },
        { new: true }
      );

      if (!data) {
        if (req.body.mainImage) {
          await awsNewsDelete(req.body.mainImage);
        }

        return res.status(404).json({ message: "News Draft not found" });
      }

      data = await news
        .findById(data.id)
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        if (req.body.mainImage) {
          await awsNewsDelete(req.body.mainImage);
        }

        return res.status(400).json({ message: "Title has been exist" });
      }

      return res.status(500).json({ message: e.message });
    }
  }

  async delete(req, res) {
    try {
      const data = await news.remove({ _id: req.params.id, user: req.user.id });

      if (data.n === 0) {
        return res.status(404).json({ message: "News Draft not found" });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
}

module.exports = new NewsController();

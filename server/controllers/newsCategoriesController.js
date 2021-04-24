const { newsCategory } = require("../models");

class NewsCategoriesController {
  async getAll(req, res) {
    try {
      const data = await newsCategory.find().populate({
        path: "news",
        match: { approved: true },
        populate: [
          { path: "user", select: "-password -role" },
          { path: "tags" },
          { path: "category" },
        ],
      });

      if (data.length === 0) {
        return res.status(404).json({ message: "News Category not found" });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async getOne(req, res) {
    try {
      const data = await newsCategory
        .findOne({ slug: req.params.slug })
        .populate({
          path: "news",
          match: { approved: true },
          populate: [
            { path: "user", select: "-password -role" },
            { path: "tags" },
            { path: "category" },
          ],
        });

      if (!data) {
        return res.status(404).json({ message: "News Category not found" });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async create(req, res) {
    try {
      const data = await newsCategory.create(req.body);

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        return res
          .status(400)
          .json({ message: "News Category Name has been exist" });
      }

      return res.status(500).json({ errors: e.message });
    }
  }

  async update(req, res) {
    try {
      const data = await newsCategory
        .findOneAndUpdate(
          {
            _id: req.params.id,
          },
          req.body,
          {
            new: true,
            runValidators: true,
          }
        )
        .populate({
          path: "news",
          match: { approved: true },
          populate: [
            { path: "user", select: "-password -role" },
            { path: "tags" },
            { path: "category" },
          ],
        });

      if (!data) {
        return res.status(404).json({ message: "News Category not found" });
      }

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        return res
          .status(400)
          .json({ message: "News Category Name has been exist" });
      }

      return res.status(500).json({ message: e.message });
    }
  }

  async delete(req, res) {
    try {
      const data = await newsCategory.deleteById(req.params.id);

      if (data.n === 0) {
        return res.status(404).json({ message: "News Category not found" });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
}

module.exports = new NewsCategoriesController();

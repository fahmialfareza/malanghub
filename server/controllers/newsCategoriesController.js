const { newsCategory } = require("../models");

class NewsCategoriesController {
  async getAll(req, res, next) {
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
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 404,
        });
      }

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }

  async getOne(req, res, next) {
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
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 404,
        });
      }

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }

  async create(req, res, next) {
    try {
      const data = await newsCategory.create(req.body);

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        console.error(e);
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 400,
        });
      }

      return next(e);
    }
  }

  async update(req, res, next) {
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
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 404,
        });
      }

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        console.error(e);
        return next({
          message: "Nama Kategori Berita sudah ada",
          statusCode: 400,
        });
      }

      return next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const data = await newsCategory.deleteById(req.params.id);

      if (data.n === 0) {
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 404,
        });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }
}

module.exports = new NewsCategoriesController();

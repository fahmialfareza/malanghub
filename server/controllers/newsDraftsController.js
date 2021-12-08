const { news, newsCategory, newsTag, user } = require('../models');
const { awsNewsUpload, awsNewsDelete } = require('../utils/amazons3');

class NewsController {
  async getAll(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return next(e);
    }
  }

  async myDrafts(req, res, next) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return next(e);
    }
  }

  async getOne(req, res, next) {
    try {
      let data = await news
        .findOne({
          slug: req.params.slug,
          approved: false,
        })
        .populate({
          path: 'user',
          select: '-password -role',
        })
        .populate('category')
        .populate('tags');

      if (!data) {
        return next({
          message: 'Draft Berita tidak ditemukan',
          statusCode: 404,
        });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return next(e);
    }
  }

  async create(req, res, next) {
    try {
      let data = await news.create(req.body);

      data = await news
        .findById(data.id)
        .populate({
          path: 'user',
          select: '-password -role',
        })
        .populate('category')
        .populate('tags');

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        await awsNewsDelete(req.body.mainImage);

        return next({ message: 'Judul yang sama sudah ada', statusCode: 400 });
      }

      return next(e);
    }
  }

  async update(req, res, next) {
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

        return next({
          message: 'Draft Berita tidak ditemukan',
          statusCode: 404,
        });
      }

      data = await news
        .findById(data.id)
        .populate({
          path: 'user',
          select: '-password -role',
        })
        .populate('category')
        .populate('tags');

      return res.status(201).json({ data });
    } catch (e) {
      if (e.code === 11000) {
        if (req.body.mainImage) {
          await awsNewsDelete(req.body.mainImage);
        }

        return next({ message: 'Judul yang sama sudah ada', statusCode: 400 });
      }

      return next(e);
    }
  }

  async delete(req, res, next) {
    try {
      let data = { n: 0 };
      const userData = await user.findById(req.user.id);

      if (userData.role.includes('admin')) {
        data = await news.remove({
          _id: req.params.id,
        });
      } else {
        data = await news.remove({
          _id: req.params.id,
          user: req.user.id,
        });
      }

      if (data.n === 0) {
        return next({
          message: 'Draft Berita tidak ditemukan',
          statusCode: 404,
        });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = new NewsController();

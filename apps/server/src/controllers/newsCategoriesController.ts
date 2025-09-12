import { newsCategory } from "@/models";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";

class NewsCategoriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
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
      logger.error(e);
      return next(e);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
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
      logger.error(e);
      return next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsCategory.create(req.body);

      return res.status(201).json({ data });
    } catch (e) {
      // Assert the type of e to include the expected properties
      const error = e as { code: number; message: string };

      if (error.code === 11000) {
        logger.error(error);
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 400,
        });
      }

      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
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
      // Assert the type of e to include the expected properties
      const error = e as { code: number; message: string };

      if (error.code === 11000) {
        logger.error(error);
        return next({
          message: "Nama Kategori Berita sudah ada",
          statusCode: 400,
        });
      }

      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsCategory.deleteOne({ _id: req.params.id });

      if (data.deletedCount === 0) {
        return next({
          message: "Kategori Berita tidak ditemukan",
          statusCode: 404,
        });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

export default new NewsCategoriesController();

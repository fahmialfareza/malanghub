import { newsTag } from "@/models";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";

class NewsCategoriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsTag.find();

      if (data.length === 0) {
        return next({ message: "Tag Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsTag.findOne({ slug: req.params.slug }).populate({
        path: "news",
        match: { approved: true },
        populate: [
          { path: "user", select: "-password -role" },
          { path: "tags" },
          { path: "category" },
        ],
      });

      if (!data) {
        return next({ message: "Tag Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsTag.create(req.body);

      return res.status(201).json({ data });
    } catch (e) {
      logger.error(e);

      const error = e as { code: number; message: string };
      if (error.code === 11000) {
        return next({
          message: "Nama Tag Berita sudah ada",
          statusCode: 400,
        });
      }

      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsTag
        .findOneAndUpdate({ _id: req.params.id }, req.body, {
          new: true,
          runValidators: true,
        })
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
        return next({ message: "Tag Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(201).json({ data });
    } catch (e) {
      logger.error(e);

      const error = e as { code: number; message: string };
      if (error.code === 11000) {
        return next({
          message: "Nama Tag Berita sudah ada",
          statusCode: 400,
        });
      }

      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsTag.deleteOne({ _id: req.params.id });

      if (data.deletedCount === 0) {
        return next({ message: "Tag Berita tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data: {} });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

export default new NewsCategoriesController();

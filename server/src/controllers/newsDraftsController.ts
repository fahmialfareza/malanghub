import { Document } from "mongoose";
import { news, user } from "@/models";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";
import { INews } from "@/models/news/news";

class NewsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      return next(e);
    }
  }

  async myDrafts(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(res.advancedResults);
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await news
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
        return next({
          message: "Draft Berita tidak ditemukan",
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
      // Create the news document
      const newData = await news.create(req.body);

      // Populate related fields after creation
      const data = await news
        .findById(newData.id)
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate("category")
        .populate("tags");

      // If data is null, handle the case
      if (!data) {
        return next({
          message: "News not found after creation",
          statusCode: 404,
        });
      }

      // Return the populated data
      return res.status(201).json({ data });
    } catch (e) {
      logger.error(e);
      const error = e as { code: number; message: string };
      if (error.code === 11000) {
        // Handle duplicate key error
        if (error.code === 11000) {
          return next({
            message: "Judul yang sama sudah ada",
            statusCode: 400,
          });
        }
      }

      // General error handling
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      let data = await news.findOneAndUpdate(
        { _id: req.params.id, approved: false, user: req.user?.id },
        { $set: req.body },
        { new: true }
      );

      if (!data) {
        return next({
          message: "Draft Berita tidak ditemukan",
          statusCode: 404,
        });
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
      logger.error(e);
      const error = e as { code: number; message: string };
      if (error.code === 11000) {
        return next({ message: "Judul yang sama sudah ada", statusCode: 400 });
      }

      return next(e);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      let data:
        | (Document<unknown, {}, INews> &
            INews &
            Required<{
              _id: unknown;
            }>)
        | null;
      const userData = await user.findById(req.user?.id);

      if (userData?.role.includes("admin")) {
        data = await news.findOneAndUpdate(
          {
            _id: req.params.id,
          },
          {
            $set: {
              deleted: true,
            },
          },
          {
            new: true,
          }
        );
      } else {
        data = await news.findOneAndUpdate(
          {
            _id: req.params.id,
            user: req.user?.id,
          },
          {
            $set: {
              deleted: true,
            },
          },
          {
            new: true,
          }
        );
      }

      if (!data) {
        return next({
          message: "Draft Berita tidak ditemukan",
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

export default new NewsController();

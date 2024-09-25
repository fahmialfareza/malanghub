import { newsComment } from "@/models";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";

class NewsCommentsController {
  async getCommentsByNews(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsComment
        .find({ news: req.params.id })
        .sort({ updated_at: -1 })
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate({
          path: "commentReplies.user",
          select: "-password -role",
        });

      return res.status(200).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await newsComment.create({
        news: req.params.id,
        user: req.user?.id,
        comment: req.body.comment,
      });

      res.status(201).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async createCommentByComment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await newsComment
        .findOneAndUpdate(
          { _id: req.params.id },
          {
            $push: {
              commentReplies: {
                user: req.user?.id,
                comment: req.body.comment,
              },
            },
          },
          { new: true }
        )
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate({
          path: "commentReplies.user",
          select: "-password -role",
        });

      return res.status(201).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

export default new NewsCommentsController();

import logger from "@/utils/logger";
import { NextFunction, Request, Response } from "express";

class ImageUploadController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({ uploaded: true, location: req.body.file });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

export default new ImageUploadController();

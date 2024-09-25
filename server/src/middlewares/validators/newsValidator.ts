import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import logger from "@/utils/logger";

// Update News
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors: string[] = [];

    // Ensure that req.params.id is defined and valid
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    // Validate message, title, and content
    if (!req.body.message) {
      errors.push("Silahkan masukkan pesan");
    }

    if (!req.body.title) {
      errors.push("Judul tidak boleh kosong");
    }

    if (!req.body.content) {
      errors.push("Konten tidak boleh kosong");
    }

    // If errors exist, pass them to next middleware
    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // If validation passes, continue to the next middleware
    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Delete News
export const deleteNews = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    // Ensure that req.params.id is defined and valid
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    // If errors exist, pass them to next middleware
    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // If validation passes, continue to the next middleware
    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

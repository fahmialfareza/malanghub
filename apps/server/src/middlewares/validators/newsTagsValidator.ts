import { Request, Response, NextFunction } from "express";
import validator from "validator";
import mongoose from "mongoose";
import logger from "@/utils/logger";

// Create Tag
export const create = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    // Validate that the name only contains alphabetic characters
    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Generate slug from the name
    req.body.slug = req.body.name;

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Update Tag
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

    // Validate that the name only contains alphabetic characters
    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Generate slug from the name
    req.body.slug = req.body.name;

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Delete Tag
export const deleteTag = (
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

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

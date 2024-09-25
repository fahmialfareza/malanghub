import { Request, Response, NextFunction } from "express";
import validator from "validator";
import mongoose from "mongoose";
import logger from "@/utils/logger";

// Create a category
export const create = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    // Validate name - must contain only alphabetic characters
    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama");
    }

    // If there are errors, pass them to the next middleware
    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Generate slug from name
    req.body.slug = req.body.name;

    // Proceed to the next middleware
    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Update a category
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

    // Validate name - must contain only alphabetic characters
    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama");
    }

    // If there are errors, pass them to the next middleware
    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Generate slug from name
    req.body.slug = req.body.name;

    // Proceed to the next middleware
    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};
// Delete a category
export const deleteCategory = (
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

    // If there are errors, pass them to the next middleware
    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Proceed to the next middleware
    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

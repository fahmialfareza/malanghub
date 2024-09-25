import { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import validator from "validator";
import mongoose from "mongoose";
import { uploader } from "@/utils/cloudinary";
import logger from "@/utils/logger";

interface FileUpload {
  name: string;
  mimetype: string;
  size: number;
  tempFilePath: string;
}

// Update Profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors: string[] = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama Anda");
    }

    // Check image
    if (req.files) {
      const file = req.files.photo as FileUpload;

      // Make sure image is photo
      if (!file.mimetype.startsWith("image")) {
        errors.push("File haruslah sebuah gambar");
      }

      // Check file size (max 1MB)
      if (file.size > 1000000) {
        errors.push("Gambar harus kurang dari 1 MB");
      }

      if (errors.length > 0) {
        return next({ message: errors.join(", "), statusCode: 400 });
      }

      // Create custom filename
      const fileName = crypto.randomBytes(16).toString("hex");
      file.name = `${fileName}${path.parse(file.name).ext}`;

      const imageUpload = await uploader(file);
      req.body.photo = imageUpload?.secure_url;
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

// Get User by ID
export const getUser = (
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

// Signup
export const signup = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama Anda");
    }

    if (!validator.isEmail(req.body.email)) {
      errors.push("Silahkan masukkan email yang valid");
    }

    if (!validator.isStrongPassword(req.body.password, { minSymbols: 0 })) {
      errors.push("Password kurang kuat");
    }

    if (req.body.passwordConfirmation !== req.body.password) {
      errors.push("Password harus sama dengan Password Konfirmasi");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    if (req.body.password.includes("Google")) {
      req.body.password = req.body.password.slice(6);
    }

    if (req.body.password.includes("Facebook")) {
      req.body.password = req.body.password.slice(8);
    }

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Signin
export const signin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    if (!validator.isEmail(req.body.email)) {
      errors.push("Silahkan masukkan email yang valid");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    if (req.body.password.includes("Google")) {
      req.body.password = req.body.password.slice(6);
    }

    if (req.body.password.includes("Facebook")) {
      req.body.password = req.body.password.slice(8);
    }

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Google Authentication
export const google = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    if (validator.isEmpty(req.body.access_token)) {
      errors.push("Silahkan masukkan access token yang valid");
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

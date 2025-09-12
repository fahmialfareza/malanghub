import { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { uploader } from "@/utils/cloudinary";
import logger from "@/utils/logger";
import { UploadedFile } from "express-fileupload";

export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors: string[] = [];

    const file = req.files?.file as UploadedFile;

    // Make sure file exists
    if (!file) {
      return next({ message: "File is required", statusCode: 400 });
    }

    // Make sure the file is an image
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

    // Rename the file
    file.name = `${fileName}${path.parse(file.name).ext}`;

    // Upload the file using Cloudinary
    const imageUpload = await uploader(file);

    // Store the uploaded file URL in the request body
    req.body.file = imageUpload?.secure_url;

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

import { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import { newsCategory, newsTag } from "@/models";
import { uploader } from "@/utils/cloudinary";
import logger from "@/utils/logger";
import { UploadedFile } from "express-fileupload";

// Create News
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors: string[] = [];

    if (!req.body.title) {
      errors.push("Silahkan masukkan judul");
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!req.body.content) {
      errors.push("Konten tidak boleh kosong");
    }

    if (!req.files || !req.files.mainImage) {
      errors.push("Foto Utama tidak boleh kosong");
    }

    const tags: mongoose.Types.ObjectId[] = JSON.parse(req.body?.tags);

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    const findData = await Promise.all([
      newsCategory.findById(req.body.category),
      newsTag.find({ _id: { $in: tags.map((tag) => tag) } }),
    ]);

    if (!findData[0]) {
      errors.push("Kategori Berita tidak ditemukan");
    }

    if (findData[1].length < tags.length) {
      errors.push("Tag Berita tidak ditemukan");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Check image
    if (req.files) {
      const file = req.files.mainImage as UploadedFile;

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
      req.body.mainImage = imageUpload?.secure_url;
    }

    req.body.time_read = Math.ceil(req.body.content.length / 100);
    req.body.slug = req.body.title;
    req.body.tags = tags;
    req.body.user = req.user?.id;

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Update News
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors: string[] = [];

    if (!req.body.title) {
      errors.push("Silahkan masukkan judul");
    }

    // Ensure that req.params.id is defined and valid
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!req.body.content) {
      errors.push("Konten tidak boleh kosong");
    }

    const tags: { _id: mongoose.Types.ObjectId }[] = [];

    req.body.tags.split(",").map((id: string) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push("Silahkan masukkan id yang benar");
      }
      tags.push({ _id: new mongoose.Types.ObjectId(id) });
    });

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    const findData = await Promise.all([
      newsCategory.findById(req.body.category),
      newsTag.find({ _id: { $in: tags.map((tag) => tag._id) } }),
    ]);

    if (!findData[0]) {
      errors.push("Kategori Berita tidak ditemukan");
    }

    if (findData[1].length < tags.length) {
      errors.push("Tag Berita tidak ditemukan");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    // Check image
    if (req.files) {
      const file = req.files.mainImage as UploadedFile;

      if (!file.mimetype.startsWith("image")) {
        errors.push("File haruslah sebuah gambar");
      }

      if (file.size > 1000000) {
        errors.push("Gambar harus kurang dari 1 MB");
      }

      if (errors.length > 0) {
        return next({ message: errors.join(", "), statusCode: 400 });
      }

      const fileName = crypto.randomBytes(16).toString("hex");
      file.name = `${fileName}${path.parse(file.name).ext}`;

      const imageUpload = await uploader(file);
      req.body.mainImage = imageUpload?.secure_url;
    }

    req.body.time_read = Math.ceil(req.body.content.length / 100);
    req.body.slug = req.body.title;
    req.body.tags = tags;
    req.body.status = "process";

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

// Delete News Draft
export const deleteNewsDraft = (
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

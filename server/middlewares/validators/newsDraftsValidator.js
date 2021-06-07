const path = require("path");
const crypto = require("crypto");
const validator = require("validator");
const mongoose = require("mongoose");
const { news, newsCategory, newsTag } = require("../../models");
const { awsNewsUpload } = require("../../utils/amazons3");

exports.create = async (req, res, next) => {
  try {
    let errors = [];

    if (!req.body.title) {
      errors.push("Silahkan masukkan judul");
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!req.body.content) {
      errors.push("Konten tidak boleh kosong");
    }

    if (!req.files) {
      errors.push("Foto Utama tidak boleh kosong");
    }

    tags = [];

    req.body.tags.split(",").map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push("Silahkan masukkan id yang benar");
      }

      tags.push({ _id: id });
    });

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    let findData = await Promise.all([
      newsCategory.findById(req.body.category),
      newsTag.find({ $or: tags }),
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
      const file = req.files.mainImage;

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
      let fileName = crypto.randomBytes(16).toString("hex");

      // Rename the file
      file.name = `${fileName}${path.parse(file.name).ext}`;

      req.body.mainImage = await awsNewsUpload(file);
    }

    req.body.time_read = eval(req.body.content.length / 100);
    req.body.slug = req.body.title;
    req.body.tags = tags;
    req.body.user = req.user.id;

    next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    let errors = [];

    if (!req.body.title) {
      errors.push("Silahkan masukkan judul");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!req.body.content) {
      errors.push("Konten tidak boleh kosong");
    }

    tags = [];

    req.body.tags.split(",").map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push("Silahkan masukkan id yang benar");
      }

      tags.push({ _id: id });
    });

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    let findData = await Promise.all([
      newsCategory.findById(req.body.category),
      newsTag.find({ $or: tags }),
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
      const file = req.files.mainImage;

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
      let fileName = crypto.randomBytes(16).toString("hex");

      // Rename the file
      file.name = `${fileName}${path.parse(file.name).ext}`;

      req.body.mainImage = await awsNewsUpload(file);
    }

    req.body.time_read = eval(req.body.content.length / 100);
    req.body.slug = req.body.title;
    req.body.tags = tags;
    req.body.status = "process";

    next();
  } catch (e) {
    return next(e);
  }
};

exports.deleteNewsDraft = (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    next();
  } catch (e) {
    return next(e);
  }
};
